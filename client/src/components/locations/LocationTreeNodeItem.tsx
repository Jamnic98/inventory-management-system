import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { LocationTreeNode } from '../../types/location'

type LocationTreeNodeItemProps = {
  node: LocationTreeNode
  selectedId: number | string | null
  onSelect: (id: number | string) => void
}

export default function LocationTreeNodeItem({
  node,
  selectedId,
  onSelect,
}: LocationTreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const isSelected = String(selectedId) === String(node.id)
  const hasChildren = node.children.length > 0

  return (
    <div className="select-none">
      <div
        onClick={() => onSelect(node.id)}
        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm cursor-pointer transition ${
          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
              className="p-0.5 hover:bg-gray-200 rounded text-gray-500 text-xs"
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-3" />
          )}
          <span className="truncate">{node.label}</span>
        </div>

        {node.itemCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
            {node.itemCount}
          </span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="pl-3 border-l border-gray-100 ml-2.5 my-0.5">
          {node.children.map((child: LocationTreeNode) => (
            <LocationTreeNodeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
