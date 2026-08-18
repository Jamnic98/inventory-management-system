import { Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface ShelfLifeSectionProps {
  showShelfLife: boolean
  expirationDate: string
  openedOn: string
  useWithinDays: string
  onToggleShow: () => void
  onChange: (field: 'expirationDate' | 'openedOn' | 'useWithinDays', value: string) => void
}

export default function ShelfLifeSection({
  showShelfLife,
  expirationDate,
  openedOn,
  useWithinDays,
  onToggleShow,
  onChange,
}: ShelfLifeSectionProps) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onToggleShow}
        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-colors text-slate-700 font-medium cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Shelf Life & Expiration
        </span>
        {showShelfLife ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {showShelfLife && (
        <div className="space-y-3 p-3 mt-2 bg-slate-50/50 rounded-xl border border-slate-100">
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Expiration Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={expirationDate}
              onChange={(e) => onChange('expirationDate', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Opened On</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={openedOn}
                onChange={(e) => onChange('openedOn', e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Use Within (Days)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g., 7"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={useWithinDays}
                onChange={(e) => onChange('useWithinDays', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
