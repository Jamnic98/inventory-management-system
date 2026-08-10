import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'

import prisma from '../db.js'
import { itemEvents } from '../events/index.js'
import { handlePrismaError } from '../middleware/index.js'
import { enrichItem, getCurrentUserId, parseId } from '../utils/index.js'

/**
 * GET /items - Retrieve all active items (deletedAt IS NULL)
 * Filters: Personal items (user_id = currentUserId) + Shared household items (user_id IS NULL)
 */
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { search, locationId } = req.query

    // Base ownership & active status filters
    const conditions: Prisma.ItemWhereInput[] = [
      { deletedAt: null }, // Active items only
      {
        OR: [
          { userId: null }, // General / Household shared items
          ...(currentUserId ? [{ userId: currentUserId }] : []),
        ],
      },
    ]

    // Optional location filter
    if (locationId) {
      const parsedLocId = parseId(locationId)
      if (!isNaN(parsedLocId)) {
        conditions.push({ locationId: parsedLocId })
      }
    }

    // Search filter across BOTH label and barcode
    if (search) {
      const searchStr = String(search).trim()
      if (searchStr) {
        conditions.push({
          OR: [
            { label: { contains: searchStr, mode: 'insensitive' } },
            { barcode: { contains: searchStr, mode: 'insensitive' } },
          ],
        })
      }
    }

    const whereClause: Prisma.ItemWhereInput = {
      AND: conditions,
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      include: { location: true },
      orderBy: { createdAt: 'desc' },
    })

    res.status(200).json(items.map(enrichItem))
  } catch (error: unknown) {
    console.error('Error fetching items:', error)
    handlePrismaError(error, res, 'Failed to retrieve items')
  }
}

/**
 * GET /items/archived - Search soft-deleted items for restocking
 */
export const getArchivedItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { search } = req.query

    const items = await prisma.item.findMany({
      where: {
        deletedAt: { not: null }, // Soft-deleted/consumed items only
        OR: [{ userId: null }, ...(currentUserId ? [{ userId: currentUserId }] : [])],
        ...(search ? { label: { contains: String(search), mode: 'insensitive' } } : {}),
      },
      include: { location: true },
      orderBy: { updatedAt: 'desc' },
    })

    res.status(200).json(items.map(enrichItem))
  } catch (error: unknown) {
    console.error('Error fetching archived items:', error)
    handlePrismaError(error, res, 'Failed to retrieve archived items')
  }
}

/**
 * GET /items/:id - Retrieve item by ID
 */
export const getItemByID = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const itemId = parseId(req.params.id)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const currentUserId = getCurrentUserId(req)

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { location: true },
    })

    // Check existence and ownership access (shared or owned by current user)
    if (!item || (item.userId !== null && item.userId !== currentUserId)) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(200).json(enrichItem(item))
  } catch (error: unknown) {
    console.error('Error fetching item:', error)
    handlePrismaError(error, res, 'Failed to retrieve item')
  }
}

/**
 * POST /items - Create new item
 * Resolves userId: Explicitly passed > Current User > Location default
 */
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const {
      label,
      quantity,
      barcode,
      locationId,
      userId,
      expirationDate,
      openedOn,
      useWithinDays,
      lowStockThreshold,
    } = req.body

    if (!label || locationId === undefined || locationId === null) {
      res.status(400).json({ error: 'Label and locationId are required' })
      return
    }

    const parsedLocationId = Number(locationId)

    // Determine ownership hierarchy
    let assignedUserId: number | null = null
    if (userId !== undefined) {
      assignedUserId = userId !== null ? Number(userId) : null
    } else if (currentUserId !== null) {
      assignedUserId = currentUserId
    } else {
      // Fallback check: if the location has an owner, inherit it
      const targetLocation = await prisma.location.findUnique({
        where: { id: parsedLocationId },
      })
      if (targetLocation?.userId) {
        assignedUserId = targetLocation.userId
      }
    }

    const newItem = await prisma.item.create({
      data: {
        label: label.trim(),
        quantity: quantity !== undefined ? Number(quantity) : 0,
        barcode: barcode?.trim() || null,
        locationId: locationId ? parsedLocationId : null,
        userId: assignedUserId,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        openedOn: openedOn ? new Date(openedOn) : null,
        useWithinDays:
          useWithinDays !== undefined && useWithinDays !== null ? Number(useWithinDays) : null,
        lowStockThreshold:
          lowStockThreshold !== undefined && lowStockThreshold !== null
            ? Number(lowStockThreshold)
            : null,
      },
      include: { location: true },
    })

    res.status(201).json(enrichItem(newItem))
  } catch (error: unknown) {
    console.error('Error adding item:', error)
    handlePrismaError(error, res, 'Failed to create item')
  }
}

/**
 * PATCH /items/:id - Dynamically update an item
 */
export const updateItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const itemId = parseId(req.params.id)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const {
      label,
      quantity,
      barcode,
      locationId,
      userId,
      expirationDate,
      openedOn,
      useWithinDays,
      lowStockThreshold,
    } = req.body

    const updateData: Prisma.ItemUpdateInput = {}

    // String fields (safely check types before trimming)
    if (typeof label === 'string') updateData.label = label.trim()
    if (typeof barcode === 'string') updateData.barcode = barcode.trim()
    if (barcode === null) updateData.barcode = null

    // Numeric fields
    if (quantity !== undefined) updateData.quantity = Number(quantity)
    if (useWithinDays !== undefined)
      updateData.useWithinDays = useWithinDays !== null ? Number(useWithinDays) : null
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold !== null ? Number(lowStockThreshold) : null

    // Date fields
    if (expirationDate !== undefined)
      updateData.expirationDate = expirationDate ? new Date(expirationDate) : null
    if (openedOn !== undefined) updateData.openedOn = openedOn ? new Date(openedOn) : null

    // Relation updates (supports both connecting and disconnecting)
    if (locationId !== undefined) {
      updateData.location =
        locationId !== null ? { connect: { id: Number(locationId) } } : { disconnect: true }
    }

    if (userId !== undefined) {
      updateData.user = userId !== null ? { connect: { id: Number(userId) } } : { disconnect: true }
    }

    // Perform DB Update
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: { location: true },
    })

    // Fire background event (Decoupled & eliminates dangling .catch calls)
    itemEvents.emit('item:updated', updatedItem)

    res.status(200).json(enrichItem(updatedItem))
  } catch (error: unknown) {
    console.error('Error updating item:', error)
    handlePrismaError(error, res, 'Failed to update item')
  }
}

/**
 * DELETE /items/:id - Soft Delete (Sets deletedAt = NOW() and quantity = 0)
 */
export const deleteItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const itemId = parseId(req.params.id)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    // Soft delete by updating deletedAt timestamp
    await prisma.item.update({
      where: { id: itemId },
      data: {
        deletedAt: new Date(),
        quantity: 0,
      },
    })

    res.status(204).send()
  } catch (error: unknown) {
    console.error('Error soft-deleting item:', error)
    handlePrismaError(error, res, 'Failed to delete item')
  }
}

/**
 * POST /items/:id/restore - Un-archive / Restock an item (Sets deletedAt = NULL)
 */
export const restoreItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const itemId = parseId(req.params.id)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const { quantity, locationId, expirationDate } = req.body

    const updateData: Prisma.ItemUpdateInput = {
      deletedAt: null, // Clear archive timestamp
      quantity: quantity !== undefined ? Number(quantity) : 1,
    }

    if (locationId !== undefined) {
      updateData.location = { connect: { id: Number(locationId) } }
    }
    if (expirationDate !== undefined) {
      updateData.expirationDate = expirationDate ? new Date(expirationDate) : null
    }

    const restoredItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: { location: true },
    })

    res.status(200).json(enrichItem(restoredItem))
  } catch (error: unknown) {
    console.error('Error restoring item:', error)
    handlePrismaError(error, res, 'Failed to restore item')
  }
}
