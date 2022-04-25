import { $proxytown } from '../proxytown'

/**
 * prettier debug logs
 */
export function debug(...args: any[]) {
  if ($proxytown.options.debug) {
    console.debug(
      '%c🎉',
      'background: blue; padding: 2px; border-radius: 5px;',
      ...args
    )
  }
}
