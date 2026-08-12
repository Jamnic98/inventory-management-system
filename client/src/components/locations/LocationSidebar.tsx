import { Plus } from 'lucide-react'

import { LocationTreeNodeItem } from '.'
import { type LocationTreeNode } from '../../types'

type LocationSidebarProps = {
  tree: LocationTreeNode[]
  selectedId: number | string | null
  onSelect: (id: number | string) => void
  onAddRoot: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function LocationSidebar({
  tree,
  selectedId,
  onSelect,
  onAddRoot,
  searchQuery,
  onSearchChange,
}: LocationSidebarProps) {
  return (
    <aside className="w-full shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
          <button
            type="button"
            onClick={onAddRoot}
            className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition flex justify-center items-center gap-0.5 cursor-pointer"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Tree Node List */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <p className="p-4 text-xs text-gray-500 text-center">No locations found.</p>
        ) : (
          tree.map((node) => (
            <LocationTreeNodeItem
              key={node.id}
              node={node}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  )
}
