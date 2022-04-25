import { Operations } from './operations'
import { $$type, Mref } from './types'

/**
 * check if the value is object
 */
export function isObject(v: any): v is object {
  return typeof v === 'object' && v !== null
}

/**
 * check if the value is a worker object ref
 */
export function isWref(value: any): value is Operations.WorkerObject {
  // @ts-ignore
  return isObject(value) && value.__OP__ === 'WorkerObject'
}
/**
 * check if the value is a main thread object ref
 */
export function isMref(v: any): v is Mref {
  return isObject(v) && 'MrefId' in v
}

/**
 * check if the value is sharable to other threads
 * functions, objects and symbols are not sharable
 */
export function isNotSharable(v: any): v is Function | object | symbol {
  return isObject(v) || typeof v === 'function' || typeof v === 'symbol'
}

/**
 * get the type of the value
 * either a value is object, function or a primitive
 */
export function $typeof(value: any): $$type {
  if (isObject(value)) {
    return 'object'
  } else if (typeof value === 'function') {
    return 'function'
  }
  return 'primitive'
}

/**
 * path that represents a operation evalution
 */
export const EVAL = '__EVAL__'
