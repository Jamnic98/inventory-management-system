import { Request, Response, NextFunction } from 'express'

import {
  transferStockService,
  updateStockQuantityService,
  openStockUnitService,
} from '../services/stocks.service.js'
import { broadcast } from '../index.js'
import prisma from '../db.js'
import { parseId } from '../utils/index.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'

export const transferStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Parse params & body cleanly
    const sourceStockId = Number(req.params.id)
    const { targetLocationId, quantityToMove, quantity, sourceLocationId } = req.body

    const amount = Number(quantityToMove ?? quantity)
    const targetLocId = targetLocationId != null ? Number(targetLocationId) : null

    // Input Validation
    if (isNaN(sourceStockId) || sourceStockId <= 0) {
      res.status(400).json({ error: 'Invalid source stock ID' })
      return
    }

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'quantityToMove must be a positive number' })
      return
    }

    // Call Service & capture result
    const result = await transferStockService({
      sourceStockId,
      targetLocationId: targetLocId,
      quantityToMove: amount,
      sourceLocationId: sourceLocationId != null ? Number(sourceLocationId) : undefined,
    })

    broadcast({ type: 'stock:transferred' })

    // Return Success Response
    res.status(200).json({
      message: 'Stock transferred successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const updateStockQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stockId = Number(req.params.id)
    const { quantity } = req.body
    const newQuantity = Number(quantity)

    // Input Validation
    if (isNaN(stockId) || stockId <= 0) {
      res.status(400).json({ error: 'Invalid stock ID' })
      return
    }

    if (isNaN(newQuantity) || newQuantity < 0) {
      res.status(400).json({ error: 'Quantity must be a non-negative number' })
      return
    }

    const result = await updateStockQuantityService({
      stockId,
      quantity: newQuantity,
    })

    broadcast({ type: 'stock:updated' })

    res.status(200).json({
      message: 'Stock quantity updated successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const openStockUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stockId = Number(req.params.id)

    // Input Validation
    if (isNaN(stockId) || stockId <= 0) {
      res.status(400).json({ error: 'Invalid stock ID' })
      return
    }

    const result = await openStockUnitService({ stockId })

    broadcast({ type: 'stock:opened' })

    res.status(200).json({
      message: 'Stock unit opened successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /stocks/:stockId - Soft-delete a single stock batch
 */
export const deleteStockBatchByID = async (
  req: Request<{ stockId: string }>,
  res: Response
): Promise<void> => {
  try {
    const stockId = parseId(req.params.stockId)
    if (isNaN(stockId)) {
      res.status(400).json({ error: 'Invalid stock ID format' })
      return
    }

    const stock = await prisma.itemStock.findUnique({
      where: { id: stockId },
    })

    if (!stock) {
      res.status(404).json({ error: 'Stock batch not found' })
      return
    }

    const deletedBatch = await prisma.itemStock.update({
      where: { id: stockId },
      data: { deletedAt: new Date() },
    })

    broadcast({ type: 'stock:deleted', id: stockId, itemId: deletedBatch.itemId })

    res.status(200).json(deletedBatch)
  } catch (error: unknown) {
    console.error('Error soft-deleting stock batch:', error)
    handlePrismaError(error, res, 'Failed to delete stock batch')
  }
}

/**
 * POST /stocks/:stockId/restore - Restore a soft-deleted stock batch
 */
export const restoreStockBatchByID = async (
  req: Request<{ stockId: string }>,
  res: Response
): Promise<void> => {
  try {
    const stockId = parseId(req.params.stockId)
    if (isNaN(stockId)) {
      res.status(400).json({ error: 'Invalid stock ID format' })
      return
    }

    const existingStock = await prisma.itemStock.findUnique({
      where: { id: stockId },
      include: { item: true },
    })

    if (!existingStock) {
      res.status(404).json({ error: 'Stock batch not found' })
      return
    }

    if (!existingStock.deletedAt) {
      res.status(400).json({ error: 'Stock batch is not soft-deleted' })
      return
    }

    // Transaction to ensure parent catalog item is also active if restored
    const restoredBatch = await prisma.$transaction(async (tx) => {
      if (existingStock.item?.deletedAt) {
        await tx.item.update({
          where: { id: existingStock.itemId },
          data: { deletedAt: null },
        })
      }

      return tx.itemStock.update({
        where: { id: stockId },
        data: { deletedAt: null },
        include: { location: true },
      })
    })

    broadcast({ type: 'stock:restored', id: stockId, itemId: restoredBatch.itemId })

    res.status(200).json(restoredBatch)
  } catch (error: unknown) {
    console.error('Error restoring stock batch:', error)
    handlePrismaError(error, res, 'Failed to restore stock batch')
  }
}
