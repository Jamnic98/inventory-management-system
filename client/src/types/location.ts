import { Item } from './item'

export interface Location {
  id: number
  label: string
  type: string
  parentId: number | null
  parent?: Location
  children: Location[]

  items: Item[]
  subscriptions: LocationSubscription[]

  createdAt: Date | null
  updatedAt: Date | null
}

export interface LocationOption {
  id: number
  label: string
}

export interface LocationSubscription {
  id: number
  locationId: number
  userId: number
  thresholdAlerts?: boolean
}

export interface LocationTreeNode extends Location {
  children: LocationTreeNode[]
  itemCount: number
}
