var proxytownWorker = (function (exports) {
	'use strict';

	const EVAL = '__EVAL__';
	function isObject(v) {
	    return typeof v === 'object' && v !== null;
	}
	function isWref(value) {
	    // @ts-ignore
	    return isObject(value) && value.__OP__ === 'WorkerObject';
	}
	function isMref(v) {
	    return isObject(v) && 'MrefId' in v;
	}
	// functions, objects and symbols are not sharable
	function isNotSharable(v) {
	    return isObject(v) || typeof v === 'function' || typeof v === 'symbol';
	}
	function $typeof(value) {
	    if (isObject(value)) {
	        return 'object';
	    }
	    else if (typeof value === 'function')
	        return 'function';
	    return 'primitive';
	}

	/**
	 * convert the operation to string
	 * perform the operation in main thread and get the raw response
	 * parse the serialized Response
	 * convert it to usable value in worker
	 */
	function evaluate(operation, parentProxy) {
	    const serializedResp = performInMainThread(operation);
	    if (serializedResp === '')
	        return undefined;
	    const value = JSON.parse(serializedResp);
	    return toUsableInWorker(value, parentProxy);
	}
	/**
	 * perform the given operation in main thread and return the raw result
	 */
	function performInMainThread(operation) {
	    const operationStr = JSON.stringify(operation);
	    var xhr = new XMLHttpRequest();
	    const requestURL = EVAL;
	    xhr.open('POST', requestURL, false);
	    xhr.send(operationStr);
	    if (xhr.status !== 200)
	        throw new Error(`service worker did not respond to evalulate: ${operationStr} from ${requestURL}`);
	    return xhr.response;
	}

	/**
	 * create a proxy for main thread values
	 * @param {number} MrefId
	 * @returns
	 */
	function createMainThreadProxy(MrefId, type, parentProxy = null) {
	    if (MrefId in proxyMemo)
	        return proxyMemo[MrefId];
	    // @ts-ignore
	    const $M$ = type === 'function' ? function () { } : {};
	    $M$.__MrefId__ = MrefId;
	    $M$.__parent__ = parentProxy;
	    $M$.__type__ = type;
	    const setKeys = new Set(['__MrefId__', '__parent__', 'prototype']);
	    const proxy = new Proxy($M$, {
	        get(_target, key) {
	            // @ts-ignore if the key is set in the target object
	            if (setKeys.has(key))
	                return _target[key];
	            const operation = {
	                __OP__: 'Get',
	                objId: MrefId,
	                key: toSharabletoMain(key),
	            };
	            // give the proxy as parent because if a proxy for foo.bar is created
	            // then foo should be it's parent proxy
	            return evaluate(operation, proxy);
	        },
	        set(_target, key, value) {
	            const operation = {
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
	            if (setKeys.has(key))
	                return true;
	            const operation = {
	                __OP__: 'Has',
	                objId: MrefId,
	                key: toSharabletoMain(key),
	            };
	            return evaluate(operation, parentProxy);
	        },
	        ownKeys(target) {
	            const operation = {
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
	function handleMainThreadProxyCall(proxy, args, newKeyword = false) {
	    const sharableArgs = args.map(toSharabletoMain);
	    if (proxy.__parent__) {
	        const methodCallOperation = {
	            __OP__: 'MethodCall',
	            objId: proxy.__parent__.__MrefId__,
	            methodId: proxy.__MrefId__,
	            args: sharableArgs,
	            newKeyword,
	        };
	        return evaluate(methodCallOperation, proxy);
	    }
	    else {
	        const fnCallOoperation = {
	            __OP__: 'FunctionCall',
	            fnId: proxy.__MrefId__,
	            args: sharableArgs,
	            newKeyword,
	        };
	        return evaluate(fnCallOoperation, proxy);
	    }
	}

	function isMainProxy(value) {
	    return value && typeof value.__MrefId__ === 'number';
	}

	function toSharabletoMain(value) {
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
	function toUsableInWorker(value, parentProxy) {
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
	function createWref(value) {
	    workerRefs.push(value);
	    const workerObjectOperation = {
	        __OP__: 'WorkerObject',
	        WrefId: workerRefs.length - 1,
	        type: $typeof(value),
	    };
	    return workerObjectOperation;
	}

	/**
	 * return the value that is targetted by the path in given object
	 */
	function getPathTarget(obj, path) {
	    return path.reduce((acc, key) => {
	        const usableKey = toUsableInWorker(key, null);
	        // @ts-ignore
	        return acc[usableKey];
	    }, obj);
	}

	function setupWorker(message) {
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
	                return windowProxy[windowKey];
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

	const workerRefs = [];
	const proxyMemo = {};
	//@ts-ignore - log from worker instead of main thread
	const $workerConsole = console;
	/**
	 * handle the messages sent by main thread to worker thread
	 */
	function init() {
	    // get messages from main thread
	    self.addEventListener('message', event => {
	        const message = event.data;
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

	exports.$workerConsole = $workerConsole;
	exports.init = init;
	exports.proxyMemo = proxyMemo;
	exports.workerRefs = workerRefs;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

})({});
