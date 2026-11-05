# Changelog

All notable changes to SALN Tracker Bukidnon are recorded here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/).

## How to version every update

| Change | Bump | Command |
|--------|------|---------|
| Fixes, copy edits, data refreshes, no visible redesign | PATCH `0.2.0 -> 0.2.1` | `npm run release:patch` |
| New feature, visible UI/design change, new data fields | MINOR `0.2.0 -> 0.3.0` | `npm run release:minor` |
| Breaking change (URL scheme, data format, removed feature) | MAJOR `0.x -> 1.0.0` | `npm run release:major` |

Steps for each update:
1. Add entries under `## [Unreleased]` while you work (Added / Changed / Fixed / Removed).
2. When shipping, run the matching `npm run release:*` script (it updates `package.json` and `package-lock.json` only; it does not commit or tag).
3. Rename `[Unreleased]` to `[x.y.z] - YYYY-MM-DD` and start a fresh empty `[Unreleased]` above it.
4. Commit as `release: vX.Y.Z`, then tag `vX.Y.Z`.

## [Unreleased]

## [0.4.0] - 2026-11-05

### Added
- Contact Us (banner and footer) now opens a small menu: default mail app, Gmail, Outlook, Yahoo Mail, or copy the address. Previously a bare `mailto:` did nothing on devices with no mail app.

### Changed
- Language menu: removed the checkmark; the selected language is a solid primary-blue pill.
- Animations are more visible: hero banners enter with a blur, a larger slide and a spring; the filter card, help banner and group panels also animate in; cards in a row stagger by 80ms.

## [0.3.0] - 2026-11-05

### Added
- Page animations built with [Animate UI](https://animate-ui.com/docs) (`@animate-ui/react` + `motion`).
- Official cards fade and slide up as they scroll into view (`Effect`, once per card).
- Hero banners and the profile card fade and slide in on page load (`Effect`).
- The header nav has a gliding hover pill between links (`Highlight`).
- `MotionConfig reducedMotion="user"`: animations are skipped for visitors who prefer reduced motion.

## [0.2.0] - 2026-11-05

### Changed
- Spotify-inspired design pass, keeping the existing blue/orange/red palette and light surfaces.
- Buttons, the search box, filter dropdowns and header nav links are now pill-shaped; button labels are bold, uppercase and widely tracked (`type-button-pill`).
- Cards and panels use an 8px radius and heavier elevation shadows (`--shadow-md`, new `--shadow-lg`).
- Font changed from Inter to Figtree (closest free match to Spotify's Circular).
- Type scale made more compact, with a bold/regular weight contrast (labels, badges and nav are heavier; tighter line heights).
- Page, card and grid spacing tightened for a denser layout.

## [0.1.0] - 2026-11-02

### Added
- First release of SALN Tracker Bukidnon.
