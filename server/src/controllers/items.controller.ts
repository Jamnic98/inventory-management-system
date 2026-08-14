import { NextFunction, Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'

import prisma from '../db.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'
import { enrichItem, getCurrentUserId, parseId } from '../utils/index.js'
import { broadcast } from '../index.js'

/**
 * Standard Prisma include object for fetching catalog items with active stock batches
 */
const itemWithStocksInclude = {
  stocks: {
    where: { deletedAt: null },
    include: { location: true },
    orderBy: { expirationDate: 'asc' as const },
  },
}

/**
 * GET /items - Retrieve all active catalog items (deletedAt IS NULL)
 * Includes active stock batches and their locations.
 */
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { search, locationId, page: reqPage, limit: reqLimit } = req.query

    // Sanitize pagination parameters
    const page = Math.max(1, parseInt(reqPage as string, 10) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(reqLimit as string, 10) || 10))
    const skip = (page - 1) * limit

    // Base ownership & active catalog filters
    const conditions: Prisma.ItemWhereInput[] = [
      { deletedAt: null },
      {
        OR: [
          { userId: null }, // General / Household shared items
          ...(currentUserId ? [{ userId: currentUserId }] : []),
        ],
      },
    ]

    // Optional location filter (filters items having stock at this location)
    if (locationId) {
      const parsedLocId = parseId(locationId)
      if (!isNaN(parsedLocId)) {
        conditions.push({
          stocks: {
            some: {
              locationId: parsedLocId,
              deletedAt: null,
            },
          },
        })
      }
    }

    // Search filter across label and barcode
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

    const where: Prisma.ItemWhereInput = { AND: conditions }

    // Execute paginated findMany and total count concurrently
    const [rawItems, totalItems] = await Promise.all([
      prisma.item.findMany({
        where,
        include: itemWithStocksInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    res.status(200).json({
      data: rawItems.map(enrichItem),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching items:', error)
    handlePrismaError(error, res, 'Failed to retrieve items')
  }
}

/**
 * GET /items/archived - Search soft-deleted catalog items
 */
export const getArchivedItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { search } = req.query

    const items = await prisma.item.findMany({
      where: {
        deletedAt: { not: null },
        OR: [{ userId: null }, ...(currentUserId ? [{ userId: currentUserId }] : [])],
        ...(search ? { label: { contains: String(search), mode: 'insensitive' } } : {}),
      },
      include: {
        stocks: {
          include: { location: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.status(200).json(items.map(enrichItem))
  } catch (error: unknown) {
    console.error('Error fetching archived items:', error)
    handlePrismaError(error, res, 'Failed to retrieve archived items')
  }
}

/**
 * GET /items/:id - Retrieve catalog item by ID with stock breakdown
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
      include: itemWithStocksInclude,
    })

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
 * POST /items - Create new catalog item + initial stock batch
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

    if (!label) {
      res.status(400).json({ error: 'Label is required' })
      return
    }

    const parsedLocationId = locationId ? Number(locationId) : null

    // Determine ownership hierarchy for master catalog item
    let assignedUserId: number | null = null
    if (userId !== undefined) {
      assignedUserId = userId !== null ? Number(userId) : null
    } else if (currentUserId !== null) {
      assignedUserId = currentUserId
    } else if (parsedLocationId) {
      const targetLocation = await prisma.location.findUnique({
        where: { id: parsedLocationId },
      })
      if (targetLocation?.userId) {
        assignedUserId = targetLocation.userId
      }
    }

    // Create Catalog Item + Initial ItemStock in a single nested write
    const newItem = await prisma.item.create({
      data: {
        label: label.trim(),
        barcode: barcode?.trim() || null,
        userId: assignedUserId,
        useWithinDays:
          useWithinDays !== undefined && useWithinDays !== null ? Number(useWithinDays) : null,
        lowStockThreshold:
          lowStockThreshold !== undefined && lowStockThreshold !== null
            ? Number(lowStockThreshold)
            : null,

        // Initial physical stock batch
        stocks: {
          create: {
            quantity: quantity !== undefined ? Number(quantity) : 1,
            locationId: parsedLocationId,
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            openedOn: openedOn ? new Date(openedOn) : null,
          },
        },
      },
      include: itemWithStocksInclude,
    })

    broadcast({ type: 'item:added', id: newItem.id })

    res.status(201).json(enrichItem(newItem))
  } catch (error: unknown) {
    console.error('Error adding item:', error)
    handlePrismaError(error, res, 'Failed to create item')
  }
}

/**
 * PATCH /items/:id - Update catalog metadata and/or primary stock entry
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
      stockId, // Optional: Target specific stock batch if provided
    } = req.body

    const updateData: Prisma.ItemUpdateInput = {}

    // Update Catalog Level Fields
    if (typeof label === 'string') updateData.label = label.trim()
    if (typeof barcode === 'string') updateData.barcode = barcode.trim()
    if (barcode === null) updateData.barcode = null

    if (useWithinDays !== undefined)
      updateData.useWithinDays = useWithinDays !== null ? Number(useWithinDays) : null
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold !== null ? Number(lowStockThreshold) : null

    if (userId !== undefined) {
      updateData.user = userId !== null ? { connect: { id: Number(userId) } } : { disconnect: true }
    }

    // Perform DB Transaction to update Item Catalog and target ItemStock batch
    const updatedItem = await prisma.$transaction(async (tx) => {
      // Update catalog entry
      await tx.item.update({
        where: { id: itemId },
        data: updateData,
      })

      // Check if stock-level fields need updating
      const hasStockUpdates =
        quantity !== undefined ||
        locationId !== undefined ||
        expirationDate !== undefined ||
        openedOn !== undefined

      if (hasStockUpdates) {
        // Find existing stock batch (specific stockId OR first active stock)
        let targetStockId = stockId ? Number(stockId) : null

        if (!targetStockId) {
          const firstStock = await tx.itemStock.findFirst({
            where: { itemId, deletedAt: null },
            orderBy: { id: 'asc' },
          })
          targetStockId = firstStock?.id ?? null
        }

        const stockUpdateData: Prisma.ItemStockUpdateInput = {}
        if (quantity !== undefined) stockUpdateData.quantity = Number(quantity)
        if (expirationDate !== undefined)
          stockUpdateData.expirationDate = expirationDate ? new Date(expirationDate) : null
        if (openedOn !== undefined) stockUpdateData.openedOn = openedOn ? new Date(openedOn) : null
        if (locationId !== undefined) {
          stockUpdateData.location =
            locationId !== null ? { connect: { id: Number(locationId) } } : { disconnect: true }
        }

        if (targetStockId) {
          await tx.itemStock.update({
            where: { id: targetStockId },
            data: stockUpdateData,
          })
        } else {
          // If no active stock batch exists, create one
          await tx.itemStock.create({
            data: {
              itemId,
              quantity: quantity !== undefined ? Number(quantity) : 1,
              locationId: locationId ? Number(locationId) : null,
              expirationDate: expirationDate ? new Date(expirationDate) : null,
              openedOn: openedOn ? new Date(openedOn) : null,
            },
          })
        }
      }

      // Return fully updated item with stocks
      return tx.item.findUniqueOrThrow({
        where: { id: itemId },
        include: itemWithStocksInclude,
      })
    })

    // Fire background event
    broadcast({ type: 'item:updated', id: itemId })

    res.status(200).json(enrichItem(updatedItem))
  } catch (error: unknown) {
    console.error('Error updating item:', error)
    handlePrismaError(error, res, 'Failed to update item')
  }
}

/**
 * DELETE /items/:id - Soft delete catalog item AND all related stock batches
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

    const now = new Date()

    // Soft-delete catalog item AND set all related stock batches to deletedAt = NOW()
    await prisma.$transaction([
      prisma.item.update({
        where: { id: itemId },
        data: { deletedAt: now },
      }),
      prisma.itemStock.updateMany({
        where: { itemId, deletedAt: null },
        data: { deletedAt: now, quantity: 0 },
      }),
    ])

    broadcast({ type: 'item:deleted', id: itemId })

    res.status(204).send()
  } catch (error: unknown) {
    console.error('Error soft-deleting item:', error)
    handlePrismaError(error, res, 'Failed to delete item')
  }
}

/**
 * POST /items/:id/restore - Un-archive catalog item & restore active stock
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

    const restoredItem = await prisma.$transaction(async (tx) => {
      // Un-archive catalog item
      await tx.item.update({
        where: { id: itemId },
        data: { deletedAt: null },
      })

      // Create a fresh stock batch for restored item
      await tx.itemStock.create({
        data: {
          itemId,
          quantity: quantity !== undefined ? Number(quantity) : 1,
          locationId: locationId ? Number(locationId) : null,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
        },
      })

      return tx.item.findUniqueOrThrow({
        where: { id: itemId },
        include: itemWithStocksInclude,
      })
    })

    broadcast({ type: 'item:restored', id: restoredItem.id })

    res.status(200).json(enrichItem(restoredItem))
  } catch (error: unknown) {
    console.error('Error restoring item:', error)
    handlePrismaError(error, res, 'Failed to restore item')
  }
}

/**
 * GET /items/barcode/:barcode - Retrieve catalog item by exact barcode (active or archived)
 */
export const getItemByBarcode = async (
  req: Request<{ barcode: string }>,
  res: Response
): Promise<void> => {
  try {
    const rawBarcode = req.params.barcode
    const barcode = rawBarcode ? rawBarcode.trim() : ''

    if (!barcode) {
      res.status(400).json({ error: 'Barcode parameter is required' })
      return
    }

    const currentUserId = getCurrentUserId(req)

    const item = await prisma.item.findFirst({
      where: {
        barcode,
        OR: [
          { userId: null }, // General / Household shared items
          ...(currentUserId ? [{ userId: currentUserId }] : []),
        ],
      },
      // Prioritize active items over archived items if duplicates exist
      orderBy: [
        { deletedAt: 'asc' }, // nulls/active items come first
        { updatedAt: 'desc' },
      ],
      include: itemWithStocksInclude,
    })

    if (!item) {
      res.status(404).json({ error: 'Item not found for this barcode' })
      return
    }

    res.status(200).json(enrichItem(item))
  } catch (error: unknown) {
    console.error('Error fetching item by barcode:', error)
    handlePrismaError(error, res, 'Failed to retrieve item by barcode')
  }
}
