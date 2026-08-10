import { Request, Response } from 'express'
import crypto from 'node:crypto'

import prisma from '../db.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'
import { parseId } from '../utils/index.js'

// GET /api/v1/auth/login?token=...
export const loginWithToken = async (
  req: Request<{}, {}, {}, { token?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.query

    if (!token) {
      res.status(400).json({ error: 'Token is required' })
      return
    }

    // Find user by magic link token or token table
    const user = await prisma.user.findFirst({
      where: {
        loginToken: token,
        // Check expiration if your schema tracks it:
        // tokenExpiresAt: { gte: new Date() }
      },
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired login token' })
      return
    }

    // Clear/consume the token if single-use
    await prisma.user.update({
      where: { id: user.id },
      data: { loginToken: null },
    })

    // Set HTTP-only session cookie
    res.cookie('user_session', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Error during token login:', error)
    res.status(500).json({ error: 'Failed to authenticate token' })
  }
}

// POST /api/v1/auth/magic-link/:userId - Generate magic link token for a user
export const generateMagicLink = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseId(req.params.userId)
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' })
      return
    }

    // Generate random 32-byte token
    const token = crypto.randomBytes(32).toString('hex')

    const user = await prisma.user.update({
      where: { id: userId },
      data: { loginToken: token },
    })

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/api/v1/auth/login?token=${token}`

    res.status(200).json({
      message: 'Magic link generated successfully',
      userId: user.id,
      token,
      magicLink,
    })
  } catch (error: unknown) {
    console.error('Error generating magic link:', error)
    handlePrismaError(error, res, 'Failed to generate magic link')
  }
}

// GET /api/v1/auth/me - Verify current cookie session
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  res.status(200).json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  })
}

// POST /api/v1/auth/logout - Clear session
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('user_session')
  res.status(200).json({ message: 'Logged out successfully' })
}
