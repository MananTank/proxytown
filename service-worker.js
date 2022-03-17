// service worker thread
let res;

function perform(action) {
	self.clients.matchAll().then(clients => {
		clients.forEach(client =>
			client.postMessage({
				type: 'action',
				action,
			})
		);
	});

	return new Promise(_res => {
		res = _res;
	});
}

self.addEventListener('fetch', event => {
	if (event.request.url.includes('party-lite-get')) {
		const action = new URL(event.request.url).searchParams.get('get');
		event.respondWith(perform(action));
	} else {
		event.respondWith(fetch(event.request));
	}
});

// in the service worker
addEventListener('message', event => {
	if (event.data.type === 'performed') {
		res(new Response(event.data.returnVal));
	}
});

self.addEventListener('install', function (event) {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
	event.waitUntil(self.clients.claim());
});
