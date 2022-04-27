#!/usr/bin/env node

// copy the dist/proxytown folder to the current directory
const fs = require('fs')
const path = require('path')

/**
 * @param {string} src  source path
 * @param {string} dest distination path
 */
var copyRecursiveSync = function (src, dest) {
  var exists = fs.existsSync(src)
  var stats = exists && fs.statSync(src)
  var isDirectory = exists && stats.isDirectory()
  if (isDirectory) {
    fs.mkdirSync(dest)
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      )
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

copyRecursiveSync(
  path.join(__dirname, './dist/proxytown'),
  path.join(__dirname, './proxytown')
)
