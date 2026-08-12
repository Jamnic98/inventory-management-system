import { Request, Response } from 'express'

import prisma from '../db.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'
import { getCurrentUserId, parseId } from '../utils/index.js'

// GET /api/v1/locations/:locationId/subscription
// Get the current user's subscription status for a specific location
export const getLocationSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const locationId = parseId(req.params.locationId)
    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid location ID format' })
      return
    }

    const subscription = await prisma.locationSubscription.findUnique({
      where: {
        userId_locationId: {
          userId: currentUserId,
          locationId,
        },
      },
    })

    // Returns null if not explicitly subscribed
    res.status(200).json(subscription)
  } catch (error: unknown) {
    console.error('Error fetching location subscription:', error)
    handlePrismaError(error, res, 'Failed to fetch location subscription')
  }
}

// PUT /api/v1/locations/:locationId/subscription
// Upsert subscription (create if doesn't exist, update toggles if it does)
export const upsertLocationSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const locationId = parseId(req.params.locationId)
    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid location ID format' })
      return
    }

    // Verify location exists before subscribing
    const locationExists = await prisma.location.findUnique({
      where: { id: locationId },
    })

    if (!locationExists) {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    const { notifyExpiring, notifyLowStock } = req.body

    const subscription = await prisma.locationSubscription.upsert({
      where: {
        userId_locationId: {
          userId: currentUserId,
          locationId,
        },
      },
      update: {
        ...(notifyExpiring !== undefined && { notifyExpiring: Boolean(notifyExpiring) }),
        ...(notifyLowStock !== undefined && { notifyLowStock: Boolean(notifyLowStock) }),
      },
      create: {
        userId: currentUserId,
        locationId,
        notifyExpiring: notifyExpiring !== undefined ? Boolean(notifyExpiring) : true,
        notifyLowStock: notifyLowStock !== undefined ? Boolean(notifyLowStock) : true,
      },
      include: {
        location: true,
      },
    })

    res.status(200).json(subscription)
  } catch (error: unknown) {
    console.error('Error upserting location subscription:', error)
    handlePrismaError(error, res, 'Failed to save location subscription')
  }
}

// DELETE /api/v1/locations/:locationId/subscription
// Unsubscribe current user from a location
export const deleteLocationSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const locationId = parseId(req.params.locationId)
    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid location ID format' })
      return
    }

    await prisma.locationSubscription.delete({
      where: {
        userId_locationId: {
          userId: currentUserId,
          locationId,
        },
      },
    })

    res.status(204).send()
  } catch (error: unknown) {
    console.error('Error deleting location subscription:', error)
    handlePrismaError(error, res, 'Failed to remove location subscription')
  }
}

// GET /api/v1/subscriptions
// List all subscriptions for the current user (for user settings view)
export const getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const subscriptions = await prisma.locationSubscription.findMany({
      where: { userId: currentUserId },
      include: {
        location: {
          select: {
            id: true,
            label: true,
            // ❌ Removed 'type: true'
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.status(200).json(subscriptions)
  } catch (error: unknown) {
    console.error('Error fetching user subscriptions:', error)
    handlePrismaError(error, res, 'Failed to fetch subscriptions')
  }
}
