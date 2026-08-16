import { useMemo } from 'react'
import { AlertTriangle, Barcode, Clock, Layers, Lock, MapPin, User } from 'lucide-react'

import { Modal } from '../../components'
import type { Item, ItemStock } from '../../types/item'

interface ItemDetailsModalProps {
  item: Item | null
  isOpen: boolean
  locationsMap?: Record<number, string>
  onClose: () => void
}

export default function ItemDetailsModal({
  item,
  isOpen,
  locationsMap = {},
  onClose,
}: ItemDetailsModalProps) {
  if (!item) return null

  // Determine effective location name (fallback chain)
  const locationName = useMemo(() => {
    if (item.locationId && locationsMap[item.locationId]) {
      return locationsMap[item.locationId]
    }
    if (item.location?.label) {
      return item.location.label
    }
    return 'Unassigned'
  }, [item, locationsMap])

  // Helpers for date formatting
  const formatDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return 'N/A'
    return new Date(dateVal).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Active status badge logic
  const isExpired = item.isExpired
  const isOpenedExpired = item.isOpenedExpired
  const isLowStock =
    item.isLowStock || (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold)

  return (
    <Modal isOpen={isOpen} title="Item Details" onClose={onClose}>
      <div className="space-y-4 text-xs text-slate-700">
        {/* HEADER BADGES & ITEM NAME */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{item.label}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: #{item.id}</p>
            </div>

            {/* TOTAL QUANTITY BADGE */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total Qty
              </span>
              <span className="text-lg font-black text-slate-900">{item.quantity}</span>
            </div>
          </div>

          {/* DYNAMIC ALERT BADGES */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {item.userId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}

            {isLowStock && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Low Stock
              </span>
            )}

            {isExpired && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                <Clock className="w-3 h-3 text-red-500" />
                Expired
              </span>
            )}

            {isOpenedExpired && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                <Clock className="w-3 h-3 text-orange-500" />
                Use Within Reached
              </span>
            )}
          </div>
        </div>

        {/* PRIMARY INFO GRID */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* LOCATION */}
          <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Location
            </span>
            <p className="font-semibold text-slate-900 truncate">{locationName}</p>
          </div>

          {/* BARCODE */}
          <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1 text-xs">
              <Barcode className="w-3.5 h-3.5 text-slate-400" />
              Barcode
            </span>
            <p className="font-mono font-semibold text-slate-900 truncate">
              {item.barcode || 'N/A'}
            </p>
          </div>

          {/* LOW STOCK ALERT THRESHOLD */}
          <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              Low Stock Alert
            </span>
            <p className="font-semibold text-slate-900">
              {item.lowStockThreshold != null ? item.lowStockThreshold : 'None'}
            </p>
          </div>

          {/* OWNERSHIP */}
          <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Access Level
            </span>
            <p className="font-semibold text-slate-900">
              {item.userId ? 'Private' : 'Shared (Household)'}
            </p>
          </div>
        </div>

        {/* SHELF LIFE & DATES SECTION */}
        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold border-b border-slate-200/80 pb-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Shelf Life & Timeline</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Expiration Date</span>
              <span className="font-medium text-slate-800">{formatDate(item.expirationDate)}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Opened On</span>
              <span className="font-medium text-slate-800">{formatDate(item.openedOn)}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Use Within</span>
              <span className="font-medium text-slate-800">
                {item.useWithinDays ? `${item.useWithinDays} Days` : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Added On</span>
              <span className="font-medium text-slate-800">{formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* NESTED INVENTORY BATCHES (IF APPLICABLE) */}
        {item.stocks && item.stocks.length > 1 && (
          <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Stock Batches
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {item.stocks.length} batch(es)
              </span>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {item.stocks.map((stock: ItemStock, idx: number) => (
                <div
                  key={stock.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-800 block">
                      Batch #{stock.id || idx + 1}
                    </span>
                    {stock.expirationDate && (
                      <span className="text-[10px] text-slate-400">
                        Exp: {formatDate(stock.expirationDate)}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                    Qty: {stock.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER ACTION */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
