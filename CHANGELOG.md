# Changelog

Notable changes to Human Kernel. Loosely follows [Keep a Changelog](https://keepachangelog.com/); pre-1.0, so versions are milestones, not stability guarantees.

## [Unreleased] - 2026-08-02 (second and third passes, same day as v0.1.0-mvd)

### Added

- Sample-first landing: the dashboard now opens on a bundled, real reference profile (`sample-data/index.json`, `fetch()`-based, works in every browser) instead of a vault-connect wall. Connecting your own vault is a small secondary action in a source banner.
- Reference profile is Adam Rosman's own vault content — real, not synthetic — redacted and corrected per his own commissioned `OPEN_SOURCE_AUDIT.md` (see `sample-vault/README.md` for exactly what was excluded/fixed and why). Compiled via the real `parseVaultFile -> compile -> serialize` pipeline (`scripts/build-sample-data.mjs`), never hand-written JSON.
- Evidence blocks may now carry an optional `date:"..."` attribute, used as `Evidence.timestamp` when present (closes a documented Post-MVD TODO using real vault file mtimes).
- `src/dashboard/charts.ts` — GitHub-style calendar heatmap (evidence density per day, defaults to the month with the most real evidence via `monthWithMostEvidence`, not a hardcoded "today") plus 6 Chart.js cards (domain count, confidence histogram, status donut, relationship-type breakdown, source-file breakdown, domain-confidence radar), all traced to real schema fields against the datavizproject.com taxonomy.
- `src/dashboard/clock.ts` — live footer clock, Asia/Kuala_Lumpur, text-only ("Month day, Q#, year · HH:MM:SS"), ticking every second. The one element on the page that visibly moves on its own, per direct request once a live-dashboard direction was confirmed.
- `.github/workflows/deploy-pages.yml` — now also builds and ships `sample-data/` to the live site (previously would have silently fallen back to the empty state).

### Removed

- Immersive/Inspect mode toggle, `DashboardMode`, the Immersive lock prompt, and the `hk-immersive` scroll-lock body class — built and shipped earlier the same day, removed the same day. Reasons: the new overview section (heatmap + 6 charts) doesn't fit one no-scroll viewport at any reasonable size, and live verification found the scroll lock was already only partially effective (`overflow:hidden` was on `<body>` only, not `<html>`). Direct instruction: scrolling is always active now; the evidence drawer opens directly on card click with no mode gating. See `docs/agile-backlog.md` story 3.1's correction note.
- The "— MVD (docs/agile-backlog.md)" subtitle text.

### Fixed

- Corrected a real error surfaced by the source audit: the vault listed Ni-Fe-Ti-Se as the INFP cognitive-function stack — that's the INFJ stack (INFP is Fi-Ne-Si-Te). The compiled sample states the self-identified MBTI/Enneagram type only, without asserting the wrong stack as fact.

### Verified live (not just unit-tested)

- Manually clicked through the deployed site: source banner, overview heatmap + charts, domain-grouped cards, and evidence drawer all confirmed rendering real compiled data on `https://forageopen.github.io/human-kernel/`. The File System Access vault-picker flow itself is still unconfirmed by a human click-through.

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
