import { Request, Response } from 'express'

import prisma from '../db.js'

// TODO: move & remove any
// Helper: Attach calculated flags for UI consumers
const enrichItem = (item: any) => {
  const isLowStock =
    item.lowStockThreshold !== null && item.lowStockThreshold !== undefined
      ? item.quantity <= item.lowStockThreshold
      : false

  let isOpenedExpired = false
  if (item.openedOn && item.useWithinDays) {
    const openedDate = new Date(item.openedOn)
    const expiryDate = new Date(openedDate)
    expiryDate.setDate(expiryDate.getDate() + item.useWithinDays)
    isOpenedExpired = new Date() > expiryDate
  }

  return {
    ...item,
    isLowStock,
    isOpenedExpired,
  }
}

// GET /items - Retrieve all items
export const getItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.item.findMany({
      include: { location: true },
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json(items.map(enrichItem))
  } catch (err) {
    console.error('Error fetching items:', err)
    res.status(500).json({ error: 'Failed to retrieve items' })
  }
}

// GET /items/:id - Retrieve item by ID
export const getItemByID = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id, 10)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { location: true },
    })

    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(200).json(enrichItem(item))
  } catch (err) {
    console.error('Error fetching item:', err)
    res.status(500).json({ error: 'Failed to retrieve item' })
  }
}

// POST /items - Create new item
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      label,
      quantity,
      locationId,
      expirationDate,
      openedOn,
      useWithinDays,
      lowStockThreshold,
    } = req.body

    if (!label || locationId === undefined || locationId === null) {
      res.status(400).json({ error: 'Label and locationId are required' })
      return
    }

    const newItem = await prisma.item.create({
      data: {
        label: label.trim(),
        quantity: quantity !== undefined ? Number(quantity) : 0,
        locationId: Number(locationId),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        openedOn: openedOn ? new Date(openedOn) : null,
        useWithinDays: useWithinDays ? Number(useWithinDays) : null,
        lowStockThreshold:
          lowStockThreshold !== undefined && lowStockThreshold !== null
            ? Number(lowStockThreshold)
            : null,
      },
      include: { location: true },
    })

    res.status(201).json(enrichItem(newItem))
  } catch (err: any) {
    console.error('Error adding item:', err)

    if (err.code === 'P2003') {
      res.status(400).json({ error: 'Specified locationId does not exist' })
      return
    }

    res.status(500).json({ error: 'Failed to create item' })
  }
}

// PATCH /items/:id - Dynamically update an item
export const updateItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id, 10)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const {
      label,
      quantity,
      locationId,
      expirationDate,
      openedOn,
      useWithinDays,
      lowStockThreshold,
    } = req.body

    const updateData: any = {}

    if (label !== undefined) updateData.label = label.trim()
    if (quantity !== undefined) updateData.quantity = Number(quantity)
    if (locationId !== undefined) updateData.locationId = Number(locationId)
    if (expirationDate !== undefined)
      updateData.expirationDate = expirationDate ? new Date(expirationDate) : null
    if (openedOn !== undefined) updateData.openedOn = openedOn ? new Date(openedOn) : null
    if (useWithinDays !== undefined)
      updateData.useWithinDays = useWithinDays !== null ? Number(useWithinDays) : null
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold !== null ? Number(lowStockThreshold) : null

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: { location: true },
    })

    res.status(200).json(enrichItem(updatedItem))
  } catch (err: any) {
    console.error('Error updating item:', err)

    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    if (err.code === 'P2003') {
      res.status(400).json({ error: 'Specified locationId does not exist' })
      return
    }

    res.status(500).json({ error: 'Failed to update item' })
  }
}

// DELETE /items/:id - Delete an item
export const deleteItemByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id, 10)
    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    await prisma.item.delete({ where: { id: itemId } })
    res.status(204).send()
  } catch (err: any) {
    console.error('Error deleting item:', err)

    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(500).json({ error: 'Failed to delete item' })
  }
}
