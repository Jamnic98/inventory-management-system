import { useState, Fragment } from 'react'
import { Minus, Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react'

import { ItemsSubTable, Pagination } from '..'
import { useAlert, useDeleteItem, useRestoreItem } from '../../hooks'
import { getStatus } from '../../utils/itemHelpers'
import type { Item, ItemStock } from '../../types'

interface ItemsTableProps {
  items: Item[]
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  locationsMap: Record<number, string>
  onUpdateQuantity: (id: number, newQuantity: number) => void
  onSelectItem: (item: Item) => void
  onUpdateBatchQuantity?: (stockId: number, newQuantity: number) => void
  onOpenBatchUnit: (stockId: number) => void
  onTransferBatch: (stock: ItemStock, parentItem: Item) => void
  onRestore?: (id: number) => void
  initialPageSize?: number
}

export default function ItemsTable({
  items,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onUpdateQuantity,
  onSelectItem,
  locationsMap = {},
  onUpdateBatchQuantity,
  onOpenBatchUnit,
  onTransferBatch,
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
              <th className="p-2 w-8 text-center hidden sm:table-cell" />
              <th className="p-2 w-6 text-center hidden sm:table-cell" title="Personal Item" />
              <th className="p-2">Item</th>
              <th className="p-2 hidden sm:table-cell">Location</th>
              <th className="p-2 text-center w-28">Total Qty</th>
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
              // 🚀 Allow expanding whenever 1 or more batches exist
              const canExpand = stocks.length > 0

              const isLowStock =
                item.isLowStock ??
                (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold)

              const primaryLocationId = item.locationId || stocks[0]?.locationId
              const locationDisplay =
                stocks.length > 1
                  ? `${stocks.length} Batches (${stocks
                      .map((s) => locationsMap[s.locationId || 0] || 'Unassigned')
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(', ')})`
                  : primaryLocationId
                    ? locationsMap[primaryLocationId] || `Loc #${primaryLocationId}`
                    : '-'

              return (
                <Fragment key={item.id}>
                  {/* Main Catalog Row */}
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
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
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
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600 inline" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 inline" />
                            )}
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

                      {/* Mobile Sub-Content */}
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

                    {/* Aggregate Inline Quantity Controls */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.stocks.length <= 1 && (
                          <button
                            type="button"
                            disabled={isArchived}
                            className="px-1.5 py-1 border rounded bg-gray-50 hover:bg-gray-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() =>
                              onUpdateQuantity(item.id!, Math.max(0, (item.quantity || 0) - 1))
                            }
                            title="Consume 1 unit (FIFO)"
                          >
                            <Minus size={12} />
                          </button>
                        )}
                        <span
                          className={`min-w-5 text-center font-bold text-xs sm:text-sm ${
                            isLowStock ? 'text-red-600' : 'text-gray-800'
                          }`}
                        >
                          {item.quantity ?? 0}
                        </span>
                        {item.stocks.length <= 1 && (
                          <button
                            type="button"
                            disabled={isArchived}
                            className="px-1.5 py-1 border rounded bg-gray-50 hover:bg-gray-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => onUpdateQuantity(item.id!, (item.quantity || 0) + 1)}
                            title="Add 1 unit"
                          >
                            <Plus size={12} />
                          </button>
                        )}
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

                  {/* 🚀 EXPANDABLE BATCH SUB-TABLE */}
                  {canExpand && isExpanded && (
                    <ItemsSubTable
                      item={item}
                      stocks={stocks}
                      isArchived={isArchived}
                      locationsMap={locationsMap}
                      onUpdateQuantity={onUpdateQuantity}
                      onUpdateBatchQuantity={onUpdateBatchQuantity}
                      onOpenBatchUnit={onOpenBatchUnit}
                      onTransferBatch={onTransferBatch}
                    />
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
