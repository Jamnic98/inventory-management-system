import prisma from '../db.js'
import { Prisma } from '../generated/prisma/client.js'

interface StockTransferData {
  sourceStockId: number
  targetLocationId: number | null
  quantityToMove: number
}

interface UpdateStockQuantityData {
  stockId: number
  quantity: number
}

interface OpenStockUnitData {
  stockId: number
}

// Helper utility to keep aggregate parent item quantity in sync
async function syncParentItemQuantity(tx: Prisma.TransactionClient, itemId: number) {
  const aggregate = await tx.itemStock.aggregate({
    where: { itemId },
    _sum: { quantity: true },
  })

  const totalQuantity = aggregate._sum.quantity ?? 0

  await tx.item.update({
    where: { id: itemId },
    data: {
      updatedAt: new Date(),
    },
  })

  return totalQuantity
}

export const transferStockService = async ({
  sourceStockId,
  targetLocationId,
  quantityToMove,
  sourceLocationId,
}: StockTransferData & { sourceLocationId?: number }) => {
  // 1. Sanitize and validate quantity
  const amount = Number(quantityToMove)
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid transfer quantity provided: ${quantityToMove}`)
  }

  // 2. Sanitize location IDs
  const targetLocId = targetLocationId != null ? Number(targetLocationId) : null
  const sourceLocId = sourceLocationId != null ? Number(sourceLocationId) : undefined

  return await prisma.$transaction(async (tx) => {
    // 3. Try finding stock batch by ItemStock.id
    let sourceStock = await tx.itemStock.findFirst({
      where: {
        id: sourceStockId,
        deletedAt: null,
      },
    })

    // 4. Fallback: If not found, treat sourceStockId as itemId
    if (!sourceStock) {
      sourceStock = await tx.itemStock.findFirst({
        where: {
          itemId: sourceStockId,
          ...(sourceLocId ? { locationId: sourceLocId } : {}),
          deletedAt: null,
          quantity: { gte: amount },
        },
        orderBy: { createdAt: 'asc' }, // FIFO: take from oldest batch
      })
    }

    if (!sourceStock) {
      throw new Error(`No available stock found for Item/Stock ID ${sourceStockId}.`)
    }

    if (sourceStock.quantity < amount) {
      throw new Error(
        `Insufficient stock quantity. Requested: ${amount}, Available: ${sourceStock.quantity}`
      )
    }

    // 5. Deduct quantity from source batch
    const updatedSource = await tx.itemStock.update({
      where: { id: sourceStock.id },
      data: { quantity: { decrement: amount } },
    })

    // 6. Soft-delete source batch if empty
    if (updatedSource.quantity <= 0) {
      await tx.itemStock.update({
        where: { id: sourceStock.id },
        data: { deletedAt: new Date() },
      })
    }

    // 7. Check if target stock batch already exists (matching location, expiration & opened status)
    const existingTargetStock = await tx.itemStock.findFirst({
      where: {
        itemId: sourceStock.itemId,
        locationId: targetLocId,
        expirationDate: sourceStock.expirationDate,
        openedOn: sourceStock.openedOn,
        deletedAt: null,
      },
    })

    if (existingTargetStock) {
      await tx.itemStock.update({
        where: { id: existingTargetStock.id },
        data: { quantity: { increment: amount } },
      })
    } else {
      await tx.itemStock.create({
        data: {
          itemId: sourceStock.itemId,
          locationId: targetLocId,
          quantity: amount,
          expirationDate: sourceStock.expirationDate,
          openedOn: sourceStock.openedOn,
        },
      })
    }

    await syncParentItemQuantity(tx, sourceStock.itemId)

    return updatedSource
  })
}

export const updateStockQuantityService = async ({
  stockId,
  quantity,
}: UpdateStockQuantityData) => {
  return await prisma.$transaction(async (tx) => {
    const stock = await tx.itemStock.findFirst({
      where: {
        id: stockId,
        deletedAt: null,
      },
    })

    if (!stock) {
      throw new Error(`Stock batch not found with ID ${stockId}`)
    }

    let updatedStock

    if (quantity <= 0) {
      // Soft-delete empty batch
      updatedStock = await tx.itemStock.update({
        where: { id: stockId },
        data: {
          quantity: 0,
          deletedAt: new Date(),
        },
      })
    } else {
      updatedStock = await tx.itemStock.update({
        where: { id: stockId },
        data: { quantity },
      })
    }

    // Recalculate parent item total quantity
    await syncParentItemQuantity(tx, stock.itemId)

    return updatedStock
  })
}

export const openStockUnitService = async ({ stockId }: OpenStockUnitData) => {
  return await prisma.$transaction(async (tx) => {
    const stock = await tx.itemStock.findFirst({
      where: {
        id: stockId,
        deletedAt: null,
      },
    })

    if (!stock) {
      throw new Error(`Stock batch not found with ID ${stockId}`)
    }

    if (stock.quantity < 1) {
      throw new Error('Cannot open a unit from an empty stock batch')
    }

    if (stock.openedOn) {
      throw new Error('This batch is already marked as opened')
    }

    const now = new Date()
    let resultStock

    if (stock.quantity === 1) {
      // Single unit batch: mark opened directly
      resultStock = await tx.itemStock.update({
        where: { id: stockId },
        data: { openedOn: now },
      })
    } else {
      // Split batch: decrement unopened batch by 1
      await tx.itemStock.update({
        where: { id: stockId },
        data: { quantity: stock.quantity - 1 },
      })

      // Check if an opened batch already exists for this item/location/expiry
      const existingOpenedStock = await tx.itemStock.findFirst({
        where: {
          itemId: stock.itemId,
          locationId: stock.locationId,
          expirationDate: stock.expirationDate,
          openedOn: { not: null },
          deletedAt: null,
        },
      })

      if (existingOpenedStock) {
        resultStock = await tx.itemStock.update({
          where: { id: existingOpenedStock.id },
          data: { quantity: { increment: 1 } },
        })
      } else {
        resultStock = await tx.itemStock.create({
          data: {
            itemId: stock.itemId,
            locationId: stock.locationId,
            expirationDate: stock.expirationDate,
            quantity: 1,
            openedOn: now,
          },
        })
      }
    }

    await syncParentItemQuantity(tx, stock.itemId)

    return resultStock
  })
}
