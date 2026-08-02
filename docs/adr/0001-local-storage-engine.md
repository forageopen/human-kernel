# ADR-0001: Local Storage Engine

**Status:** Approved (Founder — Adam Rosman, 2026-08-02, via simulated Sprint 0 walkthrough — see `human-kernel-sprint-0-walkthrough-simulated.md` §1). Real engineering confirmation against actual vault-size data remains recommended, not blocking.
**Date:** 2026-08-02

## Context

Human Kernel is a browser-native, serverless, GitHub-Pages-hosted application (Brief v2 §7). It needs a local persistence mechanism for derived `Evidence`/`Parameter`/`Relationship` objects (Spec v0.1 §3). Candidates considered: IndexedDB, OPFS + SQLite-WASM, and flat JSON files.

## Decision

Use flat JSON files, stored as a single `.human-kernel/index.json` per vault (Spec v0.1 §2).

## Rationale

Simple, transparent, portable, human-inspectable without special tooling, and consistent with the project's ownership-first philosophy (Brief v2 §7 governing principle: the kernel interprets data, it does not own it). More capable engines add complexity this project doesn't need at v1 scale.

## Consequences

- **Positive:** any user can open the index file in a text editor and understand exactly what the kernel has derived. Trivially portable — copying a folder copies the entire kernel state.
- **Negative (accepted trade-off):** flat JSON does not scale gracefully past some vault size nobody has measured yet. No indexed queries — every read means loading and scanning the whole file in memory.
- **Required mitigations (added at simulated walkthrough, now part of this decision, not optional extras):** (1) debounce re-parsing to file save / idle timeout, never on every keystroke; (2) atomic write — write to a temp file, then rename over the existing index, so a mid-write crash can't leave a corrupted file.
- **Follow-up recommended, no longer blocking:** confirm against real vault sizes once Sprint 1 has working code. If it isn't workable, this ADR gets superseded, not quietly ignored.
