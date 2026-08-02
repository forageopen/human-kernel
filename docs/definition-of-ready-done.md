# Human Kernel — Definition of Ready / Definition of Done

Formalizes Brief v2 §10's three principles into checklists a reviewer actually checks against, instead of a value statement nobody can fail a PR on.

## Definition of Ready (before a story enters a sprint)

- [ ] References a named Epic (`human-kernel-agile-backlog.md`) or proposes a new one explicitly.
- [ ] Acceptance criteria stated in the backlog, not just a title.
- [ ] Not blocked by an open ADR question — if it touches OQ-1/OQ-3 (pending engineering confirmation) or Tension C/D (open), it cannot enter a sprint until that's resolved. Check `human-kernel-sprint-0-agenda.md` Decision Log status before pulling the story.
- [ ] Estimated by the role that owns it per the RACI (Brief v2 §12).

## Definition of Done (before a story is closed)

**Principle 1 — Extract or compile, never invent:**
- [ ] No UI component renders a `Parameter` or claim without a resolvable `evidenceIds` reference.
- [ ] JSON Schema validation (`human-kernel-schema-parameter.json`, `minItems: 1` on `evidenceIds`) passes in CI — this is enforced, not just reviewed by eye.
- [ ] Any new compiler rule that could theoretically fabricate a link (relationship resolution, pattern labeling) has a test proving it warns instead of guessing on a bad/missing reference.

**Principle 2 — Every claim needs a witness:**
- [ ] `confidence` is present and schema-validated (range 0.0–1.0) on every new `Evidence`/`Parameter`/`Relationship` instance the change can produce.
- [ ] `status:disputed` and `verification:contradicted` states remain visibly distinct in the UI — not merged, averaged away, or hidden by the change.

**Principle 3 — Open or not at all:**
- [ ] No new server dependency introduced. If the change needs a network call, it needs a new ADR first, not a quiet addition.
- [ ] No analytics/telemetry script added (`human-kernel-privacy-policy.md`).
- [ ] MIT `LICENSE` header/notices unaffected; no dependency added under an incompatible license.

**General engineering bar:**
- [ ] Tests written for anything touching `evidence-parser`, `compiler`, or `store` modules (Tension C boundary sketch, Sprint 0 Decision Log #4) — this is the layer where "never invent" is either true or silently broken.
- [ ] Code reviewed by the role-appropriate RACI owner (Brief v2 §12), not just any available reviewer.
- [ ] If the story touched the data model, `human-kernel-specification-v0.1.md` §3/§6 (schemaVersion) is updated in the same PR, not after.

**A story that's "done" but fails any box above is not done — it's a PR that needs another pass.**
