# dashboard

Wired and unit-tested as of this commit — read the honest version of that claim below before assuming more than it says.

## What's real

- `render.ts` — pure DOM rendering: source banner (whose data is on screen), profile overview (calendar heatmap + 6 chart cards, `charts.ts`), domain-grouped Parameter cards ("Domain view" — see naming note below), warnings panel, evidence drawer. No framework (that's still an unmade decision, see `docs/sprint-0-walkthrough-simulated.md`). Covered by `render.test.ts` (jsdom).
- `clock.ts` — live footer clock, Asia/Kuala_Lumpur, text only. Pure formatter (`formatKlDateTime`) plus a thin `setInterval` wrapper (`startLiveClock`), same split pattern as `charts.ts`'s draw functions vs. its pure heatmap logic. Covered by `clock.test.ts` using fake timers.
- `app.ts` — `runVaultScan()` wires vault-reader → evidence-parser → compiler → store; takes its deps as arguments so it's testable with a fake vault, no real browser needed (`app.test.ts`). `wireBrowserUI()` is the thin, deliberately-small, NOT-unit-tested glue that touches `window`/`document` for real and does the ADR-0003 feature-detect before ever calling `vault-reader.pickVault()`.
- `../main.ts` + `../../index.html` + `../../styles.css` — the actual page. Reuses the visual language from `/wireframes/data-states.html`, adapted to the class names `render.ts` actually emits.

**Naming correction (2026-08-02):** the domain-grouped card grid is NOT a SWOT card, and `docs/agile-backlog.md` story 4.1 has been corrected to say so — see that file's dated note. Nothing in this repo ever defined how a Parameter (domain/status/confidence) maps onto Strengths/Weaknesses/Opportunities/Threats, so building one would have meant inventing that mapping. Didn't. If you actually want a real SWOT card, that needs a product decision first (probably a new optional `Parameter` field for valence/locus), not a rendering task.

**Immersive/Inspect removed (2026-08-02, same day it shipped):** the mode toggle, `DashboardMode`, the Immersive lock prompt, and the `hk-immersive` scroll-lock class are gone — see `docs/agile-backlog.md` story 3.1's correction note for why (the overview section doesn't fit one viewport, and the scroll lock was already only partially effective before that). Scrolling is always on; clicking a Parameter card always opens the evidence drawer, no mode gating.

## What's NOT real yet

- **No manual click-through of the File System Access vault-picker flow has been done** — a real folder, picked by a real person, in Chrome/Edge/Brave. That specific path is still "wired and passes unit tests with fakes," not confirmed end to end.
- The bundled reference profile's fetch-and-render path (the one every visitor actually sees first) **has** now been clicked through live on the deployed site — source banner, overview charts, domain grid, and evidence drawer all confirmed rendering real compiled data, not just passing jsdom tests.
- A literal SWOT card, DISC-style layout, causal map, and timeline cards (EPIC-4.2–4.4) — this ships the domain-grouped grid and the 6-chart overview only.
- Live file watching — vault-reader has no watch/subscribe primitive (see its own file); re-scan today is manual (the "Re-scan Vault" button), not automatic on save.

**Boundary rule (non-negotiable, Tension C), still holds:** `render.ts` only renders what it's given; `app.ts` is the only thing in this directory allowed to call `vault-reader`, `evidence-parser`, `compiler`, or `store`.
