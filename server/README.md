# Portfolio & Blog API

Express + Mongoose REST API for the 何宗翰 full-stack capstone project. It powers the public
portfolio and journal, JWT authentication, comments, the contact form, and the admin
dashboard used to manage projects and blog posts. Data is stored in MongoDB Atlas.

## Stack

- Node.js 20+ and Express 4
- Mongoose 9 models with schema validation
- bcrypt password hashing and JWT authentication (`jsonwebtoken`)
- helmet security headers, CORS allow-list and rate limiting
- dotenv configuration for every secret
- MVC layout: `models/`, `controllers/`, `routes/`, `middleware/`, `utils/`, `config/`

## Project structure

```text
server/
  server.js              app factory, security middleware, 404 + error handlers
  config/db.js           MongoDB Atlas connection helper
  models/                User, Project, BlogPost, Comment, Message (Mongoose schemas)
  controllers/           one controller per resource; validation + authorization
  routes/                REST route definitions
  middleware/auth.js     protect (JWT) and requireAdmin middleware
  middleware/error.js    central JSON error handler
  utils/                 ErrorHandler and JWT generator
  scripts/check.js       JavaScript syntax check
  scripts/verify.js      in-memory API test suite (no database needed)
  scripts/seed.js        production admin + demo content seed script
  scripts/promote-admin.js  promote an existing account to admin
```

## Run locally

```sh
cd server
npm ci
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev                 # or: npm start
```

The API listens on `PORT` (default `5000`). Check it with `GET http://localhost:5000/api/health`.
Every `/api` route returns `503` while the database is not connected, so the health route is
the quickest way to confirm the Atlas connection.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB Atlas connection string (or `MONGO_URI`) |
| `MONGODB_DB` | no | Database name, defaults to `capstone_portfolio` |
| `PORT` | no | HTTP port, defaults to `5000` (Render supplies it) |
| `JWT_SECRET` | yes | Private signing secret, at least 32 characters; the server refuses to boot without it |
| `CLIENT_ORIGIN` | no | Allowed browser origin(s), comma-separated; defaults to `http://localhost:5173` |
| `NODE_ENV` | no | `production` on the deployed API |
| `TRUST_PROXY` | no | Reverse-proxy hops in front of Express, defaults to `1` (Render/Vercel use one) |
| `SEED_ADMIN_USERNAME` | no | Seed admin username, defaults to `zonghan` |
| `SEED_ADMIN_EMAIL` | no | Seed admin email, defaults to `admin@zonghan.dev` |
| `SEED_ADMIN_PASSWORD` | no | Seed admin password, defaults to `Capstone@2026` |
| `SEED_RESET_PASSWORD` | no | `true` resets an existing admin password during seeding |
| `SEED_PORTFOLIO_URL` | no | Live site URL shown on the seeded capstone project card |

Copy `.env.example` to `.env` for local work; `.env` is git-ignored and must never be committed
or included in the Chaoxing submission archive.

## API reference

All bodies are JSON. Protected routes need `Authorization: Bearer <token>`. Document IDs are
MongoDB ObjectIds.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API + database readiness |
| `POST` | `/api/users/register` | Public | Register `{ username, email, password }`; password is bcrypt-hashed |
| `POST` | `/api/users/login` | Public | Login `{ email, password }`; returns the user and a 30-day JWT |
| `GET` | `/api/users/me` | Signed in | Current account |
| `GET` | `/api/projects` | Public | All projects, author username populated |
| `GET` | `/api/projects/:id` | Public | Single project |
| `POST` | `/api/projects` | Admin | Create `{ title, description, imageUrl?, repoUrl?, liveUrl? }` |
| `PUT` | `/api/projects/:id` | Admin | Update supplied project fields |
| `DELETE` | `/api/projects/:id` | Admin | Delete a project |
| `POST` | `/api/contact` | Public | Save `{ name, email, message }` as a contact message (rate limited) |
| `GET` | `/api/blog` | Public | All posts, newest first, author username populated |
| `GET` | `/api/blog/:id` | Public | Single post with author and populated comments |
| `POST` | `/api/blog` | Signed in | Create `{ title, content }`; the signed-in user becomes the author |
| `PUT` | `/api/blog/:id` | Original author | Update `{ title?, content? }`; anyone else gets `403` |
| `DELETE` | `/api/blog/:id` | Original author | Delete the post and its comments |
| `GET` | `/api/blog/:postId/comments` | Public | Comments for a post, author usernames populated |
| `POST` | `/api/blog/:postId/comments` | Signed in | Create `{ body }` on a post |

### Error contract

Controllers forward every failure to one error-handling middleware, which always answers with
a JSON body such as:

```json
{ "success": false, "status": 400, "message": "Project title is required." }
```

That middleware converts Mongoose validation errors, cast errors, duplicate keys (`409`),
malformed JSON, unknown routes (`404`) and unexpected failures into the same shape. Stack traces
are only returned when `NODE_ENV=development`.

## Data models

| Model | Fields |
| --- | --- |
| `User` | unique `username`, unique `email`, bcrypt-hashed `password` (min 6, `select: false`), `role: user \| admin`, timestamps |
| `Project` | `title`, `description`, optional `imageUrl`/`repoUrl`/`liveUrl`, `user` ref, timestamps |
| `BlogPost` | `title`, `content`, `author` ref, virtual `comments` relation, timestamps |
| `Comment` | `body`, `author` ref, `post` ref, timestamps |
| `Message` | `name`, `email`, `message`, timestamps |

## Seed demo content

`scripts/seed.js` creates (or refreshes) the administrator account plus polished demo content:
5 portfolio projects, 4 journal posts and 1 sample comment. The script is idempotent — records
are matched by admin email, project title and post title, so running it twice updates in place
instead of duplicating data.

```sh
cd server

# 1. Easiest: put MONGODB_URI in server/.env (git-ignored)
npm run seed

# 2. Or pass the URI inline, without creating a .env file
MONGODB_URI="mongodb+srv://..." npm run seed      # PowerShell: $env:MONGODB_URI="mongodb+srv://..."; npm run seed

# 3. Validate every fixture without touching the database
npm run seed -- --dry-run
```

The script prints the admin email, the created/updated counts and the sign-in reminder. Default
administrator credentials are documented at the top of `scripts/seed.js`:

| Setting | Default |
| --- | --- |
| Email | `admin@zonghan.dev` |
| Password | `Capstone@2026` |
| Username | `zonghan` |

Override them with `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before
seeding a public deployment (or set `SEED_RESET_PASSWORD=true` to rotate an existing admin's
password). `SEED_PORTFOLIO_URL` fills the live link on the capstone project card once the client
is deployed.

### Alternative: register, then promote

The seed script is not required. You can register an account through the client and promote it:

```sh
npm run admin:promote -- your-registered-email@example.com
```

Public registration can never assign the admin role by itself.

## Checks

```sh
npm run check   # syntax-check every JavaScript file (includes seed.js)
npm run verify  # in-memory API suite: auth, bcrypt/JWT, authorization, CRUD, populate, errors
```

`verify` boots the real Express app against an in-memory model adapter, so it exercises routing,
middleware and controller logic without Atlas credentials. It also requires `scripts/seed.js`
and the `npm run seed` entry to exist, and asserts that no real `.env` file is present in the
working copy — delete or rename `server/.env` before running it if you created one locally.

## Deployment (Render)

The repository root contains `render.yaml`, which builds from this directory with
`npm ci` and starts with `npm start`; the health check path is `/api/health`.

Configure these environment variables in the Render dashboard:

- `MONGODB_URI` — Atlas connection string (never commit it)
- `JWT_SECRET` — private random value of 32+ characters
- `CLIENT_ORIGIN` — the deployed front-end origin, e.g. `https://your-site.vercel.app`
- `MONGODB_DB` — `capstone_portfolio`
- `NODE_ENV` — `production`

`PORT` is supplied by Render. The Express app trusts one reverse-proxy hop by default so that
rate limiting sees real visitor IPs; override with `TRUST_PROXY` only if the deployment adds
more proxy layers. After the first deploy, confirm `https://<api-url>/api/health` reports
`"database": "connected"`, then run the seed script locally against the same Atlas database.
