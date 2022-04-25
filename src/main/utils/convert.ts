import { $typeof, isNotSharable } from '../../shared'
import { Mref, NonSharable, SharableToWorker } from '../../types'
import { $proxytown } from '../proxytown'

/**
 * convert the script such that it's code runs inside a worker thread
 *
 * for inline script, convert it to normal script
 *
 * then for src script, create a blob script which contains the code that
 * imports the original script using $proxytown.importScript which imports that script inside a worker
 */
export function convertToWorkerScript(script: HTMLScriptElement) {
  // if the script is inline script, convert it to normal script first
  if (!script.src) {
    convertInlineScriptToSrcScript(script)
  }

  const originalSrc = script.src

  // for debugging
  script.setAttribute('data-proxy-of', originalSrc)

  // create a file that imports the original script
  const code = `$proxytown.importScript("${originalSrc}")`
  const file = new Blob([code], {
    type: 'application/javascript'
  })

  // change the src of script to the blob file
  const blobURL = URL.createObjectURL(file)
  script.src = blobURL

  // @ts-ignore - mark this script as processed so we don't do this again for this script
  script.$$processed = true
}

/**
 * convert an inline script to src script
 * by moving the inline code to a blob and setting that blob's url as it's src
 */
export function convertInlineScriptToSrcScript(script: HTMLScriptElement) {
  // store the inline code in a blob
  const file = new Blob([script.textContent || ''], {
    type: 'application/javascript'
  })

  // get the src of the blob
  const blobURL = URL.createObjectURL(file)

  // set the blobURL to script src
  script.src = blobURL
}

/**
 * create main thread ref for non sharable values and share the ref object instead
 */
export function toSharableToWorker(value: any): SharableToWorker {
  if (isNotSharable(value)) {
    return createMref(value)
  }

  return value
}

/**
 * create an Mref object for given value
 */
export function createMref(value: NonSharable): Mref {
  const { refToIdMap, Mrefs } = $proxytown

  // if ref already created for this value, use that
  if (refToIdMap.has(value)) {
    return {
      MrefId: refToIdMap.get(value)!,
      type: $typeof(value)
    }
  }

  // else, create a Mref for this value
  Mrefs.push(value)
  const id = Mrefs.length - 1
  refToIdMap.set(value, id)

  return {
    MrefId: id,
    type: $typeof(value)
  }
}
