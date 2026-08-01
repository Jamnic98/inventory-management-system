import { Request, Response } from 'express'

import { Item } from 'models'

export const getItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await Item.find()
    res.status(200).json(items)
  } catch (err) {
    console.error('Error fetching items:', err)
    res.status(500).json({ error: 'Failed to retrieve items' })
  }
}

export const getItemByID = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Item.findById(req.params.id)

    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(200).json(item)
  } catch (err) {
    console.error('Error fetching item:', err)
    res.status(400).json({ error: 'Invalid ID format' })
  }
}

export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const newItem = await Item.create(req.body)
    res.status(201).json(newItem)
  } catch (err) {
    console.error('Error adding item:', err)
    res.status(400).json({ error: 'Failed to create item' })
  }
}

export const updateItemByID = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, quantity, room, location, expirationDate, lowStockAlert } = req.body

    const updateData: Record<string, any> = {
      name,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      room,
      location,
      lowStockAlert,
    }

    // Safely parse date only if provided
    if (expirationDate) {
      updateData.expirationDate = new Date(expirationDate)
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    })

    if (!updatedItem) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(200).json(updatedItem)
  } catch (err) {
    console.error('Error updating item:', err)
    res.status(400).json({ error: 'Failed to update item' })
  }
}

export const deleteItemByID = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id)

    if (!deletedItem) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(204).json()
  } catch (err) {
    console.error('Error deleting item:', err)
    res.status(400).json({ error: 'Failed to delete item' })
  }
}
