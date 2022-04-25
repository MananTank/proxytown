import { $proxytown } from '../proxytown'
import { convertToWorkerScript } from './convert'
import { isHTMLScriptElement } from './typeCheck'

/**
 * always use a main thread ref via this method so that
 * to intercept script injections
 *
 * if a disconnected script is referenced in reference, convert it to a worker script
 * so that it's code executes in a worker thread
 */
export function useMref(id: number) {
  const value = $proxytown.Mrefs[id]

  if (
    isHTMLScriptElement(value) &&
    !value.isConnected &&
    !('$$processed' in value)
  ) {
    const hasSrc = Boolean(value.src)
    const hasInlineCode = Boolean(value.textContent!.replace(/\s/, ''))
    if (hasSrc || hasInlineCode) {
      convertToWorkerScript(value)
    }
  }

  return value
}
