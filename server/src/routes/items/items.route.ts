import { Router } from 'express'

import {
  getItems,
  getItemByID,
  getItemByBarcode,
  addItem,
  updateItemByID,
  deleteItemByID,
  restoreItemByID,
} from '../../controllers/items.controller.js'

const router = Router()

// Collection routes
router.get('/', getItems)
router.post('/', addItem)

// Barcode route (place BEFORE /:id to prevent route conflicts)
router.get('/barcode/:barcode', getItemByBarcode)

// Item-specific routes
router.get('/:id', getItemByID)
router.patch('/:id', updateItemByID)
router.delete('/:id', deleteItemByID)
router.post('/:id/restore', restoreItemByID)

export default router
