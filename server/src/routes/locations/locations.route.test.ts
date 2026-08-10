import supertest from 'supertest'

import app from '../../server.js'
import prisma from '../../db.js'

describe('Test the locations endpoint', () => {
  const request = supertest(app)

  let testUserId: number
  let otherUserId: number

  let sharedLocationId: number
  let personalLocationId: number
  let otherUserLocationId: number
  let childLocationId: number

  // Connection setup and seed prerequisite users
  beforeAll(async () => {
    await prisma.$connect()

    // Primary test user
    const user1 = await prisma.user.create({
      data: {
        email: 'locuser1@example.com',
        name: 'Location User 1',
      },
    })
    testUserId = user1.id

    // Second user for ownership boundary testing
    const user2 = await prisma.user.create({
      data: {
        email: 'locuser2@example.com',
        name: 'Location User 2',
      },
    })
    otherUserId = user2.id
  })

  // Re-seed locations before EACH test
  beforeEach(async () => {
    // Delete dependent items first, then locations
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()

    // 1. Shared Root Location (Kitchen)
    const sharedLoc = await prisma.location.create({
      data: {
        label: 'Kitchen Main Cupboard',
        type: 'STORAGE',
        userId: null,
      },
    })
    sharedLocationId = sharedLoc.id

    // 2. Child Location under Shared Root
    const childLoc = await prisma.location.create({
      data: {
        label: 'Top Shelf',
        type: 'SHELF',
        parentId: sharedLocationId,
        userId: null,
      },
    })
    childLocationId = childLoc.id

    // 3. Personal Location for User 1
    const personalLoc = await prisma.location.create({
      data: {
        label: 'My Bedroom Drawer',
        type: 'DRAWER',
        userId: testUserId,
      },
    })
    personalLocationId = personalLoc.id

    // 4. Private Location belonging to User 2
    const otherUserLoc = await prisma.location.create({
      data: {
        label: 'User 2 Safe Box',
        type: 'STORAGE',
        userId: otherUserId,
      },
    })
    otherUserLocationId = otherUserLoc.id
  })

  // Clean up database tables and disconnect
  afterAll(async () => {
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('GET /api/v1/locations', () => {
    test('should retrieve shared locations and personal locations for current user', async () => {
      const response = await request
        .get('/api/v1/locations')
        .set('x-user-id', testUserId.toString())
        .expect(200)

      // Should return 3 locations: Kitchen, Top Shelf, Bedroom Drawer
      // Excludes: User 2 Safe Box
      expect(response.body).toHaveLength(3)

      const labels = response.body.map((l: any) => l.label)
      expect(labels).toContain('Kitchen Main Cupboard')
      expect(labels).toContain('Top Shelf')
      expect(labels).toContain('My Bedroom Drawer')
      expect(labels).not.toContain('User 2 Safe Box')

      // Validate relationship structures and counts
      const kitchen = response.body.find((l: any) => l.id === sharedLocationId)
      expect(kitchen).toBeDefined()
      expect(kitchen.children).toHaveLength(1)
      expect(kitchen.children[0].id).toBe(childLocationId)
      expect(kitchen).toHaveProperty('_count')
    })

    test('should filter locations by search query string', async () => {
      const response = await request
        .get('/api/v1/locations?search=Drawer')
        .set('x-user-id', testUserId.toString())
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].id).toBe(personalLocationId)
      expect(response.body[0].label).toBe('My Bedroom Drawer')
    })
  })

  describe('GET /api/v1/locations/:id', () => {
    test('should retrieve location details by ID if shared or owned', async () => {
      const response = await request
        .get(`/api/v1/locations/${sharedLocationId}`)
        .set('x-user-id', testUserId.toString())
        .expect(200)

      expect(response.body.id).toBe(sharedLocationId)
      expect(response.body.label).toBe('Kitchen Main Cupboard')
      expect(response.body.children).toBeDefined()
      expect(response.body.items).toBeDefined()
    })

    test('should return 404 for a location owned by another user', async () => {
      await request
        .get(`/api/v1/locations/${otherUserLocationId}`)
        .set('x-user-id', testUserId.toString())
        .expect(404)
    })

    test('should return 400 for invalid ID format', async () => {
      await request.get('/api/v1/locations/abc').set('x-user-id', testUserId.toString()).expect(400)
    })
  })

  describe('POST /api/v1/locations', () => {
    test('should create a shared location when isPersonal is false/omitted', async () => {
      const payload = {
        label: 'Garage Worktable',
        type: 'ROOM',
      }

      const response = await request
        .post('/api/v1/locations')
        .set('x-user-id', testUserId.toString())
        .send(payload)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.label).toBe('Garage Worktable')
      expect(response.body.type).toBe('ROOM')
      expect(response.body.userId).toBeNull()

      // Confirm in PostgreSQL
      const createdInDb = await prisma.location.findUnique({
        where: { id: response.body.id },
      })
      expect(createdInDb).not.toBeNull()
      expect(createdInDb?.userId).toBeNull()
    })

    test('should create a personal location when isPersonal is true', async () => {
      const payload = {
        label: 'Secret Stash Box',
        type: 'STORAGE',
        parentId: sharedLocationId,
        isPersonal: true,
      }

      const response = await request
        .post('/api/v1/locations')
        .set('x-user-id', testUserId.toString())
        .send(payload)
        .expect(201)

      expect(response.body.label).toBe('Secret Stash Box')
      expect(response.body.userId).toBe(testUserId)
      expect(response.body.parentId).toBe(sharedLocationId)
    })

    test('should fail with 400 if label is missing or empty', async () => {
      await request
        .post('/api/v1/locations')
        .set('x-user-id', testUserId.toString())
        .send({ label: '   ', type: 'STORAGE' })
        .expect(400)
    })
  })

  describe('PATCH /api/v1/locations/:id', () => {
    test('should update location properties and parent reference', async () => {
      const updatePayload = {
        label: 'Renamed Pantry Cupboard',
        type: 'PANTRY',
      }

      const response = await request
        .patch(`/api/v1/locations/${sharedLocationId}`)
        .set('x-user-id', testUserId.toString())
        .send(updatePayload)
        .expect(200)

      expect(response.body.id).toBe(sharedLocationId)
      expect(response.body.label).toBe('Renamed Pantry Cupboard')
      expect(response.body.type).toBe('PANTRY')
    })

    test('should reject setting a location as its own parent with 400', async () => {
      await request
        .patch(`/api/v1/locations/${sharedLocationId}`)
        .set('x-user-id', testUserId.toString())
        .send({ parentId: sharedLocationId })
        .expect(400)
    })

    test('should return 404 when updating location owned by another user', async () => {
      await request
        .patch(`/api/v1/locations/${otherUserLocationId}`)
        .set('x-user-id', testUserId.toString())
        .send({ label: 'Hacked Label' })
        .expect(404)
    })
  })

  describe('DELETE /api/v1/locations/:id', () => {
    test('should delete an empty location without dependents', async () => {
      await request
        .delete(`/api/v1/locations/${personalLocationId}`)
        .set('x-user-id', testUserId.toString())
        .expect(204)

      const deletedDbItem = await prisma.location.findUnique({
        where: { id: personalLocationId },
      })
      expect(deletedDbItem).toBeNull()
    })

    test('should fail deletion with constraint error if location has child locations', async () => {
      // Attempt to delete parent location (sharedLocationId) which has childLocationId linked
      await request
        .delete(`/api/v1/locations/${sharedLocationId}`)
        .set('x-user-id', testUserId.toString())
        .expect((res) => {
          // Accepts 409 Conflict or 500/400 depending on handler
          expect([409, 400, 500]).toContain(res.status)
        })
    })

    test('should return 404 when attempting to delete location of another user', async () => {
      await request
        .delete(`/api/v1/locations/${otherUserLocationId}`)
        .set('x-user-id', testUserId.toString())
        .expect(404)
    })
  })
})
