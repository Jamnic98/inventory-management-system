import prisma from '../db.js'

interface StockTransferData {
  sourceStockId: number
  targetLocationId: number
  quantityToMove: number
}

export const transferStock = async ({
  sourceStockId,
  targetLocationId,
  quantityToMove,
}: StockTransferData) => {
  return await prisma.$transaction(async (tx) => {
    // Fetch source stock batch to get itemId, expirationDate, and check available quantity
    const sourceStock = await tx.itemStock.findUnique({
      where: { id: sourceStockId },
    })

    if (!sourceStock) {
      throw new Error(`Source stock batch with ID ${sourceStockId} not found.`)
    }

    if (sourceStock.quantity < quantityToMove) {
      throw new Error(
        `Insufficient stock quantity. Requested: ${quantityToMove}, Available: ${sourceStock.quantity}`
      )
    }

    // Deduct quantity from the source batch (or delete/archive if empty)
    const updatedSource = await tx.itemStock.update({
      where: { id: sourceStockId },
      data: { quantity: { decrement: quantityToMove } },
    })

    // Check if a batch with the same location and expiration date already exists
    const existingTargetStock = await tx.itemStock.findFirst({
      where: {
        itemId: sourceStock.itemId,
        locationId: targetLocationId,
        expirationDate: sourceStock.expirationDate,
        deletedAt: null,
      },
    })

    if (existingTargetStock) {
      // Add quantity to existing target batch
      await tx.itemStock.update({
        where: { id: existingTargetStock.id },
        data: { quantity: { increment: quantityToMove } },
      })
    } else {
      // Create a new target batch with inherited batch details (expirationDate, openedOn)
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
