import mongoose from 'mongoose'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import dotenv from 'dotenv'

import app from './server'
import sendMessage from './emailer'

dotenv.config()

// constants
const PORT = process.env.PORT || 8080
const DB_URI = process.env.MONGODB_URI

// create a websocket server
const server = http.createServer(app)
const wsServer = new WebSocketServer({ server })

wsServer.on('close', async () => {
  await mongoose.disconnect()
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
            sendMessage(subject, content, recipients)
            break
          default:
            break
        }
      })
    } catch (err) {
      console.error('Invalid JSON message received via WebSocket:', err)
    }
  })
})

// Configure mongoose and connect to database
try {
  if (!DB_URI) {
    throw new Error('MONGODB_URI is missing from your .env file!')
  }

  // Clean connection call - deprecated options removed
  await mongoose.connect(DB_URI)
  console.log('Database connection established.')
} catch (err) {
  console.error('MongoDB Connection Error:', err)
  process.exit(1) // Stop server startup if DB fails to connect
}

// listen for incoming requests
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`)
})
