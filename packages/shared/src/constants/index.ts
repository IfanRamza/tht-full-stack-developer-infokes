export const ITEM_TYPE = {
  FOLDER: 'folder',
  FILE: 'file',
} as const;

export type ItemTypeConstant = typeof ITEM_TYPE[keyof typeof ITEM_TYPE];

export const API_VERSION = 'v1';

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
