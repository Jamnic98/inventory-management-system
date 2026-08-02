import mongoose from 'mongoose'
import supertest from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'

import app from '../server.js'
import { Email } from '../models/index.js'

let mongoServer: MongoMemoryServer

const createUniqueID = () => new mongoose.Types.ObjectId().toHexString()

const emails = [
  {
    _id: createUniqueID(),
    address: 'user1@example.com',
  },
  {
    _id: createUniqueID(),
    address: 'user2@example.com',
  },
]

describe('Test the emails endpoint', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
  })

  beforeEach(async () => {
    await Email.deleteMany({})
    await Email.insertMany(emails)
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongoServer.stop()
  })

  const request = supertest(app)

  test('get all emails', async () => {
    const response = await request.get('/emails').expect(200)

    expect(response.body).toHaveLength(emails.length)
    for (const email of response.body) {
      expect(email.address).toBeTruthy()
    }
  })

  test('add email', async () => {
    const newEmail = {
      _id: createUniqueID(),
      address: 'newuser@example.com',
    }

    const response = await request.post('/emails').send(newEmail).expect(201)

    const { address } = response.body
    expect(address).toBe(newEmail.address)
  })

  test('delete email by id', async () => {
    const { _id } = emails[0]
    await request.delete(`/emails/${_id}`).expect(204)

    // Double check it's actually removed from the database
    const found = await Email.findById(_id)
    expect(found).toBeNull()
  })
})
