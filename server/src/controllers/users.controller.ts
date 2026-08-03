import { Request, Response } from 'express'
import crypto from 'crypto'

import prisma from '../db.js'

// Helper to generate a 32-character magic token
const generateToken = (): string => crypto.randomBytes(16).toString('hex')

// GET /users - Retrieve all household users
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
  } catch (err) {
    console.error('Error fetching users:', err)
    res.status(500).json({ error: 'Failed to retrieve users' })
  }
}

// GET /users/:id - Retrieve user by ID
export const getUserByID = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10)
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
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(200).json(user)
  } catch (err) {
    console.error('Error fetching user:', err)
    res.status(500).json({ error: 'Failed to retrieve user' })
  }
}

// POST /users - Create user & generate magic login link
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' })
      return
    }

    const token = generateToken()

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        loginToken: token,
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
    const magicLink = `${protocol}://${host}/api/users/login?token=${token}`

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
  } catch (err: any) {
    console.error('Error creating user:', err)

    if (err.code === 'P2002') {
      res.status(409).json({ error: 'A user with this email already exists' })
      return
    }

    res.status(500).json({ error: 'Failed to create user' })
  }
}

// GET /users/login - Auto-login using magic link token
export const loginWithToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Invalid or missing login token' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { loginToken: token },
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired magic link token' })
      return
    }

    // Set 1-year session cookie for LAN devices
    res.cookie('user_session', String(user.id), {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    })

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('Error logging in with token:', err)
    res.status(500).json({ error: 'Failed to authenticate token' })
  }
}

// DELETE /users/:id - Delete a user
export const deleteUserByID = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid ID format' })
      return
    }

    await prisma.user.delete({ where: { id: userId } })
    res.status(204).send()
  } catch (err: any) {
    console.error('Error deleting user:', err)

    if (err.code === 'P2025') {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(500).json({ error: 'Failed to delete user' })
  }
}
