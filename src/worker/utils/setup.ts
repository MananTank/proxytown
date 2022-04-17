import { MessageTypes } from '../../types';
import { createMainThreadProxy, MainThreadProxy } from './mainThreadProxy';

export function setupWorker(message: MessageTypes.Setup) {
	const windowProxy = createMainThreadProxy(0, 'object');

	const { scriptSrcs, windowKeys } = message;

	// set getter and setters for globals of main thread in worker thread
	windowKeys.forEach(windowKey => {
		// ignore globals that are also available in worker
		if (windowKey in globalThis) {
			return;
		}

		// using getter and setter so that primitive globals
		// can also be intercepted
		Object.defineProperty(globalThis, windowKey, {
			enumerable: true,
			get() {
				// @ts-ignore
				return windowProxy[windowKey] as MainThreadProxy;
			},
			set(value) {
				// @ts-ignore
				windowProxy[windowKey] = value;
			},
		});
	});

	// run proxytown scripts in worker thread
	importScripts(...scriptSrcs);
}
