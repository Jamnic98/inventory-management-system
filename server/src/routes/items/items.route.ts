import { Router } from 'express'

import {
  getItems,
  getArchivedItems,
  getItemByID,
  addItem,
  updateItemByID,
  deleteItemByID,
  restoreItemByID,
} from '../../controllers/items.controller.js'

const router = Router()

// Collection routes
router.get('/', getItems)
router.post('/', addItem)
router.get('/archived', getArchivedItems)

// Item-specific routes
router.get('/:id', getItemByID)
router.patch('/:id', updateItemByID)
router.delete('/:id', deleteItemByID)
router.post('/:id/restore', restoreItemByID)

export default router
