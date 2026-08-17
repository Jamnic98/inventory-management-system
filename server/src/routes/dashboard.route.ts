import { Router } from 'express'
import {
  getDashboardHandler,
  getRestockPreviewHandler,
  getRestockRecipientsHandler,
  sendRestockEmailHandler,
} from '../controllers/dashboard.controller.js'
import requireAuth from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', getDashboardHandler)
router.get('/recipients', getRestockRecipientsHandler)
router.post('/send-restock-email', sendRestockEmailHandler)
router.get('/restock-preview', getRestockPreviewHandler)

export default router
