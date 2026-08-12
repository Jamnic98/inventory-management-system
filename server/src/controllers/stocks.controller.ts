import prisma from '../db.js'

export interface TransferStockInput {
  sourceStockId: number
  targetLocationId: number
  quantityToMove: number
}
export const transferStockService = async ({
  sourceStockId,
  targetLocationId,
  quantityToMove,
}: TransferStockInput) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch source stock batch
    const sourceStock = await tx.itemStock.findUnique({
      where: { id: sourceStockId },
    })

    if (!sourceStock) {
      throw new Error(`Source stock batch with ID ${sourceStockId} not found.`)
    }

    // 2. Validate quantity availability
    if (sourceStock.quantity < quantityToMove) {
      throw new Error('Insufficient stock quantity')
    }

    // 3. Prevent transferring to the same location
    if (sourceStock.locationId === targetLocationId) {
      throw new Error('Target location must be different from source location.')
    }

    // 4. Either update or delete source stock
    if (sourceStock.quantity === quantityToMove) {
      await tx.itemStock.delete({
        where: { id: sourceStockId },
      })
    } else {
      await tx.itemStock.update({
        where: { id: sourceStockId },
        data: {
          quantity: sourceStock.quantity - quantityToMove,
        },
      })
    }

    // 5. Check if matching stock batch already exists at target location
    // (Matches same Item ID and expiration date)
    const existingTargetStock = await tx.itemStock.findFirst({
      where: {
        itemId: sourceStock.itemId,
        locationId: targetLocationId,
        expirationDate: sourceStock.expirationDate,
      },
    })

    if (existingTargetStock) {
      // Increment existing batch quantity
      return await tx.itemStock.update({
        where: { id: existingTargetStock.id },
        data: {
          quantity: existingTargetStock.quantity + quantityToMove,
        },
      })
    }

    // 6. Create new stock batch at target location
    return await tx.itemStock.create({
      data: {
        itemId: sourceStock.itemId,
        locationId: targetLocationId,
        quantity: quantityToMove,
        expirationDate: sourceStock.expirationDate,
        openedOn: sourceStock.openedOn,
      },
    })
  })
}
