import { Router } from 'express'
import {
  getUsers,
  getUserByID,
  createUser,
  loginWithToken,
  deleteUserByID,
} from '../controllers/users.controller.js'

const router = Router()

router.get('/', getUsers)
router.get('/login', loginWithToken)
router.get('/:id', getUserByID)
router.post('/', createUser)
router.delete('/:id', deleteUserByID)

export default router
