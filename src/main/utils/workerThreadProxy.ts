import { MessageTypes } from '../../types';
import { $proxytown } from '../globals';
import { toSharableToWorker } from './toSharableToWorker';

// @ts-ignore
const $w$: WorkerProxy = function () {};
const IS_WORKER_PROXY = Symbol();

type WorkerProxy = Function & {
	[IS_WORKER_PROXY]: true;
};

export function workerProxy(WrefId: number, path: (string | number | symbol)[] = []) {
	const proxy: WorkerProxy = new Proxy($w$, {
		get(_target, key) {
			if (key === IS_WORKER_PROXY) return true;
			return workerProxy(WrefId, [...path, key]);
		},

		set(_target, key, value) {
			const setInWorkerMessage: MessageTypes.WorkerSet = {
				type: 'WorkerSet',
				WrefId: WrefId,
				path: [...path, key].map(toSharableToWorker),
				value: toSharableToWorker(value),
			};

			$proxytown.worker.postMessage(setInWorkerMessage);
			return true;
		},

		apply(target, thisArg, args) {
			const msg: MessageTypes.WorkerFnCall = {
				type: 'WorkerFnCall',
				WrefId: WrefId,
				path: path.map(toSharableToWorker),
				args: args.map(toSharableToWorker),
			};

			$proxytown.worker.postMessage(msg);
		},
	});

	return proxy;
}

export function isWorkerProxy(value: any) {
	return value && value[IS_WORKER_PROXY];
}
