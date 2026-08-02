# ADR-0002: AI Inference Deferral

**Status:** Accepted
**Date:** 2026-08-02

## Context

The original kernel scope included an "AI context builder" / reflection layer (Brief v2 §7 kernel pipeline; EPIC-8). Building this requires choosing between fully local inference (WebLLM / transformers.js — multi-gigabyte model download, weaker output quality) and a hosted API call (which breaks the local-first / no-cloud-dependency promise). This conflict was tracked as Tension A.

## Decision

Defer AI-powered reflection entirely to a later major version. V1 ships with zero AI inference of any kind.

## Rationale

V1's job is proving the knowledge system works — real parsing, real evidence linkage, real dashboard — not proving an AI reasoning layer works on top of an unproven foundation. Deferring keeps the core product free to use, removes an entire class of architectural complexity and cost, and avoids taking on a dependency (local model weights or a hosted API bill) before it's needed.

## Consequences

- **Positive:** v1 scope shrinks meaningfully. No inference cost, no model download, no API key management, no user-facing AI consent flow needed yet.
- **Negative (accepted trade-off):** Phase 3 (EPIC-8) has zero committed technical approach. This is fine only as long as nobody puts an AI feature on a roadmap slide before this ADR is formally superseded.
- **Reopens when:** anyone proposes an AI-powered feature. At that point, Tension A (local vs. cloud inference) returns exactly as it was — this ADR does not pre-answer it, it just postpones the question.
