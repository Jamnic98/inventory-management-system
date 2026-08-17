import { ArrowRightLeft, Minus, PackageOpen, Plus, Trash2 } from 'lucide-react'

import { Item, ItemStock } from '../../types'

interface ItemsSubTableProps {
  item: Item
  stocks: ItemStock[]
  isArchived: boolean
  locationsMap: Record<number, string>
  onUpdateQuantity: (id: number, newQuantity: number) => void
  onUpdateBatchQuantity?: (stockId: number, newQuantity: number) => void
  onOpenBatchUnit: (stockId: number) => void
  onTransferBatch: (stock: ItemStock, parentItem: Item) => void
  onDeleteBatch?: (stock: ItemStock) => void
}

export default function ItemsSubTable({
  item,
  stocks,
  isArchived,
  locationsMap,
  onUpdateQuantity,
  onUpdateBatchQuantity,
  onOpenBatchUnit,
  onTransferBatch,
  onDeleteBatch,
}: ItemsSubTableProps) {
  return (
    <tr className="bg-slate-50/80 border-b">
      <td colSpan={7} className="p-2 sm:p-3 sm:pl-10">
        <div className="bg-white border rounded-md shadow-xs overflow-hidden">
          {/* Header */}
          <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 border-b flex justify-between items-center">
            <span>Physical Stock Batches ({stocks.length})</span>
            <span className="text-[11px] text-gray-400 font-normal hidden sm:inline">
              Manage specific locations, open states &amp; transfers
            </span>
          </div>

          {/* MOBILE VIEW (< sm): Touch-friendly stacked cards */}
          <div className="block sm:hidden divide-y divide-gray-200">
            {stocks.map((stock) => {
              const locName = stock.location?.label
                ? stock.location.label
                : stock.locationId
                  ? locationsMap[stock.locationId] || `Loc #${stock.locationId}`
                  : 'Unassigned'

              const isOpened = Boolean(stock.openedOn)
              const expDate = stock.expirationDate
                ? new Date(stock.expirationDate).toLocaleDateString()
                : 'N/A'

              return (
                <div key={stock.id} className="p-3 space-y-2.5 bg-white">
                  {/* Row 1: Location & State Badge */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-gray-800 text-xs truncate">
                      📍 {locName}
                    </span>

                    {isOpened ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium inline-flex items-center gap-1 text-[10px]">
                        <PackageOpen className="w-3 h-3" />
                        Opened ({new Date(stock.openedOn!).toLocaleDateString()})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium text-[10px]">
                        🟢 New
                      </span>
                    )}
                  </div>

                  {/* Row 2: Expiry Date & Quantity Controls */}
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50">
                    <div className="text-gray-500 text-[11px]">
                      Expires: <span className="text-gray-700 font-medium">{expDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded border">
                      <button
                        type="button"
                        disabled={isArchived}
                        className="p-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-40 active:scale-95 transition-transform"
                        onClick={() =>
                          onUpdateBatchQuantity
                            ? onUpdateBatchQuantity(stock.id, stock.quantity - 1)
                            : onUpdateQuantity(item.id!, Math.max(0, (item.quantity || 0) - 1))
                        }
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-gray-800 min-w-5 text-center text-xs">
                        {stock.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isArchived}
                        className="p-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-40 active:scale-95 transition-transform"
                        onClick={() =>
                          onUpdateBatchQuantity
                            ? onUpdateBatchQuantity(stock.id, stock.quantity + 1)
                            : onUpdateQuantity(item.id!, (item.quantity || 0) + 1)
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!isOpened && onOpenBatchUnit && (
                      <button
                        type="button"
                        onClick={() => onOpenBatchUnit(stock.id)}
                        className="flex-1 py-1.5 px-2 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors text-center"
                      >
                        Open 1 Unit
                      </button>
                    )}

                    {onTransferBatch && (
                      <button
                        type="button"
                        onClick={() => onTransferBatch(stock, item)}
                        className="py-1.5 px-3 text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-gray-500" />
                        <span>Transfer</span>
                      </button>
                    )}

                    {onDeleteBatch && (
                      <button
                        type="button"
                        disabled={isArchived}
                        onClick={() => onDeleteBatch(stock)}
                        className="py-1.5 px-2 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-40 transition-colors flex items-center justify-center"
                        title="Delete batch"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP VIEW (≥ sm): Standard Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left min-w-125">
              <thead className="bg-gray-50/70 text-gray-500 border-b">
                <tr>
                  <th className="p-2">Location</th>
                  <th className="p-2">State</th>
                  <th className="p-2">Expiry Date</th>
                  <th className="p-2 text-center w-24">Batch Qty</th>
                  <th className="p-2 text-right pr-3">Batch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stocks.map((stock) => {
                  const locName = stock.location?.label
                    ? stock.location.label
                    : stock.locationId
                      ? locationsMap[stock.locationId] || `Loc #${stock.locationId}`
                      : 'Unassigned'

                  const isOpened = Boolean(stock.openedOn)
                  const expDate = stock.expirationDate
                    ? new Date(stock.expirationDate).toLocaleDateString()
                    : 'N/A'

                  return (
                    <tr key={stock.id} className="hover:bg-blue-50/30">
                      {/* Location */}
                      <td className="p-2 text-gray-800 font-semibold truncate max-w-30">
                        {locName}
                      </td>

                      {/* State Badge */}
                      <td className="p-2">
                        {isOpened ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium inline-flex items-center gap-1 text-[11px]">
                            <PackageOpen className="w-3 h-3" />
                            Opened ({new Date(stock.openedOn!).toLocaleDateString()})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium text-[11px]">
                            🟢 New
                          </span>
                        )}
                      </td>

                      {/* Expiration Date */}
                      <td className="p-2 text-gray-600">{expDate}</td>

                      {/* Batch Quantity Controls */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={isArchived}
                            className="px-1 py-0.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-40"
                            onClick={() =>
                              onUpdateBatchQuantity
                                ? onUpdateBatchQuantity(stock.id, stock.quantity - 1)
                                : onUpdateQuantity(item.id!, Math.max(0, (item.quantity || 0) - 1))
                            }
                          >
                            <Minus size={10} />
                          </button>
                          <span className="font-bold text-gray-800 min-w-4 text-center">
                            {stock.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isArchived}
                            className="px-1 py-0.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-40"
                            onClick={() =>
                              onUpdateBatchQuantity
                                ? onUpdateBatchQuantity(stock.id, stock.quantity + 1)
                                : onUpdateQuantity(item.id!, (item.quantity || 0) + 1)
                            }
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </td>

                      {/* Batch Specific Actions */}
                      <td className="p-2 text-right pr-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isOpened && onOpenBatchUnit && (
                            <button
                              type="button"
                              onClick={() => onOpenBatchUnit(stock.id)}
                              className="px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                            >
                              Open 1
                            </button>
                          )}

                          {onTransferBatch && (
                            <button
                              type="button"
                              onClick={() => onTransferBatch(stock, item)}
                              className="p-1 text-gray-600 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                              title="Transfer from this batch"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteBatch && (
                            <button
                              type="button"
                              disabled={isArchived}
                              onClick={() => onDeleteBatch(stock)}
                              className="p-1 text-red-600 border border-red-200 bg-red-50/50 rounded hover:bg-red-100 hover:border-red-300 disabled:opacity-40 transition-colors"
                              title="Delete batch"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  )
}
