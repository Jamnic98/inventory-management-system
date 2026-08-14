import React, { useEffect } from 'react'

export interface ModalProps {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClass?: string
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  maxWidthClass = 'sm:max-w-md',
}: ModalProps) {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center sm:items-center items-end z-50 p-0 sm:p-4"
      onClick={onClose} // Backdrop click to close
    >
      <div
        className={`w-full ${maxWidthClass} bg-white rounded-t-xl sm:rounded-xl p-4 flex flex-col max-h-[85vh] sm:max-h-[90vh] shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing backdrop
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3 shrink-0">
          {title ? <h2 className="font-bold text-lg text-gray-900">{title}</h2> : <div />}
          <button
            type="button"
            className="text-gray-400 hover:text-black text-sm font-semibold p-1 transition-colors rounded-lg"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body - flex-1 min-h-0 allows nested children to flex scroll properly */}
        <div className="flex-1 min-h-0 flex flex-col overflow-auto">{children}</div>
      </div>
    </div>
  )
}
