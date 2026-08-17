import { Router } from 'express'

import {
  getUserNotifications,
  markAllNotificationsRead,
  markSingleNotificationRead,
} from '../controllers/notification.controller.js'
import requireAuth from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', getUserNotifications)
router.patch('/mark-read', markAllNotificationsRead)
router.patch('/:id/read', markSingleNotificationRead)

export default router
