import { FolderContent, Item, ItemTree } from "../models/item.model";

/**
 * The ItemService port defines the use cases our application supports.
 * It sits between the REST adapter and the Repository.
 */
export interface ItemService {
  /**
   * Fetches all folders and builds a nested tree structure for the left panel.
   */
  getFolderTree(): Promise<ItemTree[]>;

  /**
   * Fetches the immediate contents of a folder for the right panel.
   * Pass null to get root-level contents.
   */
  getFolderContents(
    id: string | null,
    limit?: number,
    offset?: number,
  ): Promise<FolderContent>;

  /**
   * Fetches the immediate contents of a folder using its resolved path string.
   */
  getFolderContentsByPath(
    path: string,
    limit?: number,
    offset?: number,
  ): Promise<FolderContent>;

  /**
   * Searches for items by name across the entire tree.
   * Returns paginated results with a total count for client-side "load more" logic.
   */
  searchItems(
    query: string,
    pathString?: string,
    limit?: number,
    offset?: number,
  ): Promise<{ data: Item[]; total: number }>;

  /**
   * Creates a new folder or file.
   * `path` and `depth` are intentionally excluded — they are computed
   * server-side from the parentId to prevent client path injection.
   */
  createItem(
    item: Omit<Item, "id" | "path" | "depth" | "createdAt" | "updatedAt">,
  ): Promise<Item>;

  /**
   * Permanently deletes an item and all its descendants (via DB cascade).
   * Throws NotFoundError if the item does not exist.
   */
  deleteItem(id: string): Promise<void>;

  /**
   * Renames or moves an existing item.
   * - Rename: supply a new `name`.
   * - Move:   supply a new `parentId` (null = move to root).
   * Both can be combined in a single call.
   * When moving a folder, all descendant paths are updated atomically.
   */
  updateItem(
    id: string,
    data: { name?: string; parentId?: string | null },
  ): Promise<Item>;
}
