import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import dotenv from 'dotenv'

import app from './server.js'
import prisma from './db.js'
import { sendNotificationEmail } from './mailer.js'
import seedDatabase from './utils/database.js'

dotenv.config()

const PORT = process.env.PORT || 8080

// Verify database URL exists before proceeding
if (!process.env.DATABASE_URL) {
  console.error('Fatal Error: DATABASE_URL is missing from your .env file!')
  process.exit(1)
}

// create HTTP and WebSocket servers
const server = http.createServer(app)
const wsServer = new WebSocketServer({ server })

// Test Postgres/Prisma connection at startup
try {
  await prisma.$connect()
  console.log('PostgreSQL database connection established via Prisma.')

  await seedDatabase()
} catch (error) {
  console.error('Database connection error:', error)
  process.exit(1)
}

// Graceful cleanup on WebSocket server close
wsServer.on('close', async () => {
  await prisma.$disconnect()
  console.log('Prisma database client disconnected.')
})

wsServer.on('connection', (ws) => {
  console.log('web socket connected')

  ws.on('message', (message) => {
    // Wrap JSON parse in try/catch so malformed WS messages don't crash the server
    try {
      const messageObj = JSON.parse(String(message))
      const { type } = messageObj

      wsServer.clients.forEach((client) => {
        switch (type) {
          case 'add':
          case 'delete':
          case 'update':
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send('')
            }
            break
          case 'email':
            const { subject, content, recipients } = messageObj
            sendNotificationEmail(subject, content, recipients)
            break
          default:
            break
        }
      })
    } catch (error) {
      console.error('Invalid JSON message received via WebSocket:', error)
    }
  })
})

// Listen for incoming requests
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`)
})
