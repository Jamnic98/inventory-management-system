import { Request, Response, NextFunction } from 'express'

import {
  transferStockService,
  updateStockQuantityService,
  openStockUnitService,
} from '../services/stocks.service.js'
import { broadcast } from '../index.js'

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
