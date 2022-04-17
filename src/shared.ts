export const SCRIPT = '__SCRIPT__';
export const EVAL = '__EVAL__';
import { $$type, Mref, Operations } from './types';

export function isObject(v: any): v is object {
	return typeof v === 'object' && v !== null;
}

export function isWref(value: any): value is Operations.WorkerObject {
	// @ts-ignore
	return isObject(value) && value.__OP__ === 'WorkerObject';
}

export function isMref(v: any): v is Mref {
	return isObject(v) && 'MrefId' in v;
}

// functions, objects and symbols are not sharable
export function isNotSharable(v: any): v is Function | object | symbol {
	return isObject(v) || typeof v === 'function' || typeof v === 'symbol';
}

export function $typeof(value: any): $$type {
	if (isObject(value)) {
		return 'object';
	} else if (typeof value === 'function') return 'function';
	return 'primitive';
}
