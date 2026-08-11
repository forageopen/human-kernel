---
doc_id: PRODUCT-SPEC
authority: product-definition
retrieval_purpose: >
  What is being built: identity, architecture, MVD instance, criteria,
  platform constraints, kernel scaffolding, proposed architecture stack,
  repository architecture. Load for implementation, schema, UI, or
  feature-scope questions.
consult_when: [implementation, architecture, data-model, ui, feature-scope]
skip_when: task does not touch product boundaries or technical shape
depends_on:
  - PRODUCT-PRINCIPLES.md   # MVD / ABIM model definitions referenced below
related:
  - PRODUCT-ROADMAP.md      # phased/versioned delivery of the scaffolding below
  - PRODUCT-DECISIONS.md    # sections 2-10 of the Repo Standard SOP
source_files:
  - "Product spec for browser native app.md"
reconstructed: 2026-08-10
never_paraphrase: true
---

# PRODUCT-SPEC.md

## 1. Product Identity

###### Info
Open source
-open kernel (source code. Minimal core with extension or module around it; essential functionality + optional features. Advantage: can extend or replace the core like RAM card)
-MIT license

GitHub Pages is a **static hosting service**.

##### What this app do in one word
Human Pattern Compiler

###### Category
- Static web app; everything runs in the user's browser with no backend server

##### Source
Human lived reality
##### Definition
A local-first human intent compiler that transforms lived evidence into a verifiable personal model.

## 2. Architecture

##### Architecture
Human Reality → Pattern (Observed Events)→ Rule (Pattern Compiler) → Model (Human State Model)→  Verification & Action.

 Simple version:

```
┌────────────────────────┐
│ Browser Interface      │
│                        │
└───────────┬────────────┘
            │
┌───────────▼────────────┐
│  Intent Compiler       │
│                        │
│ Extract                │
│ Compile                │
│ Fold                   │
│ Verify                 │
└───────────┬────────────┘
            │
┌───────────▼────────────┐
│ Local Evidence Vault   │
│ Markdown / JSON / Logs │
└────────────────────────┘
```

Extended mapping architecture:

```
                Browser Interface
                       |
                       |
               Kernel Dashboard
                       |
              Pattern Compiler Engine
                       |
        ┌──────────────┴──────────────┐
        |                             |
    Sources                 Scheme (Parameters & variables)
        |                             |
        └──────────────┬──────────────┘
                       |
                Fold + Verify
                       |
                 Living Model 
```

## 3. Minimum Viable Delivery (kernel instance)

> Model definition and filter: see `PRODUCT-PRINCIPLES.md` Section MVD — Minimum Viable Delivery.

##### Minimum Viable Delivery
At minimum, the kernel should only establish:

```
Evidence
    ↓
Parameter
    ↓
Pattern
    ↓
Relationship
```

No prediction. No optimisation. No life score.

## 4. Criteria

##### Criteria
*Based on the principle of Minimum Viable Delivery*

> **Checklist, not a compliance gate** (ADR-005, `PRODUCT-DECISIONS.md` Section 11): this list is a directional target for the MVD standard, not a 100%-mandatory set. ~80% adherence is sufficient — drop an item if it doesn't serve the outcome test in `PRODUCT-PRINCIPLES.md` Section MVD Filter.

- Browser-native kernel environment
- local-first intelligence kernel (Your data never leaves your computer)
- No account. *(MVD-standard baseline, not an absolute prohibition — accounts are a potential future proposal, see `PRODUCT-ROADMAP.md` Section Delaying APIs; ADR-004)*
- No cloud dependency. *(MVD-standard baseline; cloud sync is a future proposal, see `PRODUCT-ROADMAP.md` Section Architecture Phase; ADR-004)*
- Migration friendly
- Backup friendly
- Backlog firendly
- Zero install / Zero installation
- Model agnostic
- Quick load
- Forkable and extensible
- Lightweight
- No server (Client-side) / Fully client-side
- Offline-capable (PWA-enabled)
- A single repository
- One-click deployable with GitHub Pages
- MIT licensed
- GitHub hosted
- Stack: Tauri *(roadmap-deferred, not the MVD stack — see `PRODUCT-ROADMAP.md` Section Architecture Phase, "Tauri desktop application" stage; ADR-001)*
- No login *(MVD-standard baseline; see ADR-004)*
- No subscriptions required to use the core product.
- No integration
- No API
- No database migration. *(MVD-baseline checklist target, not absolute — see Note: To set up for when migration logic becomes necessary beyond the MVD baseline; ADR-010)*
- SQLite-like local storage *(mapped per stage, not a single fixed choice — see `PRODUCT-ROADMAP.md` Section Architecture Phase and Section 9 below; ADR-002)*
- Read local files (User grants file access)
- Sandboxed file system
- Refresh/deploy update
- Extremely high portability
- Possible AI/local model adoption *(revised/future architecture tier, not near-term — see `PRODUCT-ROADMAP.md` Section Product Roadmap, Phase 3; ADR-003)*
- GitHub as **distribution/update server**, not your runtime server.

## 5. Technical Notes

###### Note: To set up
GitHub Pages serves the updated files. When users revisit, the browser downloads the new version. If you're using local storage or IndexedDB, you need to write migration logic so the user personal data stays while the app gains new features.

> **[Discarded]** "Note: Info" — an undocumented architecture decision stated in prose ("the kernel should not own the data, it should interpret the data") — removed per ADR-008, `PRODUCT-DECISIONS.md` Section 11. Material architecture decisions are now required to go through the ADR process (Section 6 of the Repo Standard SOP) rather than live as prose notes. If this decision is still considered material, it must re-enter through a proper ADR.

###### Note: Limitation
The limitation is collaboration.
If 100 students use the same GitHub Pages deployment:
- They can all read the same content.
- They cannot automatically share progress with each other.
For that, you eventually need a sync layer.

The "backend" belongs to one person.

If Adam opens the app:

```
Adam's browser
 └── Adam's data
```

If Sarah opens it:

```
Sarah's browser
 └── Sarah's data
```

They do not share the same database.

## 6. Platform Constraints

###### What you cannot do without API
Without any API or backend, you cannot:

- Send emails automatically.
- Process payments.
- Store data shared between users.
- Log users in with accounts.
- Hide secret keys.
- Run AI models hosted in the cloud.
- Download private information from other websites.

Those require a server somewhere.

## 7. Category — Meta-Application

##### Category

App. Precisely Meta-app

It is a **meta-application**. Instead of being another tool, it acts as the layer that understands _you_ and coordinates other tools.

|Layer|Traditional App|Human Kernel|
|---|---|---|
|Purpose|Solve one task|Become the operating core for a person|
|Scope|Single workflow|All workflows|
|Data|App-specific|Unified human profile and knowledge|
|Interface|UI first|Human model first|
|Architecture|Feature-centric|Identity-centric|
|Goal|Productivity|Cognitive augmentation|

###### Analogy

An analogy:

```
Computer

Operating System
    ├── Browser
    ├── VS Code
    ├── Photoshop
    └── Games
```

The vision is closer to:

```
Human

Human Kernel
    ├── Identity
    ├── Memory
    ├── Goals
    ├── Knowledge
    ├── Projects
    ├── Values
    ├── Relationships
    ├── Decision Engine
    └── AI Agents

            ↓

    Browser
    GitHub
    Obsidian
    Gmail
    Notion
    Cursor
    ChatGPT
```

So Human Kernel isn't competing with Obsidian or Notion. It becomes the **single source of truth** that every AI agent and application reads from.

That distinction is important if you're planning to build it. You can describe it as:

> "A human operating system implemented as an application."

Or even more precisely:

> "A personal cognitive operating layer that runs as a web application."

## 8. Proposed Kernel Scaffolding

#### Proposed kernel scaffolding

###### Layer 1: Evidence Vault
Raw input.
No interpretation.

Examples:

```
event:
  type: decision
  timestamp:
  context:
  action:
  outcome:
```

Eg.

The first version does not need:

- AI agents
- Cloud
- Accounts
- Collaboration
- APIs

> Architecture stack (Tauri Desktop App / React + D3.js / SQLite) relocated to `PRODUCT-ROADMAP.md` Section Architecture Phase, "Tauri desktop application" stage — it is not the MVD/first-version architecture (ADR-001, see `PRODUCT-DECISIONS.md` Section 11).

Sources:

- Journal
- Projects
- Conversations
- Decisions
- Habits
- Learning logs
- Creations

> Delivery versions (Version 1 / Version 2 / Version 3) and the mission filter for this layer: see `PRODUCT-ROADMAP.md` Section Evidence Vault Delivery Versions and `PRODUCT-PRINCIPLES.md` Section Mission Filter.

---

###### Layer 2: Domain Compiler

Every observation gets mapped through six lenses.
Example:

Observation:
> "I keep rebuilding systems instead of shipping."

Possible compilation:

Reality:
- Assumption about perfection

Human:
- Cognitive pattern
- Risk response

Strategy:
- Execution bottleneck

Adaptation:
- Learning loop

Not:
"You are a perfectionist."

Instead:
```
pattern:
  name: refinement-before-validation

evidence:
  - project history
  - repeated behaviour

domains:
  - strategy
  - adaptation

confidence:
  0.68
```

> This confidence-scoring behavior belongs to the revised/future AI architecture tier (ADR-003), not the near-term MVD stage. Its verification method is undefined — Law 2 in `PRODUCT-PRINCIPLES.md` Section 3 Three Laws is marked KIV (ADR-007) until one is specified.

---

###### Layer 3: Fold Engine

The kernel should not overwrite the person model.
It should fold new evidence.

Example:

Old:

```
risk_tolerance:
  medium
```

New evidence:

```
3 successful high-risk decisions
```

Fold:

```
risk_tolerance:
  changed: medium → calculated_high
  reason:
    new evidence exceeded threshold
```

The history remains.

---

###### Layer 4: Benchmark Dashboard

The dashboard is not a "profile page".
It is a scientific instrument.

Possible modules:

```
Kernel Status

Evidence Processed:
10,432

Patterns Compiled:
86

Unsupported Claims:
12

Model Changes:
+8 / -3

Verification Score:
91%
```

## 9. Proposed Architecture Summary

> Stage mapping (ADR-002, ADR-003): both options below implement the **GitHub Pages prototype** stage of `PRODUCT-ROADMAP.md` Section Architecture Phase. The Tauri desktop stage's architecture (SQLite, native) lives in that roadmap section, not here.

## Proposed Architecture Summary

- JAMstack
- Platform: Browser-based web application
- Hosting: GitHub Pages
- Backend: None
- Infrastructure: Fully serverless
- Local storage: Flat JSON files
- AI: Deferred until a later major version
- Browser support: Chromium browsers only
- Product focus: Educational courseware artifact
- Knowledge model: Human-authored and human-linked with no automatic inference

Option 2 (For Lite)
Stack:

- GitHub Pages
- JavaScript
- IndexedDB
- SQLite WASM
- Markdown parser
- D 3. Js visualization


The constraint becomes the selling point.

"AI tools are getting bigger. We make knowledge smaller, cleaner, and usable."

That is a real positioning angle. Sir

## 10. Repository Architecture

REPOSITORY STANDARD
Cross-Functional Product Development SOP

**Model:** Agile, iterative, incremental  
**Scope:** All serious product and software repositories  
**Priority:** Repository integrity, traceability, controlled change

> Sections 2–10 of this SOP (Source of Truth, Development Model, Decision
> Boundary, Assumption Control, Architectural Decisions, Change Management,
> Definition of Done, Modification Rules, Traceability Requirement) are
> recorded in `PRODUCT-DECISIONS.md`.

---

## 1. REPOSITORY ARCHITECTURE

*(revised so the four context-dependent product docs — PRODUCT-SPEC.md, PRODUCT-PRINCIPLES.md, PRODUCT-ROADMAP.md, PRODUCT-DECISIONS.md — are listed under `docs/product/`, replacing the prior PRODUCT-BRIEF / REQUIREMENTS / ROADMAP / USER-STORIES split)*

```
project/
├── .github/
│   └── workflows/
│
├── docs/
│   ├── product/
│   │   ├── PRODUCT-SPEC.md
│   │   ├── PRODUCT-PRINCIPLES.md
│   │   ├── PRODUCT-ROADMAP.md
│   │   └── PRODUCT-DECISIONS.md
│   │
│   ├── ux/
│   │   ├── RESEARCH.md
│   │   ├── USER-FLOWS.md
│   │   ├── INFORMATION-ARCHITECTURE.md
│   │   └── wireframes/
│   │
│   ├── ui/
│   │   ├── DESIGN-SYSTEM.md
│   │   ├── COMPONENTS.md
│   │   └── specifications/
│   │
│   ├── technical/
│   │   ├── ARCHITECTURE.md
│   │   ├── DATA-MODEL.md
│   │   ├── API.md
│   │   └── DESKTOP.md
│   │
│   ├── qa/
│   │   ├── TEST-PLAN.md
│   │   ├── TEST-CASES.md
│   │   ├── ACCEPTANCE-CRITERIA.md
│   │   └── BUGS.md
│   │
│   └── decisions/
│       └── ADR/
│
├── src/
│   ├── frontend/
│   └── desktop/
│
├── data/
│   ├── sample/
│   └── schema/
│
├── assets/
├── scripts/
│
├── README.md
├── REPO-STANDARD.md
├── CHANGELOG.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── package.json
└── .gitignore
```

### Applicability

- Omit components that are not applicable.
- Do not create empty directories.
- Do not introduce alternative locations for the same concern.
- Preserve established project conventions unless they conflict with this standard.
