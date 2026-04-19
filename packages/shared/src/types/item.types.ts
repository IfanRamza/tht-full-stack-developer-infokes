export type ItemType = 'folder' | 'file';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  parentId: string | null;
  path: string;
  depth: number;
  sortOrder: number;
  size: number;
  mimeType: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TreeNode extends Item {
  children: TreeNode[];
}

export interface FolderContents {
  folder: Item;
  children: Item[];
}
