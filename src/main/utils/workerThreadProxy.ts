import { MessageTypes } from '../../messages'
import { toSharableToWorker } from './convert'
import { postMessageToWorker } from './postMessageToWorker'

type WorkerProxy = Function

const $w$: WorkerProxy = function () {}

/**
 * create a proxy for a worker object so that we can intercept get, set and apply operations on it
 */
export function workerProxy(
  WrefId: number,
  path: (string | number | symbol)[] = []
) {
  const proxy: WorkerProxy = new Proxy($w$, {
    get(_target, key) {
      return workerProxy(WrefId, [...path, key])
    },

    set(_target, key, value) {
      const msg: MessageTypes.WorkerSet = {
        type: 'WorkerSet',
        WrefId,
        path: [...path, key].map(toSharableToWorker),
        value: toSharableToWorker(value)
      }

      postMessageToWorker(msg)
      return true
    },

    apply(_target, _thisArg, args) {
      const msg: MessageTypes.WorkerFnCall = {
        type: 'WorkerFnCall',
        WrefId,
        path: path.map(toSharableToWorker),
        args: args.map(toSharableToWorker)
      }

      postMessageToWorker(msg)
    }
  })

  return proxy
}
