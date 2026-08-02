import mongoose from 'mongoose'
import supertest from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'

import app from '../server.js'
import { Location } from '../models/index.js'

let mongoServer: MongoMemoryServer

const createUniqueID = () => new mongoose.Types.ObjectId().toHexString()

const locations = [
  {
    _id: createUniqueID(),
    label: 'Kitchen Cupboard',
    layer: 1,
    isOpen: false,
    editing: false,
    isSelected: false,
    parent: 'root',
    children: [],
  },
  {
    _id: createUniqueID(),
    label: 'Under Sink Shelf',
    layer: 2,
    isOpen: false,
    editing: false,
    isSelected: false,
    parent: 'Kitchen Cupboard',
    children: [],
  },
]

describe('Test the locations endpoint', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
  })

  beforeEach(async () => {
    await Location.deleteMany({})
    await Location.insertMany(locations)
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongoServer.stop()
  })

  const request = supertest(app)

  test('get all room locations', async () => {
    const response = await request.get('/locations').expect(200)

    expect(response.body).toHaveLength(locations.length)
    for (const item of response.body) {
      const { label, layer, parent } = item
      expect(label).toBeTruthy()
      expect(layer).toBeDefined()
      expect(parent).toBeTruthy()
    }
  })

  test('add room location', async () => {
    const newLocation = {
      _id: createUniqueID(),
      label: 'Pantry Shelf',
      layer: 1,
      isOpen: false,
      editing: false,
      isSelected: false,
      parent: 'root',
      children: [],
    }

    const response = await request.post('/locations/add').send(newLocation).expect(201)

    const { label, parent, layer } = response.body
    expect(label).toBe(newLocation.label)
    expect(parent).toBe(newLocation.parent)
    expect(layer).toBe(newLocation.layer)
  })

  test('delete room location by id', async () => {
    const { _id } = locations[0]

    // Check for 204 status if your controller returns 204, or 200 if it returns JSON
    await request.delete(`/locations/${_id}`).expect(204)

    // Verify it was actually removed from MongoDB
    const deleted = await Location.findById(_id)
    expect(deleted).toBeNull()
  })
})
