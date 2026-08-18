interface QuantityStockFieldsProps {
  quantity: string
  lowStockThreshold: string
  isManuallyLowStock: boolean
  onQuantityChange: (value: string) => void
  onThresholdChange: (value: string) => void
  onManualLowStockChange: (checked: boolean) => void
}

export default function QuantityStockFields({
  quantity,
  lowStockThreshold,
  isManuallyLowStock,
  onQuantityChange,
  onThresholdChange,
  onManualLowStockChange,
}: QuantityStockFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1.5">
            Quantity <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="number"
            min="0"
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1.5">Low Stock Alert Count</label>
          <input
            type="number"
            min="0"
            placeholder="e.g., 2"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            value={lowStockThreshold}
            onChange={(e) => onThresholdChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <input
          type="checkbox"
          id="isManuallyLowStock"
          checked={isManuallyLowStock}
          onChange={(e) => onManualLowStockChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="isManuallyLowStock"
          className="text-xs font-medium text-slate-700 cursor-pointer select-none"
        >
          Mark as Low Stock Manually
        </label>
      </div>
    </div>
  )
}
