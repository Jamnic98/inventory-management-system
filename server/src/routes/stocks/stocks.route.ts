import { Router } from 'express'

import { transferStockController as transferStock } from '../../controllers/stocks.controller.js'

const router = Router()

// Handles POST /api/v1/stocks/:id/transfer
router.post('/:id/transfer', transferStock)

export default router
