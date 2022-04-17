(function () {
	'use strict';

	const SCRIPT = '__SCRIPT__';
	const EVAL = '__EVAL__';

	/// <reference lib="WebWorker" />
	// service worker thread
	let resolve;
	// evaluate operation in main thread
	function evaluate(operation) {
	    const msg = {
	        operation,
	    };
	    self.clients.matchAll().then(clients => {
	        clients.forEach(client => client.postMessage(msg));
	    });
	}
	// create response
	function createResponse(body, contentType) {
	    return new Response(body, {
	        headers: {
	            'content-type': contentType,
	            'Cache-Control': 'no-store',
	        },
	    });
	}
	self.oninstall = () => self.skipWaiting();
	self.onactivate = () => self.clients.claim();
	self.onfetch = event => {
	    // evalulate operation
	    if (event.request.url.includes(EVAL)) {
	        event.respondWith(new Promise(async (_response) => {
	            const expr = await event.request.clone().json();
	            evaluate(expr);
	            resolve = _response;
	        }));
	    }
	    // execute script as worker
	    else if (event.request.url.includes(SCRIPT)) {
	        const targetURL = event.request.url.replace(SCRIPT, '');
	        const modifiedRequest = new Request(targetURL, event.request);
	        event.respondWith(fetch(modifiedRequest).then(async (resp) => {
	            const text = await resp.text();
	            const modified = `$party.eval(\`\n${text}\n\`)`;
	            return new Response(modified);
	        }));
	    }
	    // proxy
	    else {
	        event.respondWith(fetch(event.request));
	    }
	};
	self.onmessage = event => {
	    const resp = createResponse(JSON.stringify(event.data), 'application/json');
	    resolve(resp);
	};

})();
