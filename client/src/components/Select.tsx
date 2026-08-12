import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption<T = string | number> {
  value: T
  label: string
  badge?: string
  disabled?: boolean
}

interface SelectProps<T = string | number> {
  options: SelectOption<T>[]
  value: T | null | undefined
  onChange: (value: T) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  direction?: 'down' | 'up'
  className?: string
}

export default function Select<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  direction = 'down',
  className = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed min-w-0"
      >
        <span className="truncate text-left flex-1 min-w-0 pr-2">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-xs shrink-0 text-slate-500">{selectedOption.badge}</span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 max-h-52 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none ${
            direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors min-w-0 ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : 'hover:bg-slate-100 cursor-pointer'
                  } ${isSelected ? 'bg-blue-50/70 font-medium text-blue-700' : 'text-slate-700'}`}
                >
                  <span className="truncate flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-xs shrink-0 text-slate-400">{opt.badge}</span>
                    )}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
