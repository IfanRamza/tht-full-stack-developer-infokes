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

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as T
  }

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
  getChildrenByPath: (
    path: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<FolderContent> =>
    fetchApi<FolderContent>(
      `/v1/items/by-path?path=${encodeURIComponent(path)}&limit=${limit}&offset=${offset}`
    ),

  /**
   * Searches for items by name, bounded by an optional directory path string.
   * Supports pagination via limit/offset.
   * Accepts an AbortSignal for cancelling stale in-flight requests.
   */
  search: (
    query: string,
    path?: string,
    signal?: AbortSignal,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: Item[]; total: number }> => {
    let url = `/v1/items/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    if (path) url += `&path=${encodeURIComponent(path)}`
    return fetchApi<{ data: Item[]; total: number }>(url, { signal })
  },

  /**
   * Creates a new folder or file.
   * Pass an `idempotencyKey` (e.g. a UUID) to enable safe retries:
   * repeated calls with the same key return the original response.
   */
  createItem: (
    body: { name: string; type: 'folder' | 'file'; parentId: string | null; sortOrder: number; size?: number; mimeType?: string | null },
    idempotencyKey?: string
  ): Promise<Item> => {
    const headers: Record<string, string> = {}
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
    return fetchApi<Item>('/v1/items', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  },

  /**
   * Renames or moves an item. Supply `name` to rename, `parentId` to move.
   */
  updateItem: (
    id: string,
    data: { name?: string; parentId?: string | null }
  ): Promise<Item> =>
    fetchApi<Item>(`/v1/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Permanently deletes an item and all its descendants.
   */
  deleteItem: (id: string): Promise<void> =>
    fetchApi<void>(`/v1/items/${id}`, { method: 'DELETE' }),
}
