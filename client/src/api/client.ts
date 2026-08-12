import axios, { AxiosError, AxiosRequestConfig } from 'axios'

import { BASE_URL, TOKEN_KEY } from '../utils/constants'

// Error Type & Factory (Preserved for full app compatibility)
export interface APIError extends Error {
  readonly status: number
  readonly data?: unknown
}

export const createAPIError = (status: number, message: string, data?: unknown): APIError => {
  const error = new Error(message) as APIError
  error.name = 'APIError'
  Object.defineProperty(error, 'status', { value: status, enumerable: true })
  Object.defineProperty(error, 'data', { value: data, enumerable: true })
  return error
}

export const isAPIError = (error: unknown): error is APIError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { name?: string }).name === 'APIError'
  )
}

// Instantiate Axios Instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Automatically attach Bearer token from localStorage
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor: Normalize errors into custom APIError
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle Network or Abort Errors
    if (!error.response) {
      if (axios.isCancel(error)) {
        throw error
      }
      throw createAPIError(0, 'Network error. Please check your internet connection.', error)
    }

    const status = error.response.status
    const responseBody = error.response.data

    let errorMessage = `HTTP ${status}: ${error.response.statusText || 'An error occurred'}`
    let errorData: unknown = responseBody

    // Parse Error Messages (Matches your previous logic)
    if (responseBody && typeof responseBody === 'object') {
      const obj = responseBody as Record<string, unknown>
      const messageCandidate = obj.error ?? obj.message
      if (typeof messageCandidate === 'string') {
        errorMessage = messageCandidate
      }
      errorData = obj.details ?? obj.errors ?? responseBody
    } else if (typeof responseBody === 'string') {
      errorMessage = responseBody
    }

    // Auto-clear invalid token on 401 Unauthorized
    if (status === 401) {
      // TODO: review
      // localStorage.removeItem(TOKEN_KEY)
    }

    throw createAPIError(status, errorMessage, errorData)
  }
)

// API Client Object
export const apiClient = {
  get: async <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.get<T>(endpoint, config)
    return response.data
  },

  post: async <T>(endpoint: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(endpoint, body, config)
    return response.data
  },

  put: async <T>(endpoint: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.put<T>(endpoint, body, config)
    return response.data
  },

  patch: async <T>(endpoint: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.patch<T>(endpoint, body, config)
    return response.data
  },

  delete: async <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.delete<T>(endpoint, config)
    return response.data
  },
}

export default apiClient
