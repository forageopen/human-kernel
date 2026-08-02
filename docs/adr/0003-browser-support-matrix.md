# ADR-0003: Browser Support Matrix

**Status:** Approved (Founder — Adam Rosman, 2026-08-02, via simulated Sprint 0 walkthrough — see `human-kernel-sprint-0-walkthrough-simulated.md` §2). Real confirmation of course-cohort device policy remains recommended, not blocking.
**Date:** 2026-08-02

## Context

Human Kernel's "one browser, zero install" promise depends on the File System Access API for reading local vault files directly. Support is strong in Chromium-based browsers and partial-to-absent in Safari and Firefox (Tension B).

## Decision

V1 supports Chromium-based browsers only: Chrome, Edge, and Brave.

## Rationale

Restricting the support matrix minimizes development and cross-browser testing overhead, letting v1 iterate faster. Safari/Firefox support (likely via a drag-and-drop fallback rather than the File System Access API) is deferred to a future release rather than blocking v1 on solving cross-browser parity now.

## Consequences

- **Positive:** smaller test matrix, faster v1 iteration, no fallback-path code to build and maintain yet.
- **Negative (accepted trade-off):** excludes every Safari and Firefox user outright. This matters more than a typical browser-support trade-off because of ADR-0004 (courseware artifact) — if Forage course participants are on institution-issued or personal devices outside this matrix, they cannot use the tool at all.
- **Required mitigation (added at simulated walkthrough, now part of this decision):** feature-detect the File System Access API on load and show an explicit named message ("Human Kernel needs Chrome, Edge, or Brave — here's how to switch") rather than a silent failure or blank screen. New requirement, folded into EPIC-3 (`human-kernel-agile-backlog.md`).
- **Follow-up recommended, no longer blocking:** confirm actual course-cohort device policy before the first cohort runs.
