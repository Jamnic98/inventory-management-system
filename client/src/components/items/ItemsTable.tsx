import { useState, Fragment } from 'react'

import { type Item } from '../../types'
import { Pagination } from '..'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useAlert, useDeleteItem, useRestoreItem } from '../../hooks'

interface ItemsTableProps {
  items: Item[]
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  locationsMap?: Record<number, string>
  onUpdateQuantity: (id: number, newQuantity: number) => void
  onSelectItem: (item: Item) => void
  onTransferItem?: (item: Item) => void
  onRestore?: (id: number) => void
  initialPageSize?: number
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

  if (item.quantity == null || item.quantity <= 0) {
    return { label: 'Out', color: 'bg-rose-100 text-rose-800' }
  }

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

  const isLowStock =
    item.lowStockThreshold != null && item.quantity > 0 && item.quantity <= item.lowStockThreshold

  if (isLowStock) {
    return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' }
  }

  return { label: 'OK', color: 'bg-green-100 text-green-800' }
}

export default function ItemsTable({
  items,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  locationsMap = {},
  onUpdateQuantity,
  onSelectItem,
}: ItemsTableProps) {
  const alert = useAlert()
  const { mutate: deleteItem } = useDeleteItem()
  const { mutateAsync: restoreItem } = useRestoreItem()

  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})
  const totalPages = Math.ceil(totalItems / pageSize)

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (items.length === 0) {
    return (
      <div className="w-full text-center py-8 text-gray-500 border rounded bg-white text-sm">
        No items found matching your filter criteria.
      </div>
    )
  }

  const handleDelete = (item: Item) => {
    if (!item.id) return

    deleteItem(item.id, {
      onSuccess: () => {
        alert.success(`"${item.label || 'Item'}" deleted`, {
          duration: 6000,
          undoLabel: 'Undo',
          onUndo: async () => {
            try {
              await restoreItem(item.id!)
              alert.success(`"${item.label || 'Item'}" restored`)
            } catch (err) {
              console.error('Failed to restore item:', err)
              alert.error('Failed to restore item')
            }
          },
        })
      },
      onError: () => {
        alert.error('Failed to delete item')
      },
    })
  }

  const handleRestore = (item: Item) => {
    if (!item.id) return

    restoreItem(item.id, {
      onSuccess: () => {
        alert.success(`"${item.label || 'Item'}" restored`)
      },
      onError: () => {
        alert.error('Failed to restore item')
      },
    })
  }

  return (
    <>
      <div className="w-full border rounded bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-700 text-xs">
            <tr>
              <th className="p-2 w-6 text-center hidden sm:table-cell" />
              <th className="p-2 w-6 text-center hidden sm:table-cell" title="Personal Item" />
              <th className="p-2">Item</th>
              <th className="p-2 hidden sm:table-cell">Location</th>
              <th className="p-2 text-center w-28">Qty</th>
              <th className="p-2 hidden sm:table-cell">Status</th>
              <th className="p-2 text-right w-12 sm:w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              if (!item.id) return null

              const status = getStatus(item)
              const isArchived = Boolean(item.deletedAt)
              const isExpanded = Boolean(expandedIds[item.id])
              const stocks = item.stocks || []
              const canExpand = stocks.length > 1

              const isLowStock =
                item.isLowStock ??
                (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold)

              const primaryLocationId = item.locationId || stocks[0]?.locationId
              const locationDisplay =
                stocks.length > 1
                  ? 'Multiple Locations'
                  : primaryLocationId
                    ? locationsMap[primaryLocationId] || `Loc #${primaryLocationId}`
                    : '-'

              return (
                <Fragment key={item.id}>
                  {/* Main Row */}
                  <tr
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isArchived ? 'opacity-75 bg-gray-50/50' : ''
                    } ${isExpanded ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Desktop Expand Toggle */}
                    <td className="p-2 text-center hidden sm:table-cell">
                      {canExpand && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id!)}
                          className="text-gray-500 hover:text-gray-800 p-1 rounded focus:outline-none text-xs"
                          title={isExpanded ? 'Collapse batches' : 'Expand batches'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                    </td>

                    {/* Desktop Lock Icon */}
                    <td className="p-2 text-center hidden sm:table-cell">
                      {item.userId !== null && item.userId !== undefined && (
                        <span className="inline-block text-xs" title="Personal Item">
                          🔒
                        </span>
                      )}
                    </td>

                    {/* Item Title & Mobile Metadata */}
                    <td className="p-2 font-medium text-gray-900">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Mobile Expand Toggle */}
                        {canExpand && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id!)}
                            className="text-gray-500 hover:text-gray-800 sm:hidden pr-1 focus:outline-none text-xs"
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        )}

                        {/* Mobile Lock Icon */}
                        {item.userId !== null && item.userId !== undefined && (
                          <span className="inline-block text-xs sm:hidden" title="Personal Item">
                            🔒
                          </span>
                        )}

                        <span
                          className="cursor-pointer hover:underline text-blue-600 font-semibold truncate block max-w-[150px] xs:max-w-[200px] sm:max-w-none"
                          onClick={() => onSelectItem(item)}
                          title={item.label || '-'}
                        >
                          {item.label || '-'}
                        </span>
                      </div>

                      {/* Mobile Row Sub-Content: Location + Status Badge */}
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded font-semibold ${status.color} text-[10px]`}
                        >
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400 truncate">{locationDisplay}</span>
                      </div>
                    </td>

                    {/* Desktop Location */}
                    <td className="p-2 hidden sm:table-cell text-gray-600">{locationDisplay}</td>

                    {/* Inline Quantity Controls */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={isArchived}
                          className="px-1.5 py-1 border rounded bg-gray-50 hover:bg-gray-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() =>
                            onUpdateQuantity(item.id!, Math.max(0, (item.quantity || 0) - 1))
                          }
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          className={`min-w-5 text-center font-bold text-xs sm:text-sm ${
                            isLowStock ? 'text-red-600' : 'text-gray-800'
                          }`}
                        >
                          {item.quantity ?? 0}
                        </span>
                        <button
                          type="button"
                          disabled={isArchived}
                          className="px-1.5 py-1 border rounded bg-gray-50 hover:bg-gray-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => onUpdateQuantity(item.id!, (item.quantity || 0) + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Desktop Status Badge */}
                    <td className="p-2 hidden sm:table-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-semibold ${status.color} text-xs`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isArchived ? (
                          <button
                            type="button"
                            className="text-xs text-green-700 font-medium hover:underline cursor-pointer"
                            onClick={() => handleRestore(item)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Delete Item"
                            className="p-1 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Mobile-Friendly Sub-Table Breakdown */}
                  {canExpand && isExpanded && (
                    <tr className="bg-slate-50/80 border-b">
                      <td colSpan={7} className="p-2 sm:p-3 sm:pl-10">
                        <div className="bg-white border rounded shadow-inner overflow-hidden">
                          <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 border-b flex justify-between items-center">
                            <span>Batches ({stocks.length})</span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[320px]">
                              <thead className="bg-gray-50/50 text-gray-500 border-b">
                                <tr>
                                  <th className="p-1.5 sm:p-2">Batch</th>
                                  <th className="p-1.5 sm:p-2">Location</th>
                                  <th className="p-1.5 sm:p-2 text-center">Qty</th>
                                  <th className="p-1.5 sm:p-2">Expiry</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {stocks.map((stock) => {
                                  const locName = stock.location?.label
                                    ? stock.location.label
                                    : stock.locationId
                                      ? locationsMap[stock.locationId] || `Loc #${stock.locationId}`
                                      : 'Unassigned'

                                  const expDate = stock.expirationDate
                                    ? new Date(stock.expirationDate).toLocaleDateString()
                                    : 'N/A'

                                  return (
                                    <tr key={stock.id} className="hover:bg-blue-50/30">
                                      <td className="p-1.5 sm:p-2 font-mono text-gray-600">
                                        #{stock.id}
                                      </td>
                                      <td className="p-1.5 sm:p-2 text-gray-800 font-medium truncate max-w-[100px]">
                                        {locName}
                                      </td>
                                      <td className="p-1.5 sm:p-2 text-center font-bold text-gray-700">
                                        {stock.quantity}
                                      </td>
                                      <td className="p-1.5 sm:p-2 text-gray-600">{expDate}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={items.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  )
}
