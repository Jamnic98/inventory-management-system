import { Request, Response, NextFunction } from 'express'
import { getHomeDashboardData } from '../services/dashboard.service.js'

/**
 * GET /api/dashboard
 * Fetch all dashboard widgets/lists for the authenticated user
 */
export async function getDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const data = await getHomeDashboardData(userId)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}
