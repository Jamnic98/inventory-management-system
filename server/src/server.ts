import express from 'express'
import cors from 'cors'

import { Emails, Items, Locations } from 'routes'

// express configuration
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())

app.use('/items', Items)
app.use('/emails', Emails)
app.use('/locations', Locations)

export default app
