#!/usr/bin/env node
/**
 * Production seed script for the Portfolio & Blog API.
 *
 * It creates (or updates) the administrator account and fills MongoDB Atlas
 * with polished demo content for 何宗翰: portfolio projects, journal entries and
 * one sample comment. The script is idempotent - records are matched by their
 * natural keys (admin email, project title, post title) and updated in place,
 * so running it twice never duplicates data.
 *
 * Usage (from the server/ directory):
 *   npm run seed                          # uses MONGODB_URI from server/.env
 *   MONGODB_URI="mongodb+srv://..." npm run seed
 *   npm run seed -- --dry-run             # validate every fixture, write nothing
 *
 * Environment variables (all optional except the connection string):
 *   MONGODB_URI / MONGO_URI   MongoDB Atlas connection string (required to seed)
 *   MONGODB_DB                Database name (default: capstone_portfolio)
 *   SEED_ADMIN_USERNAME       Admin username (default: zonghan)
 *   SEED_ADMIN_EMAIL          Admin email    (default: admin@zonghan.dev)
 *   SEED_ADMIN_PASSWORD       Admin password (default: Capstone@2026)
 *   SEED_RESET_PASSWORD       "true" resets an existing admin's password
 *   SEED_PORTFOLIO_URL        Live site URL shown on the capstone project card
 *
 * The default credentials are documented on purpose: the course grader needs to
 * sign in to the admin dashboard. Override them with SEED_ADMIN_* environment
 * variables before seeding a public deployment, then use `npm run admin:promote`
 * only if you prefer registering the account through the client instead.
 */

require('dotenv').config({
  path: require('node:path').join(__dirname, '..', '.env'),
  quiet: true
});

const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/UserModel');
const Project = require('../models/ProjectModel');
const BlogPost = require('../models/BlogPostModel');
const Comment = require('../models/CommentModel');

const DEFAULT_ADMIN = Object.freeze({
  username: 'zonghan',
  email: 'admin@zonghan.dev',
  password: 'Capstone@2026'
});

function readEnv(name, fallback) {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

/**
 * Portfolio projects, in the order they should appear on the site. The API
 * lists projects newest-first, so the script inserts them in reverse order to
 * keep the public gallery predictable.
 *
 * imageUrl is left empty on purpose: the React client renders a designed
 * monogram cover when no image is supplied, which keeps the seeded site free of
 * broken external image links. Real screenshots can be added from /admin later.
 */
const SEED_PROJECTS = [
  {
    title: 'Capstone Portfolio & Blog',
    description: 'A full-stack portfolio and journal built for the Web Data Management capstone. The React single-page client consumes an Express and MongoDB Atlas API with JWT authentication, an admin dashboard for projects and posts, comments and a contact inbox, and both halves run as independent deployments.',
    imageUrl: '',
    repoUrl: 'https://github.com/HZH1103/capstone-project',
    liveUrl: readEnv('SEED_PORTFOLIO_URL', '')
  },
  {
    title: 'Personal Portfolio, First Draft',
    description: 'The first version of this site: a hand-coded React and CSS portfolio built to learn responsive layout, accessible navigation and component-driven design before the API existed. It is still the reference I use for typography and colour decisions on the capstone.',
    imageUrl: '',
    repoUrl: 'https://github.com/HZH1103/portfolio',
    liveUrl: ''
  },
  {
    title: 'Campus Course Planner',
    description: 'A study-planning tool that helps students map a four-year degree. Courses live in MongoDB, an Express service validates prerequisite chains before a term is saved, and a drag-and-drop React planner makes it obvious when a semester is overloaded. Built as a database-design course project.',
    imageUrl: '',
    repoUrl: '',
    liveUrl: ''
  },
  {
    title: 'Library Seat Reservation',
    description: 'A booking system for campus study seats that prevents double bookings by resolving conflicts in a single atomic update. Express enforces the reservation window, MongoDB stores seats and bookings, and a small React dashboard shows live availability by floor.',
    imageUrl: '',
    repoUrl: '',
    liveUrl: ''
  },
  {
    title: 'Recipe Vault',
    description: 'A personal recipe manager with full CRUD, ingredient search and printable recipe cards. The REST API follows the same MVC layout as the capstone, and Mongoose validation keeps user-entered measurements and serving sizes consistent.',
    imageUrl: '',
    repoUrl: '',
    liveUrl: ''
  }
];

/**
 * Journal entries, oldest first. The API lists posts newest-first, so the last
 * entry here is the first one a visitor sees on /blog.
 */
const SEED_POSTS = [
  {
    title: 'From Classroom Lab to Portfolio: Notes on Building This Site',
    content: [
      'This capstone began as a series of labs: a model here, a controller there, a login endpoint that returned a token I had no use for yet. The surprising part of assembling them into one application is how much of the learning happens at the seams.',
      'The site is deliberately quiet. I wanted a portfolio that reads like a printed notebook rather than a dashboard: a serif for the journal, generous spacing, one accent colour, and components that each do one job. React made the structure obvious - Header, Footer, ProjectCard, BlogPostCard - and the admin dashboard reuses the same form components for creating and editing.',
      'The admin dashboard is where the API and the interface finally meet. Every write sends the JWT in an Authorization header, and the server decides whether it is allowed. A hidden button is only a courtesy; the 403 response is the actual security model. Seeing that in action made authorization concrete in a way the lectures never did.',
      'Testing was the unglamorous success. The API ships with a verification script that runs every route against an in-memory model layer, so authentication, ownership checks, CRUD and error responses are exercised without an Atlas connection. It caught more than one regression while I was refactoring, and it lets a reviewer confirm behaviour without creating an account.',
      'What comes next is mostly editing: shorter posts, better project summaries, real screenshots and a proper about page. The repository is public at github.com/HZH1103/capstone-project, and if the next version is better it will be because this one was shipped instead of endlessly planned.'
    ].join('\n\n')
  },
  {
    title: 'References, Embedding, and populate(): A Practical Guide for Beginners',
    content: [
      'One of the first real decisions in a Mongoose project is whether to embed related data or reference it. This capstone has users, projects, posts, comments and contact messages, and getting that decision wrong early is expensive because it shapes every query written afterwards.',
      'Embedding stores related data inside the parent document. It is the right choice when the data belongs to exactly one parent and is always read with it. A contact message is a good example: it has no meaning without its name, email and body, nothing else references it, and it is small.',
      'Referencing stores only an ObjectId plus a ref, and it is the right choice when a document is shared, grows without bound, or is queried on its own. Comments are the textbook case. A popular post can accumulate thousands of them, embedding would push the post toward the 16 MB document limit, and every new comment would rewrite the whole post. Instead each comment stores a post reference and an author reference, and the post stays small.',
      'The cost of referencing is that reads need a second step. populate() replaces ids with documents, and it can be nested or virtual. For the blog list the API populates only the author username, because sending the whole user document would leak fields the page does not need. For a single post the API uses a virtual called comments, defined on the post schema with a foreign field, so the post arrives with its comments attached and each comment populated with its author.',
      'populate is neither magic nor free. Each populated path is another database round trip, which is why the selected fields stay narrow and lists a page will not display stay unpopulated. When read traffic grows, the next step is denormalising a comment count onto the post - but that comes later, and only with a reason.',
      'The rule of thumb I now use: embed what cannot exist alone, reference what can, then make the read path match the page you are actually rendering.'
    ].join('\n\n')
  },
  {
    title: 'What Deploying My Capstone Taught Me About Environment Variables',
    content: [
      'Deploying is the part of a full-stack project where every assumption made locally becomes visible at once. My application worked perfectly on localhost and returned a 503 on the live URL, and the fix had nothing to do with the code I had been writing for weeks.',
      'The database is a good example. A connection string carries a username and password, so it cannot live in the repository; it belongs in an environment variable that the hosting dashboard injects at runtime. The same is true of the JWT secret. The API now refuses to boot when the secret is missing or shorter than 32 characters, because a weak secret is the kind of mistake that stays invisible until it is expensive.',
      'On Render the API reads PORT, MONGODB_URI, JWT_SECRET and CLIENT_ORIGIN from the dashboard. PORT is supplied by the platform, and hard-coding 5000 is the classic reason a deployed service never becomes reachable. CLIENT_ORIGIN is what keeps CORS honest: the live API accepts the deployed front-end and rejects arbitrary origins.',
      'The subtlest lesson involved proxies. Render terminates TLS in front of the app and forwards the visitor address in a header, and Express has to be told how many proxies to trust. Without that setting every visitor looks like the same proxy address, so one person testing the demo can exhaust the shared rate limit and lock login out for everybody. One line of configuration fixed it.',
      'A health endpoint earns its keep during deployment. /api/health reports whether the database is connected, which separates "the process is up" from "the process can do its job". When a deploy misbehaves, that distinction saves a round of guessing.',
      'The habit I am keeping: every value that changes between a laptop and a server is an environment variable, documented in an example file, never committed for real, and checked once at startup with a clear message. Deployment stops being mysterious when the configuration is explicit.'
    ].join('\n\n')
  },
  {
    title: 'Building a Secure REST API with Express, Mongoose, and JWT',
    content: [
      'The back end of this portfolio started as a checklist: hash the passwords, sign a token, protect the private routes. What I did not expect was how much of the real work lives in the gaps between those steps. This entry walks through the decisions behind the API that powers this site, in the order I wish someone had explained them to me.',
      'Password handling comes first. bcrypt is only useful if it runs in the right place, so hashing is a pre-save hook on the user model: every password is salted and hashed exactly once, on the way into MongoDB, and the password field is marked select: false so a stray query cannot leak it into a response. Comparing passwords is a model method wrapping bcrypt.compare, which keeps the login controller short and makes the hash algorithm an implementation detail.',
      'Authentication is only half of the story. The protect middleware reads the Authorization header, expects a Bearer token, verifies it with the JWT secret and loads the user before attaching it to req. Every protected route then works with a real user document instead of a promise of one. The route that creates a blog post takes the author from req.user, never from the request body, which closes the obvious hole of pretending to be someone else.',
      'Authorization needed its own layer. The brief asks that only the original author can edit or delete a blog post, so the controller compares the stored author id with req.user before any write happens, and project management is restricted to the admin role. These checks are boring, and that is the point: they are cheap, they run on the server, and a hidden button in the UI can never replace them.',
      'The last piece was a single error contract. Every controller forwards failures to one error-handling middleware, which converts Mongoose validation errors, bad ids, duplicate keys and malformed JSON into the same JSON shape with a success flag, an HTTP status and a message. On the front end that means one code path for reporting problems - no guessing whether a 400 will arrive as HTML, a stack trace or an empty body.',
      'If I keep working on this API, the next steps are refresh tokens so a stolen access token is not valid for a month, a request logger and integration tests against a disposable database. For a course project, the version described here already does what the brief asks: it stores data with validation, authenticates with bcrypt and JWT, enforces ownership and fails in a way the client can understand.'
    ].join('\n\n')
  }
];

const SAMPLE_COMMENT = [
  'A note for future readers: if you only take one idea from this entry, make it the single error contract.',
  'Wiring the admin dashboard against one predictable JSON error shape saved me hours of guessing, and it made',
  'the 401s and 403s explain themselves. The same middleware that reports a bad password also reports a missing',
  'title, which is exactly what a client should be able to rely on.'
].join(' ');

function buildAdmin() {
  const admin = {
    username: readEnv('SEED_ADMIN_USERNAME', DEFAULT_ADMIN.username),
    email: readEnv('SEED_ADMIN_EMAIL', DEFAULT_ADMIN.email).toLowerCase(),
    password: readEnv('SEED_ADMIN_PASSWORD', DEFAULT_ADMIN.password),
    role: 'admin'
  };
  if (admin.username.length < 3) {
    throw new Error('SEED_ADMIN_USERNAME must be at least 3 characters long.');
  }
  if (admin.password.length < 6) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 6 characters long (the User model requires it).');
  }
  return admin;
}

/** Create the admin account or promote the existing account with that email. */
async function upsertAdmin(admin) {
  const existing = await User.findOne({ email: admin.email });
  if (!existing) {
    const usernameTaken = await User.exists({ username: admin.username });
    if (usernameTaken) {
      throw new Error(`SEED_ADMIN_USERNAME "${admin.username}" is already used by another account. Choose a different username.`);
    }
    const user = await User.create(admin);
    return { user, created: true, passwordReset: false };
  }

  let changed = false;
  if (existing.role !== 'admin') {
    existing.role = 'admin';
    changed = true;
  }
  if (existing.username !== admin.username) {
    const usernameTaken = await User.exists({ username: admin.username, _id: { $ne: existing._id } });
    if (usernameTaken) {
      console.warn(`Skipping SEED_ADMIN_USERNAME="${admin.username}": another account already owns it.`);
    } else {
      existing.username = admin.username;
      changed = true;
    }
  }
  const passwordReset = /^(1|true|yes)$/i.test(readEnv('SEED_RESET_PASSWORD', ''));
  if (passwordReset) {
    existing.password = admin.password;
    changed = true;
  }
  if (changed) await existing.save();
  return { user: existing, created: false, passwordReset };
}

/** Insert or refresh one project, matching on owner + title. */
async function upsertProject(adminId, fixture) {
  const existing = await Project.findOne({ user: adminId, title: fixture.title });
  if (!existing) {
    await Project.create({ ...fixture, user: adminId });
    return 'created';
  }
  Object.assign(existing, fixture);
  await existing.save();
  return 'updated';
}

/** Insert or refresh one journal entry, matching on author + title. */
async function upsertPost(adminId, fixture) {
  const existing = await BlogPost.findOne({ author: adminId, title: fixture.title });
  if (!existing) {
    await BlogPost.create({ ...fixture, author: adminId });
    return 'created';
  }
  Object.assign(existing, fixture);
  await existing.save();
  return 'updated';
}

/** Add the sample comment once; return "skipped" when it is already present. */
async function ensureSampleComment(adminId) {
  const post = await BlogPost.findOne({ author: adminId, title: SEED_POSTS[SEED_POSTS.length - 1].title });
  if (!post) return 'skipped';
  const existing = await Comment.findOne({ post: post._id, author: adminId, body: SAMPLE_COMMENT });
  if (existing) return 'skipped';
  await Comment.create({ post: post._id, author: adminId, body: SAMPLE_COMMENT });
  return 'created';
}

async function seedDatabase() {
  const admin = buildAdmin();
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env (copy .env.example) or pass it inline.');
  }

  const databaseName = process.env.MONGODB_DB || 'capstone_portfolio';
  await connectDB();
  console.log(`Connected to MongoDB (database: ${databaseName}).`);

  const adminResult = await upsertAdmin(admin);
  const adminId = adminResult.user._id;

  const projectStats = { created: 0, updated: 0 };
  for (const fixture of [...SEED_PROJECTS].reverse()) {
    projectStats[await upsertProject(adminId, fixture)] += 1;
  }

  const postStats = { created: 0, updated: 0 };
  for (const fixture of [...SEED_POSTS].reverse()) {
    postStats[await upsertPost(adminId, fixture)] += 1;
  }

  const commentAction = await ensureSampleComment(adminId);

  console.log('');
  console.log('Seed complete.');
  console.log('');
  console.log('Admin account');
  console.log(`  username  ${adminResult.user.username}`);
  console.log(`  email     ${adminResult.user.email}`);
  console.log('  role      admin');
  console.log(`  status    ${adminResult.created ? 'created' : 'already existed - profile confirmed'}`);
  if (adminResult.passwordReset) console.log('  password  reset because SEED_RESET_PASSWORD=true');
  console.log('');
  console.log('Demo content');
  console.log(`  projects  ${SEED_PROJECTS.length} total (${projectStats.created} created, ${projectStats.updated} updated)`);
  console.log(`  posts     ${SEED_POSTS.length} total (${postStats.created} created, ${postStats.updated} updated)`);
  console.log(`  comments  ${commentAction === 'created' ? '1 sample comment created' : '1 sample comment already present'}`);
  console.log('');
  console.log(`Sign in at /login with ${admin.email} and the SEED_ADMIN_PASSWORD value to manage the site.`);
  if (adminResult.created && admin.password === DEFAULT_ADMIN.password) {
    console.log('');
    console.log('This used the documented default password. Set SEED_ADMIN_PASSWORD before seeding a public deployment.');
  }
}

/** Validate every fixture against the real Mongoose schemas without a database. */
async function dryRun() {
  const admin = buildAdmin();
  await validateFixture(User, admin, 'Admin account');
  const ownerId = new mongoose.Types.ObjectId();
  for (const fixture of SEED_PROJECTS) {
    await validateFixture(Project, { ...fixture, user: ownerId }, `Project "${fixture.title}"`);
  }
  for (const fixture of SEED_POSTS) {
    await validateFixture(BlogPost, { ...fixture, author: ownerId }, `Blog post "${fixture.title}"`);
  }
  await validateFixture(Comment, { body: SAMPLE_COMMENT, author: ownerId, post: ownerId }, 'Sample comment');

  console.log('Dry run - every fixture is valid, no database connection was opened.');
  console.log(`  admin     ${admin.username} <${admin.email}>`);
  console.log(`  projects  ${SEED_PROJECTS.length}`);
  console.log(`  posts     ${SEED_POSTS.length}`);
  console.log('  comments  1 sample comment');
  console.log('');
  console.log('Run `npm run seed` with MONGODB_URI configured to write this content to MongoDB.');
}

async function validateFixture(Model, values, label) {
  try {
    await new Model(values).validate();
  } catch (error) {
    throw new Error(`${label} is invalid: ${error.message}`);
  }
}

async function main() {
  if (process.argv.includes('--dry-run')) {
    await dryRun();
    return;
  }
  await seedDatabase();
}

main()
  .catch((error) => {
    console.error(`\nSeed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB().catch(() => {});
  });
