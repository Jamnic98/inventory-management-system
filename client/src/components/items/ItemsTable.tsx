import { type Item } from '../../types'

interface ItemsTableProps {
  items: Item[]
  locationsMap?: Record<number, string> // Maps locationId to location name e.g. { 1: "Pantry" }
  onUpdateQuantity: (id: number, newQuantity: number) => void
  onSelectItem: (item: Item) => void
  onRestore?: (id: number) => void // Optional handler for archived items
}

// Helper to calculate effective expiration date
const getEffectiveExpiration = (item: Item): Date | null => {
  let openExpiry: Date | null = null
  if (item.openedOn && item.useWithinDays) {
    openExpiry = new Date(item.openedOn)
    openExpiry.setDate(openExpiry.getDate() + item.useWithinDays)
  }

  const hardExpiry = item.expirationDate ? new Date(item.expirationDate) : null

  if (openExpiry && hardExpiry) {
    return openExpiry < hardExpiry ? openExpiry : hardExpiry
  }
  return openExpiry || hardExpiry
}

// Helper to determine status badge display
const getStatus = (item: Item) => {
  if (item.deletedAt) {
    return { label: 'Archived', color: 'bg-gray-100 text-gray-600 border border-gray-300' }
  }

  // Use backend computed flag or calculate diff
  if (item.isOpenedExpired) {
    return { label: 'Opened Expired', color: 'bg-red-100 text-red-800' }
  }

  const effectiveExpiry = getEffectiveExpiration(item)
  const now = new Date()

  if (effectiveExpiry) {
    const diffDays = Math.ceil((effectiveExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800' }
    if (diffDays <= 3) return { label: `${diffDays}d left`, color: 'bg-amber-100 text-amber-800' }
  }

  // Use backend computed boolean `isLowStock`
  if (item.isLowStock) {
    return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
  }

  return { label: 'OK', color: 'bg-green-100 text-green-800' }
}

export default function ItemsTable({
  items,
  locationsMap = {},
  onUpdateQuantity,
  onSelectItem,
  onRestore,
}: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="w-full text-center py-8 text-gray-500 border rounded bg-white text-sm">
        No items found matching your filter criteria.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto border rounded bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b text-gray-700">
          <tr>
            <th className="p-2">Item</th>
            <th className="p-2 hidden sm:table-cell">Location</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            if (!item.id) return null

            const status = getStatus(item)
            const isArchived = Boolean(item.deletedAt)
            // Use backend computed boolean or fallback check
            const isLowStock =
              item.isLowStock ??
              (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold)

            return (
              <tr
                key={item.id}
                className={`hover:bg-gray-50/80 transition-colors ${isArchived ? 'opacity-75 bg-gray-50/50' : ''}`}
              >
                {/* Item Label & Mobile Subtitle */}
                <td className="p-2 font-medium text-gray-900">
                  <div className="flex items-center gap-1.5">
                    <span>{item.label || 'Unnamed Item'}</span>
                    {item.userId !== null && item.userId !== undefined && (
                      <span
                        className="px-1.5 py-0.2 text-[10px] bg-purple-50 text-purple-700 rounded border border-purple-200"
                        title="Personal Item"
                      >
                        Personal
                      </span>
                    )}
                  </div>
                  {/* Location fallback for mobile screens */}
                  {item.locationId && (
                    <span className="text-xs text-gray-500 sm:hidden block mt-0.5">
                      {locationsMap[item.locationId] || `Loc #${item.locationId}`}
                    </span>
                  )}
                </td>

                {/* Location (Tablet/Desktop) */}
                <td className="p-2 hidden sm:table-cell text-gray-600">
                  {item.locationId
                    ? locationsMap[item.locationId] || `Loc #${item.locationId}`
                    : '-'}
                </td>

                {/* Inline Quantity Controls */}
                <td className="p-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={isArchived}
                      className="px-2 py-0.5 border rounded bg-gray-50 hover:bg-gray-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() =>
                        onUpdateQuantity(item.id!, Math.max(0, (item.quantity || 0) - 1))
                      }
                    >
                      -
                    </button>
                    <span
                      className={`min-w-6 text-center font-bold ${
                        isLowStock ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      {item.quantity ?? 0}
                    </span>
                    <button
                      type="button"
                      disabled={isArchived}
                      className="px-2 py-0.5 border rounded bg-gray-50 hover:bg-gray-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => onUpdateQuantity(item.id!, (item.quantity || 0) + 1)}
                    >
                      +
                    </button>
                  </div>
                </td>

                {/* Dynamic Status Badge */}
                <td className="p-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-semibold ${status.color} text-xs`}
                  >
                    {status.label}
                  </span>
                </td>

                {/* Actions / Details */}
                <td className="p-2 text-right space-x-2">
                  {isArchived && onRestore ? (
                    <button
                      type="button"
                      className="text-xs text-green-700 font-medium hover:underline"
                      onClick={() => onRestore(item.id!)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                      onClick={() => onSelectItem(item)}
                    >
                      Details
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
