import { EventEmitter } from 'events'
import { notifyLocationSubscribers } from '../services/notification.service.js'

const itemEvents = new EventEmitter()

// Handle low stock / subscriber alerts in the background
itemEvents.on('item:updated', async (item) => {
  try {
    if (!item.locationId) return

    const isLowStock = item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold

    if (isLowStock) {
      await notifyLocationSubscribers({
        locationId: item.locationId,
        itemId: item.id,
        itemName: item.label,
        eventType: 'LOW_STOCK',
        details: `Quantity is down to ${item.quantity} (Threshold: ${item.lowStockThreshold})`,
      })
    }
  } catch (error) {
    // Isolated background logger—will never crash HTTP requests or trigger unhandled rejections
    console.error('[Event Error] Failed to process item:updated event:', error)
  }
})

export default itemEvents
