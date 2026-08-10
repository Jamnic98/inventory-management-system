import supertest from 'supertest'

import app from '../../server.js'
import prisma from '../../db.js'
import { Item } from '../../generated/prisma/client.js'

describe('Test the items endpoint', () => {
  const request = supertest(app)

  let testLocationId: number
  let testUserId: number
  let otherUserId: number

  // Connection setup and seed prerequisites (Users & Location)
  beforeAll(async () => {
    await prisma.$connect()

    // Create primary test user
    const user1 = await prisma.user.create({
      data: {
        email: 'testuser1@example.com',
        name: 'Test User 1',
      },
    })
    testUserId = user1.id

    // Create second user to test ownership boundaries
    const user2 = await prisma.user.create({
      data: {
        email: 'testuser2@example.com',
        name: 'Test User 2',
      },
    })
    otherUserId = user2.id

    // Ensure a test location exists
    const location = await prisma.location.create({
      data: {
        label: 'Kitchen Main Cupboard',
        type: 'STORAGE',
      },
    })
    testLocationId = location.id
  })

  // Wipe items table and re-seed before EACH test run
  beforeEach(async () => {
    await prisma.item.deleteMany()

    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    await prisma.item.createMany({
      data: [
        {
          label: 'beans',
          quantity: 5,
          barcode: '5010029000016',
          locationId: testLocationId,
          expirationDate: new Date(),
          lowStockThreshold: 2, // quantity (5) > threshold (2) -> isLowStock: false
          userId: null, // Shared household item
        },
        {
          label: 'bleach',
          quantity: 1,
          barcode: '5010029000023',
          locationId: testLocationId,
          lowStockThreshold: 3, // quantity (1) <= threshold (3) -> isLowStock: true
          userId: testUserId, // Personal item owned by testUserId
        },
        {
          label: 'opened milk',
          quantity: 1,
          barcode: null,
          locationId: testLocationId,
          openedOn: tenDaysAgo,
          useWithinDays: 7, // Opened 10 days ago with 7 days limit -> isOpenedExpired: true
          lowStockThreshold: 1,
          userId: null, // Shared household item
        },
        {
          label: 'private snack',
          quantity: 2,
          barcode: '5010029000030',
          locationId: testLocationId,
          userId: otherUserId, // Owned by another user (should be invisible to testUserId)
        },
        {
          label: 'archived cereal',
          quantity: 0,
          barcode: '5010029000047',
          locationId: testLocationId,
          deletedAt: new Date(), // Soft-deleted item
          userId: testUserId,
        },
      ],
    })
  })

  // Clean up database tables and disconnect
  afterAll(async () => {
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('GET /api/v1/items - get active items (shared + personal), excluding soft-deleted and other users items', async () => {
    const response = await request
      .get('/api/v1/items')
      .set('x-user-id', testUserId.toString())
      .expect(200)

    // Should receive 3 items: beans (shared), bleach (user1), opened milk (shared)
    // Excludes: private snack (user2) and archived cereal (soft deleted)
    expect(response.body).toHaveLength(3)

    const labels = response.body.map((i: Item) => i.label)
    expect(labels).toContain('beans')
    expect(labels).toContain('bleach')
    expect(labels).toContain('opened milk')
    expect(labels).not.toContain('private snack')
    expect(labels).not.toContain('archived cereal')

    for (const item of response.body) {
      expect(item).toHaveProperty('id')
      expect(item.label).toBeTruthy()
      expect(item.quantity).toBeDefined()
      expect(item).toHaveProperty('barcode')
      expect(item.locationId).toBe(testLocationId)
      expect(item.location).toBeDefined()
      expect(item).toHaveProperty('isLowStock')
      expect(item).toHaveProperty('isOpenedExpired')
    }

    const beans = response.body.find((i: Item) => i.label === 'beans')
    expect(beans.barcode).toBe('5010029000016')

    const milk = response.body.find((i: Item) => i.label === 'opened milk')
    expect(milk.barcode).toBeNull()
    expect(milk.isOpenedExpired).toBe(true)

    const bleach = response.body.find((i: Item) => i.label === 'bleach')
    expect(bleach.isLowStock).toBe(true)
  })

  test('GET /api/v1/items?search=... - search active items by barcode', async () => {
    const response = await request
      .get('/api/v1/items?search=5010029000016')
      .set('x-user-id', testUserId.toString())
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0].label).toBe('beans')
    expect(response.body[0].barcode).toBe('5010029000016')
  })

  test('GET /api/v1/items/archived - get soft-deleted items for restocking', async () => {
    const response = await request
      .get('/api/v1/items/archived')
      .set('x-user-id', testUserId.toString())
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0].label).toBe('archived cereal')
    expect(response.body[0].barcode).toBe('5010029000047')
    expect(response.body[0].deletedAt).not.toBeNull()
  })

  test('GET /api/v1/items/:id - get item by id if shared or owned', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'beans' },
    })
    expect(seededItem).not.toBeNull()

    const response = await request
      .get(`/api/v1/items/${seededItem!.id}`)
      .set('x-user-id', testUserId.toString())
      .expect(200)

    expect(response.body.id).toBe(seededItem!.id)
    expect(response.body.label).toBe('beans')
    expect(response.body.barcode).toBe('5010029000016')
    expect(response.body.locationId).toBe(testLocationId)
    expect(response.body.lowStockThreshold).toBe(2)
    expect(response.body.isLowStock).toBe(false)
  })

  test('GET /api/v1/items/:id - return 404 for item owned by another user', async () => {
    const privateItem = await prisma.item.findFirst({
      where: { label: 'private snack' },
    })
    expect(privateItem).not.toBeNull()

    await request
      .get(`/api/v1/items/${privateItem!.id}`)
      .set('x-user-id', testUserId.toString())
      .expect(404)
  })

  test('POST /api/v1/items - create item with a barcode and assign current userId', async () => {
    const newItem = {
      label: 'orange juice',
      quantity: 2,
      barcode: '5010029000054',
      locationId: testLocationId,
      expirationDate: new Date().toISOString(),
      openedOn: new Date().toISOString(),
      useWithinDays: 5,
      lowStockThreshold: 1,
    }

    const response = await request
      .post('/api/v1/items')
      .set('x-user-id', testUserId.toString())
      .send(newItem)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.label).toBe(newItem.label)
    expect(response.body.quantity).toBe(newItem.quantity)
    expect(response.body.barcode).toBe('5010029000054')
    expect(response.body.locationId).toBe(testLocationId)
    expect(response.body.userId).toBe(testUserId)
    expect(response.body.isLowStock).toBe(false)
    expect(response.body.isOpenedExpired).toBe(false)

    // Verify record in PostgreSQL
    const foundInDb = await prisma.item.findUnique({
      where: { id: response.body.id },
    })
    expect(foundInDb).not.toBeNull()
    expect(foundInDb?.barcode).toBe('5010029000054')
    expect(foundInDb?.deletedAt).toBeNull()
    expect(foundInDb?.userId).toBe(testUserId)
  })

  test('POST /api/v1/items - create item without barcode (null)', async () => {
    const newItem = {
      label: 'fresh apples',
      quantity: 6,
      barcode: null,
      locationId: testLocationId,
    }

    const response = await request
      .post('/api/v1/items')
      .set('x-user-id', testUserId.toString())
      .send(newItem)
      .expect(201)

    expect(response.body.barcode).toBeNull()

    const foundInDb = await prisma.item.findUnique({
      where: { id: response.body.id },
    })
    expect(foundInDb?.barcode).toBeNull()
  })

  test('PATCH /api/v1/items/:id - update item properties including barcode', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'bleach' },
    })
    expect(seededItem).not.toBeNull()

    const updatePayload = {
      quantity: 5,
      barcode: '9990029000099',
      openedOn: new Date().toISOString(),
      useWithinDays: 14,
      lowStockThreshold: 2,
    }

    const response = await request
      .patch(`/api/v1/items/${seededItem!.id}`)
      .set('x-user-id', testUserId.toString())
      .send(updatePayload)
      .expect(200)

    expect(response.body.id).toBe(seededItem!.id)
    expect(response.body.quantity).toBe(5)
    expect(response.body.barcode).toBe('9990029000099')
    expect(response.body.useWithinDays).toBe(14)
    expect(response.body.lowStockThreshold).toBe(2)
    expect(response.body.isLowStock).toBe(false)

    const foundInDb = await prisma.item.findUnique({
      where: { id: seededItem!.id },
    })
    expect(foundInDb?.quantity).toBe(5)
    expect(foundInDb?.barcode).toBe('9990029000099')
  })

  test('DELETE /api/v1/items/:id - soft delete item (sets deletedAt timestamp and quantity = 0)', async () => {
    const seededItem = await prisma.item.findFirst({
      where: { label: 'beans' },
    })
    expect(seededItem).not.toBeNull()

    await request
      .delete(`/api/v1/items/${seededItem!.id}`)
      .set('x-user-id', testUserId.toString())
      .expect(204)

    // Item must still exist in DB, but with deletedAt set and quantity = 0
    const foundInDb = await prisma.item.findUnique({
      where: { id: seededItem!.id },
    })
    expect(foundInDb).not.toBeNull()
    expect(foundInDb?.deletedAt).not.toBeNull()
    expect(foundInDb?.quantity).toBe(0)
  })

  test('POST /api/v1/items/:id/restore - un-archive soft-deleted item', async () => {
    const archivedItem = await prisma.item.findFirst({
      where: { label: 'archived cereal' },
    })
    expect(archivedItem).not.toBeNull()

    const response = await request
      .post(`/api/v1/items/${archivedItem!.id}/restore`)
      .set('x-user-id', testUserId.toString())
      .send({ quantity: 3 })
      .expect(200)

    expect(response.body.id).toBe(archivedItem!.id)
    expect(response.body.quantity).toBe(3)
    expect(response.body.barcode).toBe('5010029000047')
    expect(response.body.deletedAt).toBeNull()

    const foundInDb = await prisma.item.findUnique({
      where: { id: archivedItem!.id },
    })
    expect(foundInDb?.deletedAt).toBeNull()
    expect(foundInDb?.quantity).toBe(3)
  })
})
