import { Request, Response } from 'express'

import { Email } from 'models'

export const getEmails = async (_req: Request, res: Response): Promise<void> => {
  try {
    const emails = await Email.find()
    res.status(200).json(emails)
  } catch (err) {
    console.error('Error fetching emails:', err)
    res.status(500).json({ error: 'Failed to retrieve emails' })
  }
}

export const addEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body

    if (!address) {
      res.status(400).json({ error: 'Email address is required' })
      return
    }

    const newEmail = await Email.create({ address })
    res.status(201).json(newEmail)
  } catch (err) {
    console.error('Error adding email:', err)
    res.status(400).json({ error: 'Failed to create email entry' })
  }
}

export const deleteEmailById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const deletedEmail = await Email.findByIdAndDelete(id)

    if (!deletedEmail) {
      res.status(404).json({ error: 'Email not found' })
      return
    }

    res.status(204).json()
  } catch (err) {
    console.error('Error deleting email:', err)
    res.status(400).json({ error: 'Invalid ID format or operation failed' })
  }
}
