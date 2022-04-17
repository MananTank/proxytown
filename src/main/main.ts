import { $Proxytown, MessageTypes, Operation } from '../types';
import { $proxytown } from './globals';
import { createMref } from './utils/createMref';
import { debug } from './utils/debug';
import { evaluate } from './utils/evaluate';
import { toSharableToWorker } from './utils/toSharableToWorker';
import { isOperation } from './utils/typeCheck';

// this code runs inside the proxytown iframe
// but the changes need to be done in the parent window
const parentWindow = window.parent;

// @ts-ignore - make this global for debugging
parentWindow.$proxytown = $proxytown;

async function init() {
	// get proxytown scripts
	const partyScripts = parentWindow.document.querySelectorAll(
		'script[type="text/proxytown"]'
	) as NodeListOf<HTMLScriptElement>;

	// return if no proxytown scripts
	if (partyScripts.length === 0) return;

	// get config and save to options if any
	// @ts-ignore
	if (parentWindow.proxytownConfig) {
		// @ts-ignore
		const config = parentWindow.proxytownConfig as $Proxytown['options'];
		if ('debug' in config) {
			$proxytown.options.debug = config.debug;
		}
	}

	// get library location from iframe href and save to options
	const libraryLocation = location.href.slice(0, -1 * 'proxytown'.length);
	$proxytown.options.lib = libraryLocation;

	debug('found proxytown scripts :', partyScripts);

	// window is first main thread ref
	createMref(parentWindow); // 0 - window

	// register service worker with lib scope
	await navigator.serviceWorker.register(libraryLocation + 'sw.js', {
		scope: libraryLocation,
	});

	debug('proxytown service worker registered 🥳🎉');

	// create worker
	const worker = new Worker(libraryLocation + 'worker.js');
	$proxytown.worker = worker;

	/**
	 * perform the given operation and send the sharable return value to service worker
	 * @param operation
	 */
	function handleOperation(operation: Operation) {
		debug('Operation:', operation);
		const returnVal = evaluate(operation);
		const sharableReturnValue = toSharableToWorker(returnVal);
		navigator.serviceWorker!.controller!.postMessage(sharableReturnValue);
	}

	// setup worker to main thread messaging
	navigator.serviceWorker.addEventListener('message', event => {
		if (isOperation(event.data)) {
			handleOperation(event.data);
		}
	});

	// setup worker
	const setupMessage: MessageTypes.Setup = {
		type: 'Setup',
		scriptSrcs: [...partyScripts].map(s => s.src),
		windowKeys: Object.keys(parentWindow),
		options: $proxytown.options,
	};

	worker.postMessage(setupMessage);
}

// init after page load
parentWindow.addEventListener('load', init);
