import { $Proxytown, MessageTypes } from '../types'

function importScript(url: string) {
  const message: MessageTypes.ImportScript = {
    type: 'ImportScript',
    url
  }

  $proxytown.worker.postMessage(message)
}

export const $proxytown: $Proxytown = {
  Mrefs: [],
  refToIdMap: new Map(),
  importScript,
  // @ts-ignore
  worker: null,
  // eval: evalCode,
  options: {
    debug: new Set()
  },
  lib: ''
}
