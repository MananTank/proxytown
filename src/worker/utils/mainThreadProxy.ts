import { $$type, Operations } from '../../types';
import { proxyMemo } from '../worker';
import { toSharabletoMain } from './convert';
import { evaluate, performInMainThread } from './evaluate';

export type MainThreadProxy = {
	__MrefId__: number;
	__parent__: MainThreadProxy | null;
	__type__: $$type;
};

/**
 * create a proxy for main thread values
 * @param {number} MrefId
 * @returns
 */
export function createMainThreadProxy(
	MrefId: number,
	type: $$type,
	parentProxy: MainThreadProxy | null = null
) {
	if (MrefId in proxyMemo) return proxyMemo[MrefId];

	// @ts-ignore
	const $M$: MainThreadProxy = type === 'function' ? function () {} : {};
	$M$.__MrefId__ = MrefId;
	$M$.__parent__ = parentProxy;
	$M$.__type__ = type;

	const setKeys: Set<string | number | symbol> = new Set(['__MrefId__', '__parent__', 'prototype']);

	const proxy: MainThreadProxy = new Proxy($M$, {
		get(_target, key) {
			// @ts-ignore if the key is set in the target object
			if (setKeys.has(key)) return _target[key];

			const operation: Operations.Get = {
				__OP__: 'Get',
				objId: MrefId,
				key: toSharabletoMain(key),
			};

			// give the proxy as parent because if a proxy for foo.bar is created
			// then foo should be it's parent proxy
			return evaluate(operation, proxy);
		},

		set(_target, key, value) {
			const operation: Operations.Set = {
				__OP__: 'Set',
				objId: MrefId,
				key: toSharabletoMain(key),
				value: toSharabletoMain(value),
			};

			// use perform instead of evaluate because we don't care about the return value
			// we use the return value from the setting the value in the target itself
			performInMainThread(operation);

			// actually set the key on proxy object
			setKeys.add(key);
			return Reflect.set(_target, key, value);
		},

		apply(_target, _thisArg, args) {
			return handleMainThreadProxyCall(proxy, args);
		},

		has(_target, key) {
			if (setKeys.has(key)) return true;
			const operation: Operations.Has = {
				__OP__: 'Has',
				objId: MrefId,
				key: toSharabletoMain(key),
			};

			return evaluate(operation, parentProxy);
		},

		ownKeys(target) {
			const operation: Operations.Keys = {
				__OP__: 'Keys',
				objId: MrefId,
			};

			const keys = evaluate(operation, null);
			return keys;
		},

		getOwnPropertyDescriptor(target, prop) {
			return {
				enumerable: true,
				configurable: true,
			};
		},

		construct(_target, args) {
			return handleMainThreadProxyCall(proxy, args, true);
		},
	});

	proxyMemo[MrefId] = proxy;
	return proxy;
}

/**
 * create MethodCall or FunctionCall operation with appropriate new keyword
 * and evaluate in main thread and return the result
 */
function handleMainThreadProxyCall(proxy: MainThreadProxy, args: any[], newKeyword = false) {
	const sharableArgs = args.map(toSharabletoMain);

	if (proxy.__parent__) {
		const methodCallOperation: Operations.MethodCall = {
			__OP__: 'MethodCall',
			objId: proxy.__parent__.__MrefId__,
			methodId: proxy.__MrefId__,
			args: sharableArgs,
			newKeyword,
		};

		return evaluate(methodCallOperation, proxy);
	} else {
		const fnCallOoperation: Operations.FunctionCall = {
			__OP__: 'FunctionCall',
			fnId: proxy.__MrefId__,
			args: sharableArgs,
			newKeyword,
		};
		return evaluate(fnCallOoperation, proxy);
	}
}
