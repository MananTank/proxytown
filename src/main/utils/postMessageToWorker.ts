import { MessageType } from '../../messages'
import { $proxytown } from '../proxytown'

export function postMessageToWorker(message: MessageType) {
  $proxytown.worker.postMessage(message)
}
