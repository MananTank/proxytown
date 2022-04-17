import { $proxytown } from '../globals';
import { debug } from './debug';
import { isHTMLScriptElement } from './typeCheck';

/**
 * if a worker has created a script,
 * it's contents needs to be modified so that the code in it runs inside the worker thread
 */
function handleWorkerScript(script: HTMLScriptElement) {
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

export function useRef(id: number) {
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
