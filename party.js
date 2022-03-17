function partyInit() {
	const partyScripts = document.querySelectorAll('script[type="text/party"]');

	// do nothing if no party scripts
	if (partyScripts.length === 0) return;

	const partyScriptSrcs = [...partyScripts].map(s => s.src);

	const worker = new Worker('party-lite/worker.js');

	const options = {
		debug: true,
	};

	const refs = [];
	window.mainThreadRefs = refs;

	function isObj(v) {
		return typeof v === 'object' && v !== null;
	}

	function isNotPrimitive(v) {
		return isObj(v) || typeof v === 'function';
	}

	function debug(...x) {
		if (options.debug) {
			console.debug(...x);
		}
	}

	function serialize(value, actions = []) {
		if (isNotPrimitive(value)) {
			refs.push({
				val: value,
				actions,
			});

			return JSON.stringify({ refIndex: refs.length - 1 });
		}

		return value;
	}

	function evaluate(actions) {
		return actions.reduce((acc, action, i) => {
			if (action.apply) {
				// debugger;
				const fnRef = refs[actions[i - 1].refIndex];
				const objRef = refs[fnRef.actions[fnRef.actions.length - 2].refIndex];
				const obj = objRef.val;

				const $args = action.apply.map(x => {
					if (Array.isArray(x)) return evaluate(x);
					return x;
				});

				return acc.bind(obj)(...$args);
			} else if ('get' in action) {
				return acc[action.get];
			} else if ('refIndex' in action) {
				return refs[action.refIndex].val;
			} else if ('set' in action) {
				// if non-primitive
				if (Array.isArray(action.value)) {
					acc[action.set] = evaluate(action.value);
				} else {
					acc[action.set] = action.value;
				}
			} else if ('workerRefIndex' in action) {
				if (action.type === 'fn') {
					return (...args) => {
						worker.postMessage({
							type: 'call',
							workerRefIndex: action.workerRefIndex,
							args: args.map(serialize),
						});
					};
				}
			} else {
				debugger;
				throw new Error('unknown action');
			}
		}, window);
	}

	function process(expr) {
		debug(expr);
		const actions = JSON.parse(decodeURIComponent(expr));
		const returnVal = evaluate(actions);
		return serialize(returnVal, actions);
	}

	function onRegister() {
		// setup worker
		worker.postMessage({
			type: 'setup',
			scripts: partyScriptSrcs,
			windowKeys: Object.keys(window),
		});

		// when sw requests to process an expr
		navigator.serviceWorker.addEventListener('message', event => {
			// process and return the serilized returnValue
			navigator.serviceWorker.controller.postMessage({
				type: 'performed',
				returnVal: process(event.data.action),
			});
		});
	}

	navigator.serviceWorker
		.register('/service-worker.js')
		.then(onRegister)
		.catch(err => console.error(`Service Worker Error: ${err}`));
}

window.addEventListener('load', partyInit);
