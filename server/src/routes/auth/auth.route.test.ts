process.env.JWT_SECRET = 'test-secret-key-123'
import supertest from 'supertest'

import app from '../../server.js'
import prisma from '../../db.js'

let testUserId: number

beforeEach(async () => {
  // Clear tables to prevent foreign key conflicts / duplicate emails
  await prisma.user.deleteMany()

  // Create the user and store the REAL auto-incremented ID
  const createdUser = await prisma.user.create({
    data: {
      name: 'Auth Test User',
      email: 'auth-test@example.com',
    },
  })

  testUserId = createdUser.id
})

describe('GET /api/v1/auth/login', () => {
  const request = supertest(app)

  test('should auto-login with valid token and set session cookie', async () => {
    const validToken = 'valid-test-token-123'

    // Create test user atomically
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        loginToken: validToken,
        tokenExpiry: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in future
      },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        loginToken: validToken,
        tokenExpiry: new Date(Date.now() + 1000 * 60 * 60),
      },
    })

    const response = await request.get(`/api/v1/auth/login?token=${validToken}`).expect(200)

    expect(response.body.token).toBeDefined()
    expect(response.body.user).toBeDefined()
    expect(response.body.user.email).toBe('test@example.com')
  })
})
