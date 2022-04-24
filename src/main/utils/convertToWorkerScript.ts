/**
 * convert the script such that it's code runs inside a worker thread
 * convert inline script to normal script by creating a blob file
 * then for src script, create a blob script which imports the script
 */
export function convertToWorkerScript(script: HTMLScriptElement) {
  let code: string

  // script with src
  if (script.src) {
    const originalSrc = script.src
    code = `$proxytown.importScript("${originalSrc}")`
    script.setAttribute('data-proxy-of', originalSrc)
  }

  // inline script
  else {
    // store the inline code in a blob
    const scriptContentFile = new Blob([script.textContent || ''], {
      type: 'application/javascript'
    })

    // get the src of the blob
    const scriptContentURL = URL.createObjectURL(scriptContentFile)

    // import the blob as the code
    code = `$proxytown.importScript("${scriptContentURL}")`

    script.setAttribute('data-proxy-of', 'inline-script')
  }

  const file = new Blob([code], {
    type: 'application/javascript'
  })

  // @ts-ignore
  const blobURL = URL.createObjectURL(file)

  // change the src of the script to point to the blob file
  script.src = blobURL

  // @ts-ignore - mark this script as processed
  script.$$processed = true
}
