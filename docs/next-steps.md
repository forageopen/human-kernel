# Human Kernel — Next Steps: Documents & Tasks

**Answer to the standing question:** yes, the project brief alone is not enough to hand a dev team. A brief states intent; it doesn't make anything buildable, testable, or licensable on its own. Below is what closes that gap, in priority order.

**Updated 2026-08-02:** OQ-1–OQ-5 are now resolved (Brief v2 §13). Items below are re-marked as unblocked, newly critical, or still gated — see the "Priority" and "Depends On" columns.

| # | Document / Task | Purpose | Priority | Depends On |
|---|---|---|---|---|
| 1 | **Human Kernel Specification v0.1** | **Done** — `human-kernel-specification-v0.1.md`. Approved (Founder); Researcher/engineering confirmation recommended per section, not blocking. | Done | — |
| 2 | **Architecture Decision Records (ADRs)** — one each for OQ-1 through OQ-5, plus Tension C and Tension D | **Done.** All 5 ADRs written and Approved (Founder); Tensions C/D resolved in Spec v0.1 §7 and the simulated walkthrough. Remaining task is getting a real Senior Programmer to confirm OQ-1/OQ-3/Tension C once one is engaged — not writing anything further. | Done (confirmation pending) | — |
| 3 | **JSON Schema files** for Evidence / Parameter / Relationship objects | **Done** — `human-kernel-schema-{evidence,parameter,relationship,index}.json` written, all four validate cleanly (draft 2020-12). | Done | — |
| 4 | **UX wireframes or clickable prototype**, distinct from the Draft-5 static HTML | **Done** — `human-kernel-wireframes-data-states.html`, 5 data states, opens directly in a Chromium browser. | Done | — |
| 5 | **Agile backlog** — Epics from Brief v2 §6 broken into sprint-sized stories with estimates | **Done** — `human-kernel-agile-backlog.md`, MVD critical path flagged (9 stories, 37 points). Re-estimate once real developers are engaged; these are first-pass estimates. | Done | — |
| 6 | **Definition of Ready / Definition of Done checklist** | **Done** — `human-kernel-definition-of-ready-done.md`. | Done | — |
| 7 | **Data privacy & handling policy** | **Done as a draft** — `human-kernel-privacy-policy.md`. Mandatory given OQ-4 (courseware). **This is the one item founder approval cannot close** — needs real legal/compliance review before any course cohort. | Done (draft) — legal review still required | — |
| 8 | **Licensing & contribution guide** | **Done** — `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`. | Done | — |
| 9 | **Risk register** | **Done** — `human-kernel-risk-register.md`, 9 risks tracked, statuses updated post-approval. Living document — keep updating at every sprint retro. | Done (living) | — |
| 10 | **Test / validation plan** | **Done** — `human-kernel-test-validation-plan.md`, centered on the "no Parameter without Evidence" invariant. | Done | — |
| 11 | **Reference material dossier** | **Done as a shell** — `human-kernel-reference-material-dossier.md`. Exclusion policy Approved (Founder); the five files themselves remain genuinely unreviewed — that part stays open until Adam supplies them. | Done (shell) — files still unreviewed | — |
| 12 | **Sprint 0 kickoff agenda** | Reframed again: a simulated walkthrough has now filled in every row of the Decision Log, and Adam has approved all of it. Once a real Senior Programmer and Fullstack Developer are engaged, their job is to read `human-kernel-sprint-0-walkthrough-simulated.md` and the agenda together and confirm or correct — a review pass, not a from-scratch design session. | Critical (do this first, once engineers are engaged) | Brief v2 + walkthrough (done) |

**Recommended sequencing:** items 1–6, 8–11 in this table are now all done as first drafts (see `human-kernel-INDEX.md` for the full map). What's actually still outstanding: (a) get real people into the Senior Programmer / Fullstack Developer / Researcher roles, (b) have them confirm items 2 and 12 above, (c) route item 7 (privacy policy) to real legal review — that one was never simulatable and still isn't.
