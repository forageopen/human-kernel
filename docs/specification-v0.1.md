# Human Kernel — Specification v0.1

**Status:** Approved (Founder — Adam Rosman, 2026-08-02, via simulated Sprint 0 walkthrough — `human-kernel-sprint-0-walkthrough-simulated.md`). Sections originally marked "Proposed" (§1, §2) are now the working spec. Real Researcher sign-off on §1 and real engineering confirmation on §2 remain recommended, not blocking — see the walkthrough document for what each would specifically check.

## 0. Purpose

This document defines what the prior briefs left as prose: the actual ontology, the actual object shapes, the actual file on disk, and the actual rule that turns a plain-text note into a dashboard claim. If a future contributor has to guess at any of these, this spec has failed at its one job.

## 1. Domain Ontology — Approved (Founder), Researcher Validation Recommended

The six domains (Reality, Human, Civilization, Strategy, Adaptation, Legacy) were named in the original architect brief and never defined. Every `Parameter` object must declare one of these as its `domain` (Spec §3), so leaving them undefined isn't cosmetic — it's a gap in the schema itself. Proposed working definitions, to be confirmed or corrected by whoever owns framework validity (Researcher, per Brief v2 §12 RACI):

| Domain | Proposed Definition |
|---|---|
| **Reality** | External, objective conditions the person operates within — resources, location, market conditions, physical or institutional constraints not chosen by them. |
| **Human** | The individual's own traits, behaviors, and cognitive/emotional patterns — the SWOT- and DISC-type observations. |
| **Civilization** | Social, cultural, and institutional context — family, education system, cultural norms, community structures. |
| **Strategy** | Decisions, plans, and chosen courses of action the person actively takes. |
| **Adaptation** | Responses to change — resilience patterns, how the person adjusts when conditions shift. |
| **Legacy** | Accumulated long-term effects — what persists over time from repeated decisions and patterns. |

**Disambiguation added at simulated walkthrough** (Reality vs. Civilization overlap was the flagged failure point): **Reality is what constrains a person without their consent or ongoing participation** (a market, a law, a physical location). **Civilization is what shapes them through participation in a group they belong to** (an employer's culture, a family, a professional community). A company's culture tags as Civilization; that same company's market conditions tag as Reality.

**Status:** Approved (Founder, 2026-08-02). Treat as the working taxonomy — but if real Researcher validation later changes a definition, every existing tagged note using that domain needs review; that dependency doesn't go away just because this is now approved.

## 2. Storage & File Layout — Approved (Founder), Engineering Confirmation Recommended

OQ-1 decided the storage *engine* (flat JSON). It did not decide file *layout*. Proposed for v1:

**Single index file per vault:** `.human-kernel/index.json`, structurally mirroring how Obsidian itself keeps `.obsidian/` — a hidden folder at vault root.

```json
{
  "schemaVersion": "0.1",
  "generatedAt": "2026-08-02T00:00:00Z",
  "evidence": [ /* Evidence[] */ ],
  "parameters": [ /* Parameter[] */ ],
  "relationships": [ /* Relationship[] */ ]
}
```

**Why single-file over one-file-per-object:** simpler for v1, trivially portable (copy one file), matches the "flat JSON, keep it simple" rationale behind OQ-1 itself.

**Trade-off to flag, not hide:** a single file regenerated on every parse produces noisy Git diffs and a real (if rare, per the single-user/single-device assumption in Brief v2 §11) merge-conflict risk if it's ever edited from two places at once. Mitigation for v1: the compiler must write output with deterministic, sorted key ordering (sort all three arrays by `id`) so re-parsing an unchanged vault produces a byte-identical file — most of the diff noise disappears. Revisit one-file-per-object if this file's diffs become a real workflow problem, not a hypothetical one.

**This file is fully disposable.** Deleting `.human-kernel/index.json` and re-parsing the vault must reproduce it exactly (aside from `generatedAt`). If it can't, the kernel has started owning data instead of interpreting it — a direct violation of Brief v2 §7's governing principle.

**Two mitigations added at simulated walkthrough, now required, not optional:**
1. **Debounce re-parsing** to file save or a short idle timeout — never re-parse and rewrite the whole index on every keystroke.
2. **Atomic write** — write the new index to a temp file, then rename over the existing one, so a crash mid-write can't leave a corrupted index behind.

## 3. Data Objects

Carried over from Brief v2 §8, unchanged in shape, reproduced here as the canonical reference (this file, not the brief, should be treated as the source of truth for the schema going forward):

```typescript
interface Evidence {
  id: string;            // uuid
  sourceFile: string;    // relative path within vault
  sourceRef?: string;    // block reference, e.g. heading path + callout index
  timestamp: string;     // ISO 8601 — capture time, not event time
  context: string;       // free text, e.g. surrounding heading path
  observation: string;   // the actual claim this evidence supports
  confidence: number;    // 0.0–1.0
}

interface Parameter {
  id: string;
  name: string;
  domain: "Reality" | "Human" | "Civilization" | "Strategy" | "Adaptation" | "Legacy";
  evidenceIds: string[]; // FK -> Evidence[]
  pattern?: string;      // human-authored label only (no AI in v1 — OQ-2)
  confidence: number;    // derived, see §5 — never manually set
  status: "draft" | "verified" | "disputed";
}

interface Relationship {
  id: string;
  sourceParameterId: string;
  targetParameterId: string;
  relationshipType: "causal" | "correlated" | "contradicts" | "supports";
  confidence: number;
  verification: "unverified" | "user-confirmed" | "contradicted";
}
```

**Change from Brief v2:** `relationshipType` is now a closed enum instead of "TBD" — open-ended strings make Tension C's future graph-visualization work (EPIC-9) harder to render consistently. Add new types via a new ADR, not by typing a new string into a note.

## 4. Authoring Syntax — Approved (Founder)

The missing piece no prior document addressed: how does a user's plain Markdown note actually become an `Evidence` object? Convention below is built on Obsidian's native callout syntax so it degrades gracefully to a normal blockquote in any other Markdown viewer. Approved 2026-08-02; not separately walked through in the simulated Sprint 0 (it wasn't identified as a contested item), so treat real Fullstack Developer review of this section as slightly higher-value than the others — nobody has pressure-tested the parsing rules against a messy real vault yet.

**Evidence:**
```markdown
> [!evidence] domain:human parameter:"Repeated shipping under pressure" confidence:0.8
> Observation text goes here — the actual claim this note is evidence for.
```

**Relationship:**
```markdown
> [!relationship] from:"Repeated shipping under pressure" to:"Burnout risk" type:causal confidence:0.6
> Optional note on why this link exists.
```

Rules:
- `domain` must match one of §1's six values (case-sensitive) or the compiler rejects the block with a visible warning — it does not silently drop it or guess.
- `confidence` must parse as a float in `[0.0, 1.0]`; out-of-range or non-numeric values are a hard compiler error, not a clamp-and-continue.
- `parameter` is a free-text string; matching across notes is case-insensitive and whitespace-trimmed (`"Repeated Shipping"` and `"repeated shipping"` are the same Parameter).
- `from` / `to` in a relationship block must match an existing Parameter's `parameter` string. No match = compiler warning, relationship not created. This is the concrete enforcement mechanism behind OQ-5 ("never invent") — a typo in `from:` should produce a visible error, not a silently-dropped or silently-fabricated relationship.

## 5. Compiler Rules

**Parameter Compiler:**
1. Scan every `.md` file in the vault for `[!evidence]` callouts.
2. Emit one `Evidence` object per callout (`sourceFile` + `sourceRef` = file path + heading path + callout position; `timestamp` = file mtime unless an explicit `timestamp:` key is present).
3. Group Evidence objects by `(domain, normalized parameter name)` into one `Parameter` each; `evidenceIds` = every matching Evidence's `id`.
4. `status`: `"verified"` only if every member Evidence is individually marked `status:verified` in its callout; `"disputed"` if any member is marked `status:disputed`; `"draft"` otherwise (the default).

**Confidence Aggregation Rule:** `Parameter.confidence` = arithmetic mean of its member `Evidence.confidence` values, recalculated on every parse. Never manually overridden — this is what "the kernel interprets, it does not own" means concretely at the schema level (Brief v2 §7). A simple mean is deliberately chosen over a weighted or recency-biased formula for v1: it's auditable by a human in five seconds, which matters more right now than statistical sophistication.

**Pattern Engine (v1):** does not infer anything. `Parameter.pattern` is set only if the user explicitly writes a `pattern:` key on at least one member Evidence block; if multiple member Evidence blocks specify conflicting `pattern` values, the compiler leaves `pattern` unset and raises a warning rather than picking one. This is deliberately inert in v1 — "Pattern Engine" is currently a placeholder name for a pipeline stage that does no more than pass through a human-written label. Real inference is Phase 2/3 territory (Brief v2 §6) and OQ-2-gated for anything AI-based.

**Relationship Compiler:** scans `[!relationship]` callouts, resolves `from`/`to` against compiled Parameter names, emits `Relationship` objects with `verification: "unverified"` by default. A `Relationship` only moves to `"user-confirmed"` via explicit UI action (Brief v2 §10, OQ-5 corollary) — the compiler itself never sets that value.

## 6. Versioning

`schemaVersion` lives at the root of `index.json` (§2), not per-object. Any breaking change to the `Evidence`/`Parameter`/`Relationship` shapes bumps this value and requires a migration note in a new ADR — silently changing field meaning under an unchanged version number is exactly the kind of inconsistency this whole document set exists to prevent.

## 7. What This Spec Now Resolves, and What Still Needs Real Review

- **Tension C — Approved (Founder), simulated.** Module boundaries (`vault-reader` / `evidence-parser` / `compiler` / `store` / `dashboard`) and the full-re-parse-per-change model are the working architecture — see `human-kernel-sprint-0-walkthrough-simulated.md` §3. Incremental recompilation is deliberately deferred, tracked as a Post-MVD backlog note, not silently dropped.
- **Tension D — Approved (Founder) on the exclusion rule; still genuinely open on the files themselves.** The domain definitions in §1 were written without reference to the mentor's "6 Domains" document or the other four unreviewed reference files, per the standing instruction not to reconstruct from them — that exclusion is now a permanent rule, not a pending question. Whether anyone ever reads those five files for general inspiration (not as a taxonomy source) is a separate, optional, non-blocking item — see `human-kernel-reference-material-dossier.md`.
- **Still real, not simulated away:** Researcher validation of §1, and engineering confirmation of §2's storage assumptions against actual code and real vault sizes. Approval unblocks Sprint 1 planning; it doesn't manufacture the review itself.
