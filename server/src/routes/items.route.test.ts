import supertest from 'supertest'

import app from '../../src/server.js'
import prisma from '../../src/db.js'

describe('Test the items endpoint', () => {
  const request = supertest(app)

  let testLocationId: number

  // Establish database connection and set up a parent location before running tests
  beforeAll(async () => {
    await prisma.$connect()

    // Ensure a test location exists to satisfy foreign key constraints
    const location = await prisma.location.create({
      data: {
        label: 'Kitchen Main Cupboard',
        type: 'STORAGE',
      },
    })
    testLocationId = location.id
  })

  // Wipe items table and re-seed initial items before EACH test run
  beforeEach(async () => {
    await prisma.item.deleteMany()

    await prisma.item.createMany({
      data: [
        {
          label: 'beans',
          quantity: 5,
          locationId: testLocationId,
          expirationDate: new Date(),
          lowStockAlert: false,
        },
        {
          label: 'bleach',
          quantity: 2,
          locationId: testLocationId,
          expirationDate: new Date(0),
          lowStockAlert: true,
        },
      ],
    })
  })

  // Disconnect and clean up seeded test data after all tests complete
  afterAll(async () => {
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.$disconnect()
  })

  test('GET /items - get all items', async () => {
    const response = await request.get('/items').expect(200)

    expect(response.body).toHaveLength(2)
    for (const item of response.body) {
      expect(item).toHaveProperty('id')
      expect(item.label).toBeTruthy()
      expect(item.quantity).toBeDefined()
      expect(item.locationId).toBe(testLocationId)
      expect(item.location).toBeDefined() // Verify included relation
      expect(item.lowStockAlert).toBeDefined()
    }
  })

  test('GET /items/:id - get item by id', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'beans' },
    })
    expect(seededItem).not.toBeNull()

    const response = await request.get(`/items/${seededItem!.id}`).expect(200)

    expect(response.body.id).toBe(seededItem!.id)
    expect(response.body.label).toBe('beans')
    expect(response.body.locationId).toBe(testLocationId)
    expect(response.body.lowStockAlert).toBeDefined()
  })

  test('POST /items - add item', async () => {
    const newItem = {
      label: 'sweetcorn',
      quantity: 2,
      locationId: testLocationId,
      expirationDate: new Date().toISOString(),
      lowStockAlert: true,
    }

    const response = await request.post('/items').send(newItem).expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.label).toBe(newItem.label)
    expect(response.body.quantity).toBe(newItem.quantity)
    expect(response.body.locationId).toBe(testLocationId)

    // Verify record exists directly in PostgreSQL
    const foundInDb = await prisma.item.findUnique({
      where: { id: response.body.id },
    })
    expect(foundInDb).not.toBeNull()
  })

  test('PATCH /items/:id - update item by id', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'bleach' },
    })
    expect(seededItem).not.toBeNull()

    const updatePayload = {
      quantity: seededItem!.quantity - 1,
    }

    const response = await request.patch(`/items/${seededItem!.id}`).send(updatePayload).expect(200)

    expect(response.body.id).toBe(seededItem!.id)
    expect(response.body.quantity).toBe(1)

    // Double check update in database
    const foundInDb = await prisma.item.findUnique({
      where: { id: seededItem!.id },
    })
    expect(foundInDb?.quantity).toBe(1)
  })

  test('DELETE /items/:id - delete item by id', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'beans' },
    })
    expect(seededItem).not.toBeNull()

    await request.delete(`/items/${seededItem!.id}`).expect(204)

    // Double check it's actually removed from the database
    const foundInDb = await prisma.item.findUnique({
      where: { id: seededItem!.id },
    })
    expect(foundInDb).toBeNull()
  })
})
