import { Router } from 'express'

import { transferStock } from '../../controllers/stocks.controller.js'

const router = Router()

// Stock-specific routes
router.post('/transfer', transferStock)

export default router
