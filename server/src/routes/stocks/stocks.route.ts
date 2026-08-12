import { Router } from 'express'

import { transferStockService as transferStock } from '../../services/stocks.service.js'

const router = Router()

// Handles POST /api/v1/stocks/:id/transfer
router.post('/:id/transfer', transferStock)

export default router
