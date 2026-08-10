import supertest from 'supertest'

import prisma from '../../db.js'
import app from '../../../src/server.js'

describe('Test the global subscriptions router', () => {
  const request = supertest(app)

  let testUserId: number
  let otherUserId: number

  let loc1Id: number
  let loc2Id: number

  beforeAll(async () => {
    await prisma.$connect()

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'subrouteuser1@example.com',
        name: 'Subscriptions Route User 1',
      },
    })
    testUserId = user1.id

    const user2 = await prisma.user.create({
      data: {
        email: 'subrouteuser2@example.com',
        name: 'Subscriptions Route User 2',
      },
    })
    otherUserId = user2.id
  })

  beforeEach(async () => {
    // Reset database state before each test run
    await prisma.locationSubscription.deleteMany()
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()

    // Seed test locations
    const location1 = await prisma.location.create({
      data: {
        label: 'Main Refrigerator',
        type: 'STORAGE',
      },
    })
    loc1Id = location1.id

    const location2 = await prisma.location.create({
      data: {
        label: 'Pantry Shelf A',
        type: 'SHELF',
      },
    })
    loc2Id = location2.id
  })

  afterAll(async () => {
    await prisma.locationSubscription.deleteMany()
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('GET /api/v1/subscriptions', () => {
    test('should return all subscriptions for the authenticated user with nested location info', async () => {
      // Seed subscriptions for testUserId
      await prisma.locationSubscription.createMany({
        data: [
          {
            userId: testUserId,
            locationId: loc1Id,
            notifyExpiring: true,
            notifyLowStock: true,
          },
          {
            userId: testUserId,
            locationId: loc2Id,
            notifyExpiring: false,
            notifyLowStock: true,
          },
        ],
      })

      const response = await request
        .get('/api/v1/subscriptions')
        .set('x-user-id', testUserId.toString())
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)

      // Verify structure and embedded location details
      const sub1 = response.body.find((s: any) => s.locationId === loc1Id)
      expect(sub1).toBeDefined()
      expect(sub1.notifyExpiring).toBe(true)
      expect(sub1.notifyLowStock).toBe(true)
      expect(sub1.location).toHaveProperty('label', 'Main Refrigerator')
      expect(sub1.location).toHaveProperty('type', 'STORAGE')

      const sub2 = response.body.find((s: any) => s.locationId === loc2Id)
      expect(sub2).toBeDefined()
      expect(sub2.notifyExpiring).toBe(false)
      expect(sub2.notifyLowStock).toBe(true)
      expect(sub2.location).toHaveProperty('label', 'Pantry Shelf A')
    })

    test('should only return subscriptions belonging to the requesting user', async () => {
      // Seed subscription for testUserId
      await prisma.locationSubscription.create({
        data: {
          userId: testUserId,
          locationId: loc1Id,
        },
      })

      // Seed subscription for otherUserId on the same location
      await prisma.locationSubscription.create({
        data: {
          userId: otherUserId,
          locationId: loc1Id,
        },
      })

      const response = await request
        .get('/api/v1/subscriptions')
        .set('x-user-id', testUserId.toString())
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].userId).toBe(testUserId)
    })

    test('should return an empty array if the user has no subscriptions', async () => {
      const response = await request
        .get('/api/v1/subscriptions')
        .set('x-user-id', testUserId.toString())
        .expect(200)

      expect(response.body).toEqual([])
    })

    test('should return 401 when x-user-id header is missing', async () => {
      await request.get('/api/v1/subscriptions').expect(401)
    })
  })
})
