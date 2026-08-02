import express from 'express'

import { getLocations, addLocation, deleteLocationById } from '../controllers/index.js'

const router = express.Router()

router.get('', getLocations)
router.post('', addLocation)
router.delete('/:id', deleteLocationById)

export default router
