# 何宗翰 — Full-Stack Portfolio & Blog Application

Capstone project for **Web Data Management and Application**.

- **Student:** 何宗翰 (Zonghan He) — Student ID: **24998116**
- **Project type:** Cumulative Full-Stack Capstone Project (100 marks)
- **Repository:** <https://github.com/HZH1103/capstone-project>

A production-style personal portfolio and blog. Visitors can browse the project gallery, read the blog,
send a contact message, register an account and comment on posts while signed in. Signed-in
administrators get a dashboard that manages portfolio projects and blog posts (create, update, delete)
through the live REST API.

## Live URLs

| Deployment | URL |
| --- | --- |
| Front-end (React SPA, Vercel) | _Filled in after deployment — see final submission note_ |
| Back-end API (Express, Render) | _Filled in after deployment — see final submission note_ |
| Database | MongoDB Atlas (cloud-hosted M0 cluster) |

The front-end talks **exclusively** to the deployed back-end API; the API persists every record in
MongoDB Atlas and is configured through `.env` variables only (no secrets in the repository).

### Demo administrator account

The database is seeded with an administrator account so the dashboard can be reviewed immediately:

| Field | Value |
| --- | --- |
| Email | `admin@zonghan.dev` |
| Password | `Capstone@2026` |
| Username | `zonghan` |

> The password is documented deliberately for grading/demo purposes. Change it in a real deployment.

## Project structure

```text
capstone-project/
├── client/                     React SPA (Vite, React Router, Context API)
│   ├── src/pages/              Home, Projects, Blog, BlogDetail, Contact, Login, Register, Admin, NotFound
│   ├── src/pages/admin/        ProjectManager + BlogManager (protected CRUD)
│   ├── src/components/         Header, Footer, cards, LoadState, ProtectedRoute, ...
│   ├── src/auth/AuthContext.jsx   Global authentication state (Context API + localStorage)
│   ├── src/services/api.js        Fetch wrapper that attaches `Authorization: Bearer <JWT>`
│   ├── vercel.json             SPA rewrites for client-side routing
│   └── scripts/verify.mjs      Static client verification
├── server/                     Express REST API (MVC)
│   ├── models/                 Mongoose schemas: User, Project, BlogPost, Comment, Message
│   ├── controllers/            Business logic for users, projects, blog, comments, contact
│   ├── routes/                 Express routers (+ rate limiting)
│   ├── middleware/             `protect` JWT middleware, central error handler
│   ├── utils/                  JWT helper, error class
│   ├── scripts/seed.js         Idempotent production seed (admin + demo content)
│   ├── scripts/verify.js       Full in-memory API verification
│   └── server.js               App factory + startup (connects to MongoDB Atlas)
├── render.yaml                 Render blueprint for the API service
└── README.md                   This file
```

## API endpoints

Base URL: `https://<backend-url>/api` (locally `http://localhost:5000/api`).
All protected routes expect `Authorization: Bearer <token>` where the token comes from
`POST /api/users/login`. Error responses are consistent JSON: `{ "success": false, "status": <code>, "message": "..." }`.

### Users / authentication

| Method | Endpoint | Access | Purpose | Body |
| --- | --- | --- | --- | --- |
| POST | `/api/users/register` | Public | Create an account (bcrypt-hashed password) | `{ "username", "email", "password" }` |
| POST | `/api/users/login` | Public | Authenticate and receive a JWT | `{ "email", "password" }` |
| GET | `/api/users/me` | Protected | Current user (used by the client to revalidate sessions) | — |

### Projects (portfolio)

| Method | Endpoint | Access | Purpose | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/projects` | Public | List all projects (newest first) | — |
| GET | `/api/projects/:id` | Public | Get one project | — |
| POST | `/api/projects` | Protected | Create a project linked to `req.user` | `{ "title", "description", "imageUrl?", "repoUrl?", "liveUrl?" }` |
| PUT | `/api/projects/:id` | Protected | Update a project | any of the project fields |
| DELETE | `/api/projects/:id` | Protected | Delete a project | — |

### Blog posts

| Method | Endpoint | Access | Purpose | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/blog` | Public | List posts, `author` populated with `username` | — |
| GET | `/api/blog/:id` | Public | One post, `author` populated and all `comments` included | — |
| POST | `/api/blog` | Protected | Create a post authored by the logged-in user | `{ "title", "content" }` |
| PUT | `/api/blog/:id` | Protected + author only | Update a post (other users receive `403`) | any of `{ "title", "content" }` |
| DELETE | `/api/blog/:id` | Protected + author only | Delete a post and its comments | — |

### Comments (on blog posts)

| Method | Endpoint | Access | Purpose | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/blog/:postId/comments` | Public | List comments for a post, author populated | — |
| POST | `/api/blog/:postId/comments` | Protected | Comment as the logged-in user | `{ "body" }` |

### Contact & health

| Method | Endpoint | Access | Purpose | Body |
| --- | --- | --- | --- | --- |
| POST | `/api/contact` | Public | Store a contact-form message in MongoDB | `{ "name", "email", "message" }` |
| GET | `/api/health` | Public | Liveness + database connection status | — |

## Run the project locally

Requirements: **Node.js 20+**, npm, and a MongoDB database (MongoDB Atlas recommended — a local
MongoDB instance also works).

### 1. Install dependencies

```sh
cd server && npm ci
cd ../client && npm ci
```

### 2. Configure the API (`server/.env`)

Copy `server/.env.example` to `server/.env` and fill in the values (never commit the real file):

```ini
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/capstone_portfolio?retryWrites=true&w=majority
MONGODB_DB=capstone_portfolio
PORT=5000
JWT_SECRET=<at-least-32-random-characters>
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

`JWT_SECRET` is mandatory: the server refuses to start without a secret of at least 32 characters.
`CLIENT_ORIGIN` is a comma-separated allow-list for CORS.

### 3. Configure the client (`client/.env.local`)

```ini
VITE_API_URL=http://localhost:5000/api
```

`VITE_API_URL` is read at build time and is the single place the SPA points at the API — this is how
front-end and back-end are connected locally and in deployment.

### 4. (Optional) Seed demo content + the admin account

```sh
cd server
npm run seed            # uses MONGODB_URI from server/.env
npm run seed -- --dry-run
```

The seed is idempotent (safe to run repeatedly). It creates the documented administrator account and
demo projects, blog posts and a sample comment.

### 5. Run both halves

```sh
# terminal 1 — API on http://localhost:5000
cd server && npm run dev

# terminal 2 — SPA on http://localhost:5173
cd client && npm run dev
```

Sign in at `http://localhost:5173/login`, the admin dashboard is at `/admin`.

### Promote an account to admin (alternative to the seed admin)

```sh
cd server
npm run admin:promote -- you@example.com
```

Registration through the public form always creates a normal user; only the admin role can manage
projects, while blog posts remain author-editable.

## Deploying

1. **Database** — create a free MongoDB Atlas M0 cluster, a database user with read/write access and
   allow the hosting provider's egress IPs (or `0.0.0.0/0` for a course deployment).
2. **Back-end** — deploy `server/` to Render as a Web Service (Node runtime):
   build `npm ci`, start `npm start`, health check `/api/health`, environment variables
   `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`.
   `render.yaml` in the repository root encodes most of this.
3. **Front-end** — deploy `client/` to Vercel with `VITE_API_URL=https://<render-api-url>/api`
   (Vite bakes the value in at build time — rebuild after changing it), then add the Vercel origin to
   the API's `CLIENT_ORIGIN`.
4. Seed the production database once with `npm run seed` (from a machine that can reach Atlas).

## Verification & quality

```sh
# API: syntax + full in-memory integration test suite (23 endpoint/security checks)
cd server && npm run check && npm run verify

# SPA: production build + route/contract static verification
cd client && npm run build && npm run verify
```

Both suites pass and are part of the submitted source. The API also ships with `helmet`,
`express-rate-limit` (with correct `trust proxy` handling behind Render), bcrypt password hashing,
JWT authorization, ownership checks for blog posts, and a central JSON error handler.

## Course requirements → implementation map

| Requirement | Where |
| --- | --- |
| MVC back end + Mongoose models with validation | `server/models`, `server/controllers`, `server/routes` |
| MongoDB Atlas + Mongoose connection | `server/config/db.js`, `MONGODB_URI` env var |
| bcrypt hashing + JWT auth + `protect` middleware | `server/models/UserModel.js`, `server/utils/generateToken.js`, `server/middleware/auth.js` |
| Blog author-only update/delete | `server/controllers/blogController.js` (`403` for other users) |
| Comments, contact messages, `populate()` | `server/controllers/commentController.js`, `server/controllers/contactController.js`, `server/controllers/blogController.js` |
| Central error handling + security headers | `server/middleware/error.js`, `helmet`, `dotenv`, `express-rate-limit` |
| Reusable React components + responsive styling | `client/src/components`, `client/src/index.css` |
| React Router with public + protected routes | `client/src/App.jsx`, `client/src/components/ProtectedRoute.jsx` |
| Context API auth state + auth-aware header | `client/src/auth/AuthContext.jsx`, `client/src/components/Header.jsx` |
| Admin dashboard CRUD with JWT | `client/src/pages/admin/ProjectManager.jsx`, `client/src/pages/admin/BlogManager.jsx` |
| Loading/error states everywhere | `client/src/components/LoadState.jsx` and pages |
