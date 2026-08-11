import React, { useEffect, useState } from 'react'

import { BarcodeScanner, Modal } from '..'
import type { Location, Item } from '../../types'
import { useCreateItem } from '../../hooks'

interface ItemFormModalProps {
  isOpen: boolean
  locations: Location[]
  initialBarcode?: string
  currentUserId?: number | null // Passed to support setting item ownership
  onClose: () => void
  onItemAdded: (newItem: Item) => void
}

type FormState = {
  label: string
  quantity: number
  barcode: string
  locationId: number | null
  expirationDate: string
  openedOn: string
  useWithinDays: string
  lowStockThreshold: string
  isPersonal: boolean // Toggle for Personal vs Shared item
}

const INITIAL_FORM: FormState = {
  label: '',
  quantity: 1,
  barcode: '',
  locationId: null,
  expirationDate: '',
  openedOn: '',
  useWithinDays: '',
  lowStockThreshold: '1',
  isPersonal: false,
}

export default function ItemFormModal({
  isOpen,
  locations,
  initialBarcode = '',
  currentUserId = null,
  onClose,
  onItemAdded,
}: ItemFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isScannerActive, setIsScannerActive] = useState<boolean>(true)

  const { mutate: createItem, isPending } = useCreateItem()

  // Reset & sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        ...INITIAL_FORM,
        barcode: initialBarcode || '',
      })
      setError(null)
      setIsScannerActive(true)
    }
  }, [isOpen, initialBarcode])

  const handleChange = (field: keyof FormState, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleScanSuccess = (scannedCode: string) => {
    handleChange('barcode', scannedCode)
    setIsScannerActive(false)
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.label.trim()) {
      setError('Item name is required.')
      return
    }

    setError(null)

    const payload = {
      label: form.label.trim(),
      quantity: Number(form.quantity) || 0,
      barcode: form.barcode.trim() || null,
      locationId: form.locationId ? Number(form.locationId) : null,
      expirationDate: form.expirationDate ? new Date(form.expirationDate) : null,
      openedOn: form.openedOn ? new Date(form.openedOn) : null,
      useWithinDays: form.useWithinDays ? Number(form.useWithinDays) : null,
      lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : null,
      userId: form.isPersonal && currentUserId ? currentUserId : null,
    }

    createItem(payload, {
      onSuccess: (newItem) => {
        onItemAdded?.(newItem)
        setForm(INITIAL_FORM)
        onClose()
      },
      onError: (err) => {
        console.error('Failed to create item:', err)
        setError(err.message || 'Failed to save item. Please try again.')
      },
    })
  }

  return (
    <Modal isOpen={isOpen} title="Add New Item" onClose={onClose}>
      {/* Error Alert */}
      {error && (
        <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      {/* Barcode Scanner Section */}
      <div className="space-y-2 bg-gray-50 p-2.5 rounded border mb-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
          <input
            type="checkbox"
            checked={isScannerActive}
            onChange={(e) => setIsScannerActive(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <span>📷 Scan Barcode via Camera</span>
        </label>

        {isScannerActive && (
          <div className="pt-1">
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanFailure={() => console.error('Failed to scan barcode')}
            />
            <p className="text-[11px] text-gray-500 text-center mt-1">
              Aim camera at barcode to auto-fill input below
            </p>
          </div>
        )}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {/* Barcode Field */}
        <label className="block text-xs font-medium text-gray-700">
          Barcode <span className="text-gray-400 font-normal">(Optional)</span>
          <input
            type="text"
            placeholder="Scan above or type manually..."
            className="mt-1 w-full p-2 border rounded text-sm bg-gray-50 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.barcode}
            onChange={(e) => handleChange('barcode', e.target.value)}
          />
        </label>

        {/* Item Name */}
        <label className="block text-xs font-medium text-gray-700">
          Item Name <span className="text-red-500">*</span>
          <input
            type="text"
            required
            placeholder="e.g., Whole Milk 2%"
            className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </label>

        {/* Quantity & Low Stock Threshold */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-gray-700">
            Quantity
            <input
              type="number"
              min="0"
              className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', Number(e.target.value))}
            />
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Low Stock Alert Below
            <input
              type="number"
              min="0"
              placeholder="1"
              className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
            />
          </label>
        </div>

        {/* Location Dropdown */}
        <label className="block text-xs font-medium text-gray-700">
          Location
          <select
            className="mt-1 w-full p-2 border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.locationId ?? ''}
            onChange={(e) =>
              handleChange('locationId', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">No Location Assigned</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </label>

        {/* Ownership Toggle */}
        {currentUserId && (
          <div className="p-2.5 bg-gray-50 border rounded flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-800">Private Item</div>
              <div className="text-[11px] text-gray-500">
                {form.isPersonal ? 'Visible only to you' : 'Shared with entire household'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPersonal}
                onChange={(e) => handleChange('isPersonal', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        )}

        {/* Expiration Date */}
        <label className="block text-xs font-medium text-gray-700">
          Expiration Date
          <input
            type="date"
            className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.expirationDate}
            onChange={(e) => handleChange('expirationDate', e.target.value)}
          />
        </label>

        {/* Opened On & Use Within Days */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <label className="block text-xs font-medium text-gray-700">
            Opened On Date
            <input
              type="date"
              className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.openedOn}
              onChange={(e) => handleChange('openedOn', e.target.value)}
            />
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Use Within (Days)
            <input
              type="number"
              min="1"
              placeholder="e.g., 7"
              className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.useWithinDays}
              onChange={(e) => handleChange('useWithinDays', e.target.value)}
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 border rounded text-gray-600 text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-sm disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
