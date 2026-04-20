// Maps file extension to emoji icon
const EXTENSION_MAP: Record<string, string> = {
  pdf: '📄',
  xlsx: '📊',
  docx: '📝',
  exe: '⚙️',
}

// Maps a regex pattern to an emoji icon for multi-extension matching
const PATTERN_MAP: Array<[RegExp, string]> = [
  [/\.(jpg|png|gif|jpeg|webp|svg)$/i, '🖼️'],
  [/\.(mp4|mov|avi|mkv)$/i, '🎬'],
  [/\.(mp3|wav|m3u|flac|ogg)$/i, '🎵'],
  [/\.(zip|rar|7z|tar|gz)$/i, '🗜️'],
]

/**
 * Returns the emoji icon string for a given filename.
 * First checks exact extension, then falls back to regex patterns.
 */
export function getFileEmoji(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (EXTENSION_MAP[ext]) return EXTENSION_MAP[ext]
  for (const [pattern, emoji] of PATTERN_MAP) {
    if (pattern.test(name)) return emoji
  }
  return '📄'
}
