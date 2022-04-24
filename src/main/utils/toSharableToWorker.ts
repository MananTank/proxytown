import { isNotSharable } from '../../shared'
import { SharableToWorker } from '../../types'
import { createMref } from './createMref'

/**
 * create main thread ref for non sharable values and share the ref object instead
 */
export function toSharableToWorker(value: any): SharableToWorker {
  if (isNotSharable(value)) {
    return createMref(value)
  }

  return value
}
