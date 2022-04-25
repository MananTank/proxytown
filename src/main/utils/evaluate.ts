import { isMref } from '../../shared'
import { isOperation } from './typeCheck'
import { useMref } from './useMref'
import { workerProxy } from './workerThreadProxy'

/**
 * evaluate the value in main thread
 * if the value is a Mref, return the value of Mref
 * if the value is an operation, perform the operation in main thread and return the return value of operation
 * else - return the value as is
 */
export function evaluate(x: any): any {
  // main thread ref
  if (isMref(x)) return useMref(x.MrefId)

  // operation
  if (isOperation(x)) {
    switch (x.__OP__) {
      case 'MethodCall': {
        const { args, objId, methodId } = x
        const argValues = args.map((arg) => evaluate(arg))
        const obj = useMref(objId)
        const method = useMref(methodId)

        if (x.newKeyword) {
          return new method.apply(obj, argValues)
        } else {
          return method.apply(obj, argValues)
        }
      }

      case 'FunctionCall': {
        const argValues = x.args.map((arg) => evaluate(arg))
        const fn = useMref(x.fnId)
        if (x.newKeyword) {
          return new fn(...argValues)
        } else {
          return fn(...argValues)
        }
      }

      case 'Get': {
        const { objId, key } = x
        const target = useMref(objId)
        const value = Reflect.get(target, evaluate(key))
        return value
      }

      case 'Set': {
        const { objId, key, value } = x
        const target = useMref(objId)
        return Reflect.set(target, evaluate(key), evaluate(value))
      }

      case 'WorkerObject': {
        return workerProxy(x.WrefId)
      }

      case 'Has': {
        const value = useMref(x.objId)
        return Reflect.has(value, evaluate(x.key))
      }

      case 'Keys': {
        const value = useMref(x.objId)
        return Object.keys(value)
      }

      default: {
        throw new Error('unhandled operation')
      }
    }
  }

  // other
  return x
}
