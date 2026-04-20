import { ITEM_TYPE } from "../constants";

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];

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

export interface FolderContent {
  folder: Item;
  children: Item[];
  totalElements: number;
}
