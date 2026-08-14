import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'

import prisma from '../db.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'
import { getCurrentUserId, parseId } from '../utils/index.js'
import { broadcast } from '../index.js'

// GET /api/v1/locations - Retrieve locations (shared + personal)
export const getLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { search } = req.query

    const whereClause: Prisma.LocationWhereInput = {
      OR: [
        { userId: null }, // Shared household locations
        ...(currentUserId ? [{ userId: currentUserId }] : []),
      ],
    }

    if (search && typeof search === 'string') {
      const searchStr = search.trim()
      if (searchStr) {
        whereClause.label = {
          contains: searchStr,
          mode: 'insensitive',
        }
      }
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { stocks: { where: { deletedAt: null } } },
        },
      },
      orderBy: {
        label: 'asc',
      },
    })

    res.status(200).json(locations)
  } catch (error: unknown) {
    console.error('Error fetching locations:', error)
    handlePrismaError(error, res, 'Failed to retrieve locations')
  }
}

// GET /api/v1/locations/:id - Retrieve a single location by ID
export const getLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const locationId = parseId(req.params.id)
    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        OR: [{ userId: null }, ...(currentUserId !== null ? [{ userId: currentUserId }] : [])],
      },
      include: {
        parent: true,
        children: true,
        stocks: {
          include: {
            item: true,
          },
        },
      },
    })

    if (!location) {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    // Attach `items` property (aliasing `stocks`) to satisfy API contract
    res.status(200).json({
      ...location,
      items: location.stocks || [],
    })
  } catch (error: unknown) {
    console.error('Error fetching location by ID:', error)
    handlePrismaError(error, res, 'Failed to retrieve location')
  }
}

// POST /api/v1/locations - Create a new location
export const addLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { label, parentId, isPrivate } = req.body

    // Validate label presence and prevent whitespace-only strings
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      res.status(400).json({ error: 'Label is required and cannot be blank' })
      return
    }

    const trimmedLabel = label.trim()

    // Safely parse parentId if provided
    let parsedParentId: number | null = null
    if (parentId !== undefined && parentId !== null) {
      parsedParentId = parseId(parentId)
      if (isNaN(parsedParentId)) {
        res.status(400).json({ error: 'Invalid parent ID format' })
        return
      }
    }

    // Atomically create location and default subscription in a transaction
    const newLocation = await prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          label: trimmedLabel,
          parentId: parsedParentId,
          userId: isPrivate && currentUserId ? currentUserId : null,
        },
      })

      // Automatically subscribe creator if user exists
      if (currentUserId) {
        const userSettings = await tx.userSettings.findUnique({
          where: { userId: currentUserId },
        })

        const shouldAutoSubscribe = userSettings?.autoSubscribeNewLocations ?? true

        if (shouldAutoSubscribe) {
          await tx.locationSubscription.create({
            data: {
              userId: currentUserId,
              locationId: location.id,
              notifyExpiring: userSettings?.defaultNotifyExpiring ?? true,
              notifyLowStock: userSettings?.defaultNotifyLowStock ?? true,
            },
          })
        }
      }

      return location
    })

    broadcast({ type: 'location:added', id: newLocation.id })

    res.status(201).json(newLocation)
  } catch (error: unknown) {
    console.error('Error creating location:', error)
    handlePrismaError(error, res, 'Failed to create location')
  }
}

// PATCH /api/v1/locations/:id - Update an existing location
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const locationId = parseId(req.params.id)
    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    // Verify ownership access before updating
    const existing = await prisma.location.findFirst({
      where: {
        id: locationId,
        OR: [{ userId: null }, ...(currentUserId ? [{ userId: currentUserId }] : [])],
      },
    })

    if (!existing) {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    const { label, parentId, isPrivate } = req.body

    // Prevent a location from becoming its own parent
    if (parentId !== undefined && parentId !== null) {
      const parsedParent = parseId(parentId)
      if (parsedParent === locationId) {
        res.status(400).json({ error: 'A location cannot be its own parent' })
        return
      }
    }

    const updateData: Prisma.LocationUpdateInput = {}

    if (label !== undefined) updateData.label = String(label).trim()
    if (parentId !== undefined) {
      updateData.parent = parentId ? { connect: { id: parseId(parentId) } } : { disconnect: true }
    }
    if (isPrivate !== undefined) {
      updateData.user =
        isPrivate && currentUserId ? { connect: { id: currentUserId } } : { disconnect: true }
    }

    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    })

    broadcast({ type: 'location:updated', id: locationId })

    res.status(200).json(updatedLocation)
  } catch (error: unknown) {
    console.error('Error updating location:', error)
    handlePrismaError(error, res, 'Failed to update location')
  }
}

// DELETE /api/v1/locations/:id - Delete location
export const deleteLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id)
    const currentUserId = getCurrentUserId(req)

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    if (currentUserId === null) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const location = await prisma.location.findUnique({
      where: { id },
    })

    if (!location) {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    if (location.userId !== null && location.userId !== currentUserId) {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    // Check for child locations or assigned stocks
    const [childCount, stockCount] = await Promise.all([
      prisma.location.count({ where: { parentId: id } }),
      prisma.itemStock.count({ where: { locationId: id } }),
    ])

    if (childCount > 0) {
      res.status(400).json({
        error: 'Cannot delete location that contains sub-locations',
      })
      return
    }

    if (stockCount > 0) {
      res.status(400).json({
        error: 'Cannot delete location that currently contains active items',
      })
      return
    }

    await prisma.location.delete({
      where: { id },
    })

    broadcast({ type: 'location:deleted', id: location.id })

    res.status(204).send()
  } catch (error: unknown) {
    handlePrismaError(error, res, 'Failed to delete location')
  }
}

/**
 * POST /locations/:id/restore - Un-archive location
 */
export const restoreLocationByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const locationId = parseId(req.params.id)
    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const restoredLocation = await prisma.location.update({
      where: { id: locationId },
      data: { deletedAt: null },
    })

    broadcast({ type: 'location:restored', id: restoredLocation.id })

    res.status(200).json(restoredLocation)
  } catch (error: unknown) {
    console.error('Error restoring location:', error)
    handlePrismaError(error, res, 'Failed to restore location')
  }
}
