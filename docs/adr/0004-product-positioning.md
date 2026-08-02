# ADR-0004: Product Positioning

**Status:** Accepted
**Date:** 2026-08-02

## Context

Human Kernel could plausibly be built as (a) a Forage courseware/teaching artifact used inside the Digital Human Modeling module, or (b) a standalone single-user product. This was never decided in any prior document (Brief v2 §4) despite changing privacy posture, licensing motivation, and what "done" means for v1.

## Decision

V1 is a **courseware artifact** — built primarily to teach and demonstrate the Digital Human Modeling methodology inside Forage's program. Productization is deferred until the framework and learning experience are validated through course use.

## Rationale

Validating the pedagogy and the framework with a real cohort is more valuable right now than optimizing for a product launch nobody has validated demand for yet.

## Consequences

- **Positive:** clearer scope (v1 needs to work for a course exercise, not for arbitrary public users), a natural first user group (Forage cohort) to gather real feedback from.
- **Negative / direct downstream requirement:** course participants' data will pass through this tool, which makes a data privacy & handling policy mandatory rather than optional (`human-kernel-privacy-policy.md`, drafted as a direct consequence of this ADR).
- **Also constrains:** ADR-0003's browser matrix should be checked against actual course-device assumptions, not decided independently of this one.
