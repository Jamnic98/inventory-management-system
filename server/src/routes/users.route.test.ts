import supertest from 'supertest'

import app from '../../src/server.js'
import prisma from '../../src/db.js'

describe('Test the users endpoint', () => {
  const request = supertest(app)

  beforeAll(async () => {
    await prisma.$connect()
  })

  // Wipe users before EACH test
  beforeEach(async () => {
    await prisma.user.deleteMany()

    await prisma.user.createMany({
      data: [
        {
          name: 'Alex',
          email: 'alex@home.local',
          loginToken: 'token-alex-123',
        },
        {
          name: 'Sam',
          email: 'sam@home.local',
          loginToken: 'token-sam-456',
        },
      ],
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('GET /users - get all users', async () => {
    const response = await request.get('/users').expect(200)

    expect(response.body).toHaveLength(2)
    for (const user of response.body) {
      expect(user).toHaveProperty('id')
      expect(user.name).toBeTruthy()
      expect(user.email).toBeTruthy()
      // Make sure sensitive tokens aren't leaked in general lists
      expect(user).not.toHaveProperty('loginToken')
    }
  })

  test('GET /users/:id - get user by id', async () => {
    const seededUser = await prisma.user.findFirst({
      where: { email: 'alex@home.local' },
    })
    expect(seededUser).not.toBeNull()

    const response = await request.get(`/users/${seededUser!.id}`).expect(200)

    expect(response.body.id).toBe(seededUser!.id)
    expect(response.body.name).toBe('Alex')
    expect(response.body.email).toBe('alex@home.local')
  })

  test('POST /users - create user and return magic link', async () => {
    const newUser = {
      name: 'Jordan',
      email: 'jordan@home.local',
    }

    const response = await request.post('/users').send(newUser).expect(201)

    expect(response.body).toHaveProperty('magicLink')
    expect(response.body).toHaveProperty('token')
    expect(response.body.user.name).toBe('Jordan')
    expect(response.body.user.email).toBe('jordan@home.local')

    // Verify token exists in database
    const foundInDb = await prisma.user.findUnique({
      where: { email: 'jordan@home.local' },
    })
    expect(foundInDb).not.toBeNull()
    expect(foundInDb?.loginToken).toBe(response.body.token)
  })

  test('GET /users/login - auto-login setting session cookie', async () => {
    const response = await request.get('/users/login?token=token-alex-123').expect(200)

    expect(response.body.message).toBe('Login successful')
    expect(response.body.user.name).toBe('Alex')

    // Check that user_session cookie was generated
    const cookies = response.headers['set-cookie']
    expect(cookies).toBeDefined()
    expect(cookies[0]).toMatch(/user_session=/)
  })

  test('DELETE /users/:id - delete user by id', async () => {
    const seededUser = await prisma.user.findFirst({
      where: { email: 'sam@home.local' },
    })
    expect(seededUser).not.toBeNull()

    await request.delete(`/users/${seededUser!.id}`).expect(204)

    const foundInDb = await prisma.user.findUnique({
      where: { id: seededUser!.id },
    })
    expect(foundInDb).toBeNull()
  })
})
