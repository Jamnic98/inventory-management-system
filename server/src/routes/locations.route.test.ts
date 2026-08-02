import { Request, Response } from 'express'

import prisma from '../db.js'

// GET /locations - Retrieve all locations (with parent, children, and items)
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
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to retrieve locations due to an internal server error.',
    })
  }
}

// POST /locations - Create a new location (With full payload validation)
export const addLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, type, parentId } = req.body

    const validationErrors: Array<{ field: string; message: string }> = []

    // 1. Validate required field: label
    if (label === undefined || label === null || String(label).trim() === '') {
      validationErrors.push({
        field: 'label',
        message: 'The "label" field is required and cannot be empty.',
      })
    } else if (typeof label !== 'string') {
      validationErrors.push({
        field: 'label',
        message: 'The "label" field must be a string.',
      })
    }

    // 2. Validate optional field: type
    if (type !== undefined && type !== null && typeof type !== 'string') {
      validationErrors.push({
        field: 'type',
        message: 'The "type" field must be a string.',
      })
    }

    // 3. Validate optional field: parentId
    let parsedParentId: number | null = null
    if (parentId !== undefined && parentId !== null) {
      const num = Number(parentId)
      if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
        validationErrors.push({
          field: 'parentId',
          message: 'The "parentId" must be a positive integer.',
        })
      } else {
        parsedParentId = num
      }
    }

    // If any validation errors accumulated, reject early with 400 Bad Request
    if (validationErrors.length > 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request payload.',
        details: validationErrors,
      })
      return
    }

    // 4. Create location record in DB
    const newLocation = await prisma.location.create({
      data: {
        label: label.trim(),
        type: type ? type.trim() : 'LOCATION',
        parentId: parsedParentId,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    res.status(201).json(newLocation)
  } catch (err: any) {
    console.error('Error adding location:', err)

    // P2003: Foreign key constraint failure (invalid parentId provided)
    if (err.code === 'P2003') {
      res.status(400).json({
        error: 'ForeignKeyError',
        message: 'The specified parent location does not exist.',
        details: [{ field: 'parentId', message: 'No location found with this ID.' }],
      })
      return
    }

    // P2002: Unique constraint violation (e.g. if label must be unique in schema)
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'DuplicateEntryError',
        message: 'A location with this label already exists.',
      })
      return
    }

    res.status(500).json({
      error: 'DatabaseError',
      message: 'An error occurred while creating the location.',
    })
  }
}

// DELETE /locations/:id - Delete a location by ID (With route param validation)
export const deleteLocationById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    // 1. Validate parameter existence and format
    if (!id || id.trim() === '') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Location ID path parameter is required.',
      })
      return
    }

    const locationId = Number(id)
    if (isNaN(locationId) || !Number.isInteger(locationId) || locationId <= 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Location ID must be a valid positive integer.',
      })
      return
    }

    // 2. Perform deletion
    await prisma.location.delete({
      where: { id: locationId },
    })

    res.status(204).send()
  } catch (err: any) {
    console.error('Error deleting location:', err)

    // P2025: Record to delete does not exist
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'NotFoundError',
        message: `Location with ID ${req.params.id} was not found.`,
      })
      return
    }

    // P2003: Foreign key constraint failure (Location contains items or children)
    if (err.code === 'P2003') {
      res.status(409).json({
        error: 'ConflictError',
        message:
          'Cannot delete a location that contains active items or sub-locations. Reassign or remove dependent records first.',
      })
      return
    }

    res.status(500).json({
      error: 'DatabaseError',
      message: 'An error occurred while attempting to delete the location.',
    })
  }
}
