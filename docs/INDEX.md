# Human Kernel — Document Index

**26 files.** This exists because that number stopped being navigable without a map. If you're new to this project — including a real Senior Programmer, Fullstack Developer, or Researcher joining for the first time — read in this order:

1. `human-kernel-project-brief-v2.md` — what this is and why.
2. `human-kernel-specification-v0.1.md` — what to actually build.
3. `human-kernel-sprint-0-walkthrough-simulated.md` — the reasoning behind every non-obvious call, and where to push back.
4. `human-kernel-agile-backlog.md` — what to build first (MVD critical path).

Everything else is reference, not required reading on day one.

## Status Key

**Approved (Founder)** — Adam Rosman has explicitly approved this; it's operative for planning and building now. Where real engineering/research confirmation is still recommended, that's stated in the document itself, not implied here.
**Open** — genuinely unresolved; not something founder approval could close (legal review, unread files).
**Living** — expected to change every sprint; check the file itself, not this index, for current content.

## Governance & Vision

| File | Purpose | Status |
|---|---|---|
| `human-kernel-project-brief-v2.md` | Single cross-functional brief: scope, goals, architecture summary, RACI, principles. Source of truth for section numbers (§) referenced everywhere else. | Approved (Founder) |
| `human-kernel-mom-2026-08-02.md` | Minutes of the prior (ChatGPT) session that originated this project — historical record, not a living doc. | Frozen — historical |

## Process & Meetings

| File | Purpose | Status |
|---|---|---|
| `human-kernel-sprint-0-agenda.md` | Runnable agenda for the real kickoff meeting, once Senior Programmer + Fullstack Developer are engaged. Decision Log inside is filled in already — see next row. | Approved (Founder), simulated |
| `human-kernel-sprint-0-walkthrough-simulated.md` | The actual reasoning: thought process, realistic challenges, and resolutions behind OQ-1, OQ-3, Tension C, Tension D, and the domain ontology. Read before the real Sprint 0 meeting, hand to real engineers as prep material. | Approved (Founder), simulated — explicitly not a real meeting transcript |

## Technical Specification

| File | Purpose | Status |
|---|---|---|
| `human-kernel-specification-v0.1.md` | Domain ontology, data objects, file layout, authoring syntax, compiler rules, versioning. The canonical technical reference. | Approved (Founder); Researcher/engineering confirmation recommended per section |
| `human-kernel-schema-evidence.json` | JSON Schema (2020-12) for the `Evidence` object. | Draft, validates clean |
| `human-kernel-schema-parameter.json` | JSON Schema for `Parameter` — enforces "never invent" via `evidenceIds` `minItems: 1`. | Draft, validates clean |
| `human-kernel-schema-relationship.json` | JSON Schema for `Relationship`. | Draft, validates clean |
| `human-kernel-schema-index.json` | Root schema for `.human-kernel/index.json`, `$ref`s the three above. | Draft, validates clean |

## Architecture Decision Records

| File | Decision | Status |
|---|---|---|
| `human-kernel-adr-0001-local-storage-engine.md` | Flat JSON files, single index per vault | Approved (Founder), simulated |
| `human-kernel-adr-0002-ai-inference-deferral.md` | No AI in v1, deferred to later major version | Approved |
| `human-kernel-adr-0003-browser-support-matrix.md` | Chromium-only v1 (Chrome/Edge/Brave) | Approved (Founder), simulated |
| `human-kernel-adr-0004-product-positioning.md` | Courseware artifact, not standalone product | Approved |
| `human-kernel-adr-0005-relationship-inference-policy.md` | Human-tagged relationships only, never auto-inferred | Approved |

## Frontend

| File | Purpose | Status |
|---|---|---|
| `human-kernel-wireframes-data-states.html` | Clickable wireframe covering the 5 data states Draft 5 never showed (empty vault, partial parse, populated, disputed, drawer). Open directly in a Chromium browser. | Draft |

*(`human-kernel-war-room-draft-5.html`, the original interaction-model prototype, lives wherever Adam saved it from the prior ChatGPT session — not in this file set.)*

## Delivery Planning

| File | Purpose | Status |
|---|---|---|
| `human-kernel-agile-backlog.md` | Epics 1–9 broken into estimated stories; MVD critical path explicitly flagged (9 stories, 37 points). | Draft — ready for real estimation once developers are engaged |
| `human-kernel-definition-of-ready-done.md` | Brief v2 §10's three principles as a pass/fail PR checklist. | Draft |
| `human-kernel-test-validation-plan.md` | Test strategy by module; centers on the "no Parameter without Evidence" invariant. | Draft |
| `human-kernel-next-steps.md` | Running list of what's done vs. outstanding across this whole set. Check this file first if you want current status of any one item. | Living |

## Legal & Governance

| File | Purpose | Status |
|---|---|---|
| `LICENSE` | MIT. | Final |
| `CONTRIBUTING.md` | PR process, tied to the three non-negotiable principles. | Draft |
| `CODE_OF_CONDUCT.md` | Standard project conduct expectations. | Draft |
| `human-kernel-privacy-policy.md` | Data handling — critical given courseware positioning (real participant data). | **Open — not legal advice, needs real legal/compliance review before any course cohort.** This is the one document approval cannot close. |

## Risk & Reference

| File | Purpose | Status |
|---|---|---|
| `human-kernel-risk-register.md` | Living list of accepted trade-offs and open risks across every decision above. | Living |
| `human-kernel-reference-material-dossier.md` | Tracks the 5 files (mentor dashboard, BIM Intent Compiler, Fold Engine Benchmark Suite, Claude interview transcript, Open Source Audit) referenced in the original conversation but never supplied to any session. | Open — excluded from Spec authority (Approved policy); files themselves still unread |

---

**What "tidy" does not mean here:** this index doesn't make every open item closed. Two things stay genuinely open no matter how this project is organized — the privacy policy needs a real lawyer, and the five reference files need someone to actually upload and read them. Everything else in this project is now a first draft with a clear owner and a clear next action, which is the actual goal of tidying a document set this size.
