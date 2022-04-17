import { isNotSharable } from '../../shared';
import { SharableToWorker } from '../../types';
import { createMref } from './createMref';

/**
 * create main thread ref for non sharable values and share the ref object instead
 */
export function toSharableToWorker(value: any): SharableToWorker {
	// TODO: if a worker proxy, convert to worker ref

	// if (Array.isArray(value)) {
	// 	return value.map(toSharableToWorker);
	// }

	if (isNotSharable(value)) {
		return createMref(value);
	}

	return value;
}
