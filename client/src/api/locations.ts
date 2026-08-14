import { apiClient, isAPIError } from './client'
import type { Location, LocationSubscription } from '../types'

export type AddLocationData = {
  label: string
  type?: string
  parentId?: number | null
  isPrivate: boolean
  description?: string
}

// ---------------------------------------------------------------------------
// Core Location Operations
// ---------------------------------------------------------------------------

export const getLocations = async (): Promise<Location[]> => {
  return apiClient.get<Location[]>('/locations')
}

export const getLocationById = async (locationId: number | string): Promise<Location> => {
  return apiClient.get<Location>(`/locations/${locationId}`)
}

export const addLocation = async (locationData: AddLocationData): Promise<Location> => {
  return apiClient.post<Location>('/locations', locationData)
}

export const updateLocation = async (
  locationId: number | string,
  locationData: Partial<AddLocationData>
): Promise<Location> => {
  return apiClient.patch<Location>(`/locations/${locationId}`, locationData)
}

export const deleteLocation = async (locationId: number | string): Promise<void> => {
  await apiClient.delete(`/locations/${locationId}`)
}

export const restoreLocation = async (locationId: number | string): Promise<Location> => {
  return apiClient.post<Location>(`/locations/${locationId}/restore`)
}

// ---------------------------------------------------------------------------
// Location Subscription Operations
// ---------------------------------------------------------------------------

export const getLocationSubscription = async (
  locationId: number | string
): Promise<LocationSubscription | null> => {
  try {
    return await apiClient.get<LocationSubscription>(`/locations/${locationId}/subscription`)
  } catch (error: unknown) {
    if (isAPIError(error) && error.status === 404) {
      return null
    }
    throw error
  }
}

export const upsertLocationSubscription = async (
  locationId: number | string,
  subscriptionData: Partial<LocationSubscription>
): Promise<LocationSubscription> => {
  return apiClient.put<LocationSubscription>(
    `/locations/${locationId}/subscription`,
    subscriptionData
  )
}

export const deleteLocationSubscription = async (locationId: number | string): Promise<void> => {
  await apiClient.delete(`/locations/${locationId}/subscription`)
}
