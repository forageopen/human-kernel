---
doc_id: PRODUCT-ROADMAP
authority: delivery-sequence
retrieval_purpose: >
  Phased and versioned delivery plan: architecture phase, product roadmap
  phases 0-3, evidence vault delivery versions 1-3, delaying-APIs phases.
  Load for sequencing, phase-gating, or version-scoping questions.
consult_when: [sequencing, phase-gating, version-scoping, "what ships next"]
skip_when: task is already scoped to a named phase or version
depends_on:
  - PRODUCT-SPEC.md       # scaffolding these phases/versions build toward
  - PRODUCT-PRINCIPLES.md # ABIM operating loop this sequence instantiates
source_files:
  - "Product spec for browser native app.md"
reconstructed: 2026-08-10
never_paraphrase: true
---

# PRODUCT-ROADMAP.md

> **Governing method (ADR-006, `PRODUCT-DECISIONS.md` Section 11):** `PRODUCT-PRINCIPLES.md` (ABIM) is the core method. Phases and versions below — especially Section 2 Phases 2–3 — are a suggestive draft sequence subject to re-induction, not a committed backlog. Build only what validated evidence supports next.

## 1. Architecture Phase

##### Architecture Phase
GitHub Pages prototype → Tauri desktop application → Optional cloud sync and collaboration → Enterprise edition if needed.

**Stage-mapped detail:**

- **GitHub Pages prototype** — browser-native. Storage: Flat JSON files (default) or IndexedDB + SQLite WASM (Lite alternative). See `PRODUCT-SPEC.md` Section 9 Proposed Architecture Summary. (ADR-002)
- **Tauri desktop application** — native desktop. Architecture relocated here from `PRODUCT-SPEC.md` Section Layer 1 Evidence Vault (ADR-001):

  ```
  Tauri Desktop App

  Frontend:
  React + D3.js

  Local:
  SQLite

  Input:
  PDF/DOCX/TXT

  Processing:
  Local parser
  Optional AI model

  Output:
  Interactive graph
  ```

- **Optional cloud sync and collaboration** / **Enterprise edition** — potential proposals for extended architecture, contingent on validated demand. Not part of the MVD baseline defined in `PRODUCT-SPEC.md` Section 4 Criteria ("No cloud dependency," "No account," "No login"). (ADR-004)

## 2. Product Roadmap

> Phase 0–1 are the committed near-term scope. Phase 2–3 are a **suggestive draft**, not a must — re-evaluate against evidence before committing (ADR-006).

#### Product Roadmap
The kernel could initially be very small:

###### Phase 0: Foundation 
Build: Browser Obsidian Viewer + Local Markdown Vault + Human Parameter Schema + Traceability System

Eg. 
V 0.1 Kernel:
- File watcher
- Markdown parser
- Metadata extractor
- Local search
- AI context builder

###### Phase 1: Human Compiler
Add: Observation extraction, Pattern mapping, Domain classification & Confidence scoring *(confidence scoring = AI/revised-architecture tier, deferred — ADR-003)*

##### Phase 2: Personal Model — draft
Add: Timeline, Causal relationships, Contradiction detection, Model evolution

##### Phase 3: Intelligence Layer — draft, AI / revised architecture tier (ADR-003)
Add: AI reflection, Scenario simulation, Decision mirror, Personal agent

Eg.
V 2.0 Kernel:
- Digital twin
- Autonomous agents
- Personal knowledge graph
- Learning systems

## 3. Evidence Vault Delivery Versions

> Parent spec: `PRODUCT-SPEC.md` Section Layer 1: Evidence Vault.

Version 1:

- Upload file
- Extract text
- Manual tagging
- Create nodes
- Connect relationships
- Save project

Version 2: *(AI / revised architecture tier, deferred — ADR-003)*

- AI suggests nodes
- AI suggests relationships
- Auto summaries

Version 3:

- Team knowledge system

## 4. Delaying APIs

##### Delaying APIs

This is a mature engineering decision.

Many founders build:

- Authentication
- Accounts
- Teams
- Billing
- APIs
- Cloud sync

... Before they've proven anyone wants the product.

Instead:

```
Phase 1

Desktop

Single user

Offline

Folder based
```

Then:

```
Phase 2

Department

Shared folders

LAN

Permissions
```

Then:

```
Phase 3

Cloud

Enterprise

SSO

APIs
```

Each phase builds on validated demand.

> Cross-ref: `PRODUCT-SPEC.md` Section 4 Criteria frames "No cloud dependency / No account / No login" as the MVD-standard baseline; the phases above are the proposal path if that baseline is deliberately extended (ADR-004).
