import { ArrowLeft, Pen, Trash2, Folder, ChevronRight, CornerDownRight } from 'lucide-react'

import { Item, Location } from '../../types'

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
      className={`flex-1 overflow-y-auto p-3.5 sm:p-6 bg-gray-50 pb-20 md:pb-6 ${
        selectedId ? 'block' : 'hidden md:block'
      }`}
    >
      {/* Mobile Back Button */}
      {selectedLocation && (
        <button
          onClick={handleClearSelection}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 active:text-slate-900 md:hidden cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Locations Tree</span>
        </button>
      )}

      {selectedLocation ? (
        <div className="space-y-3.5 sm:space-y-6 max-w-5xl">
          {/* Location Header Card */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
            {/* Parent Breadcrumb Navigation Bar */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-medium shrink-0">Parent:</span>
              {parentLocation ? (
                <div className="inline-flex items-center gap-1 min-w-0">
                  <button
                    onClick={() => handleSelect(parentLocation.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition cursor-pointer max-w-[180px] sm:max-w-xs truncate"
                  >
                    <Folder className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{parentLocation.label}</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium text-[11px]">
                  None (Root Location)
                </span>
              )}
            </div>

            {/* Title & Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-gray-100">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {selectedLocation.label}
                </h1>
              </div>

              {/* Action Buttons: Stacked on mobile, side-by-side on desktop */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleEditLocation}
                  className="flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-bold border border-gray-300 rounded-md hover:bg-gray-100 active:bg-gray-200 transition cursor-pointer flex items-center gap-1.5 text-gray-700"
                >
                  <Pen className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteLocation}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-bold border border-red-200 text-white bg-red-600 rounded-md hover:bg-red-700 active:bg-red-800 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Storage Areas Section */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <CornerDownRight className="w-4 h-4 text-gray-400" />
                Storage Areas ({subLocations.length})
              </h2>
              <button
                onClick={handleAddSubLocation}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 active:text-emerald-900 transition cursor-pointer"
              >
                + Add Sub-Location
              </button>
            </div>

            {subLocations.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No nested storage areas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {subLocations.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleSelect(sub.id)}
                    className="p-2.5 sm:p-2 rounded-md border border-gray-200 hover:border-emerald-300 active:bg-emerald-50 hover:bg-emerald-50/50 cursor-pointer transition flex items-center justify-between gap-2 min-w-0"
                  >
                    <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                      {sub.label}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono shrink-0">
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
            <h2 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4">
              Items in {selectedLocation.label} ({locationItems.length})
            </h2>

            {locationItems.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-md">
                No inventory items are assigned to this location.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 touch-pan-x">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full text-left text-xs sm:text-sm text-gray-600">
                    <thead className="bg-gray-50 text-[11px] sm:text-xs text-gray-500 uppercase border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Barcode</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {locationItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 active:bg-gray-100">
                          <td className="py-2.5 px-3 font-medium text-gray-900 max-w-35 sm:max-w-xs">
                            <button
                              type="button"
                              className="text-left hover:underline text-blue-600 font-semibold truncate block w-full cursor-pointer"
                              onClick={() => onSelectItem(item)}
                              title={item.label}
                            >
                              {item.label}
                            </button>
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
        <div className="h-full min-h-62.5 flex items-center justify-center text-gray-400 text-xs sm:text-sm">
          Select a location from the left panel to manage storage areas and inventory.
        </div>
      )}
    </div>
  )
}
