/// <reference lib="WebWorker" />

import { Operation } from '../operations'
import { EVAL } from '../shared'

export type {}
declare const self: ServiceWorkerGlobalScope

// service worker thread
let resolve: (value: Response | PromiseLike<Response>) => void

// evaluate operation in main thread
function evaluate(operation: Operation) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(operation))
  })
}

// create response
function createResponse(body: string, contentType: string) {
  return new Response(body, {
    headers: {
      'content-type': contentType,
      'Cache-Control': 'no-store'
    }
  })
}

self.oninstall = () => self.skipWaiting()
self.onactivate = () => {
  self.clients.claim()
}

self.onfetch = (event) => {
  // evalulate operation
  if (event.request.url.includes(EVAL)) {
    event.respondWith(
      new Promise(async (_resolve) => {
        const expr = await event.request.clone().json()
        evaluate(expr)
        resolve = _resolve
      })
    )
  }

  // wrap javascript files with try catch
  else if (new URL(event.request.url).pathname.endsWith('.js')) {
    event.respondWith(
      new Promise(async (resolve) => {
        const res = await fetch(event.request.url, { method: 'GET' })
        const text = await res.text()
        resolve(
          createResponse(
            `/* proxytown */ try{\n\n${text}\n\n}catch(error){reportError(error);}`,
            'application/javascript'
          )
        )
      })
    )
  }
}

self.onmessage = (event) => {
  const resp = createResponse(JSON.stringify(event.data), 'application/json')
  resolve(resp)
}
