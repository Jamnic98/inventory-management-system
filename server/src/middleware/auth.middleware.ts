import { Request, Response, NextFunction } from 'express'

import prisma from '../db.js'

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Check x-user-id header first (ideal for tests / internal API calls)
    const headerUserId = req.headers['x-user-id']
    // 2. Fall back to user_session cookie
    const cookieUserId = req.cookies?.user_session

    const rawUserId = headerUserId || cookieUserId

    if (!rawUserId) {
      res.status(401).json({ error: 'Authentication required. No active session.' })
      return
    }

    const userId = Number(rawUserId)
    if (isNaN(userId)) {
      res.status(401).json({ error: 'Invalid session or user identifier' })
      return
    }

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

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication check failed' })
  }
}

export default requireAuth
