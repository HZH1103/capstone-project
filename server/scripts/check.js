const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ignored = new Set(['node_modules', '.git', 'coverage']);
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignored.has(entry.name)) collect(path.join(directory, entry.name));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path.join(directory, entry.name));
  }
}

collect(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}
console.log(`Syntax check passed for ${files.length} server JavaScript files.`);
