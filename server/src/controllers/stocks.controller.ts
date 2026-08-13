import { Request, Response, NextFunction } from 'express'

import { transferStockService } from '../services/stocks.service.js'
import { broadcast } from '../index.js'

export const transferStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Parse params & body
    const sourceStockId = Number(req.params.id)
    const { targetLocationId, quantityToMove } = req.body

    // Basic Input Validation
    if (isNaN(sourceStockId) || sourceStockId <= 0) {
      res.status(400).json({ error: 'Invalid source stock ID' })
      return
    }

    if (!targetLocationId || typeof targetLocationId !== 'number') {
      res.status(400).json({ error: 'targetLocationId must be a valid number' })
      return
    }

    if (!quantityToMove || typeof quantityToMove !== 'number' || quantityToMove <= 0) {
      res.status(400).json({ error: 'quantityToMove must be a positive number' })
      return
    }

    // Call Service
    const result = await transferStockService({
      sourceStockId,
      targetLocationId,
      quantityToMove,
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
