const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const Project = require('../models/ProjectModel');
const BlogPost = require('../models/BlogPostModel');
const Comment = require('../models/CommentModel');
const Message = require('../models/MessageModel');
const { createApp } = require('../server');

const root = path.resolve(__dirname, '..');
const secret = 'capstone-test-only-signing-secret-with-more-than-32-chars';

function verifyProjectStructure() {
  for (const file of [
    'models/UserModel.js', 'models/ProjectModel.js', 'models/BlogPostModel.js',
    'models/CommentModel.js', 'models/MessageModel.js', 'middleware/auth.js',
    'middleware/error.js', 'controllers/userController.js', 'controllers/projectController.js',
    'controllers/blogController.js', 'controllers/commentController.js', 'controllers/contactController.js',
    'routes/userRoutes.js', 'routes/projectRoutes.js', 'routes/blogRoutes.js',
    'routes/contactRoutes.js', 'utils/generateToken.js', 'server.js'
  ]) assert.ok(fs.existsSync(path.join(root, file)), `Missing server file: ${file}`);

  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  for (const dependency of ['bcrypt', 'cors', 'dotenv', 'express', 'express-rate-limit', 'helmet', 'jsonwebtoken', 'mongoose']) {
    assert.ok(packageJson.dependencies[dependency], `Missing dependency: ${dependency}`);
  }
  assert.equal(packageLock.name, packageJson.name);
  assert.equal(packageLock.packages[''].name, packageJson.name);
  assert.deepEqual(packageLock.packages[''].dependencies, packageJson.dependencies);
  assert.equal(fs.existsSync(path.join(root, '.env')), false, 'A real .env must never be included.');
  assert.ok(fs.existsSync(path.join(root, '.env.example')));

  const appSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.ok(appSource.includes("app.use('/api/projects'"));
  assert.ok(appSource.includes("app.use('/api/blog'"));
  assert.ok(appSource.includes('helmet()'));
  assert.ok(appSource.includes('errorHandler'));
  assert.ok(fs.readFileSync(path.join(root, 'middleware', 'auth.js'), 'utf8').includes('jwt.verify'));
  assert.ok(fs.readFileSync(path.join(root, 'controllers', 'blogController.js'), 'utf8').includes('Only the original author'));
  assert.ok(fs.readFileSync(path.join(root, 'controllers', 'blogController.js'), 'utf8').includes('.populate('));
}

async function verifySchemas() {
  assert.equal(User.schema.path('password').options.select, false);
  assert.equal(User.schema.path('password').options.minlength[0], 6);
  assert.equal(Project.schema.path('user').options.ref, 'User');
  assert.equal(BlogPost.schema.path('author').options.ref, 'User');
  assert.equal(Comment.schema.path('post').options.ref, 'BlogPost');
  assert.equal(Message.schema.options.timestamps, true);
  assert.ok(BlogPost.schema.virtuals.comments);

  const invalidDocs = [
    [new User({ username: 'ok', email: 'bad', password: '123' }), /Email|email|Password|password/],
    [new Project({ description: 'No title', user: new mongoose.Types.ObjectId() }), /title/i],
    [new BlogPost({ content: 'No title', author: new mongoose.Types.ObjectId() }), /title/i],
    [new Comment({ author: new mongoose.Types.ObjectId() }), /body|post/i],
    [new Message({ name: 'N', email: 'bad', message: 'short' }), /email|message/i]
  ];
  for (const [doc, expected] of invalidDocs) {
    await assert.rejects(doc.validate(), { name: 'ValidationError' });
    await doc.validate().catch((error) => assert.match(error.message, expected));
  }
}

function query(resolve, collections) {
  const state = { sort: null, populate: [], selected: '' };
  const current = {
    sort(value) { state.sort = value; return current; },
    populate(...value) { state.populate.push(value); return current; },
    select(value) { state.selected = value; return current; },
    then(onResolve, onReject) {
      return Promise.resolve().then(async () => {
        let result = await resolve();
        if (Array.isArray(result) && state.sort) {
          const [field, direction] = Object.entries(state.sort)[0];
          result.sort((left, right) => ((new Date(left[field] || 0) - new Date(right[field] || 0)) * direction));
        }
        if (result) {
          for (const [options] of state.populate) {
            await collections.populate(result, typeof options === 'string' ? options : options);
          }
        }
        return result;
      }).then(onResolve, onReject);
    }
  };
  return current;
}

function createMemoryModels() {
  const rows = { users: new Map(), projects: new Map(), posts: new Map(), comments: new Map(), messages: new Map() };
  const hashPasswordHook = User.schema.s.hooks._pres.get('save')
    .find(({ fn }) => fn.name === 'hashPassword')?.fn;
  assert.equal(typeof hashPasswordHook, 'function', 'The bcrypt pre-save hook is required.');

  function shape(model, values, collectionName) {
    const doc = new model(values);
    const clean = doc.toObject({ virtuals: false });
    clean.createdAt ||= new Date();
    clean.updatedAt ||= clean.createdAt;
    const record = { ...clean };
    if (model === User) {
      record.matchPassword = (password) => bcrypt.compare(password, record.password);
    }
    record.populate = async (options) => {
      await populate(record, options);
      return record;
    };
    record.save = async () => {
      const next = new model(Object.fromEntries(Object.keys(model.schema.paths)
        .filter((key) => key !== '__v')
        .map((key) => [key, record[key]])));
      next._id = record._id;
      await next.validate();
      next.createdAt = record.createdAt;
      next.updatedAt = new Date();
      const updated = next.toObject({ virtuals: false });
      rows[collectionName].set(String(updated._id), updated);
      Object.assign(record, updated);
      if (model === User) record.matchPassword = (password) => bcrypt.compare(password, record.password);
      return record;
    };
    return record;
  }

  const names = new Map([[User, 'users'], [Project, 'projects'], [BlogPost, 'posts'], [Comment, 'comments'], [Message, 'messages']]);

  async function populate(value, options) {
    const optionsList = Array.isArray(value) ? value : [value];
    const pathName = typeof options === 'string' ? options : options.path;
    for (const record of optionsList) {
      if (pathName === 'user' || pathName === 'author') {
        const id = String(record[pathName]?._id || record[pathName]);
        const user = rows.users.get(id);
        record[pathName] = user ? { _id: user._id, username: user.username } : null;
      } else if (pathName === 'comments') {
        record.comments = [...rows.comments.values()]
          .filter((comment) => String(comment.post) === String(record._id))
          .map((comment) => ({ ...comment }));
        for (const comment of record.comments) await populate(comment, 'author');
      }
    }
  }

  function makeModel(model) {
    const collectionName = names.get(model);
    return {
      async create(values) {
        const doc = new model(values);
        await doc.validate();
        if (model === User) {
          const duplicate = [...rows.users.values()].some((user) => user.username === doc.username || user.email === doc.email);
          if (duplicate) { const error = new Error('Duplicate user'); error.code = 11000; throw error; }
          await hashPasswordHook.call(doc);
        }
        doc.createdAt ||= new Date();
        doc.updatedAt ||= doc.createdAt;
        const raw = doc.toObject({ virtuals: false });
        rows[collectionName].set(String(raw._id), raw);
        return shape(model, raw, collectionName);
      },
      find(filter = {}) {
        return query(() => [...rows[collectionName].values()]
          .filter((record) => Object.entries(filter).every(([key, value]) => String(record[key]?._id || record[key]) === String(value?._id || value)))
          .map((record) => shape(model, record, collectionName)), { populate });
      },
      findById(id) {
        return query(() => {
          const record = rows[collectionName].get(String(id));
          return record ? shape(model, record, collectionName) : null;
        }, { populate });
      },
      findOne(filter = {}) {
        const result = query(() => {
          const record = [...rows[collectionName].values()].find((item) => Object.entries(filter)
            .every(([key, value]) => String(item[key]) === String(value)));
          return record ? shape(model, record, collectionName) : null;
        }, { populate });
        return result;
      },
      async findByIdAndDelete(id) {
        const record = rows[collectionName].get(String(id));
        if (!record) return null;
        rows[collectionName].delete(String(id));
        return shape(model, record, collectionName);
      },
      async deleteMany(filter = {}) {
        let deletedCount = 0;
        for (const [id, record] of rows[collectionName]) {
          if (Object.entries(filter).every(([key, value]) => String(record[key]?._id || record[key]) === String(value?._id || value))) {
            rows[collectionName].delete(id);
            deletedCount += 1;
          }
        }
        return { acknowledged: true, deletedCount };
      }
    };
  }

  return {
    rows,
    populate,
    userModel: makeModel(User),
    projectModel: makeModel(Project),
    blogPostModel: makeModel(BlogPost),
    commentModel: makeModel(Comment),
    messageModel: makeModel(Message)
  };
}

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try { await callback(baseUrl); }
  finally {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function expectError(response, status) {
  assert.equal(response.status, status);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.status, status);
  assert.equal('stack' in payload, false, 'Production error responses must not expose stack traces.');
  return payload;
}

async function verifyApi() {
  const saved = { node: process.env.NODE_ENV, jwt: process.env.JWT_SECRET, origin: process.env.CLIENT_ORIGIN };
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = secret;
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  const models = createMemoryModels();
  const app = createApp({ ...models, isDatabaseReady: () => true });

  try {
    await withServer(app, async (base) => {
      const health = await fetch(`${base}/api/health`);
      assert.equal(health.status, 200);
      assert.equal((await health.json()).database, 'connected');
      assert.equal(health.headers.get('x-powered-by'), null);
      assert.equal(health.headers.get('x-content-type-options'), 'nosniff');

      const blocked = await expectError(await fetch(`${base}/api/projects`, { method: 'POST', body: '{}' }), 401);
      assert.match(blocked.message, /authentication/i);

      const registration = await fetch(`${base}/api/users/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'zonghan', email: ' HZ@example.com ', password: 'StudyPass123' })
      });
      assert.equal(registration.status, 201);
      const registered = await registration.json();
      assert.equal(registered.user.email, 'hz@example.com');
      assert.equal(registered.user.role, 'user');
      assert.equal('password' in registered.user, false);
      const userId = registered.user._id;
      const storedUser = models.rows.users.get(userId);
      assert.notEqual(storedUser.password, 'StudyPass123');
      assert.match(storedUser.password, /^\$2[aby]\$/);
      assert.equal(await bcrypt.compare('StudyPass123', storedUser.password), true);

      const duplicate = await expectError(await fetch(`${base}/api/users/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'another', email: 'hz@example.com', password: 'StudyPass123' })
      }), 409);
      assert.match(duplicate.message, /already exists/i);
      await expectError(await fetch(`${base}/api/users/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
      }), 400);

      const loginResponse = await fetch(`${base}/api/users/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'HZ@example.com', password: 'StudyPass123' })
      });
      assert.equal(loginResponse.status, 200);
      const login = await loginResponse.json();
      assert.equal(login.user._id, userId);
      assert.equal(jwt.verify(login.token, secret).id, userId);
      assert.equal('password' in login.user, false);
      await expectError(await fetch(`${base}/api/users/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'hz@example.com', password: 'incorrect' })
      }), 401);

      const me = await fetch(`${base}/api/users/me`, { headers: { authorization: `Bearer ${login.token}` } });
      assert.equal(me.status, 200);
      assert.equal((await me.json()).user.username, 'zonghan');
      await expectError(await fetch(`${base}/api/users/me`, { headers: { authorization: 'Bearer broken' } }), 401);

      const emptyProjects = await fetch(`${base}/api/projects`);
      assert.equal(emptyProjects.status, 200);
      assert.deepEqual((await emptyProjects.json()).projects, []);
      await expectError(await fetch(`${base}/api/projects`, {
        method: 'POST', headers: { authorization: `Bearer ${login.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthorized Project', description: 'A normal user cannot publish portfolio projects.' })
      }), 403);

      const adminDoc = await models.userModel.create({ username: 'owner', email: 'owner@example.com', password: 'AdminPass123' });
      const adminId = String(adminDoc._id);
      models.rows.users.get(adminId).role = 'admin';
      const adminToken = jwt.sign({ id: adminId }, secret, { expiresIn: '30d' });
      const projectResponse = await fetch(`${base}/api/projects`, {
        method: 'POST', headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Capstone Studio', description: 'A full-stack portfolio project.', repoUrl: 'https://github.com/example/project' })
      });
      assert.equal(projectResponse.status, 201);
      const project = (await projectResponse.json()).project;
      assert.equal(String(project.user), adminId);
      assert.equal((await (await fetch(`${base}/api/projects/${project._id}`)).json()).project.title, 'Capstone Studio');
      const updateProject = await fetch(`${base}/api/projects/${project._id}`, {
        method: 'PUT', headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Capstone Studio Updated' })
      });
      assert.equal(updateProject.status, 200);

      const postResponse = await fetch(`${base}/api/blog`, {
        method: 'POST', headers: { authorization: `Bearer ${login.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Notes on the build', content: 'A longer note about building this portfolio with care.' })
      });
      assert.equal(postResponse.status, 201);
      const post = (await postResponse.json()).post;
      assert.equal(String(post.author._id), userId);
      assert.equal((await (await fetch(`${base}/api/blog`)).json()).posts.length, 1);
      const detail = await fetch(`${base}/api/blog/${post._id}`);
      assert.equal(detail.status, 200);
      assert.equal((await detail.json()).post.author.username, 'zonghan');

      const commentResponse = await fetch(`${base}/api/blog/${post._id}/comments`, {
        method: 'POST', headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'A considered comment on this entry.' })
      });
      assert.equal(commentResponse.status, 201);
      const comments = await fetch(`${base}/api/blog/${post._id}/comments`);
      assert.equal((await comments.json()).comments[0].author.username, 'owner');
      const postWithComments = await fetch(`${base}/api/blog/${post._id}`);
      assert.equal((await postWithComments.json()).post.comments.length, 1);

      const secondUser = await models.userModel.create({ username: 'reader', email: 'reader@example.com', password: 'ReaderPass123' });
      const otherToken = jwt.sign({ id: String(secondUser._id) }, secret, { expiresIn: '30d' });
      await expectError(await fetch(`${base}/api/blog/${post._id}`, {
        method: 'PUT', headers: { authorization: `Bearer ${otherToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Attempted takeover' })
      }), 403);
      const updatePost = await fetch(`${base}/api/blog/${post._id}`, {
        method: 'PUT', headers: { authorization: `Bearer ${login.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Notes on the build — revised' })
      });
      assert.equal(updatePost.status, 200);
      await expectError(await fetch(`${base}/api/blog/${post._id}`, {
        method: 'DELETE', headers: { authorization: `Bearer ${otherToken}` }
      }), 403);

      const contact = await fetch(`${base}/api/contact`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', message: 'I would like to discuss a project.' })
      });
      assert.equal(contact.status, 201);
      assert.equal((await contact.json()).success, true);
      await expectError(await fetch(`${base}/api/contact`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'X' })
      }), 400);

      const deletePost = await fetch(`${base}/api/blog/${post._id}`, {
        method: 'DELETE', headers: { authorization: `Bearer ${login.token}` }
      });
      assert.equal(deletePost.status, 200);
      assert.equal(models.rows.comments.size, 0, 'Deleting a blog post should also remove its comments.');
      const deleteProject = await fetch(`${base}/api/projects/${project._id}`, {
        method: 'DELETE', headers: { authorization: `Bearer ${adminToken}` }
      });
      assert.equal(deleteProject.status, 200);
      await expectError(await fetch(`${base}/api/not-a-route`), 404);
    });

    const unavailable = createApp({ ...models, isDatabaseReady: () => false });
    await withServer(unavailable, async (base) => {
      assert.equal((await fetch(`${base}/api/health`)).status, 503);
      await expectError(await fetch(`${base}/api/projects`), 503);
    });
  } finally {
    if (saved.node === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved.node;
    if (saved.jwt === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.jwt;
    if (saved.origin === undefined) delete process.env.CLIENT_ORIGIN; else process.env.CLIENT_ORIGIN = saved.origin;
  }
}

async function main() {
  verifyProjectStructure();
  await verifySchemas();
  await verifyApi();
  console.log('CAPSTONE_API_VERIFICATION_PASSED');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
