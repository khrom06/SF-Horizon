# Changelog

## [1.0.1]
### Changed
- The file HACS loads (`dist/`) is now minified at build time (esbuild): ~17% smaller raw. No behaviour change — `src/` stays the readable source of truth; all 329 render checks pass unchanged.
- The loaded file now prints its version to the console (`SF-HORIZON v1.0.1`) and warns, instead of silently redefining the cards, if the resource is declared twice (HACS + a manual file) — same pattern as SF-Cards. Verified in a real browser: second load is ignored with a clear warning, version banner confirmed.

## [1.0.0] — 2026-11-04
### Added
- `sf-horizon-card`: 24 h solar forecast chart, tariff strip, baseline, best-start search with coverage and cost, load presets, light and dark themes, en/fr/de/es.
- Render tests in headless Chrome.
