import { MessageTypes } from '../messages'
import { $Proxytown } from '../types'
import { postMessageToWorker } from './utils/postMessageToWorker'

function importScript(url: string) {
  const message: MessageTypes.ImportScript = {
    type: 'ImportScript',
    url
  }

  postMessageToWorker(message)
}

export const $proxytown: $Proxytown = {
  Mrefs: [],
  refToIdMap: new Map(),
  importScript,
  // @ts-ignore
  worker: null,
  options: {
    debug: new Set()
  },
  lib: ''
}
