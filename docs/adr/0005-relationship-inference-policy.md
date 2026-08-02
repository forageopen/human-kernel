# ADR-0005: Relationship & Pattern Inference Policy

**Status:** Accepted
**Date:** 2026-08-02

## Context

Phase 2 (EPIC-5, Brief v2 §6) introduces relationships between Parameters (causal, correlated, contradicts, supports). These could be human-tagged only, or algorithmically suggested. The project's first non-negotiable principle is "extract or compile, never invent" (Brief v2 §10).

## Decision

Relationships and patterns are human-tagged only in v1. No automatic or algorithmic inference of any kind.

## Rationale

Automatic relationship inference is exactly the kind of unfalsifiable, "trust the model" behavior this project was built to be the alternative to. A system that markets itself on evidence-linked transparency cannot also silently auto-generate the very links it claims are evidence-based.

## Consequences

- **Positive:** every `Relationship` object in the system is directly traceable to a specific user action — the strongest possible version of "every claim has a witness" (Brief v2 §10, principle 2).
- **Negative (accepted trade-off):** relationship-building is manual work for the user. No auto-suggested connections, even obviously plausible ones.
- **Binding on future work:** if AI-assisted relationship suggestions are ever introduced (post ADR-0002 reopening), they must require explicit confirm-before-write and must never autonomously modify the graph. This is a permanent constraint on that future feature, not a placeholder that goes away when ADR-0002 is revisited.
- **Enforcement mechanism:** Spec v0.1 §4 — a `[!relationship]` block with an unresolved `from`/`to` reference produces a compiler warning, not a fabricated relationship.
