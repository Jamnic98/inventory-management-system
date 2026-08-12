import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import dotenv from 'dotenv'

import app from './server.js'
import prisma from './db.js'
import { sendNotificationEmail } from './mailer.js'
import seedDatabase from './utils/database.js'

dotenv.config()

const PORT = process.env.PORT || 8080

if (!process.env.DATABASE_URL) {
  console.error('Fatal Error: DATABASE_URL is missing from your .env file!')
  process.exit(1)
}

const server = http.createServer(app)
const wsServer = new WebSocketServer({ server })

// 🚀 Helper function to broadcast events from ANY Express controller
export const broadcast = (data: Record<string, any>) => {
  const payload = JSON.stringify(data)
  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

try {
  await prisma.$connect()
  console.log('PostgreSQL database connection established via Prisma.')
  await seedDatabase()
} catch (error) {
  console.error('Database connection error:', error)
  process.exit(1)
}

wsServer.on('close', async () => {
  await prisma.$disconnect()
  console.log('Prisma database client disconnected.')
})

wsServer.on('connection', (ws) => {
  console.log('WebSocket client connected.')

  ws.on('message', (rawMessage) => {
    try {
      const messageObj = JSON.parse(String(rawMessage))
      const { type } = messageObj

      console.log(type)

      if (type === 'email') {
        const { subject, content, recipients } = messageObj
        sendNotificationEmail(subject, content, recipients)
        return
      }

      // If a WS message arrives, broadcast to all other clients
      wsServer.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(messageObj))
        }
      })
    } catch (error) {
      console.error('Invalid JSON message received via WebSocket:', error)
    }
  })

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err)
  })
})

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`)
})
