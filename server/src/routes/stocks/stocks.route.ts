import { Router } from 'express'

import {
  transferStock,
  updateStockQuantity,
  openStockUnit,
} from '../../controllers/stocks.controller.js'

const router = Router()

router.patch('/:id', updateStockQuantity)
router.post('/:id/open', openStockUnit)
router.post('/:id/transfer', transferStock)

export default router
