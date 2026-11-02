# SALN Tracker for Bukidnon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone static portal listing Bukidnon officials (province, LGU, barangay captains) with source-linked SALN records, filterable by municipality and barangay, and link to it from the main BetterBukidnon site.

**Architecture:** A React + Vite + TypeScript static app in a new folder, `saln-bukidnon`, with no backend. All data is JSON in the repo (`data/geo.json`, `data/officials/*.json`, `data/saln/*.json`), validated by a script that CI runs. Import scripts produce draft JSON, and a human verifies drafts before they count as verified. The main site only gets a link.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Vitest (unit), Playwright (e2e), ESLint, Cloudflare Workers static assets (`wrangler.jsonc`), `tsx` to run scripts, `pdftotext` (poppler) for House PDFs.

**Spec:** `betterbukidnon/docs/superpowers/specs/2026-11-02-saln-tracker-design.md`

## Global Constraints

- Project folder: `/Users/ict/Documents/Personal_Projects/kode-projects/saln-bukidnon` (own git repo). Main site repo is `.../betterbukidnon`.
- No Firebase, no backend, no user uploads. Zero hosting cost.
- Bukidnon PSGC province code `1001300000`; 2 cities, 20 municipalities, 464 barangays.
- Store declared totals only. No addresses, spouse/children details, signatures or ID numbers.
- `netWorth` must equal `totalAssets - totalLiabilities` to the centavo (compare `Math.round(x*100)`). Net worth may be negative.
- A SALN record needs `sourceUrl` and `status`; nothing is `verified` without `verifiedBy` and `verifiedAt`.
- Always visible: "Aggregator, not the original source; not an official government website."
- Roster rows imported from Dynasties or the community directory have `rosterVerified: false` and show an "unverified" badge.
- Filter state lives in the URL query string. Filter by PSGC code, never by name (many barangays are named "Poblacion").
- UI strings in EN / FIL / CEB. Cite Open Halalan (roster) and PSA (geography).
- Outward-facing steps (creating the GitHub repo, DNS, deploy) need the user's explicit go-ahead.
- Commits: end messages with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

- Barangay named "Poblacion" exists in many LGUs: selecting LGU A + barangay code from LGU B must not match; names must never be used as keys.
- URL has a stale or garbage param (`?lgu=zzz`, `?barangay=` with no LGU): the app must fall back to no filter, never crash or show empty results silently.
- `termEnd: null` (current term not yet ended) and `termEnd` in the past: `isCurrent` must handle both, including the day the term ends.
- Liabilities exceed assets (negative net worth) and `0` liabilities: formatting and sorting must stay correct, with no "NaN" or hidden zero.
- Names with `ñ`, `Jr.`, `Sr.`, commas, apostrophes or regex characters typed into search: search must match accent-insensitively and never throw.

---

> Task 12 (restyle to the SALN Tracker PH design) was added 2026-11-02 at the user's request; the smoke test and launch docs are Task 13.

## File Structure (new project `saln-bukidnon`)

```
portal.config.ts            province code, name, disclaimer, ombudsman URL, mainSiteUrl
src/lib/types.ts            Official, SalnRecord, GeoNode, Filters (single source of types)
src/lib/geo.ts              geo lookups (lgus, barangaysOf, nodeByCode)
src/lib/filter.ts           isCurrent, filterOfficials, sortOfficials, parseFilters, serializeFilters
src/lib/money.ts            formatPeso, netWorthMatches
src/lib/data.ts             loads geo/officials/saln JSON, joins latest SALN per person
src/lib/i18n.ts             EN/FIL/CEB strings + useT()
src/pages/OfficialsPage.tsx, OfficialPage.tsx, AboutPage.tsx
src/components/FilterBar.tsx, OfficialCard.tsx, SalnTable.tsx, Disclaimer.tsx, UnverifiedBadge.tsx
data/geo.json, data/officials/*.json, data/saln/*.json
scripts/validate-data.ts, build-geo.ts, import-roster.ts, import-barangays.ts, import-house-saln.ts
tests/unit/*.test.ts, tests/e2e/*.spec.ts, tests/fixtures/
.github/workflows/ci.yml, .github/ISSUE_TEMPLATE/submit-saln.yml
```

---

### Task 1: Project scaffold and config

**Files:**
- Create: whole project skeleton in `saln-bukidnon/` (`package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `wrangler.jsonc`, `index.html`, `src/main.tsx`, `src/App.tsx`, `portal.config.ts`, `.github/workflows/ci.yml`, `README.md`)
- Test: `tests/unit/config.test.ts`

**Interfaces:**
- Produces: `portalConfig` (default export of `portal.config.ts`) with `{ provinceName: 'Bukidnon'; provincePsgc: '1001300000'; disclaimer: string; ombudsmanRequestUrl: 'https://www.ombudsman.gov.ph/request-for-copy-of-salns/'; mainSiteUrl: 'https://betterbukidnon.org' }`. npm scripts: `dev`, `build`, `test` (vitest run), `lint`, `validate-data`, `e2e`.

- [ ] **Step 1: Write the failing test** `config.test.ts`: `portalConfig.provincePsgc === '1001300000'`, `ombudsmanRequestUrl` equals the URL above, `disclaimer` contains "not an official government website".
- [ ] **Step 2: Run** `npm test` (after `git init` and scaffolding with `npm create vite@latest . -- --template react-ts`, then adding vitest, react-router, eslint, playwright, tsx). Expected: FAIL, `portal.config.ts` missing.
- [ ] **Step 3: Implement** `portal.config.ts`; wire `wrangler.jsonc` for static assets with SPA fallback (unknown paths → `index.html`), copying the shape of `Better-Bukidnon/budget`'s `wrangler.jsonc`; CI workflow runs `lint`, `test`, `validate-data`, `build`.
- [ ] **Step 4: Run** `npm test && npm run build`. Expected: PASS, `dist/` produced.
- [ ] **Step 5: Commit** `chore: scaffold SALN portal`.

---

### Task 2: Types, money helpers, data validator

**Files:**
- Create: `src/lib/types.ts`, `src/lib/money.ts`, `scripts/validate-data.ts`, `tests/fixtures/valid/`, `tests/fixtures/invalid/`
- Test: `tests/unit/money.test.ts`, `tests/unit/validate-data.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `Level = 'province'|'district'|'city'|'municipality'|'barangay'`
  - `GeoNode { psgc: string; name: string; type: 'province'|'city'|'municipality'|'barangay'; parent?: string }`
  - `Official { id; personId; name; position; level: Level; geoCode: string; district?: 1|2|3|4; termStart: string; termEnd: string|null; rosterSource: 'openhalalan'|'comelec'|'dilg'|'community'|'manual'; rosterVerified: boolean; party?: string }` (dates `YYYY-MM-DD`)
  - `SalnRecord { id; personId; year: number; filingType: string; totalAssets: number; totalLiabilities: number; netWorth: number; sourceType: 'house-summary'|'ombudsman'|'lgu'|'submitted'; sourceUrl: string; status: 'submitted'|'verified'|'under_review'|'flagged'; verifiedBy?: string; verifiedAt?: string }`
  - `Filters` defined in Task 4.
- Produces (`money.ts`): `formatPeso(amount: number, short?: boolean): string` (`₱24.96M` short, `₱24,957,188.98` long, negatives as `-₱…`); `netWorthMatches(r: Pick<SalnRecord,'totalAssets'|'totalLiabilities'|'netWorth'>): boolean`.
- Produces (`validate-data.ts`): `validateData(dir: string): string[]` returns error messages (empty = valid); CLI exits 1 on any error.

- [ ] **Step 1: Write failing tests.** `money.test.ts`: `formatPeso(24957188.98)` → `₱24,957,188.98`; `formatPeso(24957188.98, true)` → `₱24.96M`; `formatPeso(-1500000, true)` → `-₱1.50M`; `formatPeso(0)` → `₱0.00`; `netWorthMatches({totalAssets:16366487.45,totalLiabilities:6507000,netWorth:9859487.45})` true, off by 0.01 false. `validate-data.test.ts` with fixtures: valid dir returns `[]`; each invalid fixture returns one error naming the rule: unknown `geoCode`, SALN missing `sourceUrl`, net worth mismatch, `verified` without `verifiedBy`, duplicate `(personId, year, sourceType)`, `termEnd` before `termStart`, SALN `personId` with no official.
- [ ] **Step 2: Run** `npx vitest run tests/unit/money.test.ts tests/unit/validate-data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the types, `money.ts` (Intl-free manual grouping is fine; `K/M/B` for short), and `validateData` reading `data/geo.json`, `data/officials/*.json`, `data/saln/*.json`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat: data types, money helpers and data validator`.

---

### Task 3: Geography build from PSGC

**Files:**
- Create: `scripts/build-geo.ts`, `src/lib/geo.ts`, `data/geo.json`, `tests/fixtures/psgc-sample.csv`
- Test: `tests/unit/build-geo.test.ts`, `tests/unit/geo.test.ts`

**Interfaces:**
- Consumes: `GeoNode` from Task 2.
- Produces: `buildGeo(csvText: string): GeoNode[]`, keeping rows whose 10-digit code starts with `10013`, mapping the "Geographic Level" values `Prov`→province, `City`→city, `Mun`→municipality, `Bgy`→barangay, with `parent` set from the code hierarchy. CLI: `tsx scripts/build-geo.ts <psgc.csv>` writes `data/geo.json`. `geo.ts`: `type Geo = { nodes: GeoNode[] }`, `lgus(geo): GeoNode[]` (cities+municipalities, sorted by name), `barangaysOf(geo, lguCode: string): GeoNode[]`, `nodeByCode(geo, code: string): GeoNode | undefined`.
- The user must supply the PSA PSGC masterlist export as CSV (download from https://psa.gov.ph/classification/psgc/, save the sheet as CSV). Check the real column names against the file and adjust the parser, since the fixture only mimics them.

- [ ] **Step 1: Write failing tests.** With the fixture (province row, 2 LGUs, 2 barangays each including a "Poblacion" in both): `buildGeo` returns 1 province, 2 LGUs, 4 barangays, each barangay's `parent` is its LGU; non-Bukidnon rows are dropped. `geo.test.ts`: `barangaysOf` returns only that LGU's barangays (the two "Poblacion" have different codes); `nodeByCode('bogus')` undefined.
- [ ] **Step 2: Run** both test files. Expected: FAIL.
- [ ] **Step 3: Implement** `build-geo.ts` and `geo.ts`.
- [ ] **Step 4: Run** the tests. Expected: PASS. Then run the CLI on the real PSGC file and confirm `data/geo.json` has 22 LGUs and 464 barangays (`validate-data` extended to assert these counts for the real file).
- [ ] **Step 5: Commit** `feat: build Bukidnon geography from PSGC`.

---

### Task 4: Filter, search and sort logic

**Files:**
- Create: `src/lib/filter.ts`
- Test: `tests/unit/filter.test.ts`

**Interfaces:**
- Consumes: `Official`, `SalnRecord`, `Geo`, `barangaysOf`, `nodeByCode`.
- Produces:
  - `Filters { lgu?: string; barangay?: string; provinceWide: boolean; level?: Level; status: 'current'|'former'|'all'; hasSaln: boolean; q: string; sort: 'name'|'netWorth'|'assets'|'liabilities'; dir: 'asc'|'desc' }` and `defaultFilters: Filters` (`status: 'current'`, `sort: 'name'`, `dir: 'asc'`).
  - `isCurrent(o: Official, today: Date): boolean` (true when `termStart <= today` and (`termEnd` null or `today <= termEnd`)).
  - `filterOfficials(officials: Official[], salnByPerson: Map<string, SalnRecord[]>, geo: Geo, f: Filters, today: Date): Official[]`.
  - `sortOfficials(officials, salnByPerson, f): Official[]` (officials without a SALN sort last for numeric sorts regardless of `dir`).
  - `parseFilters(params: URLSearchParams, geo: Geo): Filters` and `serializeFilters(f: Filters): URLSearchParams` (only non-default values are written).

- [ ] **Step 1: Write failing tests** (fixture of ~8 officials across 2 LGUs and 3 barangays):
  - `lgu=A` returns LGU A officials plus captains of A's barangays, not B's; `lgu=A&barangay=<A's code>` returns only that captain; province-level officials appear when no `lgu`, or when `provinceWide` is true with an `lgu`.
  - Barangay code belonging to LGU B with `lgu=A` → `parseFilters` drops `barangay`.
  - `parseFilters(new URLSearchParams('lgu=zzz'), geo)` equals `defaultFilters`; `barangay=` without `lgu` is ignored.
  - `isCurrent`: `termEnd: null` true; `termEnd` equal to today true; day after false; `termStart` in the future false.
  - `status`, `level`, `hasSaln` filters; `q='nuñez'` matches `NUNEZ` and `Núñez`; `q='(Jr.'` and `q='[a-'` don't throw and match nothing.
  - Sorting by `netWorth` desc with a negative value and a no-SALN official: negative sits above no-SALN; `serializeFilters(parseFilters(p))` round-trips.
- [ ] **Step 2: Run** `npx vitest run tests/unit/filter.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** in `filter.ts` (accent-insensitive via `normalize('NFD')` with combining marks stripped; plain `includes`, no `RegExp` built from input).
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** `feat: official filtering, search, sort and URL state`.

---

### Task 5: Data loader and Officials list page

**Files:**
- Create: `src/lib/data.ts`, `src/pages/OfficialsPage.tsx`, `src/components/FilterBar.tsx`, `src/components/OfficialCard.tsx`, `src/components/UnverifiedBadge.tsx`, `src/components/Disclaimer.tsx`; modify `src/App.tsx` (routes `/`, `/official/:id`, `/about`)
- Create seed data: `data/officials/seed.json` (from `betterbukidnon/data/officials.json`: governor, vice governor, board members, representatives) and 3 sample barangay captains for tests only, in `tests/fixtures/`
- Test: `tests/e2e/filter.spec.ts` (Playwright, runs against `vite preview` using real `data/`), `tests/unit/data.test.ts`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces: `loadAll(): { geo: Geo; officials: Official[]; salnByPerson: Map<string, SalnRecord[]> }` (static JSON import via `import.meta.glob`); `latestSaln(records: SalnRecord[] | undefined): SalnRecord | undefined` (highest `year`).

- [ ] **Step 1: Write failing tests.** `data.test.ts`: `latestSaln` picks the highest year and returns `undefined` for empty/undefined. `filter.spec.ts`: choosing a municipality in the "Municipality" select enables the "Barangay" select and lists only that municipality's barangays; changing the municipality resets the barangay; the URL gains `?lgu=<code>`; reloading that URL restores the selection; `?lgu=zzz` renders the unfiltered list; the disclaimer text is present on every page.
- [ ] **Step 2: Run** `npx vitest run tests/unit/data.test.ts` and `npx playwright test tests/e2e/filter.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the loader, list page (cards show name, position, LGU/barangay, latest net worth or "No SALN data yet", unverified badge when `rosterVerified` is false), and `FilterBar` (LGU select, dependent barangay select, province-wide toggle, level, current/former/all, has-SALN, search, sort).
- [ ] **Step 4: Run** the same commands. Expected: PASS.
- [ ] **Step 5: Commit** `feat: officials list with municipality and barangay filters`.

---

### Task 6: Official profile, SALN table, About page

**Files:**
- Create: `src/pages/OfficialPage.tsx`, `src/pages/AboutPage.tsx`, `src/components/SalnTable.tsx`
- Test: `tests/e2e/profile.spec.ts`

**Interfaces:**
- Consumes: `formatPeso`, `latestSaln`, `portalConfig`, `loadAll`.
- Produces: `/official/:id` shows all terms for the same `personId`, a SALN-by-year table (assets, liabilities, net worth, source link, status, verified-by) and, if none, "No SALN data yet" with a link to `portalConfig.ombudsmanRequestUrl`. `/about` explains sources (Open Halalan, PSA, House of Representatives, Ombudsman), the verification rules, and how to submit (link to the issue form from Task 10).

- [ ] **Step 1: Write failing e2e tests:** profile of a person with a SALN shows `₱24,957,188.98` net worth and a link whose `href` equals the record's `sourceUrl`; negative net worth renders as `-₱…` not `NaN`; a person with two terms (e.g. representative then governor) lists both; a person with no records shows the empty state and the Ombudsman link; unknown id shows a "not found" message with a link home.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/profile.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the pages and table.
- [ ] **Step 4: Run** it. Expected: PASS.
- [ ] **Step 5: Commit** `feat: official profile, SALN table and about page`.

---

### Task 7: Roster import from Dynasties API

**Files:**
- Create: `scripts/import-roster.ts`, `tests/fixtures/dynasties-contests.json`
- Test: `tests/unit/import-roster.test.ts`

**Interfaces:**
- Consumes: `Official`, `Geo`.
- Produces: `contestsToOfficials(contests: DynastiesContest[], geo: Geo, termStartYear: number): { officials: Official[]; unmapped: string[] }`. Only candidates with `won === 1` become officials. The API shapes are `GET https://officials.bettergov.ph/api/v1/contests?province=bukidnon&year=<Y>&position=<P>&candidates=1`, where `position` is one of `governor`, `vice governor`, `representative`, `board member`, `mayor`, `vice mayor`, `councilor`. Town names map to LGU codes by case/space-insensitive name match against `lgus(geo)`; towns that fail go to `unmapped`. Term dates: winners of an election in year Y serve `Y-06-30` to `(Y+3)-06-30`; `personId` = the API's `person_id`; `rosterSource: 'openhalalan'`, `rosterVerified: false`. Representative/board seats: `level: 'district'` with `geoCode` = province code and `district` from the contest's `district` field when present. CLI writes `data/officials/openhalalan-<year>.json` and prints `unmapped`.

- [ ] **Step 1: Write failing tests** with the fixture (one governor contest, one mayor contest for a municipality, one councilor contest with an unknown town): governor winner → `level 'province'`, `termEnd '2028-06-30'`; non-winners excluded; mayor maps to the right LGU code; the unknown town lands in `unmapped` and produces no official; every output has `rosterVerified === false`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/import-roster.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the mapper and CLI.
- [ ] **Step 4: Run** the test, then run the CLI for 2025 and 2022 against the live API; run `npm run validate-data` and confirm the real counts are plausible (22 mayors, 22 vice mayors, 1 governor); resolve any `unmapped` towns (for example "IMPASUG ONG" vs "Impasug-ong") by adding an alias table in the script.
- [ ] **Step 5: Commit** `feat: import Bukidnon roster from Dynasties API`.

---

### Task 8: Barangay captain layer

**Files:**
- Create: `scripts/import-barangays.ts`, `tests/fixtures/barangay-captains.csv`
- Test: `tests/unit/import-barangays.test.ts`

**Interfaces:**
- Consumes: `Geo`, `barangaysOf`.
- Produces: `captainsFromCsv(csv: string, geo: Geo): { officials: Official[]; unmatched: string[] }`. The CSV columns are `municipality,barangay,name,source`. Rows match a barangay by LGU name + barangay name; each barangay gets `position: 'Punong Barangay'`, `level: 'barangay'`, `termStart '2023-11-30'`, `termEnd '2026-11-30'`, `rosterSource` from the `source` column (`comelec`|`dilg`|`community`), `rosterVerified: false`. `unmatched` lists rows whose LGU or barangay isn't in the geo. The CLI also prints barangays that have no captain.
- Where the CSV comes from: the user supplies it (COMELEC/DILG export if obtained, otherwise a manual capture from `barangaydirectory.com`, which isn't official). This plan does not scrape that site.

- [ ] **Step 1: Write failing tests** with the fixture: the "Poblacion" row for LGU A maps to A's Poblacion code, not B's; an unknown barangay lands in `unmatched`; the community source yields `rosterSource 'community'`; all outputs unverified.
- [ ] **Step 2: Run** `npx vitest run tests/unit/import-barangays.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the importer; when the user's data changes after the next barangay election, only the CSV and term dates change.
- [ ] **Step 4: Run** the test, then `npm run validate-data`.
- [ ] **Step 5: Commit** `feat: barangay captain import`.

---

### Task 9: House of Representatives SALN import

**Files:**
- Create: `scripts/import-house-saln.ts`, `tests/fixtures/house-saln-sample.txt` (excerpt of `pdftotext -layout` output, including the 4 Bukidnon rows), `data/saln/house-2016.json`
- Test: `tests/unit/import-house-saln.test.ts`

**Interfaces:**
- Consumes: `SalnRecord`, `Official`, `netWorthMatches`.
- Produces: `parseHouseSummary(text: string, province: string): HouseRow[]` where `HouseRow { name: string; district: string; totalAssets: number; totalLiabilities: number; netWorth: number }`, matching lines containing `District, <province>`; `matchOfficial(row: HouseRow, officials: Official[]): Official | undefined` (surname + first-name match, accent-insensitive); `rowsToRecords(rows, officials, year: number, sourceUrl: string): { records: SalnRecord[]; unmatched: HouseRow[]; mismatched: HouseRow[] }` with `sourceType: 'house-summary'`, `filingType: 'House summary (as of 31 Dec)'`, `status: 'submitted'`. CLI downloads a given PDF URL, runs `pdftotext -layout`, and writes the records; scanned PDFs (empty text) abort with the message "scanned PDF: OCR needed".
- Expected 2016 values (spec §5): Acosta-Alba 16,366,487.45 / 6,507,000.00 / 9,859,487.45; Flores Jr. 11,200,000.00 / 0.00 / 11,200,000.00; Zubiri 90,134,705.53 / 5,315,643.53 / 84,819,062.00; Roque 29,469,927.14 / 4,512,738.16 / 24,957,188.98.

- [ ] **Step 1: Write failing tests** using the fixture text: exactly 4 Bukidnon rows with the values above; a row with a non-matching net worth lands in `mismatched`; "ROQUE, ROGELIO NEIL P." matches the official whose name is "Oneil Pepito Roque" **only if** the maintainer has set an alias, so assert that without an alias it ends up in `unmatched` (names must never be force-matched); empty text throws "scanned PDF: OCR needed".
- [ ] **Step 2: Run** `npx vitest run tests/unit/import-house-saln.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the parser (numbers may be `0.00`; names are `SURNAME, GIVEN` upper-case), matching with an optional `data/aliases.json` (`{ "<House name>": "<personId>" }`), and the CLI.
- [ ] **Step 4: Run** the unit test. Then run the CLI on `https://docs.congress.hrep.online/download/docs/saln.alpha.31Dec2016.pdf`, add the needed `personId`/alias entries, and compare each of the 4 records against the PDF by eye before changing any `status` to `verified` with `verifiedBy`/`verifiedAt` (this verification is the maintainer's, not an agent's). Run `npm run validate-data`.
- [ ] **Step 5: Commit** `feat: import House SALN summaries for Bukidnon representatives`.

---

### Task 10: Submission route and translations

**Files:**
- Create: `.github/ISSUE_TEMPLATE/submit-saln.yml`, `src/lib/i18n.ts`
- Modify: all pages/components to read strings through `useT()`
- Test: `tests/unit/i18n.test.ts`, extend `tests/e2e/filter.spec.ts`

**Interfaces:**
- Produces: `type Lang = 'en'|'fil'|'ceb'`; `strings: Record<Lang, Record<string, string>>`; `useT(): (key: string) => string` (falls back to `en`); language persisted with `localStorage` inside try/catch. The issue form collects: official name, position/LGU, SALN year, source URL or how the copy was legally obtained, and a consent note; it never asks for uploads.

- [ ] **Step 1: Write failing tests.** `i18n.test.ts`: every key in `en` exists in `fil` and `ceb`; fallback to `en` for a missing key. e2e: switching to Binisaya changes the "No SALN data yet" text; the About page links to the issue form.
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement** `i18n.ts` and the issue template; replace hard-coded strings. Mark FIL/CEB strings for native-speaker review in `README.md`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat: trilingual UI and SALN submission form`.

---

### Task 11: Link-only change in the main site

**Files (in `betterbukidnon`):**
- Modify: nav and footer in the HTML pages that carry the chrome (use a scripted find/replace across `*.html`, then check with `git diff`, per `docs/architecture.md`); `assets/js/translations.js` (EN/FIL/CEB label); `sitemap` only if the project already lists external links there (otherwise leave alone)
- Test: add `tests/saln-link.spec.js` to the main site's Playwright suite

**Interfaces:**
- Consumes: `portalConfig.mainSiteUrl` ↔ the portal URL `https://saln.betterbukidnon.org` (configurable constant at the top of the replace script).

- [ ] **Step 1: Write a failing Playwright spec:** the home page and one inner page each contain a nav or footer link with `href="https://saln.betterbukidnon.org"` and a translated label that changes under FIL and CEB; the link opens in the same tab and carries `rel="noopener"` only if `target` is set.
- [ ] **Step 2: Run** `npx playwright test tests/saln-link.spec.js` in `betterbukidnon`. Expected: FAIL.
- [ ] **Step 3: Implement** the scripted replacement and the three translation entries; no landing page, no shared code.
- [ ] **Step 4: Run** the spec and `npm run format:check`. Expected: PASS.
- [ ] **Step 5: Commit** in `betterbukidnon`: `feat: link to SALN tracker portal`.

---

### Task 12: Restyle to match saln-tracker-ph

**Files:**
- Create: `src/styles/index.css` (Tailwind entry + theme tokens), `src/components/ui/{Button,Badge,Card}.tsx`, `src/components/layout/{Header,Footer}.tsx`, `public/logo.svg` (copied from the main site's `assets/images/logo/better-bukidnon-logo.svg`), `tests/e2e/visual.spec.ts`
- Modify: `package.json` (tailwind, `@fontsource-variable/inter`), `vite.config.ts`, every page and component under `src/` (class names and markup only; no logic changes), `src/App.tsx`, `src/lib/strings.ts` (any new header/footer/hero strings in all 3 languages)
- Remove: the plain CSS from Tasks 5-6 once Tailwind covers it
- Reference (read-only, MIT): `JHNLWHD/saln-tracker-ph` design copy in the scratchpad `design-ref/` (tailwind.config.ts, Header/Footer, ui/{Badge,Button,Card}, OfficialsGrid, SALNRecordsView, routes/{home,about,official.$slug})

**Interfaces:**
- Consumes: all pages/components from Tasks 5-10 (behavior, roles, labels and every string asserted by existing e2e tests must be preserved).
- Produces: theme tokens `ph.red #F70000`, `ph.blue #0038A8`, `ph.yellow #FCD116`, `primary-50..900` (500 = `#0038A8`), `accent-50..900` (400 = `#FCD116`), `danger-50..900` (500 = `#F70000`); fonts Inter (self-hosted via `@fontsource-variable/inter`, no CDN); `bg-flag-gradient`; `<Card hoverable>`, `<Badge variant="ph-red|ph-blue|ph-yellow|gray|verified|unverified" size>`, `<Button variant="primary|ghost" size>`.

- [ ] **Step 1: Write the failing tests.** `visual.spec.ts` (Playwright, e2e fixture data): `getComputedStyle` of the primary button background is rgb(0, 56, 168); the header is sticky; Inter is the computed font-family of `body`; no horizontal overflow at 360px and 1280px on `/`, `/official/:id`, `/about`; text contrast of the unverified badge, empty-state text and primary button meets WCAG AA (compute from computed colors in the test with a small helper; yellow text on white must not be used); keyboard focus ring is visible on buttons, links and selects; all e2e tests from Tasks 5-10 still pass.
- [ ] **Step 2: Run to verify it fails** (`npx playwright test tests/e2e/visual.spec.ts`).
- [ ] **Step 3: Implement** the theme, layout (sticky header with logo, "SALN Tracker" title and "Bukidnon" subtitle, nav Home/About, language switcher; flag-gradient hero on the list page with the title and the disclaimer summary; footer with credits to BetterBukidnon / BetterGov.ph and the design credit "Design adapted from SALN Tracker PH (MIT)"), cards for officials (position badge colour by level: province = ph-blue, district = ph-yellow with dark text, city/municipality = ph-red, barangay = gray; `Unverified` badge amber with text, never colour-only), SALN table in a card, mobile-first container `container mx-auto px-3 sm:px-4 lg:px-8`. No analytics, no external CDNs, no dark mode, no net-worth chart (data has totals for single years).
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run validate-data` and the full Playwright suite. Expected: all pass.
- [ ] **Step 5: Commit** `feat: restyle to match SALN Tracker PH design system`.

---

### Task 13: End-to-end pass and launch readiness

**Files:**
- Modify: `README.md` (setup, data workflow, verification rules, how to refresh after elections), `.github/workflows/ci.yml`
- Test: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing smoke test:** the list loads with at least the governor; the municipality→barangay filter works on real `data/`; at least one representative profile shows a House-sourced SALN with a source link; every page has the disclaimer; Lighthouse accessibility score ≥ 0.9 via `@lhci/cli` on `/` (match the main site's `.lighthouserc.json` thresholds).
- [ ] **Step 2: Run** `npm run e2e`. Expected: FAIL until data and pages are in place from earlier tasks (fix whatever is missing).
- [ ] **Step 3: Implement** the remaining fixes and the README; CI runs `lint`, `test`, `validate-data`, `build` and `e2e`.
- [ ] **Step 4: Run** `npm run lint && npm test && npm run validate-data && npm run build && npm run e2e`. Expected: all pass.
- [ ] **Step 5: Commit** `chore: smoke test and launch docs`. **Stop here and ask the user** before creating the GitHub repo `Better-Bukidnon/saln`, pushing, pointing `saln.betterbukidnon.org` at Cloudflare, or deploying.

---

## Self-Review

- **Spec coverage:** §2 scope → Tasks 5, 7, 8; §3 delivery/link-only → Tasks 1, 11, 12; §4 data model/validation → Task 2; §5 sources → Tasks 3, 7, 8, 9; §6 lanes → Tasks 7, 9, 10; §7 UI/filters/disclaimer/badges/i18n → Tasks 4, 5, 6, 10; §8 testing → every task; §9 phases → order of tasks; §10 risks → unverified flags (7, 8), manual verification (9), term dates (8).
- **Gaps accepted:** OCR for the scanned CY2017/CY2018 House PDFs is not in this plan (spec lists it as later work); Task 9 aborts with a clear message on scanned PDFs. The PSA PSGC CSV and the barangay captain CSV must come from the user.
- **Type consistency:** `Official`, `SalnRecord`, `GeoNode` (Task 2), `Geo` helpers (Task 3), `Filters`/`filterOfficials` (Task 4), `latestSaln`/`loadAll` (Task 5) are used with the same names in Tasks 6–10.
- **Proportion:** the plan is about 2.5× the spec and bodies are limited to signatures and test assertions.
