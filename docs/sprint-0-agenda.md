# Human Kernel — Sprint 0 Kickoff Agenda

**Duration:** 90 minutes (recommend blocking 2 hours — technical disagreement on OQ-1/OQ-3 will run long if it runs at all, better to have the room than cut it off)
**Attendees:** Adam Rosman (PMO/Founder), Senior Programmer, Fullstack Developer. Researcher optional but recommended for the domain-definitions discussion (Spec v0.1, §1).
**Pre-reads (send 48h ahead, not day-of):** `human-kernel-project-brief-v2.md`, `human-kernel-next-steps.md`, `human-kernel-specification-v0.1.md`, all 5 ADRs.
**Purpose:** this is not a brainstorm. Five product/architecture decisions already exist (Brief v2 §13). This meeting's job is to get engineering to explicitly confirm or push back on the two that are technically theirs (OQ-1, OQ-3), and to close the two things nobody has decided yet (Tensions C and D). Nothing here should end the meeting still vague.

---

## Agenda

**1. Context framing — 5 min**
What Human Kernel is, why it's a courseware artifact (OQ-4) not a product race, what "never invent" actually constrains for engineering (Brief v2 §10).

**2. OQ-1 sign-off: flat JSON files — 20 min**
Founder's rationale is in Brief v2 §13; already Approved (Founder), simulated — see the walkthrough doc. Question for the room: does a real Senior Programmer object on technical grounds? If yes, capture the objection and the alternative (IndexedDB / OPFS+SQLite-WASM) with a concrete reason, not a preference, and this ADR gets superseded. If no objection, ADR-0001 drops the "simulated" qualifier entirely.
*Also confirm here:* the file-layout proposal in Spec v0.1 §4 (single `index.json` per vault) — same sign-off treatment.

**3. OQ-3 sign-off: Chromium-only v1 — 15 min**
Same treatment as #2. Specifically raise: does this conflict with what devices Forage course participants will actually use? If cohort devices are unknown, that's an action item, not a blocker.

**4. Tension C: kernel module boundaries — 20 min**
"Local-first × Intelligence Kernel" is a philosophy, not a module list. Leave this meeting with an actual boundary sketch: what is the File Watcher module, what is the Parameter Compiler module, where does one stop and the other start, who owns which repo folder. This is the one item on this agenda with no prior draft to react to — expect it to take the full 20 minutes.

**5. Tension D: reference material handling — 10 min**
Five files were referenced in the conversation that produced this project and never reviewed (Brief v2 §11, MOM §6). Decide right now: does anyone actually read them before Spec v0.1 is finalized, or are they formally excluded and noted as such? Don't let this stay ambiguous past this meeting.

**6. Assign owners: remaining next-steps backlog — 15 min**
From `human-kernel-next-steps.md`: JSON Schema files (3), UX wireframes (4), Agile backlog (5), DoR/DoD checklist (6), Test/validation plan (10). Each needs a named owner and a rough date, not "we'll get to it."

**7. Confirm Sprint 1 start date — 5 min**

---

## Decision Log

**⚠ SIMULATED, then APPROVED (Founder — Adam Rosman, 2026-08-02).** This meeting has still not actually happened — no real Senior Programmer or Fullstack Developer has been in a room for this. The rows below were filled in as a best-practice projection, then explicitly approved by Adam to unblock forward motion rather than leave the project waiting on a meeting that isn't scheduled yet. Full detail on the reasoning, and the specific challenges each item would draw from a real reviewer, is in `human-kernel-sprint-0-walkthrough-simulated.md` — read that alongside this table, not instead of it. Approved and operative now; real engineering confirmation remains recommended at the specific points the walkthrough names, and is no longer a blocker for Sprint 1.

| # | Item | Outcome (simulated) | Owner | Notes |
|---|---|---|---|---|
| 1 | OQ-1 (storage engine) | Flat JSON files accepted as workable for v1 scale (courseware cohort: expected dozens–low hundreds of notes per participant vault). Debounce + atomic-write + deterministic-sort mitigations (Spec §2) treated as hard requirements, not optional. | Senior Programmer (to confirm for real) | Approved (Founder). Revisit only if a real cohort reports measured load-time problems — not before. ADR-0001 drops its "simulated" qualifier once a real Senior Programmer has actually reviewed this row. |
| 2 | Spec v0.1 file layout | Single `.human-kernel/index.json` per vault, confirmed alongside OQ-1. | Senior Programmer | Same caveat as row 1 — simulated, not signed. |
| 3 | OQ-3 (browser support) | Chromium-only accepted as the default for v1, plus a required explicit unsupported-browser message (added at walkthrough). | Senior Programmer (technical) / Adam (course logistics) | Approved (Founder). Assumption, not fact: this projection assumes Forage's delivery environment is a controlled/lab setting that can standardize on Chrome-family browsers. That assumption is unverified — Adam should confirm actual cohort device policy before Sprint 1, not after. ADR-0003 drops its "simulated" qualifier once a real Senior Programmer has actually reviewed this row. |
| 4 | Tension C (module boundaries) | Proposed 5-module split: `vault-reader` (file watcher + File System Access API, only module touching disk) → `evidence-parser` (parses `[!evidence]`/`[!relationship]` callouts, Spec §4) → `compiler` (Parameter Compiler, confidence aggregation, Pattern Engine passthrough, Relationship Compiler, Spec §5) → `store` (only module touching `index.json`, owns deterministic serialization) → `dashboard` (UI; consumes `store`'s output only, never touches raw vault files or markdown directly). | Senior Programmer | This is Claude's proposed default, standing in for the real design discussion — package names are negotiable, but the boundary rule ("only `vault-reader` touches disk, only `store` touches the index file, `dashboard` touches neither") is the part worth preserving even if the real meeting restructures everything else. Confirm or replace at the actual Sprint 0. |
| 5 | Tension D (reference materials) | Formally excluded from Spec v0.1 authority for now. None of the five files (mentor's "6 Domains" doc, BIM Intent Compiler, Fold Engine Benchmark Suite, Claude interview transcript, Open Source Audit) were ever supplied to any session that produced Spec v0.1 — its domain definitions (§1) were built independently of them, per the standing "don't reconstruct from him" instruction. | Adam (supply files if/when relevant) / Researcher (diff against Spec §1 if supplied) | This is the one row that is a genuinely real open item, not just an unconfirmed simulation — nobody, in any session, has actually read these five files yet. |
| 6 | Backlog item owners | JSON Schema files → Senior Programmer (data schema, per RACI). UX wireframes → Fullstack Developer (frontend, per RACI). Agile backlog → Adam drafts scope, Senior Programmer + Fullstack Developer estimate. DoR/DoD checklist → Senior Programmer drafts technical gates, Adam ratifies principle compliance. Test plan → Senior Programmer + Fullstack Developer jointly, split along the module boundaries from row 4. | See per-item above | All five artifacts were actually drafted in this same session as a first pass (see file list) — treat them as drafts for the two developers to react to and reassign, not finished specs to accept blindly. |
| 7 | Sprint 1 start date | Monday, 2026-08-10 — proposed on the assumption these artifacts get reviewed within the coming week. | Adam | Placeholder. Move it the moment a real Sprint 0 meeting is actually scheduled; don't let a simulated date quietly become a real commitment. |

**This log is now Approved and operative — Adam has explicitly said yes to it.** That's a different thing from "an actual Senior Programmer has said yes to it," and this document keeps that distinction on the record on purpose, not as a hedge. When a real Senior Programmer and Fullstack Developer are actually engaged, hand them this table plus the walkthrough document and ask them to confirm or correct it — that's a faster, better-informed real meeting than starting from a blank page, which is the entire point of having simulated it first.
