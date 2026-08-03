import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { Items, Locations, Users } from './routes/index.js'

// express configuration
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(cookieParser())

app.use('/items', Items)
app.use('/locations', Locations)
app.use('/users', Users)

export default app
