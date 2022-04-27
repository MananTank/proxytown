#!/usr/bin/env node

// copy the dist/proxytown folder to the current directory
const fse = require('fs-extra')
const path = require('path')

const srcDir = path.join(__dirname, './dist/proxytown')
const destDir = path.join(__dirname, './proxytown')

fse.copySync(
  srcDir,
  destDir,
  {
    overwrite: true
  },
  (err) => {
    if (err) {
      console.error(err)
    } else {
      console.log('success!')
    }
  }
)
