(function () {
	'use strict';

	function isObject(v) {
	    return typeof v === 'object' && v !== null;
	}
	function isMref(v) {
	    return isObject(v) && 'MrefId' in v;
	}

	const EVAL = '__EVAL__';

	/// <reference lib="WebWorker" />
	let options;
	const workerRefs = [];
	const REF_ID = Symbol();
	const PARENT = Symbol();
	const proxyMemo = {};
	// @ts-ignore
	const $$$ = function () { };
	const windowProxy = createProxy(0);
	function isProxy(value) {
	    return typeof value === 'function' && value[REF_ID];
	}
	function toSharabletoMain(value) {
	    // convert proxy to main thread refs
	    if (isProxy(value)) {
	        return { MrefId: value[REF_ID] };
	    }
	    // function to worker thread refs
	    else if (typeof value === 'function') {
	        workerRefs.push(value);
	        return { __OP__: 'CreateFn', WrefId: workerRefs.length - 1 };
	    }
	    // share other values as is
	    else {
	        return value;
	    }
	}
	function perform(operationStr) {
	    var xhr = new XMLHttpRequest();
	    xhr.open('POST', `${options.lib}/${EVAL}`, false);
	    xhr.send(operationStr);
	    return xhr.response;
	}
	/**
	 * convert main thread's returned value to usable value in worker by
	 * converting main thread refs to proxies
	 */
	function proxifyRefs(value, parentProxy) {
	    if (isMref(value)) {
	        return createProxy(value.MrefId, parentProxy);
	    }
	    return value;
	}
	function evaluate(operation, parentProxy) {
	    const operationStr = JSON.stringify(operation);
	    const serializedResp = perform(operationStr);
	    if (serializedResp === '')
	        return undefined;
	    const value = JSON.parse(serializedResp);
	    return proxifyRefs(value, parentProxy);
	}
	/**
	 * create a proxy for main thread value
	 * @param {number} MrefId
	 * @returns
	 */
	function createProxy(MrefId, parentProxy = null) {
	    if (MrefId in proxyMemo)
	        return proxyMemo[MrefId];
	    const proxy = new Proxy($$$, {
	        get(_target, key) {
	            if (key === REF_ID)
	                return MrefId;
	            if (key === PARENT)
	                return parentProxy;
	            const operation = {
	                __OP__: 'Get',
	                objId: MrefId,
	                key: toSharabletoMain(key),
	            };
	            return evaluate(operation, proxy);
	        },
	        set(_target, key, value) {
	            const setOperation = {
	                __OP__: 'Set',
	                objId: MrefId,
	                key: toSharabletoMain(key),
	                value: toSharabletoMain(value),
	            };
	            const operationStr = JSON.stringify(setOperation);
	            perform(operationStr);
	            return true;
	        },
	        apply(_target, _thisArg, args) {
	            const sharableArgs = args.map(toSharabletoMain);
	            let operation;
	            const fnId = MrefId;
	            const objId = parentProxy[REF_ID];
	            if (objId) {
	                operation = { __OP__: 'MethodCall', objId, methodId: fnId, args: sharableArgs };
	            }
	            else {
	                operation = { __OP__: 'FunctionCall', fnId, args: sharableArgs };
	            }
	            return evaluate(operation, proxy);
	        },
	        has(_target, key) {
	            const hasOperation = {
	                __OP__: 'Has',
	                objId: MrefId,
	                key: toSharabletoMain(key),
	            };
	            return evaluate(hasOperation, parentProxy);
	        },
	    });
	    proxyMemo[MrefId] = proxy;
	    return proxy;
	}
	// setup and messaging --------------------------------------------
	function setupWorker(data) {
	    options = data.options;
	    const { scriptSrcs, windowKeys } = data;
	    // set getter and setters for globals of main thread in worker thread
	    windowKeys.forEach(windowKey => {
	        // ignore globals that are also available in worker
	        if (windowKey in globalThis)
	            return;
	        // using getter and setter so that primitive globals
	        // can also be intercepted
	        Object.defineProperty(globalThis, windowKey, {
	            enumerable: true,
	            get() {
	                return windowProxy[windowKey];
	            },
	            set(value) {
	                windowProxy[windowKey] = value;
	            },
	        });
	    });
	    // load party scripts in worker
	    importScripts(...scriptSrcs);
	}
	// get messages from main thread
	self.addEventListener('message', event => {
	    const { type } = event.data;
	    // setup worker
	    if (type === 'setup') {
	        setupWorker(event.data);
	    }
	    // call referenced function in worker
	    else if (type === 'call') {
	        const { args, WrefId } = event.data;
	        const proxiedArgs = args.map(arg => proxifyRefs(arg, null));
	        workerRefs[WrefId](...proxiedArgs);
	    }
	    // can't return returnvalue to main thread
	    else if (type === 'run-code') {
	        const fn = new Function(event.data.code);
	        fn();
	    }
	});

})();
