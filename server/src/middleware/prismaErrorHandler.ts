import { Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'

const handlePrismaError = (error: unknown, res: Response, fallbackMessage: string) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Record not found' })
      case 'P2002':
        return res.status(409).json({ error: 'A record with this field already exists' })
      case 'P2003':
        return res.status(409).json({ error: 'Foreign key constraint failed' })
    }
  }

  return res.status(500).json({ error: fallbackMessage })
}

export default handlePrismaError
