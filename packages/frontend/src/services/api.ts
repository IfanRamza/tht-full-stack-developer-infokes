import type { ApiResponse, ApiError } from '@explorer/shared'

const BASE_URL = '/api/v1'

/**
 * Custom error class for API failures
 */
export class ApiClientError extends Error {
  public code: string
  public details?: any

  constructor(message: string, code: string, details?: any) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'ApiClientError'
  }
}

/**
 * Core wrapper around the Fetch API that handles 
 * authentication, response unwrapping, and error parsing.
 */
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const json = await response.json()

  if (!response.ok || json.success === false) {
    const errorJson = json as ApiError
    throw new ApiClientError(
      errorJson.error?.message || 'Unknown API Error',
      errorJson.error?.code || 'UNKNOWN_ERROR',
      errorJson.error?.details
    )
  }

  const successJson = json as ApiResponse<T>
  return successJson.data
}

/**
 * API Service for Item-related operations
 */
export const itemApi = {
  /**
   * Fetches the hierarchical folder tree
   */
  getTree: () => fetchApi<any[]>('/items/tree'),

  /**
   * Fetches direct children of a specific folder
   */
  getChildren: (id: string) => fetchApi<any[]>(`/items/${id}/children`),

  /**
   * Searches for items by name
   */
  search: (query: string) => fetchApi<any[]>(`/items/search?query=${encodeURIComponent(query)}`),
}
