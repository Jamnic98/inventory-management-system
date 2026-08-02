import express from 'express'

import {
  getItems,
  getItemByID,
  addItem,
  updateItemByID,
  deleteItemByID,
} from '../controllers/index.js'

const router = express.Router()

router.get('', getItems)
router.get('/:id', getItemByID)
router.post('', addItem)
router.patch('/:id', updateItemByID)
router.delete('/:id', deleteItemByID)

export default router
