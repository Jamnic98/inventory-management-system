import { Request, Response } from 'express'
import crypto from 'crypto'
import { Prisma } from '../generated/prisma/client.js'

import prisma from '../db.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'
import { parseId } from '../utils/index.js'

// Helper to generate a 32-character magic token
const generateToken = (): string => crypto.randomBytes(16).toString('hex')

// GET /api/v1/users - Retrieve all household users
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })
    res.status(200).json(users)
  } catch (error: unknown) {
    console.error('Error fetching users:', error)
    handlePrismaError(error, res, 'Failed to retrieve users')
  }
}

// GET /api/v1/users/:id - Retrieve user by ID
export const getUserByID = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = parseId(req.params.id)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(200).json(user)
  } catch (error: unknown) {
    console.error('Error fetching user:', error)
    handlePrismaError(error, res, 'Failed to retrieve user')
  }
}

// POST /api/v1/users - Create user, initial settings, & generate magic login link
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body

    // 1. Whitespace & validation checks
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required and cannot be blank' })
      return
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      res.status(400).json({ error: 'Email is required and cannot be blank' })
      return
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const token = generateToken()

    // 2. Create user and initialize default UserSettings in a single transaction
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        loginToken: token,
        settings: {
          create: {}, // Auto-creates default UserSettings record
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        loginToken: true,
        createdAt: true,
      },
    })

    const host = req.get('host') || 'localhost:8080'
    const protocol = req.protocol
    const magicLink = `${protocol}://${host}/api/v1/users/login?token=${token}`

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      magicLink,
      token,
    })
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    handlePrismaError(error, res, 'Failed to create user')
  }
}

// PATCH /api/v1/users/:id - Update user details
export const updateUserByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseId(req.params.id)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    const { name, email } = req.body
    const updateData: Prisma.UserUpdateInput = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Name cannot be blank' })
        return
      }
      updateData.name = name.trim()
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim().length === 0) {
        res.status(400).json({ error: 'Email cannot be blank' })
        return
      }
      updateData.email = email.trim().toLowerCase()
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    })

    res.status(200).json(updatedUser)
  } catch (error: unknown) {
    console.error('Error updating user:', error)
    handlePrismaError(error, res, 'Failed to update user')
  }
}

// DELETE /api/v1/users/:id - Delete a user
export const deleteUserByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseId(req.params.id)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    await prisma.user.delete({ where: { id: userId } })
    res.status(204).send()
  } catch (error: unknown) {
    console.error('Error deleting user:', error)
    handlePrismaError(error, res, 'Failed to delete user')
  }
}
