import { Operation } from '../../operations'
import { isObject } from '../../shared'

/**
 * check if the given value is a script element
 */
export function isHTMLScriptElement(v: any): v is HTMLScriptElement {
  return isObject(v) && v.constructor.name === 'HTMLScriptElement'
}

/**
 * check if the given value is an operation
 */
export function isOperation(v: any): v is Operation {
  return isObject(v) && '__OP__' in v
}
