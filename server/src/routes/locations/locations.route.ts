import { Router } from 'express'
import {
  getLocations,
  getLocationById,
  addLocation,
  updateLocation,
  deleteLocationById,
} from '../../controllers/locations.controller.js'
import {
  getLocationSubscription,
  upsertLocationSubscription,
  deleteLocationSubscription,
} from '../../controllers/locationSubscription.controller.js'
import requireAuth from '../../middleware/auth.middleware.js'

const router = Router()

// Core Location Routes
router.get('/', getLocations)
router.get('/:id', getLocationById)

// Protected Mutation Routes
router.post('/', requireAuth, addLocation)
router.patch('/:id', requireAuth, updateLocation)
router.delete('/:id', requireAuth, deleteLocationById)

// Protected Subscription Operations
router.get('/:locationId/subscription', requireAuth, getLocationSubscription)
router.put('/:locationId/subscription', requireAuth, upsertLocationSubscription)
router.delete('/:locationId/subscription', requireAuth, deleteLocationSubscription)

export default router
