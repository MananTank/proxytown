import { isMref, isObject } from '../../shared'
import { isOperation } from './typeCheck'
import { useRef } from './useRef'
import { workerProxy } from './workerThreadProxy'

export function evaluate(x: any): any {
  if (!isObject(x)) return x

  if (isMref(x)) return useRef(x.MrefId)

  if (isOperation(x)) {
    switch (x.__OP__) {
      case 'MethodCall': {
        const { args, objId, methodId } = x
        const argValues = args.map((arg) => evaluate(arg))
        const obj = useRef(objId)
        const method = useRef(methodId)

        if (x.newKeyword) {
          return new method.apply(obj, argValues)
        } else {
          return method.apply(obj, argValues)
        }
      }

      case 'FunctionCall': {
        const argValues = x.args.map((arg) => evaluate(arg))
        const fn = useRef(x.fnId)
        if (x.newKeyword) {
          return new fn(...argValues)
        } else {
          return fn(...argValues)
        }
      }

      case 'Get': {
        const { objId, key } = x
        const target = useRef(objId)
        const value = Reflect.get(target, evaluate(key))
        return value
      }

      case 'Set': {
        const { objId, key, value } = x
        const target = useRef(objId)
        return Reflect.set(target, evaluate(key), evaluate(value))
      }

      case 'WorkerObject': {
        return workerProxy(x.WrefId)
      }

      case 'Has': {
        const value = useRef(x.objId)
        return Reflect.has(value, evaluate(x.key))
      }

      case 'Keys': {
        const value = useRef(x.objId)
        return Object.keys(value)
      }

      default: {
        throw new Error('unhandled operation')
      }
    }
  }

  return x
}
