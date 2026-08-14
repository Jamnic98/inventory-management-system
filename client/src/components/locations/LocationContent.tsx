import { ArrowLeft, Pen, Trash2 } from 'lucide-react'

import { Location } from '../../types/location'
import { Item } from '../../types'

interface LocationContentProps {
  selectedId: string | null
  locationItems: Item[]
  itemCountsMap: Map<number | string, number>
  subLocations: Location[]
  selectedLocation: Location | null
  parentLocation: Location | null
  onSelectItem: (item: Item) => void
  handleSelect: (id: number | string) => void
  handleClearSelection: () => void
  handleAddSubLocation: () => void
  handleEditLocation: () => void
  handleDeleteLocation: () => void
  isDeleting: boolean
}

export default function LocationContent({
  selectedId,
  locationItems,
  itemCountsMap,
  subLocations,
  selectedLocation,
  parentLocation,
  onSelectItem,
  handleSelect,
  handleClearSelection,
  handleAddSubLocation,
  handleEditLocation,
  handleDeleteLocation,
  isDeleting,
}: LocationContentProps) {
  return (
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
                    <span className="text-sm font-medium text-gray-800 truncate">{sub.label}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {itemCountsMap.get(sub.id) ??
                        itemCountsMap.get(String(sub.id)) ??
                        itemCountsMap.get(Number(sub.id)) ??
                        0}{' '}
                      items
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
                          <td className="py-2.5 px-3 font-medium text-gray-900 max-w-40 sm:max-w-70">
                            <div className="min-w-0">
                              <span
                                className="cursor-pointer hover:underline text-blue-600 font-semibold truncate block"
                                onClick={() => onSelectItem(item)}
                                title={item.label}
                              >
                                {item.label}
                              </span>
                            </div>
                          </td>
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
  )
}
