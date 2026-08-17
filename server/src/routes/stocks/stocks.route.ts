import { Router } from 'express'

import {
  transferStock,
  updateStockQuantity,
  openStockUnit,
  deleteStockBatchByID,
  restoreStockBatchByID,
} from '../../controllers/stocks.controller.js'

const router = Router()

router.patch('/:id', updateStockQuantity)
router.post('/:id/open', openStockUnit)
router.post('/:id/transfer', transferStock)
router.delete('/:stockId', deleteStockBatchByID)
router.post('/:stockId/restore', restoreStockBatchByID)

export default router
