# SALN Tracker for Bukidnon: Design Spec

Date: 2026-11-02 · Status: draft for review

## 1. Goal

A public transparency portal, **saln.betterbukidnon.org**, that lists officials connected to
the Province of Bukidnon and shows their declared Statement of Assets, Liabilities and Net
Worth (SALN) where an official copy is publicly available. It follows the pattern of
`budget.betterbukidnon.org` (standalone portal, main site links to it) and is inspired by
[saln.bettergov.ph](https://saln.bettergov.ph/) / `JHNLWHD/saln-tracker-ph`.

Success criteria:
- A citizen can browse all in-scope officials and filter by municipality/city and barangay
  across the whole province.
- Every SALN figure shown links to its official source and carries a verification status.
- Officials with no public SALN show a clear "No SALN data yet" state with the Ombudsman
  request route, never a blank or a guess.
- Zero hosting cost; no backend.

Non-goals: accepting document uploads on the site, accusing or scoring officials, publishing
personal details beyond declared totals.

## 2. Scope of officials

| Group | Approx. count | Roster source |
|---|---|---|
| Governor, Vice Governor, Sangguniang Panlalawigan members | ~15 | Dynasties API (2025 winners), checked against `betterbukidnon/data/officials.json` |
| Representatives, 4 districts | 4 | Same |
| Mayors and vice mayors, 2 cities + 20 municipalities | 44 | Dynasties API |
| City/municipal councilors | ~180 | Dynasties API |
| Barangay captains (punong barangay), 464 | 464 | COMELEC/DILG if obtainable; otherwise community directory marked unverified |
| Former officials (past terms) | grows | Dynasties API 2001–2022, House SALN summaries |

Kagawads and SK chairs are out of scope (YAGNI).

## 3. Delivery shape

- New repo `Better-Bukidnon/saln`: React + Vite + TypeScript static app, same stack and
  config approach as `Better-Bukidnon/budget` (`portal.config.ts`, Cloudflare Workers static
  assets, `wrangler.jsonc`). No Firebase, no backend.
- The project lives in its own local folder, `/Users/ict/Documents/Personal_Projects/kode-projects/saln-bukidnon`,
  separate from `betterbukidnon`.
- Main site (`betterbukidnon`) change is **link-only** (decided 2026-11-02): add a link to
  the portal's URL in the nav/footer plus EN/FIL/CEB label strings. No landing page, no
  shared code or data.
- Creating the GitHub repo and DNS are outward-facing steps and need explicit go-ahead at
  implementation time. Until the subdomain exists, the link target is configurable.

## 4. Data model (JSON in repo, validated in CI)

`data/geo.json`: province → 22 cities/municipalities → 464 barangays, built from the PSA PSGC
masterlist by `scripts/build-geo.ts`. Each node has `psgc`, `name`, `type`.

`data/officials/*.json`, one record per person-term:
```
id, personId, name, position, level (province|district|city|municipality|barangay),
geoCode (PSGC at the level served), termStart, termEnd,
rosterSource (openhalalan|comelec|dilg|community|manual), rosterVerified (bool),
partyOrNote?
```
`current` is derived from `termStart/termEnd`, not stored. `personId` links the same person
across terms and offices (e.g. a representative later elected governor).

`data/saln/*.json`, one record per filing:
```
id, personId, year, filingType, totalAssets, totalLiabilities, netWorth,
assets?[], liabilities?[], sourceType (house-summary|ombudsman|lgu|submitted),
sourceUrl, status (submitted|verified|under_review|flagged), verifiedBy?, verifiedAt?
```
Schema check in CI: all `geoCode`s exist in `geo.json`; every SALN has `sourceUrl` and
`status`; `netWorth == totalAssets - totalLiabilities` (to the centavo); no duplicate
`(personId, year, sourceType)`.

Privacy guardrails: store declared totals only. No addresses, no spouse/children details,
no signatures, no ID numbers.

## 5. Data sources, verified during design

- **Geography:** PSA PSGC masterlist (Bukidnon 1001300000 (region 10, province 013); 2 cities, 20 municipalities, 464
  barangays). Municipality boundaries from `bettergovph/officials-network-graph`
  (`public/data/geo/cities/bukidnon.json.gz`, PSGC 2023).
- **Roster:** Dynasties API `https://officials.bettergov.ph/api/v1` (Open Halalan, derived
  data CC0; cite Open Halalan). Winners 2001–2025 for governor through councilor. It records
  winners, not current incumbents, so imports are flagged `rosterVerified: false` until a
  maintainer checks them. It has no barangay data.
- **Barangay captains:** no official downloadable roster found. DILG "Barangay Officials
  Directory" and COMELEC results are the targets; `barangaydirectory.com` is a community
  fallback (not official, 2023–2026 term) and rows from it are visibly badged unverified.
  Barangay and SK elections may be scheduled around 2 Nov 2026 (not verified), so the whole
  captain layer may turn over; term dates make this a data update, not a code change.
- **SALN, available now:** House of Representatives SALN summary PDFs
  (`docs.congress.hrep.online`). The 31 Dec 2016 summary has all 4 Bukidnon districts:
  Acosta-Alba (1st, net worth ₱9,859,487.45), Flores Jr. (2nd, ₱11,200,000.00),
  Zubiri (3rd, ₱84,819,062.00), Roque (4th, ₱24,957,188.98). The CY2017 and CY2018 PDFs are
  image scans needing OCR; 2015 and 2016 net-worth files not yet inspected. Totals only.
- **SALN, everyone else:** none found published. The Ombudsman reopened access in Office
  Memorandum Circular No. 3 (2025) incl. LGU officials; requests are by sworn form + two IDs
  at the Ombudsman. Local officials file with the regional deputy ombudsman. The portal links
  to https://www.ombudsman.gov.ph/request-for-copy-of-salns/ and treats copies citizens
  obtain as submissions.
- **saln-tracker-ph:** contributes the record shape and UI ideas only. Its 78 records are
  national (President, VP, 24 senators), none from Bukidnon. Its stack (Firebase) is not used.

## 6. Ingestion lanes

1. **Roster import** (`scripts/import-roster.ts`): pulls Dynasties contests for Bukidnon, maps
   towns to PSGC codes, emits draft official records with `rosterVerified: false`.
2. **House summary import** (`scripts/import-house-saln.ts`): downloads the summary PDFs,
   extracts Bukidnon district rows with `pdftotext -layout` (OCR for scanned years), checks
   assets − liabilities = net worth, emits drafts. A human compares each against the PDF
   before status becomes `verified`.
3. **Submissions:** a GitHub issue form (and email link) for people to submit a copy they
   legally obtained with its source. A maintainer verifies and adds the record via PR. No
   uploads are hosted on the site.

Nothing is published as `verified` without a named verifier and a source link.

## 7. UI

Pages: Officials list, official profile (SALN by year, source and status per record, term
history across offices), About/Method (sources, disclaimer, how to request a SALN).

Filters (state kept in the URL so views are shareable):
- Municipality/City dropdown (22); Barangay dropdown dependent on it (only that LGU's
  barangays).
- Selecting an LGU lists officials serving that LGU plus its barangay captains; selecting a
  barangay narrows to its captain. Province-wide officials show when no LGU filter is set or
  via a "Province-wide" toggle.
- Level, current/former (derived from term dates), has-SALN-data, name search.
- Sort by net worth, assets, liabilities, name.

Always visible: "Aggregator, not the original source; not an official government website."
Unverified roster rows carry a badge. Trilingual strings follow the main site's EN/FIL/CEB
approach. Accessibility and Lighthouse targets match the main site.

## 8. Testing

- Unit: filter logic (LGU → barangay dependency, province-wide toggle, derived current/former),
  currency formatting, net-worth arithmetic.
- Data: JSON schema + referential-integrity checks as a CI job; failing data blocks merge.
- E2E (Playwright): municipality → barangay filtering, URL state round-trip, empty state,
  profile page shows source link and status.
- Import scripts: fixture-based tests for the House PDF row parser.

## 9. Phases

1. Scaffold portal, geo build, filters, schema checks; seed with `officials.json`.
2. Bulk roster import (Dynasties) for non-barangay officials; barangay captain layer.
3. House SALN import for the 4 representatives (2016, then OCR'd 2017/2018), human-verified.
4. Submission form, About/Method page, main-site `saln/` page, nav and translations, launch.

## 10. Risks and open items

- Wrong names on a SALN site are harmful: hence `rosterVerified`, badges, and verification
  by a named maintainer.
- Dynasties data is winners, not incumbents (vacancies, deaths, suspensions not tracked).
- Barangay captain roster has no confirmed official source yet.
- Likely turnover at the next barangay/SK election.
- No Bukidnon SALNs beyond the 4 representatives are public today; most profiles will show
  the empty state at launch.
- OCR accuracy on the scanned 2017/2018 PDFs needs manual verification.
