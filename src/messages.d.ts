import { SharableToWorker } from './types'

/**
 * types of messages sent from main thread to worker thread
 */
export namespace MessageTypes {
  /**
   * to setup worker
   */
  export type Setup = {
    type: 'Setup'
    windowKeys: string[]
    scriptSrcs: string[]
  }

  /**
   * to call a function in worker with given args from main thread
   */
  export type WorkerFnCall = {
    type: 'WorkerFnCall'
    args: any[]
    WrefId: number
    path: SharableToWorker[]
  }

  /**
   * to call a function in worker with given args from main thread
   */
  export type WorkerSet = {
    type: 'WorkerSet'
    WrefId: number
    path: SharableToWorker[]
    value: any
  }

  /**
   * import script in worker
   */
  export type ImportScript = {
    type: 'ImportScript'
    url: string
  }
}

export type MessageType =
  | MessageTypes.Setup
  | MessageTypes.WorkerFnCall
  | MessageTypes.ImportScript
  | MessageTypes.WorkerSet
