import React, { useEffect, useState, useMemo } from 'react'

import { Modal, Select } from '..'
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
  parentId: number | null
}

const INITIAL_FORM: FormState = {
  label: '',
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
  const [isPrivate, setIsPrivate] = useState<boolean>(true)

  const { mutate: createLocation, isPending: isCreating } = useCreateLocation()
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation()

  const isPending = isCreating || isUpdating
  const isEditMode = Boolean(locationToEdit)

  // Sync state whenever modal opens or switching between add/edit modes
  useEffect(() => {
    if (isOpen) {
      if (locationToEdit) {
        setForm({
          label: locationToEdit.label || '',
          parentId: locationToEdit.parentId ? Number(locationToEdit.parentId) : null,
        })
        setIsPrivate(locationToEdit.userId !== null && locationToEdit.userId !== undefined)
      } else {
        setForm({
          ...INITIAL_FORM,
          parentId: initialParentId ? Number(initialParentId) : null,
        })
        setIsPrivate(true) // 🔒 Private by default for new locations
      }
      setError(null)
    }
  }, [isOpen, initialParentId, locationToEdit])

  // If creating a sub-location, inherit privacy from the selected parent location
  useEffect(() => {
    if (isOpen && !locationToEdit && initialParentId && locations.length > 0) {
      const parentLoc = locations.find((l) => l.id === initialParentId)
      if (parentLoc) {
        setIsPrivate(Boolean(parentLoc.userId))
      }
    }
  }, [isOpen, initialParentId, locations, locationToEdit])

  // Get all descendant IDs of a location to prevent cyclic relationships
  const invalidParentIds = useMemo(() => {
    if (!isEditMode || !locationToEdit) return new Set<number>()

    const set = new Set<number>([locationToEdit.id])

    const addChildren = (parentId: number) => {
      locations.forEach((loc) => {
        if (loc.parentId === parentId) {
          set.add(loc.id)
          addChildren(loc.id) // Recurse through descendants
        }
      })
    }

    addChildren(locationToEdit.id)
    return set
  }, [locations, locationToEdit, isEditMode])

  // Filter out self AND descendants from valid parent list
  const validParentLocations = useMemo(() => {
    return locations.filter((loc) => !invalidParentIds.has(loc.id))
  }, [locations, invalidParentIds])

  // Memoized options list formatted for the Select component
  const parentOptions = useMemo(() => {
    return [
      { value: '', label: 'None (Top-Level Root Location)' },
      ...validParentLocations.map((loc) => ({
        value: loc.id,
        label: loc.label,
      })),
    ]
  }, [validParentLocations])

  const handleChange = (field: keyof FormState, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.label.trim()) {
      setError('Location name is required.')
      return
    }

    setError(null)

    // 🚀 Included isPrivate in the payload sent to the backend
    const payload = {
      label: form.label.trim(),
      parentId: form.parentId ? Number(form.parentId) : null,
      isPrivate,
    }

    if (isEditMode && locationToEdit) {
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
      <form onSubmit={handleSubmit} className="space-y-3 text-sm w-full max-w-full overflow-hidden">
        {/* Location Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Location Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Shelf 2, Row B, or Cold Storage"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            value={form.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        {/* Parent Location Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Parent Location</label>
          <Select<string | number>
            options={parentOptions}
            value={form.parentId ?? ''}
            onChange={(val: string | number) => handleChange('parentId', val ? Number(val) : null)}
            placeholder="None (Top-Level Root Location)"
            direction="up"
          />
        </div>

        {/* Privacy Checkbox Toggle */}
        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Private Location</span>
              <p className="text-xs text-gray-500">
                {isPrivate
                  ? 'Only you can view and manage items stored in this location.'
                  : 'Shared with everyone in your household/workspace.'}
              </p>
            </div>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 text-sm hover:bg-gray-100 transition cursor-pointer"
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
