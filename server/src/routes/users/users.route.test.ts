import supertest from 'supertest'

import app from '../../server.js'
import prisma from '../../db.js'

describe('Test the users and user settings endpoints', () => {
  const request = supertest(app)

  beforeAll(async () => {
    await prisma.$connect()
  })

  // Clean dependent tables and re-seed before EACH test
  beforeEach(async () => {
    await prisma.userSettings.deleteMany()
    await prisma.locationSubscription.deleteMany()
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.user.deleteMany()

    // Seed users with default settings
    await prisma.user.create({
      data: {
        name: 'Alex',
        email: 'alex@home.local',
        loginToken: 'token-alex-123',
        settings: {
          create: {},
        },
      },
    })

    await prisma.user.create({
      data: {
        name: 'Sam',
        email: 'sam@home.local',
        loginToken: 'token-sam-456',
        settings: {
          create: {},
        },
      },
    })
  })

  afterAll(async () => {
    await prisma.userSettings.deleteMany()
    await prisma.locationSubscription.deleteMany()
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // =============================================================
  // USER CRUD & AUTH TESTS
  // =============================================================
  describe('GET /api/v1/users', () => {
    test('should retrieve all users without exposing login tokens', async () => {
      const response = await request.get('/api/v1/users').expect(200)

      expect(response.body).toHaveLength(2)
      for (const user of response.body) {
        expect(user).toHaveProperty('id')
        expect(user.name).toBeTruthy()
        expect(user.email).toBeTruthy()
        expect(user).not.toHaveProperty('loginToken')
      }
    })
  })

  describe('GET /api/v1/users/:id', () => {
    test('should retrieve user by id including nested settings', async () => {
      const seededUser = await prisma.user.findFirst({
        where: { email: 'alex@home.local' },
      })
      expect(seededUser).not.toBeNull()

      const response = await request.get(`/api/v1/users/${seededUser!.id}`).expect(200)

      expect(response.body.id).toBe(seededUser!.id)
      expect(response.body.name).toBe('Alex')
      expect(response.body.email).toBe('alex@home.local')
      expect(response.body).toHaveProperty('settings')
      expect(response.body.settings.autoSubscribeNewLocations).toBe(true)
    })

    test('should return 404 for non-existent user id', async () => {
      await request.get('/api/v1/users/999999').expect(404)
    })

    test('should return 400 for invalid id format', async () => {
      await request.get('/api/v1/users/abc').expect(400)
    })
  })

  describe('POST /api/v1/users', () => {
    test('should create user, initialize default settings, and return magic link', async () => {
      const newUser = {
        name: 'Jordan',
        email: 'jordan@home.local',
      }

      const response = await request.post('/api/v1/users').send(newUser).expect(201)

      expect(response.body).toHaveProperty('magicLink')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.name).toBe('Jordan')
      expect(response.body.user.email).toBe('jordan@home.local')

      // Verify user and auto-created settings exist in DB
      const foundInDb = await prisma.user.findUnique({
        where: { email: 'jordan@home.local' },
        include: { settings: true },
      })
      expect(foundInDb).not.toBeNull()
      expect(foundInDb?.loginToken).toBe(response.body.token)
      expect(foundInDb?.settings).not.toBeNull()
      expect(foundInDb?.settings?.autoSubscribeNewLocations).toBe(true)
    })

    test('should return 400 when name or email is blank or whitespace-only', async () => {
      await request
        .post('/api/v1/users')
        .send({ name: '   ', email: 'valid@home.local' })
        .expect(400)

      await request.post('/api/v1/users').send({ name: 'Valid Name', email: '   ' }).expect(400)
    })
  })

  describe('PATCH /api/v1/users/:id', () => {
    test('should update user name and email', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'alex@home.local' } })

      const response = await request
        .patch(`/api/v1/users/${user!.id}`)
        .send({ name: 'Alexander', email: 'alexander@home.local' })
        .expect(200)

      expect(response.body.name).toBe('Alexander')
      expect(response.body.email).toBe('alexander@home.local')
    })

    test('should return 400 when updating with whitespace-only values', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'alex@home.local' } })

      await request.patch(`/api/v1/users/${user!.id}`).send({ name: '   ' }).expect(400)
    })
  })

  describe('DELETE /api/v1/users/:id', () => {
    test('should delete user by id', async () => {
      const seededUser = await prisma.user.findFirst({
        where: { email: 'sam@home.local' },
      })
      expect(seededUser).not.toBeNull()

      await request.delete(`/api/v1/users/${seededUser!.id}`).expect(204)

      const foundInDb = await prisma.user.findUnique({
        where: { id: seededUser!.id },
      })
      expect(foundInDb).toBeNull()
    })
  })

  // =============================================================
  // USER SETTINGS SUB-RESOURCE TESTS
  // =============================================================
  describe('USER SETTINGS ENDPOINTS', () => {
    test('GET /api/v1/users/:id/settings - should fetch user settings', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'alex@home.local' } })

      const response = await request.get(`/api/v1/users/${user!.id}/settings`).expect(200)

      expect(response.body.userId).toBe(user!.id)
      expect(response.body.defaultNotifyExpiring).toBe(true)
      expect(response.body.expiringThresholdDays).toBe(7)
    })

    test('PATCH /api/v1/users/:id/settings - should update user notification preferences', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'alex@home.local' } })

      const response = await request
        .patch(`/api/v1/users/${user!.id}/settings`)
        .send({
          autoSubscribeNewLocations: false,
          defaultNotifyLowStock: false,
          expiringThresholdDays: 14,
        })
        .expect(200)

      expect(response.body.autoSubscribeNewLocations).toBe(false)
      expect(response.body.defaultNotifyLowStock).toBe(false)
      expect(response.body.expiringThresholdDays).toBe(14)
    })

    test('PATCH /api/v1/users/:id/settings - should return 400 for invalid expiringThresholdDays', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'alex@home.local' } })

      await request
        .patch(`/api/v1/users/${user!.id}/settings`)
        .send({ expiringThresholdDays: 0 })
        .expect(400)

      await request
        .patch(`/api/v1/users/${user!.id}/settings`)
        .send({ expiringThresholdDays: 'invalid' })
        .expect(400)
    })
  })
})
