import { SharableToWorker } from '../../types';
import { toUsableInWorker } from './convert';

/**
 * return the value that is targetted by the path in given object
 */
export function getPathTarget(obj: object, path: SharableToWorker[]): any {
	return path.reduce((acc, key) => {
		const usableKey = toUsableInWorker(key, null);
		// @ts-ignore
		return acc[usableKey];
	}, obj);
}
