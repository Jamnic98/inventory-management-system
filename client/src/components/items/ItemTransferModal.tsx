import React, { useState, useEffect } from 'react'

import { Modal, Select } from '../../components'
import type { LocationOption, Item, ItemStock } from '../../types'
import { useAlert } from '../../hooks'

export interface ItemTransferModalProps {
  isOpen: boolean
  item?: Item | null
  stock?: ItemStock | null
  locations: LocationOption[]
  isLoading?: boolean
  onClose: () => void
  onTransfer: (targetLocationId: number, quantity: number) => Promise<void> | void
}

export default function ItemTransferModal({
  isOpen,
  item,
  stock,
  locations,
  isLoading = false,
  onClose,
  onTransfer,
}: ItemTransferModalProps) {
  const { error } = useAlert()
  const [targetLocationId, setTargetLocationId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form inputs whenever modal opens or stock batch changes
  useEffect(() => {
    if (isOpen && stock) {
      setTargetLocationId('')
      setQuantity(1)
      setIsSubmitting(false)
    }
  }, [isOpen, stock])

  if (!item || !stock) return null

  // Exclude current batch location from destination choices
  const availableLocations = locations.filter((loc) => loc.id !== stock.locationId)

  const isPending = isSubmitting || isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetLocationId) {
      error('Please select a destination location.')
      return
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0 || qty > stock.quantity) {
      error(`Quantity must be between 1 and ${stock.quantity}.`)
      return
    }

    try {
      setIsSubmitting(true)
      await onTransfer(Number(targetLocationId), qty)
      onClose()
    } catch (err: any) {
      error(err?.message || 'Failed to transfer stock batch. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} title={`Transfer Batch: ${item.label || 'Item'}`} onClose={onClose}>
      <div className="space-y-1 text-xs text-gray-500">
        <p>
          Available batch quantity:{' '}
          <span className="font-semibold text-gray-800">{stock.quantity}</span>
        </p>
        {stock.expirationDate && (
          <p>
            Expiration:{' '}
            <span className="font-medium text-gray-700">
              {new Date(stock.expirationDate).toLocaleDateString()}
            </span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Destination Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Destination Location
          </label>
          <Select<number | ''>
            options={availableLocations.map((loc) => ({
              value: loc.id,
              label: loc.label,
            }))}
            value={targetLocationId}
            onChange={(val) => setTargetLocationId(val)}
            placeholder="Select destination..."
            disabled={isPending}
          />
        </div>

        {/* Transfer Quantity */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity to Move</label>
          <input
            type="number"
            min={1}
            max={stock.quantity}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            required
            disabled={isPending}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || availableLocations.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors disabled:opacity-50"
          >
            {isPending ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
