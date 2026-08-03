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

    // Create dates for testing opened expiration
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    await prisma.item.createMany({
      data: [
        {
          label: 'beans',
          quantity: 5,
          locationId: testLocationId,
          expirationDate: new Date(),
          lowStockThreshold: 2, // quantity (5) > threshold (2) -> isLowStock: false
        },
        {
          label: 'bleach',
          quantity: 1,
          locationId: testLocationId,
          lowStockThreshold: 3, // quantity (1) <= threshold (3) -> isLowStock: true
        },
        {
          label: 'opened milk',
          quantity: 1,
          locationId: testLocationId,
          openedOn: tenDaysAgo,
          useWithinDays: 7, // Opened 10 days ago with 7 days limit -> isOpenedExpired: true
          lowStockThreshold: 1,
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

  test('GET /items - get all items with enriched computed properties', async () => {
    const response = await request.get('/items').expect(200)

    expect(response.body).toHaveLength(3)
    for (const item of response.body) {
      expect(item).toHaveProperty('id')
      expect(item.label).toBeTruthy()
      expect(item.quantity).toBeDefined()
      expect(item.locationId).toBe(testLocationId)
      expect(item.location).toBeDefined() // Verify included relation
      expect(item).toHaveProperty('isLowStock')
      expect(item).toHaveProperty('isOpenedExpired')
    }

    // Check computed flags on specific items
    const milk = response.body.find((i: any) => i.label === 'opened milk')
    expect(milk.isOpenedExpired).toBe(true)

    const bleach = response.body.find((i: any) => i.label === 'bleach')
    expect(bleach.isLowStock).toBe(true)
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
    expect(response.body.lowStockThreshold).toBe(2)
    expect(response.body.isLowStock).toBe(false)
  })

  test('POST /items - add item with openedOn and useWithinDays', async () => {
    const newItem = {
      label: 'orange juice',
      quantity: 2,
      locationId: testLocationId,
      expirationDate: new Date().toISOString(),
      openedOn: new Date().toISOString(),
      useWithinDays: 5,
      lowStockThreshold: 1,
    }

    const response = await request.post('/items').send(newItem).expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.label).toBe(newItem.label)
    expect(response.body.quantity).toBe(newItem.quantity)
    expect(response.body.locationId).toBe(testLocationId)
    expect(response.body.useWithinDays).toBe(5)
    expect(response.body.lowStockThreshold).toBe(1)
    expect(response.body.isLowStock).toBe(false)
    expect(response.body.isOpenedExpired).toBe(false)

    // Verify record exists directly in PostgreSQL
    const foundInDb = await prisma.item.findUnique({
      where: { id: response.body.id },
    })
    expect(foundInDb).not.toBeNull()
    expect(foundInDb?.useWithinDays).toBe(5)
  })

  test('PATCH /items/:id - update item openedOn date and lowStockThreshold', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'bleach' },
    })
    expect(seededItem).not.toBeNull()

    const now = new Date()
    const updatePayload = {
      quantity: 5,
      openedOn: now.toISOString(),
      useWithinDays: 14,
      lowStockThreshold: 2,
    }

    const response = await request.patch(`/items/${seededItem!.id}`).send(updatePayload).expect(200)

    expect(response.body.id).toBe(seededItem!.id)
    expect(response.body.quantity).toBe(5)
    expect(response.body.useWithinDays).toBe(14)
    expect(response.body.lowStockThreshold).toBe(2)
    // Quantity (5) > threshold (2) -> isLowStock should now be false
    expect(response.body.isLowStock).toBe(false)

    // Double check update in database
    const foundInDb = await prisma.item.findUnique({
      where: { id: seededItem!.id },
    })
    expect(foundInDb?.quantity).toBe(5)
    expect(foundInDb?.lowStockThreshold).toBe(2)
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
