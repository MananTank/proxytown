// @ts-check
const fse = require('fs');
const srcDir = `./src/sandbox.html`;
const destDir = `./dist/sandbox.html`;

// To copy a folder or file
fse.copyFileSync(srcDir, destDir);
