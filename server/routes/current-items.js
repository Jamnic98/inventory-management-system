import express from 'express';
import { getItems, getOneItem } from '../controllers/current-items.js';

const router = express.Router();
router.get('/', getItems);
router.get('/:id', getOneItem);

export default router;
