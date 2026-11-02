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

### Roster of officials

`data/officials/openhalalan-<year>.json` (2016, 2019, 2022, 2025 elections) is generated from the BetterGov Dynasties API (`https://officials.bettergov.ph/api/v1`), which serves Open Halalan data: Leung, Robert R., *Open Halalan: The Philippine National and Local Election Dataset*, https://robertrleung.github.io/OpenHalalan/. The derived data is CC0 1.0 (BetterGov.ph).

- Regenerate: `npx tsx scripts/import-roster.ts [--years 2016,2019,2022,2025] [--from-fixture <file>]`. Output is sorted and deterministic, so reruns diff cleanly. Towns that cannot be matched to a PSGC LGU are printed as `UNMAPPED` and never dropped silently.
- For the 2025 term the governor, vice governor, board member and representative seats are not imported; the curated `data/officials/seed.json` covers them. Every imported row is `rosterVerified: false`.


### Barangay captains

No captain data ships with the repo. The importer turns a CSV you supply (a COMELEC/DILG export, or a manual capture) into `data/officials/barangay-captains.json`. The tool never scrapes a website and never invents names.

- CSV columns, header row required: `municipality,barangay,name,source`. Quoted fields (names with commas) are allowed; UTF-8 with or without BOM; CRLF or LF.
- `source` must be `comelec`, `dilg` or `community` (case-insensitive). Anything else is an invalid row. Community-sourced rows are not official.
- Matching: the municipality is matched first (case, accent, space and hyphen insensitive; "City of"/"Municipality of"/trailing "City" ignored), then the barangay only among that municipality's own barangays, so a "Poblacion" row always lands on its own town's Poblacion. A leading "Barangay "/"Brgy. " is ignored and a "(Pob.)" suffix is optional; numbers are kept ("Barangay 2" and "Barangay 3" stay distinct). Row numbers in reports count the header as row 1.
- Every row imports as `rosterVerified: false` (shown with the unverified badge), `position: 'Punong Barangay'`, term 2023-11-30 to 2026-11-30. Ids are `2023-<barangayCode>-punong-barangay`; `personId` is `cap-<barangayCode>-2023` because identity across terms is unknown.
- Run: `npx tsx scripts/import-barangays.ts captains.csv [--out data/officials/barangay-captains.json] [--allow-partial] [--force]`. It prints counts, unmatched/duplicate/invalid rows and the barangays that still have no captain (count plus first 20 when more than 20). It exits non-zero and writes nothing if any row is unmatched or invalid, unless `--allow-partial`. Two rows for one barangay: the first wins and the rest are listed as duplicates. An existing output file is not overwritten without `--force`.
- Workflow: obtain the CSV, run the importer, fix reported rows in the CSV and rerun, then `npm run validate-data`. After the next barangay election, only the CSV and the term dates in the script change.

## Translations

The interface is available in English, Filipino (`fil`) and Binisaya/Cebuano (`ceb`). **The Filipino and Binisaya strings were machine-assisted and have NOT been reviewed by native speakers. They need native-speaker review before launch.** Shared terms were aligned with the main site's dictionaries (`betterbukidnon/assets/js/translations.js`). Legal terms stay as is (SALN, Ombudsman).

To edit a translation, change the entry in `src/lib/strings.ts` (the `en`, `fil` and `ceb` objects share the same keys). `{name}` placeholders must stay identical in every language. Run `npm test`: `tests/unit/i18n.test.ts` fails on a missing key, an empty value or a placeholder mismatch. A key missing in one language falls back to English at runtime. The chosen language is saved in `localStorage` (key `saln-lang`) and defaults to English.

## Submitting a SALN copy

The issue form is `.github/ISSUE_TEMPLATE/submit-saln.yml`. The GitHub label `saln-submission` must be created once in the repo (Issues > Labels), otherwise GitHub silently drops it. It collects links and declared totals only and never asks for file uploads. Maintainers verify a submission before any record is published.

## Assets and credits

- `public/logo.svg`, `public/logo-white.svg`, `public/favicon.svg`, `public/favicon.ico` and `public/bettergov-footer.svg` are copied unchanged from the BetterBukidnon site (`betterbukidnon/assets/images/logo/`: `better-bukidnon-logo.svg`, `better-bukidnon-logo-white.svg`, `favicon.svg`, `favicon.ico`, `bettergov-footer.svg`). That repository is dual-licensed MIT (code) and CC BY 4.0 (content, including images); the logo files carry their own notes inside (province outline from OpenStreetMap, ODbL 1.0; wordmark Inter Display, SIL OFL 1.1). `bettergov-footer.svg` is the BetterGov.ph partner mark that the main site displays in its footer; it stays the property of BetterGov.ph and is used here only to credit the partner.
- Layout and styling follow [SALN Tracker PH](https://github.com/JHNLWHD/saln-tracker-ph) (MIT) and the BetterBukidnon site's design tokens.
