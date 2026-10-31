# Netlify deployment for the capstone API (Express → Netlify Functions)

The Express API is deployed as a single Netlify Function that wraps the Express app with
[`serverless-http`](https://github.com/dougmoscrop/serverless-http). This keeps the production API on a
free, always-on HTTPS hosting platform while the same Express code also works on Render/Heroku
(`render.yaml` is kept as an alternative).

## How it works

- `functions/api.js` — Lambda-style Netlify Function entry point. It lazily connects Mongoose to
  MongoDB Atlas, builds the Express app from `lib/`, and normalises the rewritten `/api/*` path.
- `netlify.toml` — rewrites `/api/*` to the function and sets the placeholder `public/` page.
- `prepare.mjs` — copies the real `server/` source into `lib/` at deploy time, so there is no
  duplicated code in the repository. It also swaps `bcrypt` for the API-compatible pure-JS `bcryptjs`
  because Netlify Functions run on Linux and cannot load a Windows-native `bcrypt` binary; the
  produced hashes are standard bcrypt hashes and work with `bcrypt.compare`.

## Deploy

```sh
cd deploy/netlify-api
npm ci
node prepare.mjs          # creates lib/ from ../../server (not committed)
npx netlify-cli deploy --prod --dir public --functions functions --site <site-id>
```

Environment variables (set with `netlify env:set … --site <site-id>`):

| Key | Value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | `capstone_portfolio` |
| `JWT_SECRET` | 32+ random characters |
| `CLIENT_ORIGIN` | Deployed front-end URL |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |

After deploying, the API is available under `https://<site>.netlify.app/api/*`
(health check: `/api/health`).

## Front-end deployment (Netlify static site)

The React SPA is deployed as a Netlify static site:

```sh
cd client
VITE_API_URL=https://<api-site>/api npm run build
# copy dist/ and add an SPA fallback redirect: /* /index.html 200
npx netlify-cli deploy --prod --dir dist --site <web-site-id>
```

See the root `README.md` for the deployed URLs.
