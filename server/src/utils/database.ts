import prisma from '../db.js'
import { Prisma } from '../generated/prisma/client.js'

export type RestockScope = 'public' | 'private' | 'both'

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

/**
 * Helper to build consistent location scope filters across handlers
 */
export function getItemScopeFilter(scope: RestockScope, userId: number): Prisma.ItemWhereInput {
  if (scope === 'private') {
    return {
      OR: [
        { userId }, // Private catalog items owned by user
        { stocks: { some: { location: { userId } } } }, // Items with stock in private locations
      ],
    }
  }

  if (scope === 'public') {
    return {
      OR: [
        { userId: null }, // Public catalog items
        { stocks: { some: { location: { userId: null } } } }, // Items with stock in public locations
      ],
    }
  }

  // 'both' scope
  return {
    OR: [{ userId }, { userId: null }],
  }
}

export interface RestockItem {
  id: number
  label: string
  currentQty: number
  threshold: number
  isManuallyLowStock: boolean
  isOutOfStock: boolean
  needsRestock: boolean
  locationName: string
}

export async function getRestockItems(
  userId: number,
  scope: RestockScope = 'public'
): Promise<RestockItem[]> {
  // 1. Resolve Location IDs that belong to the requested scope
  let scopedLocationIds: number[] | undefined

  if (scope === 'private') {
    const userLocations = await prisma.location.findMany({
      where: { userId },
      select: { id: true },
    })
    scopedLocationIds = userLocations.map((l) => l.id)
  } else if (scope === 'public') {
    const publicLocations = await prisma.location.findMany({
      where: { userId: null },
      select: { id: true },
    })
    scopedLocationIds = publicLocations.map((l) => l.id)
  }

  // 2. Define Item Catalog Ownership based on scope
  const itemOwnershipWhere: Prisma.ItemWhereInput =
    scope === 'private'
      ? { userId }
      : scope === 'public'
        ? { userId: null }
        : { OR: [{ userId }, { userId: null }] }

  // 3. Query Items matching Catalog Ownership + Low Stock criteria
  const items = await prisma.item.findMany({
    where: {
      deletedAt: null,
      ...itemOwnershipWhere,
      AND: [
        {
          OR: [{ isManuallyLowStock: true }, { lowStockThreshold: { not: null } }],
        },
      ],
    },
    include: {
      stocks: {
        where: {
          deletedAt: null,
          ...(scopedLocationIds !== undefined ? { locationId: { in: scopedLocationIds } } : {}),
        },
        include: {
          location: { select: { label: true } },
        },
      },
    },
  })

  // 4. Map & Evaluate Restock Status
  return items
    .map((item) => {
      const currentQty = item.stocks.reduce((acc, s) => acc + s.quantity, 0)
      const threshold = item.lowStockThreshold ?? 1

      // Location label preference: 1st scoped stock location -> item location -> 'Unassigned'
      const locationName = item.stocks[0]?.location?.label || 'Unassigned'

      const isOutOfStock = currentQty === 0
      const needsRestock = item.isManuallyLowStock || currentQty <= threshold

      return {
        id: item.id,
        label: item.label,
        currentQty,
        threshold,
        isManuallyLowStock: item.isManuallyLowStock,
        isOutOfStock,
        needsRestock,
        locationName,
      }
    })
    .filter((item) => item.needsRestock)
}

export default async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  // List the initial users you want in your system
  const initialUsers = [
    {
      id: 1,
      email: 'jamie.paul.stimpson@gmail.com',
      name: 'Jamie Stimpson',
    },
  ]

  for (const userData of initialUsers) {
    // Upsert ensures running the seed multiple times won't create duplicate users
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { id: userData.id, name: userData.name },
      create: userData,
    })

    console.log(`✅ User ready: ID ${user.id} — ${user.email}`)
  }

  console.log('🎉 Seeding completed successfully!')
}
