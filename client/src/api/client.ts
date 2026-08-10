const BASE_URL = '/api/v1'

// Error Type & Factory
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

// Safe Body Parsing
const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

// Core Request Function
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  // Safely merge headers using native Headers constructor to prevent TS type conflicts
  const headers = new Headers(options.headers)
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  }

  let response: Response

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    throw createAPIError(0, 'Network error. Please check your internet connection.', error)
  }

  const responseBody = await parseResponseBody(response)

  // Handle Error Statuses
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText || 'An error occurred'}`
    let errorData: unknown = responseBody

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

    throw createAPIError(response.status, errorMessage, errorData)
  }

  // Handle Empty Responses
  if (response.status === 204 || responseBody === null) {
    return {} as T
  }

  return responseBody as T
}

// API Client Object
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

export default apiClient
