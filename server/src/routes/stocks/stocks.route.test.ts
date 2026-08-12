import prisma from '../../db.js'
import { transferStock } from '../../controllers/stocks.controller.js'

describe('Stock Transfer Service - transferStock', () => {
  let testUserId: number
  let kitchenLocationId: number
  let bathroomLocationId: number
  let itemId: number

  // ---------------------------------------------------------------------------
  // Prerequisites Setup
  // ---------------------------------------------------------------------------
  beforeAll(async () => {
    await prisma.$connect()

    // 1. Create a Test User
    const user = await prisma.user.create({
      data: {
        email: 'transferuser@example.com',
        name: 'Transfer Test User',
      },
    })
    testUserId = user.id

    // 2. Create Kitchen & Bathroom Locations
    const kitchen = await prisma.location.create({
      data: { label: 'Kitchen Under Sink' },
    })
    kitchenLocationId = kitchen.id

    const bathroom = await prisma.location.create({
      data: { label: 'Bathroom Under Cupboard' },
    })
    bathroomLocationId = bathroom.id
  })

  // ---------------------------------------------------------------------------
  // Wipe Database Tables Before Each Test Run
  // ---------------------------------------------------------------------------
  beforeEach(async () => {
    await prisma.itemStock.deleteMany()
    await prisma.item.deleteMany()

    // Create a base Flash Bleach catalog item
    const item = await prisma.item.create({
      data: {
        label: 'Flash Bleach',
        barcode: '5010029000099',
        userId: testUserId,
      },
    })
    itemId = item.id
  })

  // ---------------------------------------------------------------------------
  // Tear Down
  // ---------------------------------------------------------------------------
  afterAll(async () => {
    await prisma.itemStock.deleteMany()
    await prisma.item.deleteMany()
    await prisma.location.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // ---------------------------------------------------------------------------
  // Test Cases
  // ---------------------------------------------------------------------------

  test('should transfer quantity to a NEW location and create a target stock batch', async () => {
    // Seed: 3x Bleach in Kitchen
    const sourceStock = await prisma.itemStock.create({
      data: {
        itemId,
        locationId: kitchenLocationId,
        quantity: 3,
        expirationDate: new Date('2027-05-01'),
      },
    })

    // Act: Move 1x Bleach from Kitchen -> Bathroom
    await transferStock({
      sourceStockId: sourceStock.id,
      targetLocationId: bathroomLocationId,
      quantityToMove: 1,
    })

    // Assert Source Batch (Kitchen) drops from 3 to 2
    const updatedSource = await prisma.itemStock.findUnique({
      where: { id: sourceStock.id },
    })
    expect(updatedSource?.quantity).toBe(2)

    // Assert Target Batch (Bathroom) is created with quantity 1
    const targetStock = await prisma.itemStock.findFirst({
      where: {
        itemId,
        locationId: bathroomLocationId,
      },
    })
    expect(targetStock).not.toBeNull()
    expect(targetStock?.quantity).toBe(1)
    expect(targetStock?.expirationDate).toEqual(new Date('2027-05-01'))
  })

  test('should transfer quantity and INCREMENT an existing target stock batch', async () => {
    const expDate = new Date('2027-05-01')

    // Seed: 3x Bleach in Kitchen
    const sourceStock = await prisma.itemStock.create({
      data: {
        itemId,
        locationId: kitchenLocationId,
        quantity: 3,
        expirationDate: expDate,
      },
    })

    // Seed: Pre-existing 2x Bleach in Bathroom
    const existingTargetStock = await prisma.itemStock.create({
      data: {
        itemId,
        locationId: bathroomLocationId,
        quantity: 2,
        expirationDate: expDate,
      },
    })

    // Act: Move 1x Bleach from Kitchen -> Bathroom
    await transferStock({
      sourceStockId: sourceStock.id,
      targetLocationId: bathroomLocationId,
      quantityToMove: 1,
    })

    // Assert Kitchen drops from 3 to 2
    const updatedSource = await prisma.itemStock.findUnique({
      where: { id: sourceStock.id },
    })
    expect(updatedSource?.quantity).toBe(2)

    // Assert Bathroom increments from 2 to 3
    const updatedTarget = await prisma.itemStock.findUnique({
      where: { id: existingTargetStock.id },
    })
    expect(updatedTarget?.quantity).toBe(3)

    // Ensure no duplicate stock records were created in Bathroom
    const allBathroomStocks = await prisma.itemStock.findMany({
      where: { itemId, locationId: bathroomLocationId },
    })
    expect(allBathroomStocks).toHaveLength(1)
  })

  test('should throw an error if requesting to move more quantity than available', async () => {
    // Seed: 1x Bleach in Kitchen
    const sourceStock = await prisma.itemStock.create({
      data: {
        itemId,
        locationId: kitchenLocationId,
        quantity: 1,
      },
    })

    // Act & Assert: Attempt to move 5 items from batch of 1
    await expect(
      transferStock({
        sourceStockId: sourceStock.id,
        targetLocationId: bathroomLocationId,
        quantityToMove: 5,
      })
    ).rejects.toThrow('Insufficient stock quantity')

    // Verify Kitchen quantity remains unchanged due to rollback
    const unChangedSource = await prisma.itemStock.findUnique({
      where: { id: sourceStock.id },
    })
    expect(unChangedSource?.quantity).toBe(1)
  })

  test('should throw an error if source stock batch does not exist', async () => {
    await expect(
      transferStock({
        sourceStockId: 99999, // Non-existent ID
        targetLocationId: bathroomLocationId,
        quantityToMove: 1,
      })
    ).rejects.toThrow('Source stock batch with ID 99999 not found.')
  })
})
