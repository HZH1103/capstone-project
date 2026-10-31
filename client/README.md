# Portfolio & Journal — React Client

The React single-page application for the Full-Stack Portfolio & Blog capstone project
(Web Data Management and Application). It is the client for the Express + MongoDB API in
`../server` and is deployed independently (for example on Vercel).

## Pages and routes

| Route | Page | Data |
| --- | --- | --- |
| `/` | Home / About | `GET /api/projects` for featured projects |
| `/projects` | Projects gallery | `GET /api/projects` |
| `/blog` | Journal list | `GET /api/blog` |
| `/blog/:id` | Journal entry + comments | `GET /api/blog/:id`, `POST /api/blog/:id/comments` |
| `/contact` | Contact form | `POST /api/contact` |
| `/login` | Log in | `POST /api/users/login` |
| `/register` | Create account | `POST /api/users/register` |
| `/admin` | Admin dashboard (protected) | Project and blog CRUD with the JWT |
| `*` | Not found | — |

`/admin` requires a logged-in administrator. Logged-out visitors are redirected to `/login` and
returned to the dashboard after signing in. Non-admin accounts see a short explanation instead of
the dashboard.

## Architecture

- **React 19 + Vite** with `BrowserRouter` and the routes above.
- **AuthContext** (Context API + `localStorage`) stores the JWT and user, refreshes the session
  against `GET /api/users/me`, and exposes `login`, `register`, and `logout`.
- **`services/api.js`** is the only place that talks to the API. It prefixes `API_BASE_URL`, sends
  JSON bodies, and attaches `Authorization: Bearer <token>` for protected requests.
- **Reusable components**: `Header` (auth-aware), `Footer`, `ProjectCard`, `BlogPostCard`,
  `PageHeading`, `LoadState` (loading/error/empty/retry), `ProtectedRoute`, `RouteEffects`.
- **Admin dashboard**: `ProjectManager` (create/update/delete projects) and `BlogManager`
  (create/update/delete blog posts; only the original author can edit or delete an entry, which
  mirrors the API authorization rules).
- All data comes from the API — nothing on the Projects or Journal pages is hardcoded.

## API base URL

`VITE_API_URL` is the single API configuration value. It defaults to
`http://localhost:5000/api` when unset.

```bash
# .env (local only — never commit a real .env)
VITE_API_URL=http://localhost:5000/api
```

For the deployed front end, set `VITE_API_URL` in the Vercel project to the public API URL with
the `/api` suffix, for example `https://your-api.onrender.com/api`. Rebuild after changing it.

## Run locally

1. Start the API (see `../server`), configured with its own `.env`.
2. Install dependencies: `npm ci`
3. Optional: copy `.env.example` to `.env` and point `VITE_API_URL` at the API.
4. `npm run dev` and open the printed local URL.

## Scripts

- `npm run dev` — Vite development server.
- `npm run build` — production build into `dist/`.
- `npm run preview` — preview the production build.
- `npm run verify` — static verification of the required files, routes, API calls, and auth
  contract (`node scripts/verify.mjs`).

## Deployment notes

- `vercel.json` rewrites every path to `index.html` so client-side routes work on refresh.
- Set `VITE_API_URL` before building; the value is baked into the bundle at build time.
- The API only accepts requests from origins listed in its `CLIENT_ORIGIN` variable, so add the
  deployed front-end URL there as well.
- The first registered account is a normal user. Promote an account to administrator from the
  server folder with `npm run admin:promote` so it can use `/admin`.
