import React, { useState, useEffect } from 'react'

import { Modal } from '../../components'
import type { LocationOption, Item } from '../../types'

export interface ItemTransferModalProps {
  isOpen: boolean
  item: Item | null
  locations: LocationOption[]
  onClose: () => void
  onTransfer: (itemId: number, targetLocationId: number, quantity: number) => Promise<void> | void
}

export default function ItemTransferModal({
  isOpen,
  item,
  locations,
  onClose,
  onTransfer,
}: ItemTransferModalProps) {
  const [targetLocationId, setTargetLocationId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form inputs whenever a new item is selected or modal opens
  useEffect(() => {
    if (isOpen && item) {
      setTargetLocationId('')
      setQuantity(1)
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, item])

  if (!item) return null

  // Exclude current location from target choices
  const availableLocations = locations.filter((loc) => loc.id !== item.locationId)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError(null)

    if (!targetLocationId) {
      setError('Please select a destination location.')
      return
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
      setError(`Quantity must be between 1 and ${item.quantity}.`)
      return
    }

    try {
      setIsSubmitting(true)
      await onTransfer(item.id!, Number(targetLocationId), qty)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to transfer item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} title={`Transfer ${item.label || 'Item'}`} onClose={onClose}>
      <p className="text-xs text-gray-500 -mt-2">
        Available stock in current location:{' '}
        <span className="font-semibold text-gray-800">{item.quantity}</span>
      </p>

      {error && (
        <div className="rounded bg-red-50 p-2 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Destination Location
          </label>
          <select
            value={targetLocationId}
            onChange={(e) => setTargetLocationId(Number(e.target.value) || '')}
            className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
            required
            disabled={isSubmitting}
          >
            <option value="">Select destination...</option>
            {availableLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transfer Quantity */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity to Move</label>
          <input
            type="number"
            min={1}
            max={item.quantity}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || availableLocations.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
