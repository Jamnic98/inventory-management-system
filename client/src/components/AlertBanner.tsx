import React from 'react'
import { AlertTriangle, CheckCircle2, Info, RotateCcw, XCircle, X } from 'lucide-react'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

interface AlertBannerProps {
  type?: AlertType
  title?: string
  message: React.ReactNode
  /** Optional Undo callback. Renders an "Undo" action button if provided. */
  onUndo?: () => void
  undoLabel?: string
  /** Optional dismiss callback. Renders an 'X' button if provided. */
  onDismiss?: () => void
  className?: string
}

const variantStyles: Record<
  AlertType,
  {
    container: string
    icon: React.ReactNode
    undoBtn: string
  }
> = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
    undoBtn: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 focus:ring-blue-400',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    undoBtn:
      'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 focus:ring-emerald-400',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    undoBtn: 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 focus:ring-amber-400',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    undoBtn: 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 focus:ring-rose-400',
  },
}

export default function AlertBanner({
  type = 'info',
  title,
  message,
  onUndo,
  undoLabel = 'Undo',
  onDismiss,
  className = '',
}: AlertBannerProps) {
  const config = variantStyles[type]

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 p-3.5 border rounded-xl text-xs transition-all shadow-2xs ${config.container} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {config.icon}
        <div className="space-y-0.5">
          {title && <h4 className="font-semibold leading-tight">{title}</h4>}
          <div className="text-[11px] leading-relaxed opacity-90">{message}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* UNDO BUTTON */}
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all shadow-2xs focus:outline-none focus:ring-2 ${config.undoBtn}`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{undoLabel}</span>
          </button>
        )}

        {/* DISMISS BUTTON */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
