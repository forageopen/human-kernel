# Human Kernel — Test & Validation Plan

Organized around the module boundaries proposed in the Sprint 0 Decision Log (`human-kernel-sprint-0-agenda.md`, item 4 — simulated, pending real confirmation), so ownership of each test tier maps directly onto who owns that module.

## The One Test That Matters Most

**Invariant:** no `Parameter` object ever exists with an empty `evidenceIds` array. This is Brief v2 §10 principle 1, "extract or compile, never invent," expressed as code.

- **Enforced at the schema level already:** `human-kernel-schema-parameter.json` sets `"minItems": 1` on `evidenceIds`. Any object that violates this fails schema validation, full stop.
- **Also test at the compiler level, not just the schema level:** a unit test (or property/fuzz test) on the `compiler` module that asserts the Parameter Compiler can never *emit* such an object in the first place — catching the bug before it hits validation, not just when it hits validation. Schema validation is the safety net; this test is the actual guarantee.

## Unit Tests (by module)

| Module | What to test | Owner (per RACI) |
|---|---|---|
| `evidence-parser` | Correct extraction of `domain`, `parameter`, `confidence`, `pattern` from `[!evidence]` callouts. Rejects (not clamps) out-of-range confidence. Rejects unrecognized `domain` values. | Senior Programmer |
| `compiler` (Parameter Compiler) | Grouping by normalized `(domain, name)`. Confidence = arithmetic mean, recalculated on every run — not cached, not manually overridden. `status` derivation rules (verified/disputed/draft) match Spec v0.1 §5 exactly. | Senior Programmer |
| `compiler` (Relationship Compiler) | Unresolved `from`/`to` references produce a warning and no `Relationship` object — never a silently-created or guessed link. | Senior Programmer |
| `store` | `index.json` serialization is deterministic — same input vault produces byte-identical output across two separate runs (Spec v0.1 §2). | Senior Programmer |
| `dashboard` | Card rendering never reads raw vault files or bypasses `store`'s output (the module boundary rule itself, Sprint 0 Decision Log #4). | Fullstack Developer |

## Schema Validation Tests (CI-gated)

- Every `index.json` produced by any test fixture must validate against `human-kernel-schema-index.json` (which itself `$ref`s the other three) before a build is considered green.
- A schema-breaking change without a `schemaVersion` bump (Spec v0.1 §6) should fail CI, not just get caught in review.

## End-to-End Tests

- Vault picker → parse → at least one real `Parameter` renders on a card → drawer opens and shows its Evidence list with source file, confidence, and timestamp (mirrors wireframe states 3 and 5, `human-kernel-wireframes-data-states.html`).
- Immersive/Inspect mode toggle behaves per Draft 5's validated model: scroll locked in Immersive, drawer only reachable in Inspect.
- A `status:disputed` Parameter renders with visibly distinct styling (wireframe state 4) — this is a visual regression risk worth an explicit test, not just a one-time eyeball check.

## Manual / Exploratory Checklist

- [ ] Cross-browser spot check within the ADR-0003 matrix only: Chrome, Edge, Brave. (Explicitly not Safari/Firefox for v1 — don't burn time there.)
- [ ] Confirm a malformed callout (e.g., missing `confidence:` key entirely) fails loudly in the UI, not silently.
- [ ] Confirm deleting `.human-kernel/index.json` and re-parsing reproduces it exactly (byte-for-byte aside from `generatedAt`) — the direct test of Spec v0.1 §2's "fully disposable" claim.

## What This Plan Deliberately Does Not Cover

Load/performance testing against large vaults — R1 in the risk register accepts that flat JSON has an unmeasured scaling ceiling. Add a load-test suite only once a real bottleneck is reported, not preemptively.
