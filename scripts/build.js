// @ts-check
const fs = require('fs');
const srcDir = `./src/proxytown.html`;
const destDir = `./dist/proxytown/proxytown.html`;

fs.copyFileSync(srcDir, destDir);
