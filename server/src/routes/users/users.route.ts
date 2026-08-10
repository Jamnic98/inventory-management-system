import { Router } from 'express'

import {
  getUsers,
  getUserByID,
  createUser,
  updateUserByID,
  deleteUserByID,
} from '../../controllers/users.controller.js'
import { getUserSettings, updateUserSettings } from '../../controllers/userSettings.controller.js'

const router = Router()

// Base Users
router.get('/', getUsers)

// Single User Operations
router.post('/', createUser)
router.get('/:id', getUserByID)
router.patch('/:id', updateUserByID)
router.delete('/:id', deleteUserByID)

// User Settings Sub-resource
router.get('/:id/settings', getUserSettings)
router.patch('/:id/settings', updateUserSettings)

export default router
