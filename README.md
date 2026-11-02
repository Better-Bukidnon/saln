# SALN Tracker: Bukidnon

Public aggregator of Statements of Assets, Liabilities and Net Worth (SALN) links for Bukidnon officials. Aggregator, not the original source; not an official government website.

## Scripts

- `npm run dev` start the dev server
- `npm run build` typecheck and build to `dist/`
- `npm test` unit tests (vitest)
- `npm run lint` eslint
- `npm run e2e` Playwright tests

Deploys as static assets via Cloudflare Workers (`wrangler.jsonc`, worker name `saln-bukidnon`).
