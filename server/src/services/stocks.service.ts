import prisma from '../db.js'

interface StockTransferData {
  sourceStockId: number
  targetLocationId: number | null
  quantityToMove: number
}

export const transferStockService = async ({
  sourceStockId,
  targetLocationId,
  quantityToMove,
  sourceLocationId, // Optional: if you know which location to move from
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
          quantity: { gte: amount }, // Pick batch with enough stock
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

    return updatedSource
  })
}
