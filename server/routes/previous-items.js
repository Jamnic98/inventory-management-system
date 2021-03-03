import express from 'express';
import { getItems } from '../controllers/previous-items.js';

const router = express.Router();
router.get('/', getItems);

export default router;
