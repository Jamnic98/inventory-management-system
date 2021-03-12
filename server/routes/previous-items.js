import express from 'express';
import {
  getItems,
  addItem,
  deleteItemByID,
} from '../controllers/previous-items.js';

const router = express.Router();
router.get('/', getItems);
router.post('/add', addItem);
router.delete('/:id', deleteItemByID);

export default router;
