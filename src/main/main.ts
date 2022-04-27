import { MessageTypes } from '../messages'
import { Operation } from '../operations'
import { ProxytownConfig } from '../types'
import { $proxytown } from './proxytown'
import {
  convertToWorkerScript,
  createMref,
  toSharableToWorker
} from './utils/convert'
import { debug } from './utils/debug'
import { evaluate } from './utils/evaluate'
import { postMessageToWorker } from './utils/postMessageToWorker'
import { isOperation } from './utils/typeCheck'

/**
 * initialize proxytown
 */
async function init() {
  // get proxytown scripts
  const partyScripts = parentWindow.document.querySelectorAll(
    'script[type="text/proxytown"]'
  ) as NodeListOf<HTMLScriptElement>

  debug('scripts to run in proxytown worker:', partyScripts)

  // convert the inline script to worker script
  partyScripts.forEach((partyScript) => {
    if (!partyScript.src) {
      convertToWorkerScript(partyScript)
    }
  })

  // return if no proxytown scripts
  if (partyScripts.length === 0) {
    debug('no scripts to run in proxytown')
    return
  }

  // get config and save in different variable
  if (proxytown && proxytown.debug) {
    // create a set from array
    $proxytown.options.debug = new Set(proxytown.debug)
  }

  // get library location from iframe
  const libraryLocation = location.href.split('/').slice(0, -1).join('/') + '/'
  // save library location in $proxytown
  $proxytown.lib = libraryLocation

  // window is first main thread ref
  createMref(parentWindow) // 0 - window

  // register service worker with lib scope
  await navigator.serviceWorker.register(libraryLocation + 'sw.js', {
    scope: libraryLocation
  })

  debug('proxytown service worker registered 🥳🎉')

  // create worker
  const worker = new Worker(libraryLocation + 'worker.js')
  $proxytown.worker = worker

  /**
   * perform the given operation and send the sharable return value to service worker
   * @param operation
   */
  function handleOperation(operation: Operation) {
    if ($proxytown.options.debug.has(operation.__OP__)) {
      debug('Operation:', operation)
    }

    const returnVal = evaluate(operation)
    const sharableReturnValue = toSharableToWorker(returnVal)
    navigator.serviceWorker!.controller!.postMessage(sharableReturnValue)
  }

  // setup worker to main thread messaging
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (isOperation(event.data)) {
      handleOperation(event.data)
    }
  })

  // setup worker
  const setupMessage: MessageTypes.Setup = {
    type: 'Setup',
    scriptSrcs: [...partyScripts].map((partyScript) => partyScript.src),
    windowKeys: Object.keys(parentWindow)
  }

  postMessageToWorker(setupMessage)
}

// this code runs inside the proxytown iframe
// but the changes need to be done in the parent window
const parentWindow = window.parent

// @ts-ignore
const proxytown = parentWindow.proxytown as ProxytownConfig

// @ts-ignore - make this global for debugging
parentWindow.$proxytown = $proxytown

// init after page load
parentWindow.addEventListener('load', init)
