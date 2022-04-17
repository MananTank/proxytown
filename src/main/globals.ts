import { $Proxytown, MessageTypes } from '../types';

function importScript(url: string) {
	const message: MessageTypes.ImportScript = {
		type: 'ImportScript',
		url: url,
	};

	$proxytown.worker.postMessage(message);
}

//  @ts-ignore
export const $proxytown: $Proxytown = {
	Mrefs: [],
	refToIdMap: new Map(),
	importScript,
	options: {
		lib: '/proxytown',
		debug: true,
	},
};
