import { Item } from "../models/item.model";

/**
 * The ItemRepository port defines the interface for any database adapter.
 * This ensures the core logic is decoupled from PostgreSQL or Drizzle.
 */
export interface ItemRepository {
  /**
   * Find a single item by its ID.
   */
  findById(id: string): Promise<Item | null>;

  /**
   * Find an item by its parent and name to prevent duplication.
   */
  findByNameAndParentId(
    name: string,
    parentId: string | null,
  ): Promise<Item | null>;

  /**
   * Fetch ALL folders in the database. (Initial load)
   */
  findAllFolders(): Promise<Item[]>;

  /**
   * Fetch immediate children of a specific folder.
   * Use null to fetch root items.
   */
  findChildrenByParentId(
    parentId: string | null,
    limit?: number,
    offset?: number,
    typeFilter?: "file" | "folder",
  ): Promise<{ data: Item[]; total: number }>;

  /**
   * Fetch all descendants (children, grandchildren, etc) using the materialized path.
   */
  findDescendantsByPath(path: string): Promise<Item[]>;

  /**
   * Search for items across the entire structure by name.
   * Returns paginated results consistent with other list endpoints.
   */
  searchByName(
    query: string,
    pathPrefix?: string,
    limit?: number,
    offset?: number,
  ): Promise<{ data: Item[]; total: number }>;

  /**
   * Create a new folder or file.
   * @deprecated Prefer `createWithId()` to avoid a double DB write.
   */
  create(item: Omit<Item, "id" | "createdAt" | "updatedAt">): Promise<Item>;

  /**
   * Create a new item with a caller-supplied UUID.
   * Allows the service to pre-compute the materialized path before inserting,
   * eliminating the need for a second UPDATE round-trip.
   */
  createWithId(item: Omit<Item, "createdAt" | "updatedAt">): Promise<Item>;

  /**
   * Update an existing item (rename, move, etc).
   */
  update(id: string, data: Partial<Item>): Promise<Item>;

  /**
   * Bulk-update the materialized path of all descendants when a folder is moved.
   * Replaces `oldPathPrefix` with `newPathPrefix` in every descendant's path column.
   */
  updateDescendantPaths(
    oldPathPrefix: string,
    newPathPrefix: string,
  ): Promise<void>;

  /**
   * Permanently delete an item (and its children via DB cascade).
   */
  delete(id: string): Promise<void>;
}
