import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { LocationContent, LocationFormModal, LocationSidebar } from '../components/locations'
import { useItems, useLocations, useDeleteLocation, useAlert } from '../hooks'
import { buildLocationTree } from '../utils/locationTree'
import type { Item, Location } from '../types'
import { ItemDetailsModal } from '../components'

export default function Locations() {
  const alert = useAlert()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('selectedId')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalParentId, setModalParentId] = useState<number | null>(null)
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null)

  // Item Modal State (for clicking an item inside a location's item table)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  // Fetch Locations
  const { data: locations = [], isLoading: isLoadingLocs, isError: isErrorLocs } = useLocations()
  const { mutate: deleteLocation, isPending: isDeleting } = useDeleteLocation()

  // 🚀 Fetch items scoped specifically to the selected location
  const { data: itemsResponse, isLoading: isLoadingItems } = useItems(
    selectedId ? { locationId: Number(selectedId), limit: 100 } : undefined
  )

  // Handle both array and paginated object responses safely
  const locationItems = useMemo(() => {
    if (!itemsResponse) return []
    return Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.data || []
  }, [itemsResponse])

  // Map item counts per location ID
  // Note: Ideally, count should come from location._count.items on backend location object
  const itemCountsMap = useMemo(() => {
    const map = new Map<number | string, number>()
    for (const item of locationItems) {
      if (item.locationId) {
        map.set(item.locationId, (map.get(item.locationId) || 0) + 1)
      }
    }
    return map
  }, [locationItems])

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
          const errorMessage =
            err instanceof Error && err.message
              ? err.message
              : 'Failed to delete location. Make sure it has no sub-locations or items first.'
          alert.error(errorMessage)
        },
      })
    }
  }

  if (isLoadingLocs || (selectedId && isLoadingItems)) {
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

      <LocationContent
        selectedId={selectedId}
        locationItems={locationItems}
        itemCountsMap={itemCountsMap}
        subLocations={subLocations}
        selectedLocation={selectedLocation}
        parentLocation={parentLocation}
        onSelectItem={setSelectedItem}
        handleSelect={handleSelect}
        handleClearSelection={handleClearSelection}
        handleAddSubLocation={handleAddSubLocation}
        handleEditLocation={handleEditLocation}
        handleDeleteLocation={handleDeleteLocation}
        isDeleting={isDeleting}
      />

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

      <ItemDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        isOpen={!!selectedItem}
      />
    </div>
  )
}
