import type { Item } from '@explorer/shared'

export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    // 1. Sort by type (folder vs file)
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    // 2. Sort alphabetically by name
    return a.name.localeCompare(b.name)
  })
}
