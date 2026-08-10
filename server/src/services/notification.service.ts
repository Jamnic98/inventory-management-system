import prisma from '../db.js'

export type ItemEventType = 'LOW_STOCK' | 'EXPIRING' | 'ITEM_UPDATED'

interface NotifyOptions {
  locationId: number
  itemId: number
  itemName: string
  eventType: ItemEventType
  details?: string
}

export const notifyLocationSubscribers = async ({
  locationId,
  // itemId,
  itemName,
  eventType,
  // details,
}: NotifyOptions) => {
  try {
    // Query only users subscribed to this location with matching preferences
    const subscriptions = await prisma.locationSubscription.findMany({
      where: {
        locationId,
        ...(eventType === 'LOW_STOCK' && { notifyLowStock: true }),
        ...(eventType === 'EXPIRING' && { notifyExpiring: true }),
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    if (subscriptions.length === 0) return

    const targetUserIds = subscriptions.map((sub) => sub.userId)

    console.log(
      `[Notification] Event: ${eventType} for item "${itemName}" at location #${locationId}. Notifying users:`,
      targetUserIds
    )

    // TODO: push to an in-app Notification table, trigger webhooks, or queue email jobs
    /*
    await prisma.notification.createMany({
      data: subscriptions.map((sub) => ({
        userId: sub.userId,
        title: eventType === 'LOW_STOCK' ? 'Low Stock Alert' : 'Expiration Alert',
        message: `${itemName}: ${details}`,
        locationId,
        itemId,
      })),
    })
    */
  } catch (error) {
    console.error('Failed to notify location subscribers:', error)
  }
}
