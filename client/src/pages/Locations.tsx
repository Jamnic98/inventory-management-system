import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pen, Trash2 } from 'lucide-react'

import { LocationFormModal, LocationSidebar } from '../components/locations'
import { useItems, useLocations, useDeleteLocation } from '../hooks'
import { buildLocationTree } from '../utils/locationTree'
import { type Location } from '../types/location'

export default function Locations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('selectedId')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalParentId, setModalParentId] = useState<number | null>(null)
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null)

  // Fetch data via React Query hooks
  const { data: locations = [], isLoading: isLoadingLocs, isError: isErrorLocs } = useLocations()
  const { mutate: deleteLocation, isPending: isDeleting } = useDeleteLocation()
  const { data: items = [], isLoading: isLoadingItems } = useItems()

  // Map item counts per location ID
  const itemCountsMap = useMemo(() => {
    const map = new Map<number | string, number>()
    items.forEach((item) => {
      if (item.locationId) {
        map.set(item.locationId, (map.get(item.locationId) || 0) + 1)
      }
    })
    return map
  }, [items])

  // Filter and build tree hierarchy
  const locationTree = useMemo(() => {
    let filtered = locations
    if (searchQuery.trim()) {
      filtered = locations.filter((loc) =>
        loc.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return buildLocationTree(filtered, itemCountsMap)
  }, [locations, searchQuery, itemCountsMap])

  // Active selected location details
  const selectedLocation = useMemo(
    () => locations.find((loc) => String(loc.id) === String(selectedId)) || null,
    [locations, selectedId]
  )

  // Direct parent location
  const parentLocation = useMemo(() => {
    if (!selectedLocation?.parentId) return null
    return locations.find((loc) => String(loc.id) === String(selectedLocation.parentId)) || null
  }, [locations, selectedLocation])

  // Direct child sub-locations
  const subLocations = useMemo(() => {
    if (!selectedLocation) return []
    return locations.filter((loc) => String(loc.parentId) === String(selectedLocation.id))
  }, [locations, selectedLocation])

  // Items stored directly in the active location
  const locationItems = useMemo(
    () => items.filter((item) => String(item.locationId) === String(selectedId)),
    [items, selectedId]
  )

  // Handler for selecting a location node
  const handleSelect = (id: number | string) => {
    setSearchParams({ selectedId: String(id) })
  }

  // Clear selection on mobile back button
  const handleClearSelection = () => {
    setSearchParams({})
  }

  // Close modal and reset modal states
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setLocationToEdit(null)
    setModalParentId(null)
  }

  // Open modal for root-level location creation
  const handleAddRoot = () => {
    setLocationToEdit(null)
    setModalParentId(null)
    setIsModalOpen(true)
  }

  // Open modal pre-configured for a sub-location
  const handleAddSubLocation = () => {
    if (!selectedLocation) return
    setLocationToEdit(null)
    setModalParentId(Number(selectedLocation.id))
    setIsModalOpen(true)
  }

  // Open modal pre-filled for editing the active location
  const handleEditLocation = () => {
    if (!selectedLocation) return
    setLocationToEdit(selectedLocation)
    setModalParentId(selectedLocation.parentId ? Number(selectedLocation.parentId) : null)
    setIsModalOpen(true)
  }

  const handleDeleteLocation = () => {
    if (!selectedLocation) return

    const confirmMsg = `Are you sure you want to delete "${selectedLocation.label}"?`
    if (window.confirm(confirmMsg)) {
      deleteLocation(selectedLocation.id, {
        onSuccess: () => {
          setSearchParams({}) // Clear selection after deletion
        },
        onError: (err) => {
          // TODO: replace with alert banner
          const errorMessage =
            err instanceof Error && err.message
              ? err.message
              : 'Failed to delete location. Make sure it has no sub-locations or items first.'
          alert(errorMessage)
        },
      })
    }
  }

  if (isLoadingLocs || isLoadingItems) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Loading locations and inventory...
      </div>
    )
  }

  if (isErrorLocs) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        Failed to load locations. Please refresh the page.
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] w-full overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Inner Location Tree Sidebar */}
      <div
        className={`w-full md:w-80 shrink-0 border-r border-gray-200 ${
          selectedId ? 'hidden md:block' : 'block'
        }`}
      >
        <LocationSidebar
          tree={locationTree}
          selectedId={selectedId}
          onSelect={handleSelect}
          onAddRoot={handleAddRoot}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Workspace Content Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 pb-20 md:pb-6 ${
          selectedId ? 'block' : 'hidden md:block'
        }`}
      >
        {/* Mobile Back Button */}
        {selectedLocation && (
          <button
            onClick={handleClearSelection}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 md:hidden cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Locations Tree
          </button>
        )}

        {selectedLocation ? (
          <div className="space-y-4 sm:space-y-6 max-w-5xl">
            {/* Location Header Card */}
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Parent:{' '}
                  {parentLocation ? (
                    <button
                      onClick={() => handleSelect(parentLocation.id)}
                      className="text-emerald-600 hover:underline font-medium cursor-pointer"
                    >
                      {parentLocation.label}
                    </button>
                  ) : (
                    <span className="text-gray-500">None (Root)</span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  {selectedLocation.label}
                </h1>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditLocation}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-md hover:bg-gray-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Pen className="w-3.5 h-3.5" strokeWidth={3} /> Edit
                </button>
                <button
                  onClick={handleDeleteLocation}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-bold border border-red-200 text-white bg-red-600 rounded-md hover:bg-red-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={3} />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Sub-Locations Section */}
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">
                  Sub-Locations ({subLocations.length})
                </h2>
                <button
                  onClick={handleAddSubLocation}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                >
                  + Add Sub-Location
                </button>
              </div>

              {subLocations.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No nested sub-locations.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {subLocations.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => handleSelect(sub.id)}
                      className="p-3 rounded-md border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {sub.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {itemCountsMap.get(sub.id) || 0} items
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stored Inventory Items Section */}
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Items in {selectedLocation.label} ({locationItems.length})
              </h2>

              {locationItems.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-md">
                  No inventory items are assigned to this location.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Barcode</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {locationItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/80">
                            <td className="py-2.5 px-3 font-medium text-gray-900">{item.label}</td>
                            <td className="py-2.5 px-3 text-xs font-mono text-gray-400">
                              {item.barcode || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-700">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-62.5 flex items-center justify-center text-gray-400 text-sm">
            Select a location from the left panel to manage sub-locations and inventory.
          </div>
        )}
      </div>

      {/* Add / Edit Location Modal */}
      <LocationFormModal
        isOpen={isModalOpen}
        locations={locations}
        initialParentId={modalParentId}
        locationToEdit={locationToEdit}
        onClose={handleCloseModal}
        onLocationAdded={(loc) => {
          handleSelect(loc.id)
          handleCloseModal()
        }}
      />
    </div>
  )
}
