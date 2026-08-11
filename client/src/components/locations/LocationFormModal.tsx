import React, { useEffect, useState } from 'react'

import { Modal } from '..'
import type { Location } from '../../types/location'
import { useCreateLocation, useUpdateLocation } from '../../hooks/useLocations'

interface LocationFormModalProps {
  isOpen: boolean
  locations: Location[]
  initialParentId?: number | null // Pre-fills parent when adding a sub-location
  locationToEdit?: Location | null // If provided, modal operates in EDIT mode
  onClose: () => void
  onLocationAdded?: (newLocation: Location) => void
}

type FormState = {
  label: string
  // description: string
  parentId: number | null
}

const INITIAL_FORM: FormState = {
  label: '',
  // description: '',
  parentId: null,
}

export default function LocationFormModal({
  isOpen,
  locations,
  initialParentId = null,
  locationToEdit = null,
  onClose,
  onLocationAdded,
}: LocationFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)

  const { mutate: createLocation, isPending: isCreating } = useCreateLocation()
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation()

  const isPending = isCreating || isUpdating
  const isEditMode = Boolean(locationToEdit)

  // Sync state whenever modal opens or switching between add/edit modes
  useEffect(() => {
    if (isOpen) {
      if (locationToEdit) {
        // Pre-fill form fields for Editing
        setForm({
          label: locationToEdit.label || '',
          // description: locationToEdit.description || '',
          parentId: locationToEdit.parentId ? Number(locationToEdit.parentId) : null,
        })
      } else {
        // Reset form for Creating
        setForm({
          ...INITIAL_FORM,
          parentId: initialParentId ? Number(initialParentId) : null,
        })
      }
      setError(null)
    }
  }, [isOpen, initialParentId, locationToEdit])

  const handleChange = (field: keyof FormState, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.label.trim()) {
      setError('Location name is required.')
      return
    }

    setError(null)

    const payload = {
      label: form.label.trim(),
      // description: form.description.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : null,
    }

    if (isEditMode && locationToEdit) {
      // UPDATE Existing Location
      updateLocation(
        {
          id: locationToEdit.id,
          data: payload,
        },
        {
          onSuccess: (updatedLoc) => {
            onLocationAdded?.(updatedLoc)
            onClose()
          },
          onError: (err) => {
            console.error('Failed to update location:', err)
            const message =
              err instanceof Error ? err.message : 'Failed to update location. Please try again.'
            setError(message)
          },
        }
      )
    } else {
      // CREATE New Location
      createLocation(payload, {
        onSuccess: (newLoc) => {
          onLocationAdded?.(newLoc)
          setForm(INITIAL_FORM)
          onClose()
        },
        onError: (err) => {
          console.error('Failed to create location:', err)
          const message =
            err instanceof Error ? err.message : 'Failed to save location. Please try again.'
          setError(message)
        },
      })
    }
  }

  // Dynamic modal title determination
  const getModalTitle = () => {
    if (isEditMode) return `Edit Location: ${locationToEdit?.label}`
    if (form.parentId) return 'Add Sub-Location'
    return 'Add New Location'
  }

  return (
    <Modal isOpen={isOpen} title={getModalTitle()} onClose={onClose}>
      {/* Error Alert */}
      {error && (
        <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {/* Location Name */}
        <label className="block text-xs font-medium text-gray-700">
          Location Name <span className="text-red-500">*</span>
          <input
            type="text"
            required
            placeholder="e.g., Shelf 2, Row B, or Cold Storage"
            className="mt-1 w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </label>

        {/* Parent Location Dropdown */}
        <label className="block text-xs font-medium text-gray-700">
          Parent Location
          <select
            className="mt-1 w-full p-2 border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.parentId ?? ''}
            onChange={(e) =>
              handleChange('parentId', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">None (Top-Level Root Location)</option>
            {locations
              // Prevent a location from setting itself as its own parent in Edit mode
              .filter((loc) => !isEditMode || String(loc.id) !== String(locationToEdit?.id))
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
          </select>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            Select a parent to nest this location under another area.
          </span>
        </label>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 border rounded text-gray-600 text-sm hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-sm disabled:opacity-50 transition cursor-pointer"
          >
            {isPending ? 'Saving...' : isEditMode ? 'Update Location' : 'Save Location'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
