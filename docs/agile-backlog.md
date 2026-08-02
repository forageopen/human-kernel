# Human Kernel — Agile Backlog

**Terminology note:** Adam's instruction shifted the target from "MVP" (Brief v2 §6, Phase 1) to **MVD — Minimum Viable Demonstration**. Read as: the smallest slice that makes the full evidence → dashboard loop demonstrable end-to-end, not full completion of every Phase-1 Epic. Flag if a different meaning was intended. Stories below are tagged **[MVD]** where they're on that critical path, and **[Post-MVD]** where they're real but can slip past the first demo.

Estimates are Fibonacci story points, not hours. Every story's acceptance criteria implicitly includes the Definition of Done (`human-kernel-definition-of-ready-done.md`) — not repeated per-story below.

---

## EPIC-1: Local File Ingestion

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 1.1 File System Access API vault picker | 3 | **[MVD]** | User selects a local folder; app holds a live handle to it. Chromium-only (ADR-0003). |
| 1.2 Recursive file watcher for live changes | 5 | Post-MVD | Editing a file outside the app updates the dashboard without a manual re-scan. Not needed for a single demo pass. |
| 1.3 Frontmatter + wikilink parser | 5 | Post-MVD | Obsidian-standard frontmatter and `[[wikilinks]]` parse without error. Nice-to-have for MVD; not required to prove the evidence loop. |
| 1.4 Callout parser: `[!evidence]` / `[!relationship]` | 8 | **[MVD]** | Parses the syntax in Spec v0.1 §4, including the validation rules (domain enum check, confidence range check, rejects rather than clamps). This is the actual on-ramp for every downstream Epic. |

## EPIC-2: Evidence & Parameter Data Model

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 2.1 Implement Evidence/Parameter/Relationship types + JSON Schema validation | 3 | **[MVD]** | Runtime objects validate against the four schema files (`human-kernel-schema-*.json`) in CI, not just at compile time. |
| 2.2 Parameter Compiler: grouping + confidence aggregation | 5 | **[MVD]** | Evidence with matching (domain, normalized name) groups into one Parameter; confidence = arithmetic mean, recalculated every parse (Spec v0.1 §5). |
| 2.3 Relationship Compiler + unresolved-reference warnings | 5 | Post-MVD | Needed for the causal map, not for a first single-Parameter demo. |
| 2.4 `index.json` serializer, deterministic sort | 3 | **[MVD]** | Re-parsing an unchanged vault produces a byte-identical file (Spec v0.1 §2). |

## EPIC-3: Dashboard Shell

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 3.1 Immersive/Inspect mode toggle + scroll lock | 2 | **[MVD]** | Matches Draft 5's validated interaction model (Brief v2 §9). |
| 3.2 Card grid layout | 3 | **[MVD]** | Renders at least one real card type from live `Parameter` data, not hardcoded values. |
| 3.3 Evidence drawer component | 5 | **[MVD]** | Opening a card shows its linked Evidence list — source file, confidence, timestamp (wireframe state 5, `human-kernel-wireframes-data-states.html`). |

## EPIC-4: Visualizations Bound to Real Data

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 4.1 SWOT card wired to Parameter query by domain | 5 | **[MVD]** | Pick one visualization type to prove the loop end-to-end; SWOT chosen as simplest. |
| 4.2 DISC card | 5 | Post-MVD | Same pattern as 4.1, second visualization type — demonstrates the pattern generalizes, not required for the first demo. |
| 4.3 Causal map card wired to Relationship data | 8 | Post-MVD | Depends on 2.3. |
| 4.4 Timeline card wired to Evidence timestamps | 5 | Post-MVD | |

## EPIC-5: Relationship/Causal Tagging (Phase 2)

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 5.1 Optional relationship-authoring UI helper | 5 | Post-MVD | Authoring stays markdown-first (Spec v0.1 §4) — this is a convenience layer, not a requirement. |

## EPIC-6: Timeline & Pattern Evolution (Phase 2)

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 6.1 Historical snapshot diffing | 8 | Post-MVD | Requires multiple parses over time — not meaningful for a single demo session. |

## EPIC-7: Contradiction Detection (Phase 2)

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 7.1 Surface `status:disputed` Parameters prominently | 3 | Post-MVD | Wireframe state 4 exists (`human-kernel-wireframes-data-states.html`) — build once 2.2 is stable. |

## EPIC-8: AI Reflection Layer (Phase 3)

**BLOCKED — ADR-0002.** No stories written. Do not estimate work against a deferred decision.

## EPIC-9: Graph-Database Visualization (Phase 3)

| Story | Points | Tag | Acceptance Criteria |
|---|---|---|---|
| 9.1 Research spike: graph rendering library options | 5 | Post-MVD | Replaces the static causal-map card (4.3) eventually — explicitly out of MVD scope. |

---

## MVD Critical Path (for a scheduling view, not a new list)

Stories 1.1 → 1.4 → 2.1 → 2.2 → 2.4 → 3.1 → 3.2 → 3.3 → 4.1, in that dependency order, is the shortest real path to "open a vault, see one real evidence-backed card, inspect it." That's 3+8+3+5+3+2+3+5+5 = **37 points** of critical-path work. Everything else in this backlog can happen before or after that path without blocking the demo.
