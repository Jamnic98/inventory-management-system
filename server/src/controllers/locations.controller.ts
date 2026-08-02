import { Request, Response } from 'express'

import prisma from '../db.js'

// GET /locations - Retrieve all locations (with parent & child relations)
export const getLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        parent: true,
        children: true,
        items: true,
      },
      orderBy: {
        label: 'asc',
      },
    })
    res.status(200).json(locations)
  } catch (err) {
    console.error('Error fetching locations:', err)
    res.status(500).json({ error: 'Failed to retrieve locations' })
  }
}

// POST /locations - Create a new location
export const addLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, type, parentId } = req.body

    if (!label || typeof label !== 'string' || label.trim() === '') {
      res.status(400).json({ error: 'Label is required and must be a non-empty string' })
      return
    }

    const newLocation = await prisma.location.create({
      data: {
        label: label.trim(),
        type: type || 'LOCATION',
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    res.status(201).json(newLocation)
  } catch (err: any) {
    // Print full error object in your backend terminal console for debugging
    console.error('DEBUG - Full error on addLocation:', err)

    // P2002: Unique constraint failed (e.g. label already exists)
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Duplicate Location',
        message: `A location with the label "${req.body.label}" already exists.`,
      })
      return
    }

    // P2003: Foreign key constraint failure (invalid parentId)
    if (err.code === 'P2003') {
      res.status(400).json({
        error: 'Invalid Parent ID',
        message: 'The specified parent location does not exist in the database.',
      })
      return
    }

    // P2006 / P2009: Invalid value provided (e.g. type enum mismatch)
    if (err.code === 'P2006' || err.code === 'P2009') {
      res.status(400).json({
        error: 'Invalid Field Value',
        message: err.message || 'One of the provided fields has an invalid type or enum value.',
      })
      return
    }

    // Fallback: Return actual Prisma message during development
    res.status(500).json({
      error: 'Failed to create location',
      code: err.code || 'UNKNOWN',
      details: err.message,
    })
  }
}

// DELETE /locations/:id - Delete a location by ID
export const deleteLocationById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const locationId = parseInt(id, 10)

    if (isNaN(locationId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    await prisma.location.delete({
      where: { id: locationId },
    })

    res.status(204).send()
  } catch (err: any) {
    console.error('Error deleting location:', err)

    // P2025: Record to delete does not exist
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Location not found' })
      return
    }

    // P2003: Foreign key constraint failure (Location has dependent sub-locations or items)
    if (err.code === 'P2003') {
      res.status(409).json({
        error:
          'Cannot delete location that contains items or sub-locations. Reassign or remove them first.',
      })
      return
    }

    res.status(400).json({ error: 'Failed to delete location' })
  }
}
