import { Camera, ScanLine } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'

interface BarcodeFieldProps {
  value: string
  showScanner: boolean
  onChange: (value: string) => void
  onToggleScanner: () => void
  onScanSuccess: (code: string) => void
}

export default function BarcodeField({
  value,
  showScanner,
  onChange,
  onToggleScanner,
  onScanSuccess,
}: BarcodeFieldProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <ScanLine className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Barcode (optional)"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onToggleScanner}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-slate-500" />
          <span>{showScanner ? 'Close Camera' : 'Scan'}</span>
        </button>
      </div>

      {showScanner && (
        <div className="relative pt-2 mt-2 border-t border-slate-200 overflow-hidden rounded-lg">
          <div className="rounded-lg overflow-hidden border border-slate-300 shadow-inner">
            <BarcodeScanner onScanSuccess={onScanSuccess} />
          </div>
        </div>
      )}
    </div>
  )
}
