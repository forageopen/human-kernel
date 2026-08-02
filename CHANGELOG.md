# Changelog

Notable changes to Human Kernel. Loosely follows [Keep a Changelog](https://keepachangelog.com/); pre-1.0, so versions are milestones, not stability guarantees.

## [v0.1.0-mvd] - 2026-08-02

### Added

- Full pipeline wired end-to-end: `vault-reader` → `evidence-parser` → `compiler` → `store` → `dashboard`.
- `src/dashboard/render.ts` — pure DOM rendering: empty state, unsupported-browser message, domain-grouped Parameter cards, warnings panel, evidence drawer.
- `src/dashboard/app.ts` — `runVaultScan()` (pipeline logic with injectable deps, testable without a browser) and `wireBrowserUI()` (thin browser glue, does the ADR-0003 feature-detect before calling `vault-reader.pickVault()`).
- `index.html`, `styles.css`, `src/main.ts` — the actual running page, reusing `wireframes/data-states.html`'s visual language.
- 17 unit tests (9 dashboard/render, 4 dashboard/pipeline, 4 compiler) — all passing. Strict-mode `tsc --noEmit` clean. Schema validation clean.
- `.github/workflows/deploy-pages.yml` — builds and deploys to GitHub Pages on push to `main`. Requires one manual, owner-only repo setting before it goes live (`Settings → Pages → Source → GitHub Actions`) — see README.
- Credits section in README; commits carry a `Co-Authored-By: Claude <noreply@anthropic.com>` trailer starting this release.

### Known gaps (stated on purpose, not hidden)

- No manual browser click-through with a real vault yet. This release is wired and unit-tested with fakes, not confirmed end-to-end by a human in an actual browser.
- Only the plain domain-grouped card view ships. DISC-style layout, causal map, and timeline views (EPIC-4 in `docs/agile-backlog.md`) are not built.
- No live file watching — the File System Access API has no watch/subscribe primitive; re-scan is a manual button, not automatic on save.
- 5 npm audit findings (1 critical) in `vitest`'s dev-only dependency chain (`esbuild`/`vite`), not shipped in the deployed app. Deferred rather than force-upgraded unreviewed — see repo issues.

## Pre-repo planning (no tag)

Full planning phase — project brief, MOM, Specification v0.1, 5 ADRs, JSON Schema, wireframes, agile backlog, Definition of Ready/Done, test plan, risk register — completed and Approved (Founder) before this repository existed. See [`docs/INDEX.md`](docs/INDEX.md).
