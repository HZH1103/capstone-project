# Lab 13: Fetching Live GitHub Projects with React

A responsive React portfolio that replaces hardcoded project data with public repositories fetched from the GitHub REST API.

## Features

- `Projects` uses `useState` for repository, loading, and error state.
- A `useEffect` fetches the selected GitHub user's repositories once when the component mounts.
- Loading, error, empty, and successful results have separate accessible messages.
- Repository name, description, and `html_url` are mapped to reusable `ProjectCard` props.
- The browser tab title updates when the number of repositories changes.
- The existing responsive portfolio layout and dark-mode control are retained.
- The default account is `octocat`, as shown in the assignment. Use your own account by setting `VITE_GITHUB_USERNAME` in a local `.env` file.

## Run locally

1. Install dependencies with `npm ci`.
2. Optionally copy `.env.example` to `.env` and change the username.
3. Start the app with `npm run dev` and open the local URL printed by Vite.

No GitHub token or other secret is needed for public repositories. Do not commit a real `.env` file.

## Verify

- `npm run check` checks the API helper syntax and creates a production build.
- `npm run verify` checks loading UI, repository mapping, card links, API success/error handling, and the optional title update.
