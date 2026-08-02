# dashboard

Wired and unit-tested as of this commit — read the honest version of that claim below before assuming more than it says.

## What's real

- `render.ts` — pure DOM rendering: empty state, unsupported-browser message, domain-grouped Parameter cards ("Domain view" — see naming note below), warnings panel, evidence drawer, and the Immersive/Inspect mode toggle (Brief v2 §9: Immersive = ambient/observation-only/no-scroll, Inspect = investigation/scroll/drawer). No framework (that's still an unmade decision, see `docs/sprint-0-walkthrough-simulated.md`). Covered by `render.test.ts` (jsdom, 12 tests).
- `app.ts` — `runVaultScan()` wires vault-reader → evidence-parser → compiler → store; takes its deps as arguments so it's testable with a fake vault, no real browser needed (`app.test.ts`). `wireBrowserUI()` is the thin, deliberately-small, NOT-unit-tested glue that touches `window`/`document` for real, does the ADR-0003 feature-detect before ever calling `vault-reader.pickVault()`, and enforces Immersive = observation-only at the callback level (not just via CSS) so a stray click can't open the drawer outside Inspect mode.
- `../main.ts` + `../../index.html` + `../../styles.css` — the actual page. Reuses the visual language from `/wireframes/data-states.html`, adapted to the class names `render.ts` actually emits.

**Naming correction (2026-08-02):** the domain-grouped card grid is NOT a SWOT card, and `docs/agile-backlog.md` story 4.1 has been corrected to say so — see that file's dated note. Nothing in this repo ever defined how a Parameter (domain/status/confidence) maps onto Strengths/Weaknesses/Opportunities/Threats, so building one would have meant inventing that mapping. Didn't. If you actually want a real SWOT card, that needs a product decision first (probably a new optional `Parameter` field for valence/locus), not a rendering task.

## What's NOT real yet

- **No manual browser click-through has been done.** Real folder, real vault, real Chrome/Edge/Brave — not tested. Everything above is "wired and passes unit tests with fakes," not "confirmed working end to end by a human clicking through it."
- A literal SWOT card, DISC-style layout, causal map, and timeline cards (EPIC-4.2–4.4) — this ships the domain-grouped grid only.
- Live file watching — vault-reader has no watch/subscribe primitive (see its own file); re-scan today is manual (the "Re-scan Vault" button), not automatic on save.

**Boundary rule (non-negotiable, Tension C), still holds:** `render.ts` only renders what it's given; `app.ts` is the only thing in this directory allowed to call `vault-reader`, `evidence-parser`, `compiler`, or `store`.
