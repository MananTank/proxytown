import { $proxytown } from '../proxytown'
import { convertToWorkerScript } from './convertToWorkerScript'
import { isHTMLScriptElement } from './typeCheck'

export function useRef(id: number) {
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
