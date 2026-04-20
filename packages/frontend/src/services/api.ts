import type {
  ApiError,
  ApiResponse,
  FolderContent,
  Item,
  TreeNode,
} from '@explorer/shared'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiClientError extends Error {
  public code: string
  public details?: unknown

  constructor(message: string, code: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'ApiClientError'
  }
}

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

export const itemApi = {
  /**
   * Fetches the full folder tree for the left panel.
   * Returns all folders in a nested hierarchy.
   */
  getTree: (): Promise<TreeNode[]> => fetchApi<TreeNode[]>('/v1/items/tree'),

  /**
   * Fetches direct children of a folder using its string path.
   */
  getChildrenByPath: (path: string): Promise<FolderContent> =>
    fetchApi<FolderContent>(`/v1/items/by-path?path=${encodeURIComponent(path)}`),

  /**
   * Searches for items by name across the entire structure.
   * Accepts an AbortSignal for cancelling stale in-flight requests.
   */
  search: (query: string, signal?: AbortSignal): Promise<Item[]> =>
    fetchApi<Item[]>(`/v1/items/search?q=${encodeURIComponent(query)}`, {
      signal,
    }),
}
