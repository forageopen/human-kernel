# Human Kernel — Project Brief (v0.2, Workshop Draft)

**Status:** Approved (Founder — Adam Rosman, 2026-08-02) — OQ-1–OQ-5 and Tensions C/D all resolved; see §13 and `human-kernel-sprint-0-walkthrough-simulated.md` for the simulated reasoning behind OQ-1/OQ-3 and Tension C specifically. Real engineering/research confirmation remains recommended at the points noted throughout, no longer blocking.
**Prepared for:** Walkthrough with senior programmer + fullstack developer
**Supersedes:** Prior four-document set (separate PMO / Architect / Frontend / Founder POV briefs)
**Note on that prior set:** those four documents were reviewed and found to repeat the same philosophy in four different section headers rather than producing four role-specific artifacts (no RACI, no schema types, no sprint breakdown, no named technical risk). This brief replaces them with one working document that carries every function's actual concerns, plus the open engineering questions the prior draft never surfaced.

---

## 1. Executive Summary

Human Kernel is a browser-native, local-first application that turns a person's own notes and observable history into an evidence-linked model of their behavioral patterns — visualized as a dashboard, not asserted as a personality score. No install, no account, no server-side storage of personal data.

It is the working prototype for Forage DeepMind's Digital Human Modeling thesis: using LLM/ML methods, established psychological frameworks (SWOT, DISC, causal mapping) as data schemas rather than verdicts, and code-architecture analogies to make an abstract "self-model" inspectable the way a codebase is inspectable — every claim has a file, a line, a commit.

## 2. Problem Statement

Existing self-development tooling (personality tests, productivity scorers, wellness trackers) outputs conclusions without exposing the evidence behind them. That produces two failure modes: unfalsifiable claims, and dependency on the tool's authority instead of the user's own judgment.

Human Kernel's counter-position, carried over from the founder's own framing of this project: *"A person cannot change what they cannot see."* The dashboard's job is visibility, not verdicts.

## 3. Goals / Non-Goals

**Goals (v1):**
- Working browser-only MVP: open a local vault (`.md` files) → kernel parses it → dashboard renders SWOT / DISC / causal map / timeline cards from *real* parsed evidence, not hardcoded demo data.
- Every card is inspectable: clicking a claim opens a drawer showing its source, timestamp, and confidence.
- Fully local: no account, no server round-trip for personal data, MIT-licensed, forkable.

**Non-Goals (v1 — explicitly out of scope):**
- Not a personality-scoring or gamified self-improvement app. No leaderboards, no badges, no "score."
- Not a hosted SaaS product. No multi-user backend in the MVP.
- Not an Obsidian plugin-ecosystem competitor. Obsidian-file compatibility (frontmatter, wikilinks) is a read/interop target, not a feature set to out-build.
- Not an autonomous-agent system. The "AI reflection layer" is explicitly deferred past v1 (OQ-2, resolved) — no local-vs-cloud inference approach is committed, and none is needed until this is deliberately revisited.

## 4. Strategic Context

Human Kernel sits inside Forage DeepMind's Digital Human Modeling focus — it's the reference implementation of that thesis, not a side experiment.

**Resolved (OQ-4):** Human Kernel v1 is a **courseware artifact** — built primarily to teach and demonstrate the Digital Human Modeling methodology inside Forage's program, with productization deferred until the framework and learning experience are validated. This is a decision, not a default, and it has a direct consequence: v1 should assume multiple course participants' data will pass through the tool, not just Adam's own. That makes a data privacy & handling policy mandatory rather than optional (see `human-kernel-next-steps.md`, item 7, now Critical).

## 5. Users & Primary Use Case

**Primary user, v1:** Adam himself, then early Forage cohort participants running a self-audit exercise.

**Use case walkthrough:** user opens a local vault → kernel indexes `.md` files → dashboard populates SWOT / DISC / causal / timeline cards → user opens a card in Inspect mode → evidence drawer shows the source note and confidence → user can flag a claim as disputed.

## 6. Scope & Phased Delivery

| Phase | Epics | Exit Criteria |
|---|---|---|
| **Sprint 0 (Spike)** | All five OQs plus Tensions C and D are Approved (Founder), formalized in 5 ADRs plus a simulated walkthrough (`human-kernel-sprint-0-walkthrough-simulated.md`). Sprint 0's remaining actual job, once a Senior Programmer and Fullstack Developer are engaged: have them read the walkthrough and either confirm it or tell us specifically where it's wrong — not re-litigate from zero. | A real engineer has explicitly said yes/no to OQ-1, OQ-3, and the Tension C module boundaries — not just inherited a document that says "approved." |
| **Phase 1 (MVP)** | EPIC-1 Local File Ingestion (file watcher, `.md` parser, frontmatter/wikilink support) · EPIC-2 Evidence & Parameter data model + local persistence · EPIC-3 Dashboard shell (Immersive/Inspect toggle, card grid, drawer) · EPIC-4 Static visualizations (SWOT/DISC/causal/timeline) bound to real parsed data | User opens a real vault and sees at least one claim traced end-to-end from dashboard card → drawer → source file |
| **Phase 2** | EPIC-5 Relationship/causal tagging (human-assisted, not auto-inferred) · EPIC-6 Timeline & pattern evolution over time · EPIC-7 Contradiction detection | Two evidence points that conflict are surfaced to the user, not silently merged |
| **Phase 3** | EPIC-8 AI reflection layer (deferred — OQ-2, no committed approach or timeline) · EPIC-9 Graph-database visualization replacing static cards | EPIC-9 can proceed independently of EPIC-8; EPIC-8 stays unscheduled until a future major version deliberately reopens OQ-2 |

**Note on the existing HTML mockup** (`human-kernel-war-room-draft-5.html`, "Human Kernel War Room v0.3"): this is a static front-end prototype with hardcoded values. It validates the Immersive/Inspect interaction model and the evidence-drawer pattern, and nothing else — there is no parser, no schema, no data behind it yet. Engineering should treat it as a UI reference, not a starting codebase.

## 7. Proposed Technical Architecture

**Resolved deployment shape:** browser-based web app, hosted on GitHub Pages, no backend, fully serverless. Local persistence is flat JSON files (OQ-1) — chosen over IndexedDB or OPFS+SQLite-WASM for transparency, portability, and inspectability. Revisit only if performance becomes a *measured* bottleneck, not a theoretical one.

```
Local Files (.md vault)
   → Evidence Layer
   → Parameter Compiler
   → Pattern Engine
   → Causal Model
   → Visualization (Dashboard)
```

**Governing principle:** the kernel interprets the user's data; it does not own it. Source of truth stays in the user's plain files. Anything the kernel derives (index, cache, computed confidence) must be disposable and rebuildable — never the only copy of anything.

**File layout — Approved (Founder):** single `.human-kernel/index.json` per vault (Spec v0.1 §2), not one file per Parameter/Evidence object. Chosen for simplicity and portability; the noisy-diff/merge-conflict trade-off this creates is accepted and mitigated with deterministic key-sorting and an atomic write pattern (Spec v0.1 §2, added at the simulated walkthrough).

## 8. Data Model — Draft, Needs Engineering Sign-Off

This is a logical schema carried over from the prior draft, tightened into actual types. Storage engine and file layout are now both decided — flat JSON files (OQ-1), single `.human-kernel/index.json` per vault, Approved (Founder) — see Spec v0.1 §2 for the full detail including the debounce and atomic-write mitigations added at the simulated walkthrough.

```typescript
interface Evidence {
  id: string;            // uuid
  sourceFile: string;    // relative path within vault
  sourceRef?: string;    // block/line reference, e.g. "#^abc123"
  timestamp: string;     // ISO 8601 — capture time, not event time
  context: string;       // free text
  observation: string;   // the actual claim this evidence supports
  confidence: number;    // 0.0–1.0
}

interface Parameter {
  id: string;
  name: string;
  domain: "Reality" | "Human" | "Civilization" | "Strategy" | "Adaptation" | "Legacy";
  evidenceIds: string[]; // FK -> Evidence[]
  pattern?: string;      // derived label — optional until Pattern Engine exists
  confidence: number;    // aggregate; derivation rule TBD
  status: "draft" | "verified" | "disputed";
}

interface Relationship {
  id: string;
  sourceParameterId: string;
  targetParameterId: string;
  relationshipType: string;  // enum TBD: causal | correlated | contradicts | supports
  confidence: number;
  verification: "unverified" | "user-confirmed" | "contradicted";
}
```

## 9. Frontend / UX Direction

- **Immersive mode:** no scroll, ambient command-center view. Observation only.
- **Inspect mode:** scroll enabled, evidence drawer active. Investigation.
- Visual direction: dark, mission-control aesthetic. Explicitly avoid gamification, achievement badges, or ranking visuals.
- Interaction model locked in from Draft 5: **Screen = awareness layer → Drawer = investigation layer → Evidence = verification layer.**
- No AI-generated or AI-suggested content anywhere in the v1 UI — OQ-2's deferral means the "AI context builder" from the original kernel scope is not being built yet. Don't design empty states or drawer copy that imply it exists.

## 10. Non-Negotiable Principles (= Definition-of-Done gates)

1. **Extract or compile, never invent.** No UI element displays a claim without a linked Evidence object. This is testable: a linter/CI check can reject any dashboard component that renders a `Parameter` with an empty `evidenceIds` array. **Corollary (resolved OQ-5):** `Relationship` objects may only be created by explicit user action — no automatic or algorithmic inference in v1, full stop. If AI-assisted suggestions are ever introduced later, they require explicit confirm-before-write and can never commit to the graph autonomously.
2. **Every claim needs a witness.** `confidence` is a required field in the schema, not optional.
3. **Open or not at all.** MIT license, no closed telemetry, no server dependency for core function.

## 11. Risks, Assumptions, and Unresolved Tensions

This section exists because the prior draft had none — it stated principles and architecture side by side without checking whether they're compatible. They aren't, in a few places:

- **Tension A — RESOLVED (OQ-2).** AI reflection is deferred entirely past v1. The local-vs-cloud conflict this tension described doesn't need solving now — it needs solving whenever OQ-2 is reopened. Don't let "deferred" quietly become "forgotten": the day anyone proposes an AI feature, this tension is back, unchanged.
- **Tension B — RESOLVED (OQ-3).** Chromium-only for v1 (Chrome, Edge, Brave). Accepted trade-off, not a non-issue: this cuts out every Safari and Firefox user outright, which matters if OQ-4's courseware participants are on devices Adam doesn't control. Worth a one-line check with whoever runs course logistics before it becomes a support ticket mid-cohort.
- **Tension C — RESOLVED (Approved, Founder, simulated).** Module boundaries now defined: `vault-reader` → `evidence-parser` → `compiler` → `store` → `dashboard`, full-re-parse-per-change for v1 (Spec v0.1 §7, walkthrough §3). Real engineering confirmation once code exists remains recommended, not blocking.
- **Tension D — RESOLVED on policy (Approved, Founder); files themselves still genuinely unreviewed.** The mentor's dashboard, the BIM Intent Compiler and Fold Engine Benchmark Suite files, the prior Claude interview transcript, and the Open Source Audit document are permanently excluded from Spec v0.1's authority (domain taxonomy, parameters) — that's now settled policy, not an open question. What's still true: nobody has actually read these five files. A non-binding, low-priority read-through for general inspiration is tracked in `human-kernel-reference-material-dossier.md`, separate from and not required by the exclusion rule.
- **Assumption to confirm:** single-user, single-device in v1, no sync. This determines whether the storage layer needs conflict resolution at all.
- **Accepted residual risks from the OQ-1/OQ-2/OQ-3 decisions (not the same as "resolved" — these are trade-offs now on the books):** flat JSON files will not scale gracefully past some vault size nobody has measured yet; Chromium-only excludes Safari/Firefox users outright; deferring AI means Phase 3 has zero committed technical approach, which is fine only as long as nobody puts AI on a roadmap slide before OQ-2 is formally reopened.

## 12. Roles & Working Agreement

| Activity | PMO (Adam) | Senior Programmer | Fullstack Developer | Researcher |
|---|---|---|---|---|
| Scope & roadmap decisions | A/R | C | C | C |
| Kernel architecture (storage, inference approach) | C | A/R | C | I |
| Data schema (Evidence/Parameter/Relationship) | C | A/R | R | C |
| Frontend implementation (dashboard, modes, drawer) | C | C | A/R | I |
| Framework validity (is the SWOT/DISC/causal model sound) | C | I | I | A/R |
| Non-negotiable principles compliance (§10) | A | R | R | R |

*A = Accountable, R = Responsible, C = Consulted, I = Informed*

**Ceremonies:** 2-week sprints recommended. Sprint 0 = spike sprint, no feature commitments — its job is now confirming OQ-1/OQ-3 feasibility with engineering, formalizing all five OQs into written ADRs, and closing Tensions C and D (§11). Definition of Ready / Definition of Done should formalize §10 into a checklist (tracked separately — see next-steps document).

## 13. Decisions (formerly "Open Questions") — Resolved 2026-08-02

**Status note (updated 2026-08-02):** all five are now Approved (Founder). OQ-2, OQ-4, and OQ-5 were always PMO scope calls per §12's RACI — closed, full stop, no caveat needed. OQ-1 and OQ-3 technically sit under Senior Programmer accountability per the same RACI; they're approved via a simulated Sprint 0 walkthrough (`human-kernel-sprint-0-walkthrough-simulated.md`) rather than an actual engineering review, and that provenance is worth keeping straight — not because the decision is in doubt, but because if a real Senior Programmer is engaged later, they should know they're confirming a founder call, not rubber-stamping their own prior sign-off.

- **OQ-1 — Local storage engine: flat JSON files.** Rationale: browser-based, GitHub Pages-hosted, fully serverless; JSON is simple, transparent, portable, inspectable, and matches the ownership-first philosophy. IndexedDB / OPFS+SQLite stay on the table for a future version if performance becomes a measured bottleneck. *(Approved, Founder — debounce + atomic-write mitigations added at simulated walkthrough, ADR-0001.)*
- **OQ-2 — AI inference: deferred to a later major version.** V1 is a knowledge system, not a reasoning system — keeps the core free to use, reduces architectural complexity, avoids premature dependencies. *(Closed — PMO scope call.)*
- **OQ-3 — Browser support: Chromium-only v1** (Chrome, Edge, Brave). Minimizes dev/test overhead; Safari/Firefox deferred to a future release. *(Approved, Founder — explicit unsupported-browser messaging added as a requirement at simulated walkthrough, ADR-0003. Confirming actual course-cohort device policy remains recommended.)*
- **OQ-4 — Product positioning: courseware artifact.** V1 exists to teach and demonstrate the methodology; productization follows validation. *(Closed — PMO scope call. Triggers the data privacy policy requirement — next-steps item 7.)*
- **OQ-5 — Relationship/pattern inference: human-tagged only.** No automatic or algorithmic relationship creation in v1. Any future AI-assisted suggestion requires explicit user approval and can never autonomously modify the graph. *(Closed — directly enforces §10 principle 1.)*

**Tensions C and D are now also resolved** (§11) via the same simulated walkthrough — module boundaries approved, reference-material exclusion policy approved. What's genuinely still open, and can't be simulated shut: real engineering/research confirmation of OQ-1/OQ-3/Tension C, and an actual read-through of the five reference files if that's ever done.

## 14. Next Steps

A brief does not fully de-risk this project on its own — see `human-kernel-next-steps.md` for the full list of documents and tasks this workshop should produce or schedule before backlog grooming starts.
