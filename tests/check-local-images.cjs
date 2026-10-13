#!/usr/bin/env node
// Regression guard: chess piece assets must not depend on remote hosts.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
const html = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && /\.html?$/i.test(item.name)) html.push(full);
  }
}
walk(root);
const failures = [];
for (const file of html) {
  const text = fs.readFileSync(file, 'utf8');
  // Detect remote image URLs in HTML attributes, CSS URLs, and JS string literals.
  const remoteImage = /(?:https?:)?\/\/[^\s"'<>\\)]+\.(?:png|svg|webp|gif|jpe?g)(?:\?[^\s"'<>\\)]*)?/gi;
  for (const match of text.matchAll(remoteImage)) {
    failures.push(path.relative(root, file) + ': ' + match[0]);
  }
}
if (failures.length) {
  console.error('Remote image dependencies found:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS: no remote image URLs in ' + html.length + ' HTML files');
}
