(function () {
	'use strict';

	function evalScript(code) {
	    $party.worker.postMessage({
	        type: 'run-code',
	        code: code,
	    });
	}

	//  @ts-ignore
	const $party = {
	    Mrefs: [],
	    refToIdMap: new Map(),
	    eval: evalScript,
	};

	const options = {
	    debug: true,
	    lib: '/dist',
	};

	function createMref(value) {
	    // if ref already created, use that
	    if ($party.refToIdMap.has(value)) {
	        return { MrefId: $party.refToIdMap.get(value) };
	    }
	    $party.Mrefs.push(value);
	    const id = $party.Mrefs.length - 1;
	    $party.refToIdMap.set(value, id);
	    return { MrefId: id };
	}

	function debug(...x) {
	    if (options.debug) {
	        console.debug('%cDEBUG', 'color: purple', ...x);
	    }
	}

	const SCRIPT = '__SCRIPT__';

	function isObject(v) {
	    return typeof v === 'object' && v !== null;
	}
	// functions, objects and symbols are not sharable
	function isNotSharable(v) {
	    return isObject(v) || typeof v === 'function' || typeof v === 'symbol';
	}
	function isHTMLScriptElement(v) {
	    return isObject(v) && v.constructor.name === 'HTMLScriptElement';
	}
	function isOperation(v) {
	    return isObject(v) && '__OP__' in v;
	}
	function isMref(v) {
	    return isObject(v) && 'MrefId' in v;
	}

	function getRef(id) {
	    const value = $party.Mrefs[id];
	    // even script's ref is created,  check this every time because it may not have the src set
	    // if worker wants a reference to a script element that is not added to document yet
	    // that script shoud be executed in the worker thread
	    if (isHTMLScriptElement(value)) {
	        if (!value.isConnected && value.src && !value.src.includes(SCRIPT)) {
	            value.src += SCRIPT;
	        }
	    }
	    return value;
	}

	// create a reference for non sharable values
	function toSharable(value) {
	    if (isNotSharable(value)) {
	        return createMref(value);
	    }
	    return value;
	}

	function evaluate(x, worker) {
	    if (!isObject(x))
	        return x;
	    if (isMref(x))
	        getRef(x.MrefId);
	    if (isOperation(x)) {
	        switch (x.__OP__) {
	            case 'MethodCall': {
	                const { args, objId, methodId } = x;
	                const argValues = args.map(arg => evaluate(arg, worker));
	                const obj = getRef(objId);
	                const method = getRef(methodId);
	                return method.apply(obj, argValues);
	            }
	            case 'FunctionCall': {
	                const argValues = x.args.map(arg => evaluate(arg, worker));
	                const fn = getRef(x.fnId);
	                // console.log({ fn });
	                return fn(...argValues);
	            }
	            case 'Get': {
	                const { objId, key } = x;
	                const target = getRef(objId);
	                return Reflect.get(target, evaluate(key, worker));
	            }
	            case 'Set': {
	                const { objId, key, value } = x;
	                const target = getRef(x.objId);
	                return Reflect.set(target, evaluate(key, worker), evaluate(value, worker));
	            }
	            case 'CreateFn': {
	                // create a function in main thread which when called
	                // calls the function in worker thread with given args
	                return (...args) => {
	                    worker.postMessage({
	                        type: 'call',
	                        WrefId: x.WrefId,
	                        args: args.map(toSharable),
	                    });
	                    // can't return the return value without blocking main thread
	                };
	            }
	            default: {
	                throw new Error('invalid operation');
	            }
	        }
	    }
	    return x;
	}

	async function init() {
	    const partyScripts = document.querySelectorAll('script[type="text/party"]');
	    // return if no party scripts
	    if (partyScripts.length === 0)
	        return;
	    // @ts-ignore
	    window.$party = $party;
	    // ref 0 is global object
	    createMref(window);
	    await navigator.serviceWorker.register(options.lib + '/sw.js');
	    // setup worker
	    $party.worker = new Worker(options.lib + '/worker.js');
	    $party.worker.postMessage({
	        type: 'setup',
	        scriptSrcs: [...partyScripts].map(s => s.src),
	        windowKeys: Object.keys(window),
	        options,
	    });
	    // setup worker to main thread message
	    navigator.serviceWorker.addEventListener('message', event => {
	        if (event.data.expr) {
	            handleWorkerRequest(event.data.expr);
	        }
	    });
	    function handleWorkerRequest(expr) {
	        debug(expr);
	        const returnVal = evaluate(expr, $party.worker);
	        const sharableReturnValue = toSharable(returnVal);
	        navigator.serviceWorker.controller.postMessage(sharableReturnValue);
	    }
	}
	window.addEventListener('load', init);

})();
