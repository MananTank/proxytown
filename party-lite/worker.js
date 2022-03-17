// worker thread

let dataFromMain;
const workerRefs = [];

function isObj(v) {
	return typeof v === 'object' && v !== null;
}

function isNotPrimitive(v) {
	return isObj(v) || typeof v === 'function';
}

/**
 * evaluate exprStr in main thread and return the reurned value
 * @param {string} exprStr
 * @returns {string}
 */
function evaluate(exprStr) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', `/party-lite-get?get=${exprStr}`, false);
	xhr.send();
	return xhr.response;
	// if (xhr.status === 200) {
	// return xhr.response;
	// } else {
	// 	throw new Error('Evaluation failed in main thread');
	// }
}

const proxyMemo = {};

/**
 *
 * @param {any} id
 * @returns
 */
function toWorkerRef(id) {
	// is proxy
	if (id && id[INFO]) {
		// return path
		return id[INFO];
	} else if (typeof id === 'function') {
		// if function
		// create a workerRef of type 'fn'
		workerRefs.push(id);
		return [{ workerRefIndex: workerRefs.length - 1, type: 'fn' }];
	} else {
		// other
		return id;
	}
}

/**
 * get value of given expression from main thread
 * @param {any[]} expr
 * @returns
 */
function getter(expr) {
	const exprStr = JSON.stringify(expr);
	if (exprStr in proxyMemo) {
		return proxyMemo[exprStr];
	}
	return evaluate(exprStr);
}

function setter(expr, key, value) {
	const actions = [...expr, { set: key, value: toWorkerRef(value) }];
	return evaluate(JSON.stringify(actions));
}

function returnVal(value, path) {
	if (value.includes('refIndex')) {
		const newPath = [{ refIndex: JSON.parse(value).refIndex }];
		const pathStr = JSON.stringify(newPath);
		if (pathStr in proxyMemo) {
			return proxyMemo[pathStr];
		}
		const prox = createContextProxy(newPath);
		proxyMemo[pathStr] = prox;
		return prox;
	} else {
		return value;
	}
}

var INFO = Symbol();

function createContextProxy(path = []) {
	const $$$ = function () {};
	const proxy = new Proxy($$$, {
		get(target, key) {
			if (key === INFO) return path;
			const subPath = [...path, { get: key }];
			const value = getter(subPath);
			return returnVal(value, subPath);
		},

		set(_target, key, value) {
			return setter(path, key, value);
		},

		apply(target, _thisArg, args) {
			const $args = args.map(toWorkerRef);
			const value = getter([...path, { apply: $args }]);
			console.log('apply:', path);
			return returnVal(value, path);
		},
		has(_target, key) {
			if (key === INFO) return true;
			const target = getter(path);
			if (!target) return false;
			return key in target;
		},
	});

	return proxy;
}

const global = this;
const proxy = createContextProxy([]);

function setup(data) {
	// set getter and setters for globals of main thread in worker thread
	data.windowKeys.forEach(windowKey => {
		// ignore globals that are also available in worker
		if (windowKey in global) return;

		Object.defineProperty(global, windowKey, {
			enumerable: true,
			get() {
				return proxy[windowKey];
			},
			set() {
				console.log('writing to global');
			},
		});
	});

	// load party scripts in worker
	importScripts(...data.scripts);
}

addEventListener('message', event => {
	if (event.data.type === 'setup') {
		setup(event.data);
	} else if (event.data.type === 'call') {
		const argProxies = event.data.args.map(arg => {
			return createContextProxy([JSON.parse(arg)]);
		});

		console.log('create args', argProxies);
		workerRefs[event.data.workerRefIndex](...argProxies);
	}
});
