/**
 * types of operation that worker thread requests main thread for
 */
export namespace Operations {
  export interface Get {
    __OP__: 'Get'
    key: SharableToMain
    objId: number
  }

  export interface Has {
    __OP__: 'Has'
    key: SharableToMain
    objId: number
  }

  export interface Keys {
    __OP__: 'Keys'
    objId: number
  }

  export interface Set {
    __OP__: 'Set'
    key: SharableToMain
    objId: number
    value: any
  }

  export interface WorkerObject {
    __OP__: 'WorkerObject'
    type: $$type
    WrefId: number
  }

  export interface MethodCall {
    __OP__: 'MethodCall'
    args: any[]
    objId: number
    methodId: number
    newKeyword: boolean
  }

  export interface FunctionCall {
    __OP__: 'FunctionCall'
    args: any[]
    fnId: number
    newKeyword: boolean
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
