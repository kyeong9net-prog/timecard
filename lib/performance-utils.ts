/**
 * Performance utility functions
 * Throttle and debounce functions for optimizing event handlers
 */

/**
 * Throttle function - limits function calls to once per specified time period
 * Useful for scroll, mousemove, touchmove events
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds (default: 16ms ≈ 60fps)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 16
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (timeSinceLastCall >= delay) {
      lastCall = now
      fn(...args)
    } else {
      // Schedule the call for the remaining time
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn(...args)
        timeoutId = null
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * Debounce function - delays function call until after specified time has elapsed
 * since last invocation. Useful for search inputs, resize events
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * RequestAnimationFrame-based throttle for smooth animations
 * Best for visual updates that need to sync with browser repaints
 * @param fn - Function to throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let latestArgs: Parameters<T> | null = null

  return function throttled(...args: Parameters<T>) {
    latestArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs) {
          fn(...latestArgs)
        }
        rafId = null
        latestArgs = null
      })
    }
  }
}
