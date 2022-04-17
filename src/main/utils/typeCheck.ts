import { isObject } from '../../shared';
import { Operation } from '../../types';

export function isHTMLScriptElement(v: any): v is HTMLScriptElement {
	return isObject(v) && v.constructor.name === 'HTMLScriptElement';
}

export function isOperation(v: any): v is Operation {
	return isObject(v) && '__OP__' in v;
}
