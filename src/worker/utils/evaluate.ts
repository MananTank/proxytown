import { Operation } from '../../operations'
import { EVAL } from '../../shared'
import { toUsableInWorker } from './convert'
import { MainThreadProxy } from './mainThreadProxy'

/**
 * convert the operation to string
 * perform the operation in main thread and get the raw response
 * parse the serialized Response
 * convert it to usable value in worker
 */
export function evaluate(
  operation: Operation,
  parentProxy: MainThreadProxy | null
): any {
  const serializedResp = performInMainThread(operation)
  if (serializedResp === '') return undefined
  const value = JSON.parse(serializedResp)
  return toUsableInWorker(value, parentProxy)
}

/**
 * perform the given operation in main thread and return the raw result
 */
export function performInMainThread(operation: Operation) {
  const operationStr = JSON.stringify(operation)
  const xhr = new XMLHttpRequest()
  const requestURL = EVAL
  xhr.open('POST', requestURL, false)
  xhr.send(operationStr)
  if (xhr.status !== 200) {
    throw new Error(
      `service worker did not respond to evalulate: ${operationStr} from ${requestURL}`
    )
  }
  return xhr.response
}
