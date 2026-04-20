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
  findByNameAndParentId(name: string, parentId: string | null): Promise<Item | null>;

  /**
   * Fetch ALL folders in the database.
   * Useful for loading the left-side tree navigation on startup.
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
    typeFilter?: "file" | "folder"
  ): Promise<{ data: Item[]; total: number }>;

  /**
   * Fetch all descendants (children, grandchildren, etc) using the materialized path.
   */
  findDescendantsByPath(path: string): Promise<Item[]>;

  /**
   * Search for items across the entire structure by name.
   */
  searchByName(query: string, pathPrefix?: string): Promise<Item[]>;

  /**
   * Create a new folder or file.
   */
  create(item: Omit<Item, "id" | "createdAt" | "updatedAt">): Promise<Item>;

  /**
   * Update an existing item (rename, move, etc).
   */
  update(id: string, data: Partial<Item>): Promise<Item>;

  /**
   * Permanently delete an item (and its children via DB cascade).
   */
  delete(id: string): Promise<void>;
}
