import { Request, Response, NextFunction } from 'express'

import { transferStockService } from '../services/stocks.service.js'
import { broadcast } from '../index.js'

export const transferStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Parse params & body cleanly
    const sourceStockId = Number(req.params.id)
    const { targetLocationId, quantityToMove, quantity, sourceLocationId } = req.body

    const amount = Number(quantityToMove ?? quantity)
    const targetLocId = targetLocationId != null ? Number(targetLocationId) : null

    // 2. Input Validation
    if (isNaN(sourceStockId) || sourceStockId <= 0) {
      res.status(400).json({ error: 'Invalid source stock ID' })
      return
    }

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'quantityToMove must be a positive number' })
      return
    }

    // 3. Call Service & capture result
    const result = await transferStockService({
      sourceStockId,
      targetLocationId: targetLocId,
      quantityToMove: amount,
      sourceLocationId: sourceLocationId != null ? Number(sourceLocationId) : undefined,
    })

    broadcast({ type: 'stock:transferred' })

    // 4. Return Success Response
    res.status(200).json({
      message: 'Stock transferred successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
