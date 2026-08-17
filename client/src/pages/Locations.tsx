import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock, Globe, Bell, BellOff, AlertTriangle, Clock } from 'lucide-react'

import { LocationContent, LocationFormModal, LocationSidebar } from '../components/locations'
import { useItems, useLocations, useDeleteLocation, useAlert } from '../hooks'
import { buildLocationTree } from '../utils/locationTree'
import type { Item, Location } from '../types'
import { ItemDetailsModal } from '../components'

// Extended location type containing optional notification fields
type ExtendedLocation = Location & {
  notifyExpiring?: boolean
  notifyLowStock?: boolean
}

export default function Locations() {
  const alert = useAlert()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('selectedId')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalParentId, setModalParentId] = useState<number | null>(null)
  const [locationToEdit, setLocationToEdit] = useState<ExtendedLocation | null>(null)

  // Item Modal State (for clicking an item inside a location's item table)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  // Fetch Locations
  const { data: locations = [], isLoading: isLoadingLocs, isError: isErrorLocs } = useLocations()
  const { mutate: deleteLocation, isPending: isDeleting } = useDeleteLocation()

  // Fetch items scoped specifically to the selected location
  const { data: itemsResponse, isLoading: isLoadingItems } = useItems(
    selectedId ? { locationId: Number(selectedId), limit: 100 } : undefined
  )

  // Handle both array and paginated object responses safely
  const locationItems = useMemo(() => {
    if (!itemsResponse) return []
    return Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.data || []
  }, [itemsResponse])

  // Map item counts per location ID
  const itemCountsMap = useMemo(() => {
    const map = new Map<number | string, number>()
    for (const loc of locations) {
      const count = (loc as any)._count?.stocks ?? (loc as any)._count?.items ?? 0
      map.set(loc.id, count)
      map.set(String(loc.id), count)
    }
    return map
  }, [locations])

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
    () =>
      (locations.find((loc) => String(loc.id) === String(selectedId)) as ExtendedLocation) || null,
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

  // Helpers to derive status properties for "At-a-Glance" display
  const locationMeta = useMemo(() => {
    if (!selectedLocation) return null

    const isPrivate = selectedLocation.userId !== null && selectedLocation.userId !== undefined
    const notifyExpiring = selectedLocation.notifyExpiring ?? true
    const notifyLowStock = selectedLocation.notifyLowStock ?? true

    return {
      isPrivate,
      notifyExpiring,
      notifyLowStock,
      hasAnyNotification: notifyExpiring || notifyLowStock,
    }
  }, [selectedLocation])

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
          setSearchParams({})
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
      {/* Sidebar: Full screen on mobile when no location selected, desktop 80px side drawer */}
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

      {/* Main Location Workspace: Visible on mobile when location selected, always on desktop */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
          !selectedId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* At-a-Glance Mobile-Responsive Banner */}
        {selectedLocation && locationMeta && (
          <div className="px-3 sm:px-6 py-2.5 bg-gray-50/90 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Badges Container - Wraps neatly on small screens */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
              {/* Privacy Status */}
              {locationMeta.isPrivate ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px] sm:text-xs">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Private</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px] sm:text-xs">
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>Shared</span>
                </span>
              )}

              {/* Low Stock Subscription Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] sm:text-xs ${
                  locationMeta.notifyLowStock
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 line-through opacity-75'
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Low Stock</span>
              </span>

              {/* Expiration Subscription Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] sm:text-xs ${
                  locationMeta.notifyExpiring
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 line-through opacity-75'
                }`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>Expiring</span>
              </span>
            </div>

            {/* Notification Summary Flag */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 self-end sm:self-auto shrink-0">
              {locationMeta.hasAnyNotification ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden xs:inline">Alerts Active</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Muted</span>
                </>
              )}
            </div>
          </div>
        )}

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

      <ItemDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        isOpen={!!selectedItem}
      />
    </div>
  )
}
