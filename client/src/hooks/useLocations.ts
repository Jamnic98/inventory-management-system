import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  restoreLocation,
  updateLocation,
  type AddLocationData,
} from '../api/locations'
import type { Location } from '../types/location'

// Central Query Keys
export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  detail: (id: number | string) => [...locationKeys.all, 'detail', String(id)] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all locations
 */
export const useLocations = () => {
  return useQuery<Location[]>({
    queryKey: locationKeys.lists(),
    queryFn: getLocations,
  })
}

/**
 * Fetch a single location by ID
 */
export const useLocation = (id?: number | string) => {
  return useQuery<Location>({
    queryKey: locationKeys.detail(id!),
    queryFn: () => getLocationById(id!),
    enabled: Boolean(id),
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new location
 */
export const useCreateLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newLocation: AddLocationData) => addLocation(newLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

/**
 * Update an existing location
 */
export const useUpdateLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<AddLocationData> }) =>
      updateLocation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(id) })
    },
  })
}

/**
 * Delete a location by ID
 */
export const useDeleteLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

/**
 * Restore an archived location by ID
 */
export const useRestoreLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => restoreLocation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(id) })
    },
  })
}
