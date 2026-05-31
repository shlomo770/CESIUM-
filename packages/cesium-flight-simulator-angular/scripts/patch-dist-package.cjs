const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../dist/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// ng-packagr "exports" blocks TypeScript from resolving internal .d.ts
// (e.g. ./lib/config/mergeConfig) during ng serve type-checking.
delete pkg.exports;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('[patch-dist-package] Removed exports field from dist/package.json');
