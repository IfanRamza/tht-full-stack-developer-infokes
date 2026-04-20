import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/domain.error";
import { FolderContent, Item, ItemTree } from "../models/item.model";
import { ItemRepository } from "../ports/item-repository.port";
import { ItemService } from "../ports/item-service.port";

export class ItemServiceImpl implements ItemService {
  constructor(private readonly itemRepository: ItemRepository) {}

  private validateName(name: string): void {
    if (!/^[^\/\\:*?"<>|]+$/.test(name)) {
      throw new ValidationError(
        `Invalid item name: '${name}' contains illegal characters.`,
      );
    }
  }

  async getFolderTree(): Promise<ItemTree[]> {
    const flatFolders = await this.itemRepository.findAllFolders();
    const map = new Map<string, ItemTree>();
    const roots: ItemTree[] = [];

    // First pass: create all tree nodes
    for (const folder of flatFolders) {
      map.set(folder.id, { ...folder, children: [] });
    }

    // Second pass: assemble the hierarchy
    for (const folder of flatFolders) {
      const node = map.get(folder.id)!;
      if (folder.parentId === null) {
        roots.push(node);
      } else {
        const parent = map.get(folder.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    return roots;
  }

  async getFolderContents(
    id: string | null,
    limit: number = 50,
    offset: number = 0,
  ): Promise<FolderContent> {
    const [folder, { data: children, total: totalElements }] =
      await Promise.all([
        id ? this.itemRepository.findById(id) : null,
        this.itemRepository.findChildrenByParentId(id, limit, offset),
      ]);

    const folderData = folder ?? {
      id: "root",
      name: "Root",
      type: "folder" as const,
      parentId: null,
      path: "",
      depth: -1,
      sortOrder: 0,
      size: 0,
      mimeType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { folder: folderData, children, totalElements };
  }

  async getFolderContentsByPath(
    pathString: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<FolderContent> {
    const decodedPath = decodeURIComponent(pathString);
    const segments = decodedPath.split("/").filter(Boolean);
    if (segments.length === 0) {
      return this.getFolderContents(null, limit, offset);
    }

    let currentParentId: string | null = null;
    let currentFolder: Item | null = null;

    for (const segment of segments) {
      const found = await this.itemRepository.findByNameAndParentId(
        segment,
        currentParentId,
      );
      if (!found || found.type !== "folder") {
        throw new Error(`Folder path not found: /${decodedPath}`);
      }
      currentFolder = found;
      currentParentId = found.id;
    }

    if (!currentFolder) throw new NotFoundError("Path resolution failed");
    return this.getFolderContents(currentFolder.id, limit, offset);
  }

  async searchItems(query: string, pathString?: string): Promise<Item[]> {
    let parentPathPrefix: string | undefined = undefined;

    if (pathString) {
      const decodedPath = decodeURIComponent(pathString);
      const segments = decodedPath.split("/").filter(Boolean);

      let currentParentId: string | null = null;
      let currentFolder: Item | null = null;

      for (const segment of segments) {
        const found = await this.itemRepository.findByNameAndParentId(
          segment,
          currentParentId,
        );
        if (!found || found.type !== "folder") {
          throw new NotFoundError(`Folder path not found: /${decodedPath}`);
        }
        currentFolder = found;
        currentParentId = found.id;
      }

      if (currentFolder) {
        parentPathPrefix = currentFolder.path;
      }
    }

    return this.itemRepository.searchByName(query, parentPathPrefix);
  }

  async createItem(
    item: Omit<Item, "id" | "path" | "depth" | "createdAt" | "updatedAt">,
  ): Promise<Item> {
    // SECURITY CHECK: Character Validation
    this.validateName(item.name);

    // SECURITY CHECK: Uniqueness
    const existing = await this.itemRepository.findByNameAndParentId(
      item.name,
      item.parentId,
    );
    if (existing) {
      throw new ConflictError(
        `An item named '${item.name}' already exists in this location`,
      );
    }

    let parentPath = "";
    let depth = 0;

    if (item.parentId) {
      const parent = await this.itemRepository.findById(item.parentId);
      if (!parent) {
        throw new NotFoundError(`Parent with id '${item.parentId}' not found`);
      }
      if (parent.depth >= 30) {
        throw new ValidationError(`Maximum hierarchy depth of 30 exceeded.`);
      }
      parentPath = parent.path;
      depth = parent.depth + 1;
    }

    // Insert with a temporary path to get the DB-generated ID
    const created = await this.itemRepository.create({
      ...item,
      path: parentPath,
      depth,
    });

    // Patch with the correct materialized path now that we have the ID
    const fullPath = parentPath
      ? `${parentPath}/${created.id}`
      : `/${created.id}`;

    return this.itemRepository.update(created.id, { path: fullPath });
  }
}
