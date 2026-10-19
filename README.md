# 何宗翰 — Full-Stack Portfolio & Blog

A responsive React portfolio connected to an Express and Mongoose API. Visitors can browse projects and journal entries, send a contact message, create an account, and comment while signed in. An administrator can manage projects and blog posts from the protected dashboard.

## Live URLs

- Front end: not deployed yet; add the public Vercel or Netlify URL after deployment.
- Back end: not deployed yet; add the public Render URL after deployment. The API health route is `/api/health`.

The repository includes Render and Vercel deployment configuration. A MongoDB Atlas URI, JWT secret, and authenticated hosting accounts are required before either live URL can be created. No production credentials are included in this archive.

## Project structure

```text
client/   React SPA, Vite build, React Router pages
server/   Express REST API, MVC controllers, Mongoose models
render.yaml
```

## Run locally

Requirements: Node.js 20 or newer, npm, and a MongoDB Atlas database (or a local MongoDB instance).

1. Install dependencies:

   ```sh
   cd server && npm ci
   cd ../client && npm ci
   ```

2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` to your own database connection string. Set `JWT_SECRET` to a private random value of at least 32 characters. Do not commit or share the `.env` file.

3. Copy `client/.env.example` to `client/.env.local`. Set `VITE_API_URL=http://localhost:5000/api` for local development.

4. Start the API in one terminal:

   ```sh
   cd server && npm run dev
   ```

5. Start the web client in another terminal:

   ```sh
   cd client && npm run dev
   ```

   Open the local URL printed by Vite (normally `http://localhost:5173`). The API health endpoint is `http://localhost:5000/api/health`.

### Set up the administrator account

1. Register an account from the site’s **Join the journal** link.
2. In the `server` folder, promote that registered email using the local database connection:

   ```sh
   npm run admin:promote -- your-registered-email@example.com
   ```

3. Log out and back in. The account’s administrator role is included in the new login session. Public registration cannot assign the admin role.

Add projects and blog posts from `/admin`. This account and its data are stored in your configured database; no seeded passwords or private records are bundled.

## Environment variables

### API (`server/.env`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Private MongoDB Atlas URI |
| `MONGODB_DB` | Database name (defaults to `capstone_portfolio`) |
| `PORT` | API port (defaults to `5000`) |
| `JWT_SECRET` | Private signing secret, at least 32 characters |
| `CLIENT_ORIGIN` | Allowed web origin; comma-separate multiple origins |
| `NODE_ENV` | Set to `production` when deployed |

### Web client (`client/.env.local`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL ending in `/api` |

## API endpoints

All request and response bodies use JSON. Protected routes require `Authorization: Bearer <token>`. IDs are MongoDB document IDs.

| Method | Endpoint | Access | Purpose and expected input |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API and database readiness |
| `POST` | `/api/users/register` | Public | Register with `{ "username", "email", "password" }` |
| `POST` | `/api/users/login` | Public | Sign in with `{ "email", "password" }`; returns user and JWT |
| `GET` | `/api/users/me` | Signed in | Return the current account |
| `GET` | `/api/projects` | Public | List projects with their author username |
| `GET` | `/api/projects/:id` | Public | Read one project |
| `POST` | `/api/projects` | Admin | Create using `{ "title", "description", "imageUrl?", "repoUrl?", "liveUrl?" }` |
| `PUT` | `/api/projects/:id` | Admin | Update any supplied project fields |
| `DELETE` | `/api/projects/:id` | Admin | Delete a project |
| `POST` | `/api/contact` | Public | Save `{ "name", "email", "message" }` as a contact message |
| `GET` | `/api/blog` | Public | List posts with author usernames |
| `GET` | `/api/blog/:id` | Public | Read a post with author and comments |
| `POST` | `/api/blog` | Signed in | Create `{ "title", "content" }`; the signed-in user becomes author |
| `PUT` | `/api/blog/:id` | Original author | Update supplied `{ "title?", "content?" }` fields |
| `DELETE` | `/api/blog/:id` | Original author | Delete the author’s post |
| `GET` | `/api/blog/:postId/comments` | Public | List comments with author usernames |
| `POST` | `/api/blog/:postId/comments` | Signed in | Create a comment using `{ "body" }` |

## Data models

- **User:** unique username and email, bcrypt-hashed password excluded from normal queries, and `user`/`admin` role.
- **Project:** title, description, optional image/repository/live URLs, owner reference, and timestamps.
- **BlogPost:** title, content, author reference, timestamps, and a virtual relationship to comments.
- **Comment:** body, author reference, post reference, and timestamps.
- **Message:** name, email, message, and timestamps.

## Validation and checks

Run these from the corresponding folder:

```sh
# API
npm run check
npm run verify

# Web client
npm run check
npm run verify
```

`verify` exercises the API with in-memory model adapters and checks validation, auth, authorization, CRUD routes, error responses, and relationships without a live database. It does not need Atlas credentials.

## Deployment

- **API:** use the included `render.yaml` blueprint. Configure `MONGODB_URI`, a private `JWT_SECRET`, and `CLIENT_ORIGIN` in the hosting dashboard. After deployment, check `<API_URL>/api/health`.
- **Web client:** deploy the `client` directory to Vercel or Netlify. Set `VITE_API_URL` to `<API_URL>/api` before building. The Vercel rewrite keeps React Router deep links working.
- After both sites are live, replace the two entries in **Live URLs** with their public addresses.

## Chaoxing submission

Create one archive named `24998116_何宗翰_CapstoneProject.zip` containing `client/`, `server/`, and this README. Exclude every `node_modules` folder and every real `.env` file. Include `client/package.json`, `client/package-lock.json`, `server/package.json`, and `server/package-lock.json`.
