import { useState } from 'react'
import { AlertTriangle, PackageX, ShoppingCart, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SendRestockEmailModal } from '../components'

export interface RestockItem {
  id: number
  label: string
  currentQty: number
  threshold: number
  isOutOfStock: boolean
}

interface LowStockWidgetProps {
  items: RestockItem[]
  currentUserId?: number
}

export default function LowStockWidget({ items, currentUserId }: LowStockWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Restock Needed</h2>
              <p className="text-xs text-slate-500">Low or out of stock items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  <Mail className="h-3 w-3" /> Email List
                </button>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {items.length}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              All stock levels are currently healthy.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {item.isOutOfStock ? (
                    <PackageX className="h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <span className="font-semibold text-slate-800 truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-md px-2 py-0.5 font-bold text-[11px] ${
                      item.isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.isOutOfStock ? 'Out of stock' : `${item.currentQty} left`}
                  </span>
                  <span className="text-[10px] text-slate-400">(Min: {item.threshold})</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <Link
            to="/items"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Manage Items &rarr;
          </Link>
        </div>
      </div>

      <SendRestockEmailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={currentUserId}
      />
    </>
  )
}
