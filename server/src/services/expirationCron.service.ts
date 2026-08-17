// server/src/services/expirationCron.service.ts
import cron from 'node-cron'

import prisma from '../db.js'

import { broadcast } from '../index.js'
import { sendNotificationEmail } from './email.service.js'

export function initExpirationCron() {
  // Runs every day at 8:00 AM ('0 8 * * *')
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily expiration check...')
    await checkExpiringItems()
  })
}

export async function checkExpiringItems(daysThreshold = 3) {
  try {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysThreshold)

    // 1. Fetch active stock items expiring on or before threshold
    const expiringStocks = await prisma.itemStock.findMany({
      where: {
        quantity: { gt: 0 },
        expirationDate: {
          not: null,
          lte: targetDate,
        },
        item: {
          deletedAt: null,
        },
      },
      include: {
        item: {
          select: {
            id: true,
            label: true,
            userId: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
        location: {
          select: { id: true, label: true },
        },
      },
    })

    if (expiringStocks.length === 0) {
      console.log('[Cron] No expiring items found today.')
      return
    }

    // Extract all unique location IDs present in the expiring items
    const locationIds = Array.from(
      new Set(expiringStocks.map((s) => s.locationId).filter((id): id is number => id !== null))
    )

    // 2. Query location subscriptions where notifyExpiring is enabled
    const subscriptions =
      locationIds.length > 0
        ? await prisma.locationSubscription.findMany({
            where: {
              locationId: { in: locationIds },
              notifyExpiring: true,
            },
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          })
        : []

    // Map: locationId -> Array of Subscribed Users
    const subscribersByLocation = new Map<
      number,
      Array<{ id: number; email: string; name: string | null }>
    >()

    for (const sub of subscriptions) {
      if (!subscribersByLocation.has(sub.locationId)) {
        subscribersByLocation.set(sub.locationId, [])
      }
      subscribersByLocation.get(sub.locationId)!.push(sub.user)
    }

    // 3. Map expiring stocks to recipient users (Location Subscribers + Item Owner)
    const userNotifications = new Map<
      number,
      {
        user: { id: number; email: string; name: string | null }
        stocks: typeof expiringStocks
      }
    >()

    const addStockToUser = (
      user: { id: number; email: string; name: string | null },
      stock: (typeof expiringStocks)[0]
    ) => {
      if (!userNotifications.has(user.id)) {
        userNotifications.set(user.id, { user, stocks: [] })
      }
      const userEntry = userNotifications.get(user.id)!
      if (!userEntry.stocks.some((s) => s.id === stock.id)) {
        userEntry.stocks.push(stock)
      }
    }

    for (const stock of expiringStocks) {
      // Add users subscribed to this item's location
      if (stock.locationId && subscribersByLocation.has(stock.locationId)) {
        for (const subUser of subscribersByLocation.get(stock.locationId)!) {
          addStockToUser(subUser, stock)
        }
      }

      // Also ensure the item owner is notified
      if (stock.item.user) {
        addStockToUser(stock.item.user, stock)
      }
    }

    if (userNotifications.size === 0) {
      console.log('[Cron] No active subscribers found for expiring items.')
      return
    }

    const notificationRecords: Array<{
      userId: number
      title: string
      message: string
      itemId: number
      locationId: number | null
    }> = []

    // 4. Send digest email and queue DB notification per user
    for (const [userId, { user, stocks }] of userNotifications.entries()) {
      const itemLinesHtml = stocks
        .map((s) => {
          const expDate = s.expirationDate ? new Date(s.expirationDate).toLocaleDateString() : 'N/A'
          const loc = s.location?.label || 'Unassigned'
          return `<strong>${s.item.label}</strong> (${s.quantity} units in ${loc}) — Expires: <strong>${expDate}</strong>`
        })
        .join('<br />')

      const subject = `⚠️ Alert: ${stocks.length} item(s) expiring soon`
      const htmlContent = `
    Hello ${user.name || 'there'},<br /><br />
    The following items in your subscribed locations are expiring soon:<br /><br />
    ${itemLinesHtml}<br /><br />
    Please check your inventory dashboard.
  `

      if (user.email) {
        await sendNotificationEmail(user.email, subject, htmlContent)
      }

      for (const s of stocks) {
        notificationRecords.push({
          userId,
          title: 'Expiring Item Alert',
          message: `${s.item.label} (${s.quantity} units) in ${s.location?.label || 'Unassigned'} is expiring soon (${s.expirationDate ? new Date(s.expirationDate).toLocaleDateString() : 'N/A'})`,
          itemId: s.itemId,
          locationId: s.locationId,
        })
      }
    }

    // 5. Persist notifications into Prisma DB
    if (notificationRecords.length > 0) {
      await prisma.notification.createMany({
        data: notificationRecords,
      })
    }

    // 6. Broadcast WebSocket event to refresh open dashboards
    broadcast({
      type: 'notification:expiring',
      count: expiringStocks.length,
    })

    console.log(
      `[Cron] Sent expiration digests to ${userNotifications.size} user(s) across ${expiringStocks.length} stock batch(es).`
    )
  } catch (error) {
    console.error('[Cron] Error checking expiring items:', error)
  }
}
