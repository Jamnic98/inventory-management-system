import { Request, Response } from 'express'

import { Location } from '../models/index.js'

export const getLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await Location.find()
    res.status(200).json(locations)
  } catch (err) {
    console.error('Error fetching locations:', err)
    res.status(500).json({ error: 'Failed to retrieve room locations' })
  }
}

export const addLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const newLocation = await Location.create(req.body)
    res.status(201).json(newLocation)
  } catch (err) {
    console.error('Error adding location:', err)
    res.status(400).json({ error: 'Failed to create location' })
  }
}

export const deleteLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedLocation = await Location.findByIdAndDelete(req.params.id)

    if (!deletedLocation) {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    res.status(204).json()
  } catch (err) {
    console.error('Error deleting location:', err)
    res.status(400).json({ error: 'Invalid ID format or operation failed' })
  }
}
