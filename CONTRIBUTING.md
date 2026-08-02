# Contributing to Human Kernel

Human Kernel is MIT-licensed and forkable by design (Brief v2 §10, principle 3 — "open or not at all"). This document is how a contribution actually gets accepted, not just how to open a PR.

## Before You Write Code

Read, in this order: `human-kernel-project-brief-v2.md`, `human-kernel-specification-v0.1.md`, the ADRs in this repo. A PR that contradicts a standing ADR needs a new ADR proposing the change, not a silent override.

## The Three Gates Every PR Must Pass

These come directly from Brief v2 §10 and are not negotiable by convenience:

1. **Extract or compile, never invent.** If your change renders a claim, chart, or card, it must trace to a real `Evidence` object with a non-empty `evidenceIds` reference. PRs that hardcode or placeholder-fake evidence to "make the UI look right" will be rejected on sight.
2. **Every claim needs a witness.** `confidence` is a required field, not optional, anywhere a `Parameter` or `Relationship` is created.
3. **No automatic relationship inference.** Per OQ-5 (ADR-0005), `Relationship` objects are only created by explicit user action. If you're adding an AI-assisted suggestion feature, it must require confirm-before-write and must never auto-commit to the graph.

## Reporting Issues

- **Bug:** steps to reproduce, expected vs. actual, browser + version (remember: Chromium-only in v1, per ADR-0003 — note if you're testing outside that matrix).
- **Feature proposal:** state which Epic (Brief v2 §6) it belongs to, or propose a new one. If it touches AI/inference, read ADR-0002 first — you are proposing to reopen a deferred decision, not just add a feature.

## Pull Request Conventions

- Branch naming: `epic-<n>/<short-description>` (e.g. `epic-1/frontmatter-parser`).
- One logical change per PR. Schema changes (Evidence/Parameter/Relationship shape) go in their own PR, referencing the relevant ADR or proposing a new one.
- Tests required for anything touching the Parameter Compiler or Pattern Engine (Spec v0.1 §5) — this is the layer where "never invent" is either true or silently broken.

## Code Style

Formalized once the Definition of Ready/Done checklist (`human-kernel-next-steps.md` item 6) exists. Until then: match the TypeScript interfaces in Spec v0.1 §3 exactly — field names and types are not stylistic preferences, they're the contract the frontend and kernel both build against.

## Governance

Scope and roadmap decisions are PMO-owned; kernel architecture and data schema are Senior-Programmer-owned; frontend implementation is Fullstack-Developer-owned (Brief v2 §12 RACI). If your PR sits across these lines, tag the relevant owner rather than assuming sign-off.
