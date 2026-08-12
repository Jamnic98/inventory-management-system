import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import prisma from '../db.js'

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let userId: number | null = null

    // Primary Authentication: Bearer JWT Token
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const jwtSecret = process.env.JWT_SECRET

      if (!jwtSecret && process.env.NODE_ENV === 'production') {
        console.error('FATAL: JWT_SECRET environment variable is missing!')
        res.status(500).json({ error: 'Internal server configuration error.' })
        return
      }

      try {
        const decoded = jwt.verify(token, jwtSecret || 'your-fallback-secret-key') as {
          id: number
        }
        userId = decoded.id
      } catch (jwtErr) {
        res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' })
        return
      }
    }

    // Controlled Fallbacks (ONLY in non-production/test environments)
    if (!userId && process.env.NODE_ENV === 'test') {
      const headerUserId = req.headers['x-user-id']
      const cookieUserId = req.cookies?.user_session
      const rawUserId = headerUserId || cookieUserId

      if (rawUserId) {
        const parsed = Number(rawUserId)
        if (!isNaN(parsed) && parsed > 0) {
          userId = parsed
        }
      }
    }

    // Reject unauthenticated requests
    if (!userId || isNaN(userId)) {
      res.status(401).json({ error: 'Authentication required. No active session.' })
      return
    }

    // Validate user exists in Database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      if (req.cookies?.user_session) {
        res.clearCookie('user_session')
      }
      res.status(401).json({ error: 'Authenticated user no longer exists.' })
      return
    }

    // Attach user object to Express request
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication check failed.' })
  }
}

export default requireAuth
