---
doc_id: PRODUCT-DECISIONS
authority: governance-process
retrieval_purpose: >
  Who decides, and how: project role authority, open/unresolved decisions,
  and Sections 2-10 of the Repo Standard SOP (source of truth, development
  model, decision boundary, assumption control, ADR process, change
  management, definition of done, modification rules, traceability).
consult_when: [classifying-a-decision, recording-an-assumption, opening-an-adr,
  before-repository-modification, role-authority-question]
skip_when: never — low-impact decisions still default to established
  convention per Section 4 below rather than skipping this file entirely
depends_on: []
related:
  - PRODUCT-SPEC.md Section Repository Architecture   # Section 1 of the same SOP
source_files:
  - "Product spec for browser native app.md"
reconstructed: 2026-08-10
never_paraphrase: true
---

# PRODUCT-DECISIONS.md

## 1. Project Governance — Roles

##### How this project being managed

- Product manager : AI agent
- UX designer: performed by the designer as first-hand user. Interation happened until everything features are stress-tested & noted.
- UI designer: **UI**: what's exposed (visually). Interation happened until everything look & feel coherent
- Frontend developer: performed by Claude Cowork as excellent co-work. Modern AI tools are very good at generating desktop apps because the UI, logic, and filesystem access are well-defined, accelerating much of the implementation and repetitive work. 
- Backend developer: AI agent (it's possible to have project without backend)
- Desktop developer : AI agent
- QA tester : AI agent
- Technical writer : AI agent

Human only directs the product, making design decisions, validating outputs, and refining the experience.

AI orchestration worth looking into. 

## 2. Open Decisions

##### What's flexible (To decide)
Operational Qualification (OQ)

## 3. Repo Standard SOP — Sections 2–10

REPOSITORY STANDARD
Cross-Functional Product Development SOP

**Model:** Agile, iterative, incremental  
**Scope:** All serious product and software repositories  
**Priority:** Repository integrity, traceability, controlled change

> Section 1 (REPOSITORY ARCHITECTURE) of this SOP is recorded in
> `PRODUCT-SPEC.md` Section Repository Architecture.

---

## 2. SOURCE OF TRUTH

|Concern|Authoritative location|
|---|---|
|Product intent| `docs/product/PRODUCT-PRINCIPLES.md` |
|Requirements| `docs/product/PRODUCT-SPEC.md` |
|Roadmap| `docs/product/PRODUCT-ROADMAP.md` |
|UX| `docs/ux/` |
|UI| `docs/ui/` |
|Technical architecture| `docs/technical/` |
|QA| `docs/qa/` |
|Architectural decisions| `docs/decisions/ADR/` and Section 11 below (refactor-log ADRs) |
|Implementation| `src/` |
|Data structure| `data/schema/` |
|Material changes| `CHANGELOG.md` |

*(table synced to the four-doc split — previously pointed to `PRODUCT-BRIEF.md` / `REQUIREMENTS.md` / `docs/product/ROADMAP.md`, none of which exist in the tree revised in `PRODUCT-SPEC.md` Section 10; ADR-009)*

Rules:

- One authoritative source per concern.
- Do not duplicate specifications.
- References may point to the authoritative source.
- Resolve conflicts before implementation.
- Repository artifacts supersede undocumented conversational context.

---

## 3. DEVELOPMENT MODEL

Use iterative development.

```
Requirement
→ Design
→ Implement
→ Test
→ Review
→ Learn
→ Reprioritize
→ Next increment
```

Requirements may change when new evidence appears.

Material changes must update the affected source of truth.

Do not silently change requirements.

---

## 4. DECISION BOUNDARY

Classify unresolved information before proceeding.

### LOW IMPACT

Examples:

- Naming
- Minor spacing
- Local implementation details
- Reversible cosmetic choices

**Action:** Proceed using established conventions.

### MATERIAL

Affects:

- Feature behavior
- User flow
- Information architecture
- Acceptance criteria
- Externally observable behavior

**Action:** Record assumption or resolve before implementation when the ambiguity materially affects the result.

### HIGH IMPACT

Affects:

- Architecture
- Data model
- Security
- Privacy
- Authentication
- Storage
- API contracts
- Platform
- Deployment
- Compatibility
- Major dependencies
- Regulatory/compliance constraints
- Irreversible technical decisions

**Action:** STOP. Resolve and record the decision before proceeding.

---

## 5. ASSUMPTION CONTROL

When proceeding with an assumption that may affect future work, record:

```
UNKNOWN:
IMPACT:
ASSUMPTION:
STATUS:
```

An assumption must not silently become a requirement.

If the assumption becomes material, convert it into an explicit decision.

---

## 6. ARCHITECTURAL DECISIONS

Use:

```
docs/decisions/ADR/
```

Create an ADR for material decisions affecting:

- Architecture
- Data
- Security
- Infrastructure
- Technology selection
- Interoperability
- Major UX constraints
- Maintainability

ADR minimum structure:

```
# ADR-NNN: Title

Status:
Context:
Decision:
Consequences:
```

Do not create ADRs for trivial implementation choices.

---

## 7. CHANGE MANAGEMENT

For every material change:

1. Identify affected source (s) of truth.
2. Assess impact.
3. Update requirement/specification if necessary.
4. Implement the smallest coherent change.
5. Test.
6. Update affected documentation.
7. Update `CHANGELOG.md` when user-visible, architectural, or otherwise material.

Do not restructure a repository solely for aesthetic consistency.

---

## 8. DEFINITION OF DONE

A material feature is complete only when applicable:

```
Requirement
→ Acceptance criteria
→ Design
→ Implementation
→ Verification
→ Documentation
→ Release
```

A feature may be considered complete without every documentation artifact when that artifact is genuinely not applicable.

---

## 9. MODIFICATION RULES

Before modifying an existing repository:

1. Read `REPO-STANDARD.md`.
2. Read relevant requirements.
3. Inspect relevant ADRs.
4. Inspect affected implementation.
5. Identify conflicts and dependencies.
6. Determine decision boundaries.
7. Implement.
8. Verify.
9. Update affected records.

Do not assume missing information is permission to invent requirements.

Do not block development for low-impact ambiguity.

---

## 10. TRACEABILITY REQUIREMENT

For material functionality, the repository should support this chain:

```
Product intent
→ Requirement
→ Design
→ Technical decision
→ Implementation
→ QA verification
→ Release
→ Change record
```

Break the chain only where a stage is genuinely not applicable.

---

## 11. REFACTOR DECISION LOG (2026-08-10)

Resolutions to the contradictions surfaced by the KB-AUDIT pass across `PRODUCT-SPEC.md`, `PRODUCT-PRINCIPLES.md`, and `PRODUCT-ROADMAP.md`. Recorded per Section 6 (Architectural Decisions) ADR structure, per the owner's instruction to prioritize proof, documentation, and record over prose notes.

### ADR-001: Deployment sequencing — Tauri relocated to roadmap
**Status:** Accepted
**Context:** `PRODUCT-SPEC.md` Section Layer 1 Evidence Vault stated "Tauri Desktop App" as the first-version architecture, contradicting the browser-native/zero-install MVD criteria and `PRODUCT-ROADMAP.md` Section Architecture Phase's own sequencing (GitHub Pages prototype precedes Tauri desktop application).
**Decision:** Tauri Desktop App architecture relocated to `PRODUCT-ROADMAP.md` Section Architecture Phase, attached to the "Tauri desktop application" stage — the furthest roadmap stage that specifically names it. `PRODUCT-SPEC.md` Section Layer 1 Evidence Vault reverts to browser-native/stack-agnostic for the MVD stage.
**Consequences:** SPEC and ROADMAP no longer disagree on what ships first. The "Stack: Tauri" line in SPEC Section 4 Criteria is annotated as roadmap-deferred.

### ADR-002: Local storage mapped per stage
**Status:** Accepted
**Context:** Four storage technologies (SQLite-like, SQLite, Flat JSON, IndexedDB/SQLite WASM) were each stated as "the" storage layer without stage qualification.
**Decision:** Flat JSON files (default) or IndexedDB/SQLite WASM (Lite alternative) at the GitHub Pages prototype stage; SQLite at the Tauri desktop application stage. Mapped in `PRODUCT-ROADMAP.md` Section Architecture Phase and `PRODUCT-SPEC.md` Section 9.
**Consequences:** Criteria's "SQLite-like local storage" bullet is annotated as a cross-stage generic target, not a single fixed choice.

### ADR-003: AI / automatic inference grouped into a deferred, revised-architecture tier
**Status:** Accepted
**Context:** `PRODUCT-SPEC.md` Section 9 stated AI is deferred and inference is non-automatic, while Layer 2 Domain Compiler, Roadmap Phase 1, and Version 2 already specified automatic confidence scoring and AI-suggested relationships near-term.
**Decision:** AI/automatic-inference content (Layer 2 confidence scoring, Phase 1 confidence scoring, Version 2 AI suggestions, Phase 3 Intelligence Layer) is grouped as a single revised/future architecture tier, out of the near-term stages. Phase 0/1 and Version 1 stay rule-based/manual — early product development is deferred on AI, aligned to MVD practice.
**Consequences:** "AI: Deferred until a later major version" is now accurate and uncontradicted. Layer 2's confidence-score example is annotated as a future-tier illustration.

### ADR-004: Cloud/account criteria reframed as MVD-standard baseline, not absolute prohibition
**Status:** Accepted
**Context:** `PRODUCT-SPEC.md` Section 4 listed "No account," "No login," "No cloud dependency" without phase qualification; `PRODUCT-ROADMAP.md` planned optional cloud sync, enterprise edition, and SSO later.
**Decision:** These criteria are a constraint applied for delivery efficiency to hold the MVD standard — not a permanent prohibition. Cloud/account/SSO capability is a potential proposal, evaluated only if/when the MVD baseline is deliberately extended.
**Consequences:** Criteria and roadmap now operate at different decision layers (standard vs. proposal) — no residual textual conflict.

### ADR-005: Criteria list reclassified as directional checklist
**Status:** Accepted
**Context:** MVD's Scope Rule (`PRODUCT-PRINCIPLES.md` Section 2) forbids adding requirements merely for being scalable/technically possible; `PRODUCT-SPEC.md` Section 4 listed 30+ simultaneous items under the MVD label, reading as a compulsory 100% checklist.
**Decision:** The Criteria list is a directional checklist targeting the MVD standard, not a compliance gate. It is flexible up to ~80%; 100% adherence is not required.
**Consequences:** SPEC Section 4 carries an explicit checklist/flexibility note referencing this ADR.

### ADR-006: ABIM governs; Roadmap Phases 2–3 marked draft
**Status:** Accepted
**Context:** `PRODUCT-ROADMAP.md` Phases 2–3 pre-specified features ahead of validating evidence, in tension with ABIM's re-induction and anti-pattern rules (`PRODUCT-PRINCIPLES.md` Section 1, Section 12, Section 16).
**Decision:** `PRODUCT-PRINCIPLES.md` (ABIM) is the core method the roadmap serves. ROADMAP Phases 2–3 are marked suggestive draft, not committed requirements. Phase 0–1 remain the only committed near-term scope.
**Consequences:** Phase 2–3 feature lists may be reduced, replaced, or killed per ABIM Section 12 without constituting a roadmap contradiction.

### ADR-007: Law 2 (witness requirement) marked KIV
**Status:** Proposed — KIV, not yet applied
**Context:** Layer 2 Domain Compiler's confidence-score example states no verification method, in tension with Law 2 (`PRODUCT-PRINCIPLES.md` Section 3), which requires every transformation to carry input/process/output/verification.
**Decision:** Law 2 is struck through in `PRODUCT-PRINCIPLES.md` and marked KIV, tolerated pending a defined verification method for confidence scoring. Kept visible for future reference, not deleted.
**Consequences:** The confidence-score example is no longer in violation of an actively applied rule. Law 2 stands as a placeholder obligation to resolve before AI/confidence-scoring content leaves the deferred tier (ADR-003).

### ADR-008: SPEC Section 5 "Note: Info" discarded
**Status:** Accepted
**Context:** `PRODUCT-SPEC.md` contained an undocumented "key architectural decision" stated in prose, bypassing the ADR process this SOP (Section 6) requires for material architecture decisions.
**Decision:** "Note: Info" is discarded from `PRODUCT-SPEC.md`, in favor of prioritizing proof, documentation, and record — aligned with industry-standard project management method — over informal prose notes.
**Consequences:** If "the kernel should not own the data, it should interpret it" is still considered material, it must re-enter through a proper ADR, not by default.

### ADR-009: Source of Truth table synced to the revised repository tree
**Status:** Accepted
**Context:** This file's Section 2 Source of Truth table pointed to `PRODUCT-BRIEF.md` / `REQUIREMENTS.md` / `docs/product/ROADMAP.md`, none of which exist in the tree revised in `PRODUCT-SPEC.md` Section 10.
**Decision:** Table updated — Product intent → `PRODUCT-PRINCIPLES.md`, Requirements → `PRODUCT-SPEC.md`, Roadmap → `PRODUCT-ROADMAP.md`.
**Consequences:** The two docs no longer disagree about which files are authoritative. (Not explicitly requested by the owner — flagged and fixed as a factual sync issue, not a judgment call.)

### ADR-010: "No database migration" criterion reconciled with migration guidance
**Status:** Accepted
**Context:** Identified during the refactor pass, not in the delivered audit report — flagged here transparently rather than left silently unresolved. `PRODUCT-SPEC.md` Section 4 lists "No database migration" while Section 5 "Note: To set up" states migration logic is needed once local storage/IndexedDB schema changes across versions.
**Decision:** Resolved under the same logic as ADR-005 — "No database migration" is an MVD-baseline checklist target, not an absolute rule; the "Note: To set up" guidance applies once the product persists local data across versions, which is expected beyond the initial MVD.
**Consequences:** SPEC Section 4 bullet annotated accordingly.
