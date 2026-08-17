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
  // 2. Quick Grocery / Restock List
  const allItems = await prisma.item.findMany({
    where: { userId },
    include: { stocks: { select: { quantity: true } } },
  })

  const restockList = allItems
    // Ignore items that do not have an explicit lowStockThreshold set
    .filter((item) => item.lowStockThreshold !== null && item.lowStockThreshold !== undefined)
    .map((item) => {
      const totalQty = item.stocks.reduce((acc, s) => acc + s.quantity, 0)
      const threshold = item.lowStockThreshold!

      return {
        id: item.id,
        label: item.label,
        currentQty: totalQty,
        threshold,
        isOutOfStock: totalQty === 0,
        needsRestock: totalQty <= threshold,
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
