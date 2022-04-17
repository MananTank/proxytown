/// <reference lib="WebWorker" />
import { MessageType } from '../types';
import { toUsableInWorker } from './utils/convert';
import { getPathTarget } from './utils/getPathTarget';
import { MainThreadProxy } from './utils/mainThreadProxy';
import { setupWorker } from './utils/setup';

export const workerRefs: any[] = [];
export const proxyMemo: Record<string, MainThreadProxy> = {};

//@ts-ignore - log from worker instead of main thread
export const $workerConsole = console;

/**
 * handle the messages sent by main thread to worker thread
 */
export function init() {
	// get messages from main thread
	self.addEventListener('message', event => {
		const message = event.data as MessageType;

		switch (message.type) {
			case 'Setup': {
				setupWorker(message);
				break;
			}

			case 'WorkerFnCall': {
				const { args, WrefId, path } = message;
				const proxiedArgs = args.map(arg => toUsableInWorker(arg, null));
				const ref = workerRefs[WrefId];
				const target = getPathTarget(ref, path);
				target(...proxiedArgs);
				break;
			}

			case 'ImportScript': {
				importScripts(message.url);
				break;
			}
		}
	});
}

init();
