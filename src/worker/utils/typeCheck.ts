import { MainThreadProxy } from './mainThreadProxy';

export function isMainProxy(value: any): value is MainThreadProxy {
	return value && typeof value.__MrefId__ === 'number';
}
