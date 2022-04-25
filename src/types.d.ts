export type $$type = 'object' | 'function' | 'primitive'

export type Mref = {
  MrefId: number
  type: $$type
}

export type Wref = {
  WrefId: number
}

export type Primitive = string | number | boolean | null | undefined
export type SharableToWorker = Mref | Primitive | Wref | Array<SharableToWorker>
export type SharableToMain = Mref | Primitive | Operation | Wref
export type NonSharable = Function | object | symbol

/**
 * global proxytown api
 */
export type $Proxytown = {
  Mrefs: any[]
  worker: Worker
  refToIdMap: Map<NonSharable, number>
  importScript: (url: string) => void
  options: {
    debug: Set<string>
  }
  lib: string
}

export type ProxytownConfig =
  | undefined
  | {
      debug?: string[]
    }
