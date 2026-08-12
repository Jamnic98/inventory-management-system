import prisma from '../db.js'

interface StockTransferData {
  sourceStockId: number
  targetLocationId: number
  quantityToMove: number
}

export const transferStockService = async ({
  sourceStockId,
  targetLocationId,
  quantityToMove,
  sourceLocationId, // Optional: if you know which location to move from
}: StockTransferData & { sourceLocationId?: number }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Try finding stock batch by ItemStock.id
    let sourceStock = await tx.itemStock.findFirst({
      where: {
        id: sourceStockId,
        deletedAt: null,
      },
    })

    // 2. Fallback: If not found, treat sourceStockId as itemId
    if (!sourceStock) {
      sourceStock = await tx.itemStock.findFirst({
        where: {
          itemId: sourceStockId,
          ...(sourceLocationId ? { locationId: sourceLocationId } : {}),
          deletedAt: null,
          quantity: { gte: quantityToMove }, // Pick batch with enough stock
        },
        orderBy: { createdAt: 'asc' }, // FIFO: take from oldest batch
      })
    }

    if (!sourceStock) {
      throw new Error(`No available stock found for Item/Stock ID ${sourceStockId}.`)
    }

    if (sourceStock.quantity < quantityToMove) {
      throw new Error(
        `Insufficient stock quantity. Requested: ${quantityToMove}, Available: ${sourceStock.quantity}`
      )
    }

    // Deduct quantity from source batch
    const updatedSource = await tx.itemStock.update({
      where: { id: sourceStock.id },
      data: { quantity: { decrement: quantityToMove } },
    })

    // Soft-delete source batch if empty
    if (updatedSource.quantity <= 0) {
      await tx.itemStock.update({
        where: { id: sourceStock.id },
        data: { deletedAt: new Date() },
      })
    }

    // Check if target stock batch already exists
    const existingTargetStock = await tx.itemStock.findFirst({
      where: {
        itemId: sourceStock.itemId,
        locationId: targetLocationId,
        expirationDate: sourceStock.expirationDate,
        deletedAt: null,
      },
    })

    if (existingTargetStock) {
      await tx.itemStock.update({
        where: { id: existingTargetStock.id },
        data: { quantity: { increment: quantityToMove } },
      })
    } else {
      await tx.itemStock.create({
        data: {
          itemId: sourceStock.itemId,
          locationId: targetLocationId,
          quantity: quantityToMove,
          expirationDate: sourceStock.expirationDate,
          openedOn: sourceStock.openedOn,
        },
      })
    }

    return updatedSource
  })
}
