import React, { useEffect, useState, useRef, useContext } from 'react'
import { Lock } from 'lucide-react'

import { BarcodeField, LocationSelectField, Modal, QuantityStockFields, ShelfLifeSection } from '.'
import { AlertContext } from '../context'
import { useUpdateItem } from '../hooks'
import { formatDateForInput } from '../utils/itemHelpers'
import { Item, type Location } from '../types'

interface EditItemModalProps {
  isOpen: boolean
  item: Item | null
  locations: Location[]
  currentUserId?: number | null
  onClose: () => void
}

type EditFormState = {
  label: string
  quantity: string
  barcode: string
  locationId: number | null
  expirationDate: string
  openedOn: string
  useWithinDays: string
  lowStockThreshold: string
  isManuallyLowStock: boolean
  isPersonal: boolean
}

const INITIAL_FORM: EditFormState = {
  label: '',
  quantity: '1',
  barcode: '',
  locationId: null,
  expirationDate: '',
  openedOn: '',
  useWithinDays: '',
  lowStockThreshold: '',
  isManuallyLowStock: false,
  isPersonal: false,
}

export default function EditItemModal({
  isOpen,
  item,
  locations,
  currentUserId = null,
  onClose,
}: EditItemModalProps) {
  const alert = useContext(AlertContext)

  const [form, setForm] = useState<EditFormState>(INITIAL_FORM)
  const [showScanner, setShowScanner] = useState<boolean>(false)
  const [showShelfLife, setShowShelfLife] = useState<boolean>(false)

  const { mutate: updateItem, isPending } = useUpdateItem()
  const shelfLifeRef = useRef<HTMLDivElement | null>(null)

  // Populate state whenever target item changes
  useEffect(() => {
    if (isOpen && item) {
      const hasShelfLifeDates = Boolean(item.expirationDate || item.openedOn || item.useWithinDays)
      setShowShelfLife(hasShelfLifeDates)
      setShowScanner(false)

      setForm({
        label: item.label || '',
        quantity: item.quantity != null ? String(item.quantity) : '1',
        barcode: item.barcode || '',
        locationId: item.locationId ?? null,
        expirationDate: formatDateForInput(item.expirationDate),
        openedOn: formatDateForInput(item.openedOn),
        useWithinDays: item.useWithinDays != null ? String(item.useWithinDays) : '',
        lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : '',
        isManuallyLowStock: Boolean(item.isManuallyLowStock),
        isPersonal: Boolean(item.userId && item.userId === currentUserId),
      })
    }
  }, [isOpen, item, currentUserId])

  // Smooth scroll when toggling shelf life
  useEffect(() => {
    if (showShelfLife && shelfLifeRef.current) {
      setTimeout(() => {
        shelfLifeRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }, 50)
    }
  }, [showShelfLife])

  const handleChange = (field: keyof EditFormState, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleLocationChange = (selectedLocId: number | null) => {
    handleChange('locationId', selectedLocId)

    if (!selectedLocId) {
      handleChange('isPersonal', false)
      return
    }

    const selectedLoc = locations.find((loc) => loc.id === selectedLocId)
    if (selectedLoc && currentUserId && selectedLoc.userId === currentUserId) {
      handleChange('isPersonal', true)
    } else {
      handleChange('isPersonal', false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!item) return
    if (!form.label.trim()) return alert?.error('Label is required.')

    const payload = {
      label: form.label.trim(),
      quantity: form.quantity !== '' ? Math.max(0, Number(form.quantity)) : 0,
      barcode: form.barcode.trim() || null,
      locationId: form.locationId ? Number(form.locationId) : null,
      expirationDate: form.expirationDate ? new Date(form.expirationDate) : null,
      openedOn: form.openedOn ? new Date(form.openedOn) : null,
      useWithinDays: form.useWithinDays ? Number(form.useWithinDays) : null,
      lowStockThreshold:
        form.lowStockThreshold !== '' && form.lowStockThreshold != null
          ? Math.max(0, Number(form.lowStockThreshold))
          : null,
      isManuallyLowStock: form.isManuallyLowStock,
      userId: form.isPersonal && currentUserId ? currentUserId : null,
    }

    updateItem(
      { itemId: item.id, data: payload },
      {
        onSuccess: (updated) => {
          alert?.success(`Updated "${updated.label || 'Item'}" successfully!`)
          onClose()
        },
        onError: (err) => alert?.error(err.message || 'Failed to update item.'),
      }
    )
  }

  return (
    <Modal isOpen={isOpen && Boolean(item)} title="Edit Item & Stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* BARCODE & SCANNER */}
        <BarcodeField
          value={form.barcode}
          showScanner={showScanner}
          onChange={(val) => handleChange('barcode', val)}
          onToggleScanner={() => setShowScanner((prev) => !prev)}
          onScanSuccess={(scannedCode) => {
            handleChange('barcode', scannedCode)
            setShowScanner(false)
          }}
        />

        {/* ITEM LABEL */}
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

        {/* LOCATION SELECT */}
        <LocationSelectField
          value={form.locationId}
          locations={locations}
          onChange={handleLocationChange}
        />

        {/* QUANTITY, THRESHOLD & MANUAL LOW STOCK */}
        <QuantityStockFields
          quantity={form.quantity}
          lowStockThreshold={form.lowStockThreshold}
          isManuallyLowStock={form.isManuallyLowStock}
          onQuantityChange={(val) => handleChange('quantity', val)}
          onThresholdChange={(val) => handleChange('lowStockThreshold', val)}
          onManualLowStockChange={(checked) => handleChange('isManuallyLowStock', checked)}
        />

        {/* PRIVATE TOGGLE */}
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

        {/* SHELF LIFE SECTION */}
        <ShelfLifeSection
          showShelfLife={showShelfLife}
          expirationDate={form.expirationDate}
          openedOn={form.openedOn}
          useWithinDays={form.useWithinDays}
          onToggleShow={() => setShowShelfLife((prev) => !prev)}
          onChange={(field, val) => handleChange(field, val)}
        />

        {/* BUTTONS */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100" ref={shelfLifeRef}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
