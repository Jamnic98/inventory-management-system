import type { Location, LocationTreeNode } from '../types/location'

/**
 * Transforms a flat array of locations into a hierarchical tree structure,
 * and attaches item counts for each location node.
 */
export const buildLocationTree = (
  locations: Location[] = [],
  itemsCountMap: Map<number | string, number> = new Map()
): LocationTreeNode[] => {
  const nodeMap = new Map<number | string, LocationTreeNode>()
  const roots: LocationTreeNode[] = []

  // Initialize node map
  for (const loc of locations) {
    nodeMap.set(loc.id, {
      ...loc,
      children: [],
      itemCount: itemsCountMap.get(loc.id) || 0,
    })
  }

  // Build tree hierarchy
  for (const loc of locations) {
    const node = nodeMap.get(loc.id)!
    if (loc.parentId && nodeMap.has(loc.parentId)) {
      nodeMap.get(loc.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
