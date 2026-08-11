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

    // Check Bearer Token in Authorization Header (Primary Method for Frontend SPA)
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key') as {
          id: number
        }
        userId = decoded.id
      } catch (jwtErr) {
        res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' })
        return
      }
    }

    // Fallbacks for test suites or legacy cookies
    if (!userId) {
      const headerUserId = req.headers['x-user-id']
      const cookieUserId = req.cookies?.user_session
      const rawUserId = headerUserId || cookieUserId

      if (rawUserId) {
        userId = Number(rawUserId)
      }
    }

    // 3. No identifier found in headers, cookies, or JWT
    if (!userId || isNaN(userId)) {
      res.status(401).json({ error: 'Authentication required. No active session.' })
      return
    }

    // Look up user in PostgreSQL via Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      if (req.cookies?.user_session) {
        res.clearCookie('user_session')
      }
      res.status(401).json({ error: 'Authenticated user no longer exists' })
      return
    }

    // Attach full user object to Request
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication check failed' })
  }
}

export default requireAuth
