(function () {
	'use strict';

	function importScript(url) {
	    const message = {
	        type: 'ImportScript',
	        url: url,
	    };
	    $proxytown.worker.postMessage(message);
	}
	//  @ts-ignore
	const $proxytown = {
	    Mrefs: [],
	    refToIdMap: new Map(),
	    importScript,
	    options: {
	        lib: '/proxytown',
	        debug: true,
	    },
	};

	function isObject(v) {
	    return typeof v === 'object' && v !== null;
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
	 * create an Mref object for given value
	 */
	function createMref(value) {
	    const { refToIdMap, Mrefs } = $proxytown;
	    // if ref already created, use that
	    if (refToIdMap.has(value)) {
	        return {
	            MrefId: refToIdMap.get(value),
	            type: $typeof(value),
	        };
	    }
	    Mrefs.push(value);
	    const id = Mrefs.length - 1;
	    refToIdMap.set(value, id);
	    return {
	        MrefId: id,
	        type: $typeof(value),
	    };
	}

	function debug(...args) {
	    if ($proxytown.options.debug) {
	        console.debug('%c🎉', 'background: blue; padding: 2px; border-radius: 5px;', ...args);
	    }
	}

	function isHTMLScriptElement(v) {
	    return isObject(v) && v.constructor.name === 'HTMLScriptElement';
	}
	function isOperation(v) {
	    return isObject(v) && '__OP__' in v;
	}

	/**
	 * if a worker has created a script,
	 * it's contents needs to be modified so that the code in it runs inside the worker thread
	 */
	function handleWorkerScript(script) {
	    // create a script file
	    const file = new Blob([`$proxytown.importScript("${script.src}")`], {
	        type: 'application/javascript',
	    });
	    const blobURL = URL.createObjectURL(file);
	    debug('created script:', script.src);
	    // change the src of the script to point to the blob file
	    script.src = blobURL;
	    // @ts-ignore - mark this script as processed
	    script.$$processed = true;
	}
	function useRef(id) {
	    const value = $proxytown.Mrefs[id];
	    // even script's ref is created,  check this every time because it may not have the src set
	    // if worker wants a reference to a script element that is not added to document yet
	    // that script shoud be executed in the worker thread
	    if (isHTMLScriptElement(value)) {
	        if (!value.isConnected && value.src && !('$$processed' in value)) {
	            handleWorkerScript(value);
	        }
	    }
	    return value;
	}

	/**
	 * create main thread ref for non sharable values and share the ref object instead
	 */
	function toSharableToWorker(value) {
	    // TODO: if a worker proxy, convert to worker ref
	    // if (Array.isArray(value)) {
	    // 	return value.map(toSharableToWorker);
	    // }
	    if (isNotSharable(value)) {
	        return createMref(value);
	    }
	    return value;
	}

	// @ts-ignore
	const $w$ = function () { };
	const IS_WORKER_PROXY = Symbol();
	function workerProxy(WrefId, path = []) {
	    const proxy = new Proxy($w$, {
	        get(_target, key) {
	            if (key === IS_WORKER_PROXY)
	                return true;
	            return workerProxy(WrefId, [...path, key]);
	        },
	        set(_target, key, value) {
	            const setInWorkerMessage = {
	                type: 'WorkerSet',
	                WrefId: WrefId,
	                path: [...path, key].map(toSharableToWorker),
	                value: toSharableToWorker(value),
	            };
	            $proxytown.worker.postMessage(setInWorkerMessage);
	            return true;
	        },
	        apply(target, thisArg, args) {
	            const msg = {
	                type: 'WorkerFnCall',
	                WrefId: WrefId,
	                path: path.map(toSharableToWorker),
	                args: args.map(toSharableToWorker),
	            };
	            $proxytown.worker.postMessage(msg);
	        },
	    });
	    return proxy;
	}

	function evaluate(x) {
	    if (!isObject(x))
	        return x;
	    if (isMref(x))
	        return useRef(x.MrefId);
	    if (isOperation(x)) {
	        switch (x.__OP__) {
	            case 'MethodCall': {
	                const { args, objId, methodId } = x;
	                const argValues = args.map(arg => evaluate(arg));
	                const obj = useRef(objId);
	                const method = useRef(methodId);
	                if (x.newKeyword) {
	                    return new method.apply(obj, argValues);
	                }
	                else {
	                    return method.apply(obj, argValues);
	                }
	            }
	            case 'FunctionCall': {
	                const argValues = x.args.map(arg => evaluate(arg));
	                const fn = useRef(x.fnId);
	                if (x.newKeyword) {
	                    return new fn(...argValues);
	                }
	                else {
	                    return fn(...argValues);
	                }
	            }
	            case 'Get': {
	                const { objId, key } = x;
	                const target = useRef(objId);
	                const value = Reflect.get(target, evaluate(key));
	                debug(value);
	                return value;
	            }
	            case 'Set': {
	                const { objId, key, value } = x;
	                const target = useRef(objId);
	                return Reflect.set(target, evaluate(key), evaluate(value));
	            }
	            case 'WorkerObject': {
	                return workerProxy(x.WrefId);
	            }
	            case 'Has': {
	                const value = useRef(x.objId);
	                return Reflect.has(value, evaluate(x.key));
	            }
	            case 'Keys': {
	                const value = useRef(x.objId);
	                return Object.keys(value);
	            }
	            default: {
	                throw new Error('unhandled operation');
	            }
	        }
	    }
	    return x;
	}

	// this code runs inside the proxytown iframe
	// but the changes need to be done in the parent window
	const parentWindow = window.parent;
	// @ts-ignore - make this global for debugging
	parentWindow.$proxytown = $proxytown;
	async function init() {
	    // get proxytown scripts
	    const partyScripts = parentWindow.document.querySelectorAll('script[type="text/proxytown"]');
	    // return if no proxytown scripts
	    if (partyScripts.length === 0)
	        return;
	    // get config and save to options if any
	    // @ts-ignore
	    if (parentWindow.proxytownConfig) {
	        // @ts-ignore
	        const config = parentWindow.proxytownConfig;
	        if ('debug' in config) {
	            $proxytown.options.debug = config.debug;
	        }
	    }
	    // get library location from iframe href and save to options
	    const libraryLocation = location.href.slice(0, -1 * 'proxytown'.length);
	    $proxytown.options.lib = libraryLocation;
	    debug('found proxytown scripts :', partyScripts);
	    // window is first main thread ref
	    createMref(parentWindow); // 0 - window
	    // register service worker with lib scope
	    await navigator.serviceWorker.register(libraryLocation + 'sw.js', {
	        scope: libraryLocation,
	    });
	    debug('proxytown service worker registered 🥳🎉');
	    // create worker
	    const worker = new Worker(libraryLocation + 'worker.js');
	    $proxytown.worker = worker;
	    /**
	     * perform the given operation and send the sharable return value to service worker
	     * @param operation
	     */
	    function handleOperation(operation) {
	        debug('Operation:', operation);
	        const returnVal = evaluate(operation);
	        const sharableReturnValue = toSharableToWorker(returnVal);
	        navigator.serviceWorker.controller.postMessage(sharableReturnValue);
	    }
	    // setup worker to main thread messaging
	    navigator.serviceWorker.addEventListener('message', event => {
	        if (isOperation(event.data)) {
	            handleOperation(event.data);
	        }
	    });
	    // setup worker
	    const setupMessage = {
	        type: 'Setup',
	        scriptSrcs: [...partyScripts].map(s => s.src),
	        windowKeys: Object.keys(parentWindow),
	        options: $proxytown.options,
	    };
	    worker.postMessage(setupMessage);
	}
	// init after page load
	parentWindow.addEventListener('load', init);

})();
