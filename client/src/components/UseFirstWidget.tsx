import { Clock } from 'lucide-react'

export interface UseFirstItem {
  id: number
  itemLabel: string
  locationLabel: string
  quantity: number
  daysRemaining: number
}

interface UseFirstWidgetProps {
  items: UseFirstItem[]
}

export default function UseFirstWidget({ items }: UseFirstWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Use First (Opened)</h2>
          <p className="text-xs text-slate-500">Items open & ticking down</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No opened items active.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-medium text-slate-900 truncate">{item.itemLabel}</p>
                <p className="text-xs text-slate-400 truncate">
                  {item.locationLabel} • Qty: {item.quantity}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  item.daysRemaining <= 0
                    ? 'bg-red-100 text-red-700'
                    : item.daysRemaining <= 2
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.daysRemaining <= 0
                  ? 'Expired!'
                  : item.daysRemaining === 1
                    ? '1 day left'
                    : `${item.daysRemaining} days left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
