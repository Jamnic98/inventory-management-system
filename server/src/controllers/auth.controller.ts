import { Request, Response } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

import prisma from '../db.js'
import handlePrismaError from '../middleware/prismaErrorHandler.js'
import { sendMagicLinkEmail } from '../services/email.service.js'
import { parseId } from '../utils/index.js'

// GET /api/v1/auth/login?token=...
export const loginWithToken = async (
  req: Request<{}, {}, {}, { token?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Invalid or missing token' })
      return
    }

    const user = await prisma.user.findFirst({
      where: { loginToken: token, tokenExpiry: { gte: new Date() } },
    })

    if (!user) {
      res.status(401).json({ error: 'Magic link is invalid or expired.' })
      return
    }

    // Invalidate token after use
    await prisma.user.update({
      where: { id: user.id },
      data: { loginToken: null },
    })

    if (!process.env.JWT_SECRET) {
      console.error('❌ FATAL ERROR: JWT_SECRET is missing from environment variables!')
      process.exit(1)
    }

    // Generate a long-lived Session JWT (e.g., 7 days)
    const sessionToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1y',
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: sessionToken,
    })
  } catch (error) {
    console.error('Error during token login:', error)
    res.status(500).json({ error: 'Error during token login' })
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
    const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 mins expiry

    // Save token to user in database
    const user = await prisma.user.update({
      where: { id: userId },
      data: { loginToken: token, tokenExpiry: expiry },
    })

    // Construct Magic Link
    const clientBaseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173'
    const magicLink = `${clientBaseUrl}/login/verify?token=${token}`

    // Send email via Nodemailer
    await sendMagicLinkEmail(user.email, magicLink)

    // Send response (avoid leaking the raw token in production responses if email is working)
    res.status(200).json({
      message: `Magic link sent successfully to ${user.email}`,
      userId: user.id,
    })
  } catch (error: unknown) {
    console.error('Error generating magic link:', error)
    handlePrismaError(error, res, 'Failed to generate magic link')
  }
}

// GET /api/v1/auth/me - Verify current session
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get userId from token payload attached by auth middleware
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Fetch fresh user record directly from DB
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Return full user object
    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

// POST /api/v1/auth/logout - Clear session
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('user_session')
  res.status(200).json({ message: 'Logged out successfully' })
}
