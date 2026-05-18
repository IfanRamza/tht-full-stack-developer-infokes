import { uuidv7 } from "uuidv7";
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

  async searchItems(
    query: string,
    pathString?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Item[]; total: number }> {
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

    return this.itemRepository.searchByName(
      query,
      parentPathPrefix,
      limit,
      offset,
    );
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

    // Pre-generate the UUID so the full materialized path can be computed
    // before touching the database — enables a single atomic INSERT.
    const id = uuidv7();
    const fullPath = parentPath ? `${parentPath}/${id}` : `/${id}`;

    return this.itemRepository.createWithId({
      ...item,
      id,
      path: fullPath,
      depth,
    });
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Item with id '${id}' not found`);
    }
    await this.itemRepository.delete(id);
  }

  async updateItem(
    id: string,
    data: { name?: string; parentId?: string | null },
  ): Promise<Item> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Item with id '${id}' not found`);
    }

    const patch: Partial<Item> = {};
    const isRename = data.name !== undefined && data.name !== item.name;
    const isMove =
      data.parentId !== undefined && data.parentId !== item.parentId;

    // ── Rename validation ──────────────────────────────────────────────────
    if (isRename) {
      this.validateName(data.name!);
      // Check for name conflict in the target parent (current if not moving)
      const targetParent = isMove ? data.parentId! : item.parentId;
      const conflict = await this.itemRepository.findByNameAndParentId(
        data.name!,
        targetParent,
      );
      if (conflict && conflict.id !== id) {
        throw new ConflictError(
          `An item named '${data.name}' already exists in this location`,
        );
      }
      patch.name = data.name;
    }

    // ── Move logic ─────────────────────────────────────────────────────────
    if (isMove) {
      let newParentPath = "";
      let newDepth = 0;

      if (data.parentId !== null) {
        const newParent = await this.itemRepository.findById(data.parentId!);
        if (!newParent) {
          throw new NotFoundError(
            `Parent with id '${data.parentId}' not found`,
          );
        }
        if (newParent.type !== "folder") {
          throw new ValidationError(
            `Target parent '${data.parentId}' is not a folder`,
          );
        }
        if (newParent.depth >= 30) {
          throw new ValidationError(`Maximum hierarchy depth of 30 exceeded.`);
        }
        newParentPath = newParent.path;
        newDepth = newParent.depth + 1;
      }

      const oldPath = item.path;
      const newPath = newParentPath ? `${newParentPath}/${id}` : `/${id}`;

      patch.parentId = data.parentId ?? null;
      patch.path = newPath;
      patch.depth = newDepth;

      // Bulk-update all descendants so their paths stay consistent
      if (item.type === "folder") {
        await this.itemRepository.updateDescendantPaths(oldPath, newPath);
      }
    }

    return this.itemRepository.update(id, patch);
  }
}
