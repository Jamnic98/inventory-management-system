import express from 'express';
import { getEmails, addEmail, deleteEmailById } from '../controllers/emails.js';

const router = express.Router();
router.get('/', getEmails);
router.post('/add', addEmail);
router.delete('/:id', deleteEmailById);

export default router;
