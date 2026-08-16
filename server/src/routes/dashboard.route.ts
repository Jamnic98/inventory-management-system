import { Router } from 'express'

import { getDashboardHandler } from '../controllers/dashboard.controller.js'
import requireAuth from '../middleware/auth.middleware.js'

const router = Router()

// All dashboard endpoints require authentication
router.get('/', requireAuth, getDashboardHandler)

export default router
