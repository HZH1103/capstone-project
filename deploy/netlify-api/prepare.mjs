#!/usr/bin/env node
/**
 * Netlify function packaging step.
 *
 * Copies the real Express source from ../../server into ./lib so the deployment
 * exercises exactly the same MVC code that the course submission contains, while
 * keeping the repository free of duplicated source.
 *
 * bcrypt -> bcryptjs: Netlify Functions run on Linux and the `bcrypt` package ships
 * a platform-native binary. The hashes produced by bcryptjs are standard bcrypt
 * hashes and are compatible with bcrypt.compare, which keeps the deployed API
 * behaviour identical for the course requirements.
 */
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const serverDir = path.join(repoRoot, 'server');
const libDir = path.join(here, 'lib');

if (!existsSync(serverDir)) throw new Error('server/ folder not found next to deploy/');
rmSync(libDir, { recursive: true, force: true });
cpSync(serverDir, libDir, {
  recursive: true,
  filter: (source) => path.basename(source) !== 'node_modules' && path.basename(source) !== 'scripts'
});
rmSync(path.join(libDir, '.env'), { force: true });

function patchBcrypt(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) { patchBcrypt(full); continue; }
    if (!entry.endsWith('.js')) continue;
    const source = readFileSync(full, 'utf8');
    if (source.includes("require('bcrypt')")) {
      writeFileSync(full, source.replaceAll("require('bcrypt')", "require('bcryptjs')"));
    }
  }
}
patchBcrypt(libDir);
console.log('Prepared deploy/netlify-api/lib from server/ (bcrypt -> bcryptjs for the Linux runtime).');
