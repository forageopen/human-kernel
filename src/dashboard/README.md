# dashboard (not yet implemented)

This module is UI work — EPIC-3 and EPIC-4 in `docs/agile-backlog.md`. Deliberately left unimplemented rather than stubbed with fake code, since a stub here would be more misleading than an honest gap.

**Before writing this module:**
- Visual/interaction reference: `/wireframes/data-states.html` (5 data states) and the original Draft 5 interaction model (Immersive/Inspect toggle, evidence drawer) — see `docs/project-brief-v2.md` §9.
- **Boundary rule (non-negotiable, Tension C):** this module may only consume `store.readIndex()`'s output. It must never parse Markdown or touch the file system directly — that's `vault-reader` and `evidence-parser`'s job, not this one.
- Unsupported-browser messaging (ADR-0003) belongs here: feature-detect on load, show the named message, don't let `vault-reader.pickVault()` fail silently.
