export interface RestockItem {
  id: number
  label: string
  currentQty: number
  threshold: number
  isManuallyLowStock: boolean
  isOutOfStock: boolean
  needsRestock: boolean
  locationName: string
  hasScopedBatches?: boolean
}
