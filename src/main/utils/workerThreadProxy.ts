import { MessageTypes } from '../../types'
import { $proxytown } from '../proxytown'
import { toSharableToWorker } from './toSharableToWorker'

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-function
const $w$: WorkerProxy = function () {}

type WorkerProxy = Function

export function workerProxy(
  WrefId: number,
  path: (string | number | symbol)[] = []
) {
  const proxy: WorkerProxy = new Proxy($w$, {
    get(_target, key) {
      return workerProxy(WrefId, [...path, key])
    },

    set(_target, key, value) {
      const setInWorkerMessage: MessageTypes.WorkerSet = {
        type: 'WorkerSet',
        WrefId,
        path: [...path, key].map(toSharableToWorker),
        value: toSharableToWorker(value)
      }

      $proxytown.worker.postMessage(setInWorkerMessage)
      return true
    },

    apply(target, thisArg, args) {
      const msg: MessageTypes.WorkerFnCall = {
        type: 'WorkerFnCall',
        WrefId,
        path: path.map(toSharableToWorker),
        args: args.map(toSharableToWorker)
      }

      $proxytown.worker.postMessage(msg)
    }
  })

  return proxy
}
