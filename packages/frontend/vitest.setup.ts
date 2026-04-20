import { afterEach, vi } from 'vitest'

// Clean up DOM between test cases natively ensuring no variable bleed affects iterations
afterEach(() => {
  vi.clearAllMocks()
})
