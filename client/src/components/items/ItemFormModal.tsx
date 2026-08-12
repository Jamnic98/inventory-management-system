import React, { useEffect, useMemo, useState } from 'react'
import { Camera, Clock, ChevronDown, ChevronUp, AlertTriangle, Lock, ScanLine } from 'lucide-react'

import { BarcodeScanner, Modal, Select } from '..'
import { useCreateItem } from '../../hooks'
import type { Location, Item } from '../../types'

interface ItemFormModalProps {
  isOpen: boolean
  locations: Location[]
  initialBarcode?: string
  currentUserId?: number | null
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
  isPersonal: boolean
}

const INITIAL_FORM: FormState = {
  label: '',
  quantity: 1,
  barcode: '',
  locationId: null,
  expirationDate: '',
  openedOn: '',
  useWithinDays: '',
  lowStockThreshold: '',
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
  const [showScanner, setShowScanner] = useState<boolean>(true)
  const [showShelfLife, setShowShelfLife] = useState<boolean>(false)

  const { mutate: createItem, isPending } = useCreateItem()

  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc.id,
      label: loc.label,
      badge: loc.userId ? '🔒 (Private)' : undefined,
    }))
  }, [locations])

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...INITIAL_FORM,
        barcode: initialBarcode || '',
      })
      setError(null)
      setShowScanner(true)
      setShowShelfLife(false)
    }
  }, [isOpen, initialBarcode])

  const handleChange = (field: keyof FormState, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleScanSuccess = (scannedCode: string) => {
    handleChange('barcode', scannedCode)
    setShowScanner(false)
  }

  // Auto-toggle privacy based on chosen location's ownership
  const handleLocationChange = (selectedLocId: number | null) => {
    handleChange('locationId', selectedLocId)

    if (!selectedLocId) {
      handleChange('isPersonal', false)
      return
    }

    // Find the selected location object
    const selectedLoc = locations.find((loc) => loc.id === selectedLocId)

    // If the location belongs to the current user, default the item to private
    if (selectedLoc && currentUserId && selectedLoc.userId === currentUserId) {
      handleChange('isPersonal', true)
    } else {
      handleChange('isPersonal', false)
    }
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.label.trim()) {
      setError('Label is required.')
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
      lowStockThreshold: form.lowStockThreshold !== '' ? Number(form.lowStockThreshold) : null,
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
        setError(err.message || 'Failed to save item.')
      },
    })
  }

  return (
    <Modal isOpen={isOpen} title="Add New Item" onClose={onClose}>
      {error && (
        <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* BARCODE & SCANNER SECTION */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ScanLine className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Barcode (optional)"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={form.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>{showScanner ? 'Close Camera' : 'Scan'}</span>
            </button>
          </div>

          {showScanner && (
            <div className="relative pt-2 mt-2 border-t border-slate-200 overflow-hidden rounded-lg">
              <div className="rounded-lg overflow-hidden border border-slate-300 shadow-inner">
                <BarcodeScanner
                  onScanSuccess={handleScanSuccess}
                  onScanFailure={() => console.error('Failed to scan barcode')}
                />
              </div>
            </div>
          )}
        </div>

        {/* ITEM NAME */}
        <div>
          <label className="block font-medium text-slate-700 mb-1.5">
            Item Label <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter item label..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            value={form.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        {/* LOCATION DROPDOWN */}
        <div className="w-full min-w-0">
          <label className="block font-medium text-slate-700 mb-1.5">
            Location <span className="text-rose-500 font-bold">*</span>
          </label>
          <Select<string | number>
            options={locationOptions}
            value={form.locationId ?? ''}
            onChange={(val: string | number) => handleLocationChange(val ? Number(val) : null)}
            placeholder="Select a location..."
            required
          />
        </div>

        {/* QUANTITY & LOW STOCK THRESHOLD ROW */}
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
              value={form.quantity}
              onChange={(e) => handleChange('quantity', Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Low Stock Alert Below</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 2"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              value={form.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
            />
          </div>
        </div>

        {/* PRIVATE TOGGLE ROW */}
        {currentUserId && (
          <div className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Private Item
            </span>
            <input
              type="checkbox"
              checked={form.isPersonal}
              onChange={(e) => handleChange('isPersonal', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}

        {/* COLLAPSIBLE SHELF LIFE */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowShelfLife(!showShelfLife)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-colors text-slate-700 font-medium"
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
                  value={form.expirationDate}
                  onChange={(e) => handleChange('expirationDate', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">Opened On</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={form.openedOn}
                    onChange={(e) => handleChange('openedOn', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Use Within (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 7"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    value={form.useWithinDays}
                    onChange={(e) => handleChange('useWithinDays', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ICONS */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
