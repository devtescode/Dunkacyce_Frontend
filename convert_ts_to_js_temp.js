const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if ((p.endsWith('.ts') || p.endsWith('.tsx')) && !p.endsWith('.d.ts')) {
      files.push(p);
    }
  }
}
walk(root);
const renamed = [];
for (const file of files) {
  const ext = path.extname(file);
  const outExt = ext === '.tsx' ? '.jsx' : '.js';
  const outFile = file.slice(0, -ext.length) + outExt;
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      noEmitHelpers: true,
      importHelpers: false,
    },
    fileName: path.basename(file),
    reportDiagnostics: true,
  });
  fs.writeFileSync(outFile, result.outputText, 'utf8');
  renamed.push({ file, outFile });
}
for (const { file } of renamed) {
  fs.unlinkSync(file);
}
console.log('Converted', renamed.length, 'files');
