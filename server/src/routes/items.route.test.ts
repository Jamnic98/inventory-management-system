import mongoose from 'mongoose'
import supertest from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'

import app from '../server'
import { Item } from 'models'

let mongoServer: MongoMemoryServer

const createUniqueID = () => new mongoose.Types.ObjectId().toHexString()

const items = [
  {
    _id: createUniqueID(),
    name: 'beans',
    quantity: 5,
    room: 'kitchen',
    location: 'main cupboard',
    expirationDate: new Date(),
    lowStockAlert: false,
  },
  {
    _id: createUniqueID(),
    name: 'bleach',
    quantity: 2,
    room: 'kitchen',
    location: 'under sink cupboard',
    expirationDate: new Date(0),
    lowStockAlert: true,
  },
  {
    _id: createUniqueID(),
    name: 'beans',
    quantity: 5,
    room: 'kitchen',
    location: 'main cupboard',
    expirationDate: new Date(),
    lowStockAlert: false,
  },
]

describe('Test the items endpoint', () => {
  // 1. Start in-memory DB and connect Mongoose before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
  })

  // 2. Seed database fresh before EACH test
  beforeEach(async () => {
    await Item.deleteMany({}) // Clear database state
    await Item.insertMany(items)
  })

  // 3. Cleanup database and stop server after all tests finish
  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongoServer.stop()
  })

  const request = supertest(app)

  test('get all items', async () => {
    const response = await request.get('/items').expect(200)

    for (const item of response.body) {
      const { name, quantity, room, location, expirationDate, lowStockAlert } = item
      expect(name).toBeTruthy()
      expect(quantity).toBeTruthy()
      expect(room).toBeTruthy()
      expect(location).toBeTruthy()
      expect(expirationDate).toBeTruthy()
      expect(lowStockAlert).toBeDefined()
    }
  })

  test('get item by id', async () => {
    const { _id } = items[0]
    const response = await request.get(`/items/${_id}`).expect(200)

    const { name, room, location, expirationDate, lowStockAlert } = response.body
    expect(name).toBeTruthy()
    expect(room).toBeTruthy()
    expect(location).toBeTruthy()
    expect(expirationDate).toBeTruthy()
    expect(lowStockAlert).toBeDefined()
  })

  test('add item', async () => {
    const item = {
      _id: createUniqueID(),
      name: 'sweetcorn',
      quantity: 2,
      room: 'kitchen',
      location: 'main cupboard',
      expirationDate: new Date(),
      lowStockAlert: true,
    }

    const response = await request.post('/items/add').send(item).expect(201)

    const { name, room, location, expirationDate, lowStockAlert } = response.body
    expect(name).toBeTruthy()
    expect(room).toBeTruthy()
    expect(location).toBeTruthy()
    expect(expirationDate).toBeTruthy()
    expect(lowStockAlert).toBeDefined()
  })

  test('update item by id', async () => {
    const item = items[1]
    const updatedItem = { ...item, quantity: item.quantity - 1 }

    const response = await request.put(`/items/update/${item._id}`).send(updatedItem).expect(200)

    const { name, room, location, expirationDate, lowStockAlert } = response.body
    expect(name).toBeTruthy()
    expect(room).toBeTruthy()
    expect(location).toBeTruthy()
    expect(expirationDate).toBeTruthy()
    expect(lowStockAlert).toBeDefined()
  })

  test('delete item by id', async () => {
    const { _id } = items[0]
    await request.delete(`/items/${_id}`).expect(204)

    // Double check it's actually removed from the database
    const found = await Item.findById(_id)
    expect(found).toBeNull()
  })
})
