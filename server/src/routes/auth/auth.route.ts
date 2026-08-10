import { Router } from 'express'
import {
  loginWithToken,
  generateMagicLink,
  getCurrentUser,
  logout,
} from '../../controllers/auth.controller.js'
import requireAuth from '../../middleware/auth.middleware.js'

const router = Router()

// Public Auth Operations
router.get('/login', loginWithToken)
router.post('/magic-link/:userId', generateMagicLink)

// Authenticated Session Endpoints
router.get('/me', requireAuth, getCurrentUser)
router.post('/logout', requireAuth, logout)

export default router
