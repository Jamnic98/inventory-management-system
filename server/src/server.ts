import express from 'express'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'

import {
  AuthRoute,
  DashBoardRoute,
  Items,
  Locations,
  Notifications,
  Stocks,
  Subscriptions,
  Users,
} from './routes/index.js'

const app = express()
app.set('trust proxy', true)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const allowedOrigins = [
  'https://core.local',
  'https://localhost:5173',
  'http://localhost:5173',
  'http://localhost:8080',
]

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`))
    }
  },
  credentials: true,
}

app.use(cors(corsOptions))

app.use(cors())
app.use(cookieParser())

app.use('/api/v1/auth', AuthRoute)
app.use('/api/v1/dashboard', DashBoardRoute)
app.use('/api/v1/items', Items)
app.use('/api/v1/locations', Locations)
app.use('/api/v1/notifications', Notifications)
app.use('/api/v1/stocks', Stocks)
app.use('/api/v1/subscriptions', Subscriptions)
app.use('/api/v1/users', Users)

export default app
