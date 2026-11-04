// Bundle the app into one self-contained HTML file that opens by double-click.
//
// Browsers refuse to load ES modules from file:// URLs, so the modules are
// inlined: each one becomes a function returning its exports, and imports turn
// into destructuring of those objects. No dependencies, no network.
//
//   node tools/build.mjs   →   dist/harmony-academy.html

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Dependency order: each module only imports from modules above it.
const MODULES = ['theory', 'curriculum', 'audio', 'ear', 'app'];

function wrap(name) {
  let src = read(`js/${name}.js`);
  const exported = [];
  src = src.replace(/import\s*\{([^}]*)\}\s*from\s*'\.\/(\w+)\.js';/g, (_, names, mod) => `const {${names}} = __m.${mod};`);
  src = src.replace(/import\s*\*\s*as\s+(\w+)\s+from\s*'\.\/(\w+)\.js';/g, (_, alias, mod) => `const ${alias} = __m.${mod};`);
  src = src.replace(/^export\s+(?:async\s+)?(const|let|function)\s+(\w+)/gm, (m, kind, id) => {
    exported.push(id);
    return m.replace(/^export\s+/, '');
  });
  src = src.replace(/^export\s*\{([^}]*)\};?$/gm, (_, names) => {
    exported.push(...names.split(',').map((s) => s.trim()).filter(Boolean));
    return '';
  });
  if (/^\s*(import|export)\s/m.test(src)) throw new Error(`${name}.js has an import/export the bundler does not understand`);
  return `__m.${name} = (() => {\n'use strict';\n${src}\nreturn { ${exported.join(', ')} };\n})();`;
}

const bundle = `const __m = {};\n${MODULES.map(wrap).join('\n\n')}`;
const icon = `data:image/svg+xml;base64,${Buffer.from(read('icon.svg')).toString('base64')}`;

let html = read('index.html');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`index.html no longer contains: ${from}`);
  html = html.replace(from, () => to);
};
swap('<link rel="icon" href="icon.svg" type="image/svg+xml">', `<link rel="icon" href="${icon}">`);
swap('  <link rel="manifest" href="manifest.webmanifest">\n', '');
swap('<link rel="stylesheet" href="styles.css">', `<style>\n${read('styles.css')}</style>`);
swap('<script type="module" src="js/app.js"></script>', `<script>\n${bundle}\n</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/harmony-academy.html'), html);
console.log(`dist/harmony-academy.html  ${(html.length / 1024).toFixed(0)} KB`);
