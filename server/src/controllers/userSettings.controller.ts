import { Request, Response } from 'express'

import prisma from '../db.js'
import { handlePrismaError } from '../middleware/index.js'
import { parseId } from '../utils/index.js'

// GET /api/v1/users/:id/settings
// Fetch user settings (auto-creates default record if legacy user didn't have one)
export const getUserSettings = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseId(req.params.id)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })

    res.status(200).json(settings)
  } catch (error: unknown) {
    console.error('Error fetching user settings:', error)
    handlePrismaError(error, res, 'Failed to retrieve user settings')
  }
}

// PATCH /api/v1/users/:id/settings
// Update notification preferences and thresholds
export const updateUserSettings = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseId(req.params.id)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const {
      defaultNotifyExpiring,
      defaultNotifyLowStock,
      autoSubscribeNewLocations,
      expiringThresholdDays,
      emailNotifications,
      pushNotifications,
    } = req.body

    // Define explicit scalar types to prevent Prisma update/create type mismatches
    const settingsPayload: {
      defaultNotifyExpiring?: boolean
      defaultNotifyLowStock?: boolean
      autoSubscribeNewLocations?: boolean
      emailNotifications?: boolean
      pushNotifications?: boolean
      expiringThresholdDays?: number
    } = {}

    if (typeof defaultNotifyExpiring === 'boolean')
      settingsPayload.defaultNotifyExpiring = defaultNotifyExpiring
    if (typeof defaultNotifyLowStock === 'boolean')
      settingsPayload.defaultNotifyLowStock = defaultNotifyLowStock
    if (typeof autoSubscribeNewLocations === 'boolean')
      settingsPayload.autoSubscribeNewLocations = autoSubscribeNewLocations
    if (typeof emailNotifications === 'boolean')
      settingsPayload.emailNotifications = emailNotifications
    if (typeof pushNotifications === 'boolean')
      settingsPayload.pushNotifications = pushNotifications

    if (expiringThresholdDays !== undefined) {
      const days = Number(expiringThresholdDays)
      if (isNaN(days) || days < 1) {
        res.status(400).json({ error: 'Threshold days must be a positive number' })
        return
      }
      settingsPayload.expiringThresholdDays = days
    }

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: settingsPayload,
      create: {
        userId,
        ...settingsPayload,
      },
    })

    res.status(200).json(updatedSettings)
  } catch (error: unknown) {
    console.error('Error updating user settings:', error)
    handlePrismaError(error, res, 'Failed to update user settings')
  }
}
