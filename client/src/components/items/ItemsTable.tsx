import { useState, Fragment } from 'react'

import { type Item } from '../../types'
import { Pagination } from '..'

interface ItemsTableProps {
  items: Item[]
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  locationsMap?: Record<number, string> // Maps locationId to location name e.g. { 1: "Pantry" }
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

  if (item.isLowStock) {
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
  onRestore,
}: ItemsTableProps) {
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

  return (
    <>
      <div className="w-full overflow-x-auto border rounded bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-700">
            <tr>
              <th className="p-2 w-8 text-center" />
              <th className="p-2">Item</th>
              <th className="p-2 hidden sm:table-cell">Location</th>
              <th className="p-2 text-center hidden md:table-cell">Batches</th>
              <th className="p-2 text-center">Total Qty</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              if (!item.id) return null

              const status = getStatus(item)
              const isArchived = Boolean(item.deletedAt)
              const isExpanded = Boolean(expandedIds[item.id])
              const stocks = item.stocks || []
              const canExpand = stocks.length > 1 // Only enable expandable view if > 1 batch

              const isLowStock =
                item.isLowStock ??
                (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold)

              // Resolve location name
              const primaryLocationId = item.locationId || stocks[0]?.locationId
              const locationDisplay =
                stocks.length > 1
                  ? 'Multiple Locations'
                  : primaryLocationId
                    ? locationsMap[primaryLocationId] || `Loc #${primaryLocationId}`
                    : '-'

              return (
                <Fragment key={item.id}>
                  {/* Main Item Row */}
                  <tr
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isArchived ? 'opacity-75 bg-gray-50/50' : ''
                    } ${isExpanded ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Expand Toggle Column (Only for > 1 batch) */}
                    <td className="p-2 text-center">
                      {canExpand ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id!)}
                          className="text-gray-500 hover:text-gray-800 p-1 rounded focus:outline-none text-xs"
                          title={isExpanded ? 'Collapse batches' : 'Expand batches'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      ) : null}
                    </td>

                    {/* Item Label & Personal Badge */}
                    <td className="p-2 font-medium text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="cursor-pointer hover:underline text-blue-600 font-semibold"
                          onClick={() => onSelectItem(item)}
                        >
                          {item.label || 'Unnamed Item'}
                        </span>
                        {item.userId !== null && item.userId !== undefined && (
                          <span
                            className="px-1.5 py-0.2 text-[10px] bg-purple-50 text-purple-700 rounded border border-purple-200"
                            title="Personal Item"
                          >
                            Personal
                          </span>
                        )}
                      </div>

                      {/* Mobile Fallback: Location */}
                      <span className="text-xs text-gray-500 sm:hidden block mt-0.5">
                        {locationDisplay}
                      </span>
                    </td>

                    {/* Location (Tablet / Desktop) */}
                    <td className="p-2 hidden sm:table-cell text-gray-600">{locationDisplay}</td>

                    {/* Dedicated Batches Count Column */}
                    <td className="p-2 text-center hidden md:table-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          stocks.length > 1
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {stocks.length}
                      </span>
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

                    {/* Actions Column */}
                    {isArchived && onRestore ? (
                      <td className="p-2 text-right space-x-2">
                        <button
                          type="button"
                          className="text-xs text-green-700 font-medium hover:underline"
                          onClick={() => onRestore(item.id!)}
                        >
                          Restore
                        </button>
                      </td>
                    ) : null}
                  </tr>

                  {/* Sub-Table View (Only renders if canExpand === true and isExpanded === true) */}
                  {canExpand && isExpanded && (
                    <tr className="bg-slate-50/80 border-b">
                      <td colSpan={7} className="p-3 pl-10">
                        <div className="bg-white border rounded shadow-inner overflow-hidden">
                          <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 border-b flex justify-between items-center">
                            <span>Stock Batches Breakdown</span>
                            <span className="text-xs font-normal text-gray-500">
                              Total Batches: {stocks.length}
                            </span>
                          </div>

                          <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/50 text-gray-500 border-b">
                              <tr>
                                <th className="p-2">Batch ID</th>
                                <th className="p-2">Location</th>
                                <th className="p-2 text-center">Quantity</th>
                                <th className="p-2">Expiration Date</th>
                                <th className="p-2">Opened Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {stocks.map((stock) => {
                                const locName = stock.location?.label
                                  ? stock.location.label
                                  : stock.locationId
                                    ? locationsMap[stock.locationId] ||
                                      `Location #${stock.locationId}`
                                    : 'Unassigned'

                                const expDate = stock.expirationDate
                                  ? new Date(stock.expirationDate).toLocaleDateString()
                                  : 'N/A'

                                const openedDate = stock.openedOn
                                  ? new Date(stock.openedOn).toLocaleDateString()
                                  : 'Unopened'

                                return (
                                  <tr key={stock.id} className="hover:bg-blue-50/30">
                                    <td className="p-2 font-mono text-gray-600">#{stock.id}</td>
                                    <td className="p-2 text-gray-800 font-medium">{locName}</td>
                                    <td className="p-2 text-center font-bold text-gray-700">
                                      {stock.quantity}
                                    </td>
                                    <td className="p-2 text-gray-600">{expDate}</td>
                                    <td className="p-2 text-gray-600">{openedDate}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
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

      {/* Pagination Footer */}
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
