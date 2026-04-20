import { Item, FolderContent, ItemTree } from "../models/item.model";

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
  getFolderContents(id: string | null, limit?: number, offset?: number): Promise<FolderContent>;

  /**
   * Fetches the immediate contents of a folder using its resolved path string.
   */
  getFolderContentsByPath(path: string, limit?: number, offset?: number): Promise<FolderContent>;

  /**
   * Searches for items by name across the entire tree.
   */
  searchItems(query: string, pathString?: string): Promise<Item[]>;

  /**
   * Creates a new folder or file.
   * `path` and `depth` are intentionally excluded — they are computed
   * server-side from the parentId to prevent client path injection.
   */
  createItem(
    item: Omit<Item, "id" | "path" | "depth" | "createdAt" | "updatedAt">
  ): Promise<Item>;
}
