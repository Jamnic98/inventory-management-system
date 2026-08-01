import express from 'express'

import { getLocations, addLocation, deleteLocationById } from 'controllers'

const router = express.Router()

router.get('/', getLocations)
router.post('/add', addLocation)
router.delete('/:id', deleteLocationById)

export default router
