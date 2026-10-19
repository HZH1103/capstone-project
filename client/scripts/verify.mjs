import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const requiredFiles = [
  'src/App.jsx',
  'src/auth/AuthContext.jsx',
  'src/services/api.js',
  'src/pages/HomePage.jsx',
  'src/pages/ProjectsPage.jsx',
  'src/pages/BlogPage.jsx',
  'src/pages/BlogDetailPage.jsx',
  'src/pages/ContactPage.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/AdminPage.jsx',
  'src/pages/admin/ProjectManager.jsx',
  'src/pages/admin/BlogManager.jsx',
  'src/components/Header.jsx',
  'src/components/Footer.jsx'
];

for (const relativePath of requiredFiles) {
  assert.ok(existsSync(path.join(root, relativePath)), `Missing client file: ${relativePath}`);
}

const packageJson = JSON.parse(source('package.json'));
const packageLock = JSON.parse(source('package-lock.json'));
assert.ok(packageJson.dependencies['react-router-dom']);
assert.equal(packageLock.packages[''].name, packageJson.name);
assert.deepEqual(packageLock.packages[''].dependencies, packageJson.dependencies);

const app = source('src/App.jsx');
for (const route of ["path=\"/\"", 'path="/projects"', 'path="/blog"', 'path="/blog/:id"', 'path="/contact"', 'path="/login"', 'path="/register"', 'path="/admin"']) {
  assert.ok(app.includes(route), `Missing required route: ${route}`);
}

assert.match(source('src/auth/AuthContext.jsx'), /createContext/);
assert.match(source('src/services/api.js'), /authorization.*Bearer/);
assert.match(source('src/pages/ProjectsPage.jsx'), /apiRequest\('\/projects'/);
assert.match(source('src/pages/BlogPage.jsx'), /apiRequest\('\/blog'/);
assert.match(source('src/pages/BlogDetailPage.jsx'), /\/comments/);
assert.match(source('src/pages/ContactPage.jsx'), /apiRequest\('\/contact'/);
assert.match(source('src/pages/admin/ProjectManager.jsx'), /method: editingId \? 'PUT' : 'POST'/);
assert.match(source('src/pages/admin/BlogManager.jsx'), /method: editingId \? 'PUT' : 'POST'/);
assert.match(source('src/components/ProtectedRoute.jsx'), /user\.role !== 'admin'/);
assert.equal(existsSync(path.join(root, '.env')), false, 'Do not include a real client .env file.');

console.log('CAPSTONE_CLIENT_STATIC_VERIFICATION_PASSED');
