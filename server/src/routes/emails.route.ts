import express from 'express'

import { getEmails, addEmail, deleteEmailById } from '../controllers/index.js'

const router = express.Router()

router.get('', getEmails)
router.post('', addEmail)
router.delete('/:id', deleteEmailById)

export default router
