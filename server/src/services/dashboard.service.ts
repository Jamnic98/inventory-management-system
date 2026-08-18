import prisma from '../db.js'

export async function getHomeDashboardData(userId: number) {
  const now = new Date()

  // 1. Recently Opened / "Use First" List
  const openedStocks = await prisma.itemStock.findMany({
    where: {
      quantity: { gt: 0 },
      openedOn: { not: null },
      item: {
        userId, // Filtered via relation since ItemStock doesn't have direct userId
      },
    },
    include: {
      item: { select: { id: true, label: true, useWithinDays: true } },
      location: { select: { label: true } },
    },
    orderBy: { openedOn: 'desc' },
  })

  const useFirstList = openedStocks
    .map((stock) => {
      const openedOn = new Date(stock.openedOn!)
      const useWithinDays = stock.item.useWithinDays ?? 7 // Default 7 days if unspecified
      const expiresByDate = new Date(openedOn)
      expiresByDate.setDate(expiresByDate.getDate() + useWithinDays)

      const daysRemaining = Math.ceil(
        (expiresByDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: stock.id,
        itemLabel: stock.item.label,
        locationLabel: stock.location?.label || 'Unassigned',
        openedOn: stock.openedOn,
        quantity: stock.quantity,
        daysRemaining,
      }
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)

  // 2. Quick Grocery / Restock List
  const allItems = await prisma.item.findMany({
    where: {
      deletedAt: null, // Ensure archived items aren't returned
      OR: [
        { userId },
        { userId: null }, // Include shared/household items if applicable
      ],
    },
    include: {
      stocks: {
        where: { deletedAt: null },
        select: { quantity: true },
      },
    },
  })

  const restockList = allItems
    .map((item) => {
      const totalQty = item.stocks.reduce((acc, s) => acc + s.quantity, 0)
      const threshold = item.lowStockThreshold

      // Check manual override first, fallback to threshold check
      const needsRestock =
        item.isManuallyLowStock === true ||
        (item.isManuallyLowStock !== false &&
          threshold !== null &&
          threshold !== undefined &&
          totalQty <= threshold)

      return {
        id: item.id,
        label: item.label,
        currentQty: totalQty,
        threshold,
        isLowStock: item.isManuallyLowStock ?? false, // Include in payload
        isOutOfStock: totalQty === 0,
        needsRestock,
      }
    })
    .filter((item) => item.needsRestock)
    .sort((a, b) => a.currentQty - b.currentQty)

  // 3. Location Summary Cards
  const locationCounts = await prisma.location.findMany({
    where: { userId },
    select: {
      id: true,
      label: true,
      stocks: {
        where: { quantity: { gt: 0 } },
        select: { quantity: true },
      },
    },
  })

  const locationSummaries = locationCounts.map((loc) => ({
    id: loc.id,
    label: loc.label,
    itemCount: loc.stocks.reduce((sum, s) => sum + s.quantity, 0),
  }))

  return {
    useFirstList,
    restockList,
    locationSummaries,
  }
}
