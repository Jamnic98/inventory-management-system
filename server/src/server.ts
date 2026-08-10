import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { AuthRoute, Items, Locations, Subscriptions, Users } from './routes/index.js'

// express configuration
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(cookieParser())

app.use('/api/v1/auth', AuthRoute)
app.use('/api/v1/items', Items)
app.use('/api/v1/locations', Locations)
app.use('/api/v1/subscriptions', Subscriptions)
app.use('/api/v1/users', Users)

export default app
