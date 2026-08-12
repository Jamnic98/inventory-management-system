import { Item } from './item'
import { type User } from './user'

export interface Location {
  id: number
  label: string

  // Ownership: null = General / Household Shared, non-null = Personal
  userId?: number | null
  user?: User | null

  // Self-Referencing Tree
  parentId?: number | null
  parent?: Location | null
  children?: Location[]

  // Relations
  items?: Item[]
  subscriptions?: LocationSubscription[]

  createdAt?: Date | string | null
  updatedAt?: Date | string | null
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
