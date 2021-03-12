import express from 'express';
import {
  getItems,
  getItemByID,
  addItem,
  updateItemByID,
  deleteItemByID,
} from '../controllers/current-items.js';

const router = express.Router();
router.get('/', getItems);
router.get('/:id', getItemByID);
router.post('/add', addItem);
router.put('/update/:id', updateItemByID);
router.delete('/:id', deleteItemByID);

export default router;
