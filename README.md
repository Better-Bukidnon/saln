# SALN Tracker: Bukidnon

Public aggregator of Statements of Assets, Liabilities and Net Worth (SALN) links for Bukidnon officials. Aggregator, not the original source; not an official government website.

## Scripts

- `npm run dev` start the dev server
- `npm run build` typecheck and build to `dist/`
- `npm test` unit tests (vitest)
- `npm run lint` eslint
- `npm run e2e` Playwright tests

Deploys as static assets via Cloudflare Workers (`wrangler.jsonc`, worker name `saln-bukidnon`).

## Data sources

`data/geo.json` (Bukidnon geography: 1 province, 2 cities, 20 municipalities, 464 barangays) is built from the Philippine Standard Geographic Code (PSGC).

- Source: the community PSGC API mirror at https://psgc.gitlab.io/api/ (`provinces/`, `provinces/101300000/cities-municipalities.json`, `provinces/101300000/barangays.json`), fetched 2026-11-02. The PSA publication page (https://psa.gov.ph/classification/psgc/) was not reachable by script (Cloudflare challenge), so the mirror was used; its counts match the PSA's (2 cities, 20 municipalities, 464 barangays). Vintage is whatever the mirror served on that date; the mirror does not state a PSGC publication quarter.
- Conversion: a throwaway script (outside the repo) turned the three JSON files into a CSV with columns `10-digit PSGC, Name, Correspondence Code, Geographic Level` (`Prov`/`City`/`Mun`/`Bgy`), using each record's `psgc10DigitCode`.
- Build: `npx tsx scripts/build-geo.ts <psgc.csv>` rewrites `data/geo.json`. The same command accepts the PSA masterlist exported as CSV. `npm run validate-data` asserts the exact counts and that every parent exists.
- Note: Bukidnon's 10-digit PSGC is `1001300000` (region 10, province 013), so rows are kept when the code starts with `10013`.
