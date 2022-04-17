export type $Proxytown = {
	Mrefs: any[];
	worker: Worker;
	refToIdMap: Map<NonSharable, number>;
	importScript: (url: string) => void;
	options: {
		lib: string;
		debug: boolean;
	};
};

export namespace Operations {
	export interface Get {
		__OP__: 'Get';
		key: SharableToMain;
		objId: number;
	}

	export interface Has {
		__OP__: 'Has';
		key: SharableToMain;
		objId: number;
	}

	export interface Keys {
		__OP__: 'Keys';
		objId: number;
	}

	export interface Set {
		__OP__: 'Set';
		key: SharableToMain;
		objId: number;
		value: any;
	}

	export interface WorkerObject {
		__OP__: 'WorkerObject';
		type: $$type;
		WrefId: number;
	}

	export interface MethodCall {
		__OP__: 'MethodCall';
		args: any[];
		objId: number;
		methodId: number;
		newKeyword: boolean;
	}

	export interface ConsoleCall {
		__OP__: 'ConsoleCall';
		args: any[];
		method: string;
	}

	export interface FunctionCall {
		__OP__: 'FunctionCall';
		args: any[];
		fnId: number;
		newKeyword: boolean;
	}
}

export type Operation =
	| Operations.Get
	| Operations.Set
	| Operations.WorkerObject
	| Operations.FunctionCall
	| Operations.MethodCall
	| Operations.Has
	| Operations.Keys
	| Operations.ConsoleCall;

export type Mref = {
	MrefId: number;
	type: $$type;
};

export type Wref = {
	WrefId: number;
};

/**
 * types of messages sent between threads
 */
export namespace MessageTypes {
	/**
	 * to setup worker
	 */
	export type Setup = {
		type: 'Setup';
		options: $Proxytown['options'];
		windowKeys: string[];
		scriptSrcs: string[];
	};

	/**
	 * to call a function in worker with given args from main thread
	 */
	export type WorkerFnCall = {
		type: 'WorkerFnCall';
		args: any[];
		WrefId: number;
		path: SharableToWorker[];
	};

	/**
	 * to call a function in worker with given args from main thread
	 */
	export type WorkerSet = {
		type: 'WorkerSet';
		WrefId: number;
		path: SharableToWorker[];
		value: any;
	};

	/**
	 * import script in worker
	 */
	export type ImportScript = {
		type: 'ImportScript';
		url: url;
	};
}

export type MessageType =
	| MessageTypes.Setup
	| MessageTypes.WorkerFnCall
	| MessageTypes.ImportScript;

export type $$type = 'object' | 'function' | 'primitive';

export type Primitive = string | number | boolean | null | undefined;
export type SharableToWorker = Mref | Primitive | Wref | Array<SharableToWorker>;
export type SharableToMain = Mref | Primitive | Operation | Wref;
export type NonSharable = Function | object | symbol;
