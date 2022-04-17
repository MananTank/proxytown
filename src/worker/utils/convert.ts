import { $typeof, isMref, isNotSharable, isWref } from '../../shared';
import { NonSharable, Operations, SharableToMain } from '../../types';
import { workerRefs } from '../worker';
import { createMainThreadProxy, MainThreadProxy } from './mainThreadProxy';
import { isMainProxy } from './typeCheck';

export function toSharabletoMain(value: any): SharableToMain {
	// convert main thread ref proxy to main thread ref
	if (isMainProxy(value)) {
		// TODO: should be pass parent as well?
		return { MrefId: value.__MrefId__, type: value.__type__ };
	}

	// if already a worker ref, pass it as is
	else if (isWref(value)) {
		return value;
	}

	// is the value is not sharable to other thread, create a worker ref
	else if (isNotSharable(value)) {
		return createWref(value);
	}

	// share the sharable values directly
	return value;
}

/**
 * convert main thread's returned value to usable value in worker by
 * converting main thread refs to proxies
 */
export function toUsableInWorker(value: any, parentProxy: MainThreadProxy | null): any {
	// if (Array.isArray(value)) {
	// 	return value.map(x => toUsableInWorker(x, parentProxy));
	// }

	// create proxy for main thread value
	if (isMref(value)) {
		return createMainThreadProxy(value.MrefId, value.type, parentProxy);
	}

	// use the value directly if a reference to worker value
	else if (isWref(value)) {
		return workerRefs[value.WrefId];
	}

	return value;
}

function createWref(value: NonSharable) {
	workerRefs.push(value);
	const workerObjectOperation: Operations.WorkerObject = {
		__OP__: 'WorkerObject',
		WrefId: workerRefs.length - 1,
		type: $typeof(value),
	};
	return workerObjectOperation;
}
