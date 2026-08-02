# dashboard

Wired and unit-tested as of this commit — read the honest version of that claim below before assuming more than it says.

## What's real

- `render.ts` — pure DOM rendering (empty state, unsupported-browser message, domain-grouped Parameter cards, warnings panel, evidence drawer). No framework (that's still an unmade decision, see `docs/sprint-0-walkthrough-simulated.md`). Covered by `render.test.ts` (jsdom).
- `app.ts` — `runVaultScan()` wires vault-reader → evidence-parser → compiler → store; takes its deps as arguments so it's testable with a fake vault, no real browser needed (`app.test.ts`). `wireBrowserUI()` is the thin, deliberately-small, NOT-unit-tested glue that touches `window`/`document` for real and does the ADR-0003 feature-detect before ever calling `vault-reader.pickVault()`.
- `../main.ts` + `../../index.html` + `../../styles.css` — the actual page. Reuses the visual language from `/wireframes/data-states.html`, adapted to the class names `render.ts` actually emits.

## What's NOT real yet

- **No manual browser click-through has been done.** Real folder, real vault, real Chrome/Edge/Brave — not tested. Everything above is "wired and passes unit tests with fakes," not "confirmed working end to end by a human clicking through it."
- EPIC-4's other visualization types (DISC-style layout, causal map, timeline cards) — this only ships the plain domain-grouped card grid from the wireframe's "populated" state, not the fuller set.
- Live file watching — vault-reader has no watch/subscribe primitive (see its own file); re-scan today is manual (the "Re-scan Vault" button), not automatic on save.

**Boundary rule (non-negotiable, Tension C), still holds:** `render.ts` only renders what it's given; `app.ts` is the only thing in this directory allowed to call `vault-reader`, `evidence-parser`, `compiler`, or `store`.
