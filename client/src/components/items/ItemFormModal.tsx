import React, { useEffect, useMemo, useState, useRef, useContext } from 'react'
import {
  Camera,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
  ScanLine,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import { BarcodeScanner, Modal, Select } from '..'
import { AlertContext } from '../../context/AlertContext' // Adjust relative path to where AlertContext is stored
import { useCreateItem, useItemByBarcode, useRestoreItem, useUpdateItem } from '../../hooks'
import type { Location } from '../../types'

// TODO: move
// Helper to safely convert Date / ISO string to YYYY-MM-DD for <input type="date" />
export const formatDateForInput = (dateVal?: string | Date | null): string => {
  if (!dateVal) return ''
  const dateObj = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
  if (isNaN(dateObj.getTime())) return '' // Prevents invalid date crashes

  return dateObj.toISOString().split('T')[0]
}

interface ItemFormModalProps {
  isOpen: boolean
  locations: Location[]
  initialBarcode?: string
  currentUserId?: number | null
  onClose: () => void
}

type FormState = {
  label: string
  quantity: string
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
  quantity: '1',
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
}: ItemFormModalProps) {
  const alert = useContext(AlertContext)

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [showScanner, setShowScanner] = useState<boolean>(true)
  const [showShelfLife, setShowShelfLife] = useState<boolean>(false)
  const [overrideBarcode, setOverrideBarcode] = useState<string | null>(null)
  const [existingItemId, setExistingItemId] = useState<number | string | null>(null)

  const [isArchivedMatch, setIsArchivedMatch] = useState(false)
  const { data: matchedItem, isLoading: isLookingUp } = useItemByBarcode(form.barcode)
  const { mutate: createItem, isPending: isCreating } = useCreateItem()
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem()
  const { mutate: restoreItem } = useRestoreItem()

  // Ref to track the shelf life element
  const shelfLifeRef = useRef<HTMLDivElement | null>(null)

  const isPending = isCreating || isUpdating || isLookingUp

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
      setShowScanner(true)
      setShowShelfLife(false)
    }
  }, [isOpen, initialBarcode])

  // Scroll to the bottom when showShelfLife becomes true
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

  useEffect(() => {
    // Reset if no item matched, or if the user clicked "Create as new"
    const isOverridden = overrideBarcode && overrideBarcode === form.barcode.trim()

    if (!matchedItem || isOverridden) {
      setExistingItemId(null)
      return
    }

    // Item matched! Switch modal to Update Mode and auto-fill
    setExistingItemId(matchedItem.id)

    if (matchedItem.expirationDate || matchedItem.openedOn || matchedItem.useWithinDays) {
      setShowShelfLife(true)
    }

    setForm((prev) => ({
      ...prev,
      label: matchedItem.label || prev.label,
      quantity: matchedItem.quantity != null ? String(matchedItem.quantity) : prev.quantity,
      locationId: matchedItem.locationId ?? prev.locationId,
      lowStockThreshold:
        matchedItem.lowStockThreshold != null
          ? String(matchedItem.lowStockThreshold)
          : prev.lowStockThreshold,
      expirationDate: formatDateForInput(matchedItem.expirationDate),
      openedOn: formatDateForInput(matchedItem.openedOn),
      useWithinDays:
        matchedItem.useWithinDays != null ? String(matchedItem.useWithinDays) : prev.useWithinDays,
      isPersonal: Boolean(matchedItem.userId && matchedItem.userId === currentUserId),
    }))
  }, [matchedItem, overrideBarcode, form.barcode, currentUserId])

  useEffect(() => {
    const isOverridden = overrideBarcode && overrideBarcode === form.barcode.trim()

    if (matchedItem && !isOverridden) {
      setExistingItemId(matchedItem.id)

      // Check if the barcode belongs to an archived item
      const isArchived = Boolean(matchedItem.deletedAt)
      setIsArchivedMatch(isArchived)

      // Auto-expand shelf life section if dates exist
      if (matchedItem.expirationDate || matchedItem.openedOn || matchedItem.useWithinDays) {
        setShowShelfLife(true)
      }

      setForm((prev) => ({
        ...prev,
        label: matchedItem.label || prev.label,
        // Convert quantity to String so form state remains consistent
        quantity: matchedItem.quantity != null ? String(matchedItem.quantity) : prev.quantity,
        locationId: matchedItem.locationId ?? prev.locationId,
        lowStockThreshold:
          matchedItem.lowStockThreshold != null
            ? String(matchedItem.lowStockThreshold)
            : prev.lowStockThreshold,
        expirationDate: formatDateForInput(matchedItem.expirationDate),
        openedOn: formatDateForInput(matchedItem.openedOn),
        useWithinDays:
          matchedItem.useWithinDays != null
            ? String(matchedItem.useWithinDays)
            : prev.useWithinDays,
        isPersonal: Boolean(matchedItem.userId && matchedItem.userId === currentUserId),
      }))
    } else {
      setExistingItemId(null)
      setIsArchivedMatch(false)
    }
  }, [matchedItem, overrideBarcode, form.barcode, currentUserId])

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setForm({ ...INITIAL_FORM, barcode: initialBarcode || '' })
      setExistingItemId(null)
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

    const selectedLoc = locations.find((loc) => loc.id === selectedLocId)

    if (selectedLoc && currentUserId && selectedLoc.userId === currentUserId) {
      handleChange('isPersonal', true)
    } else {
      handleChange('isPersonal', false)
    }
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
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
      userId: form.isPersonal && currentUserId ? currentUserId : null,
    }

    const resetState = () => {
      setForm((prev) => ({
        ...INITIAL_FORM,
        locationId: prev.locationId,
        isPersonal: prev.isPersonal,
      }))
      setExistingItemId(null)
      setIsArchivedMatch(false)
      setOverrideBarcode(null)
      setShowScanner(true)
      setShowShelfLife(false)
    }

    // RESTORE MODE (Barcode matches an archived item)
    if (isArchivedMatch && existingItemId) {
      restoreItem(existingItemId, {
        onSuccess: (restoredItem) => {
          alert?.success(`Restored "${restoredItem.label || 'Item'}" successfully!`)
          resetState()
        },
        onError: (err) => alert?.error(err.message || 'Failed to restore item.'),
      })
      return
    }

    // UPDATE MODE (Barcode matches an active existing item)
    if (existingItemId) {
      updateItem(
        { itemId: existingItemId, data: payload },
        {
          onSuccess: (updatedItem) => {
            alert?.success(`Updated "${updatedItem.label || 'Item'}" successfully!`)
            resetState()
          },
          onError: (err) => alert?.error(err.message || 'Failed to update item.'),
        }
      )
      return
    }

    // CREATE MODE (Brand new barcode or manual entry)
    createItem(payload, {
      onSuccess: (newItem) => {
        alert?.success(`Added "${newItem.label || 'Item'}" successfully!`)
        resetState()
      },
      onError: (err) => alert?.error(err.message || 'Failed to save item.'),
    })
  }

  return (
    <Modal isOpen={isOpen} title="Add Items" onClose={onClose}>
      {/* Insert directly above <form> inside <Modal> */}
      {existingItemId && (
        <div className="mb-3 flex items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Matched existing item. Submitting will update this record.
          </span>
          <button
            type="button"
            onClick={() => {
              setOverrideBarcode(form.barcode.trim())
              setExistingItemId(null)
            }}
            className="text-amber-700 underline font-semibold hover:text-amber-900 cursor-pointer shrink-0"
          >
            Create as new
          </button>
        </div>
      )}

      {/* Replace static ScanLine icon in input wrapper with loader */}
      {isLookingUp ? (
        <Loader2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
      ) : (
        <ScanLine className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isArchivedMatch && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-amber-900">
            <div className="text-sm">
              <p className="font-semibold">Archived Item Found</p>
              <p className="text-amber-700 text-xs mt-0.5">
                "{matchedItem?.label}" was previously archived. Restoring it will bring back its
                record and set its active quantity.
              </p>
            </div>
          </div>
        )}

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
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>{showScanner ? 'Close Camera' : 'Scan'}</span>
            </button>
          </div>

          {showScanner && (
            <div className="relative pt-2 mt-2 border-t border-slate-200 overflow-hidden rounded-lg">
              <div className="rounded-lg overflow-hidden border border-slate-300 shadow-inner">
                <BarcodeScanner onScanSuccess={handleScanSuccess} />
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
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-colors text-slate-700 font-medium cursor-pointer"
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

        {/* BUTTONS */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100" ref={shelfLifeRef}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {isPending
              ? isArchivedMatch
                ? 'Restoring...'
                : existingItemId
                  ? 'Updating...'
                  : 'Adding...'
              : isArchivedMatch
                ? 'Restore Item'
                : existingItemId
                  ? 'Update Item'
                  : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
