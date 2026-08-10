import { Router } from 'express'

import { getUserSubscriptions } from '../../controllers/locationSubscription.controller.js'
import requireAuth from '../../middleware/auth.middleware.js'

const router = Router()

// Require active session to view subscriptions
router.get('/', requireAuth, getUserSubscriptions)

export default router
