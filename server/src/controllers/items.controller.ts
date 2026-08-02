import { Request, Response } from 'express'
import prisma from '../db.js'

// GET /items - Retrieve all items (including location details)
export const getItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.item.findMany({
      include: {
        location: true, // Equivalent to Mongoose .populate('location')
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    res.status(200).json(items)
  } catch (err) {
    console.error('Error fetching items:', err)
    res.status(500).json({ error: 'Failed to retrieve items' })
  }
}

// GET /items/:id - Retrieve a single item by ID
export const getItemByID = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        location: true,
      },
    })

    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(200).json(item)
  } catch (err) {
    console.error('Error fetching item:', err)
    res.status(500).json({ error: 'Failed to retrieve item' })
  }
}

// POST /items - Create a new item linked to a location
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, quantity, locationId, expirationDate, lowStockAlert } = req.body

    if (!label || locationId === undefined || locationId === null) {
      res.status(400).json({ error: 'Label and locationId are required' })
      return
    }

    const newItem = await prisma.item.create({
      data: {
        label,
        quantity: quantity !== undefined ? Number(quantity) : 0,
        locationId: Number(locationId),
        lowStockAlert: Boolean(lowStockAlert),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
      include: {
        location: true,
      },
    })

    res.status(201).json(newItem)
  } catch (err) {
    console.error('Error adding item:', err)
    res.status(400).json({ error: 'Failed to create item' })
  }
}

// PUT/PATCH /items/:id - Update an item dynamically
export const updateItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const { label, quantity, locationId, expirationDate, lowStockAlert } = req.body

    // Build update payload dynamically
    const updateData: {
      label?: string
      quantity?: number
      locationId?: number
      lowStockAlert?: boolean
      expirationDate?: Date | null
    } = {}

    if (label !== undefined) updateData.label = label
    if (quantity !== undefined) updateData.quantity = Number(quantity)
    if (locationId !== undefined) updateData.locationId = Number(locationId)
    if (lowStockAlert !== undefined) updateData.lowStockAlert = Boolean(lowStockAlert)
    if (expirationDate !== undefined) {
      updateData.expirationDate = expirationDate ? new Date(expirationDate) : null
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: {
        location: true,
      },
    })

    res.status(200).json(updatedItem)
  } catch (err: any) {
    console.error('Error updating item:', err)
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.status(400).json({ error: 'Failed to update item' })
  }
}

// DELETE /items/:id - Delete an item by ID
export const deleteItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    await prisma.item.delete({
      where: { id: itemId },
    })

    res.status(204).send()
  } catch (err: any) {
    console.error('Error deleting item:', err)
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.status(400).json({ error: 'Failed to delete item' })
  }
}
