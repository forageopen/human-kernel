# Human Kernel — Data Privacy & Handling Policy (Draft v0.1)

**This is a working draft, not legal advice.** Have Forage's legal/compliance function, or outside counsel, review this before it is used with actual course participants — particularly against Malaysia's Personal Data Protection Act 2010 (PDPA) given Forage's Cyberjaya base, and against whatever jurisdiction any non-Malaysian cohort participants are processing data from. Everything below is a good-faith technical/operational description of what the product does, not a compliance certification.

## Why This Exists Now, Not Later

OQ-4 (Brief v2 §13) resolved Human Kernel v1 as a **courseware artifact**. That means course participants' data — SWOT/DISC observations, causal-map entries, timeline events — will pass through this tool during Forage's Digital Human Modeling module, not just Adam's own. That data is psychological/behavioral in nature, a more sensitive category than typical productivity-app data. A stated policy stops being optional at that point.

## What Data Exists

- The user's own Markdown notes (already on their device, pre-existing).
- Evidence, Parameter, and Relationship objects the kernel derives from those notes (Spec v0.1) — stored locally as flat JSON files (OQ-1), inside the user's own vault folder.
- Nothing else. No account, no user profile, no usage analytics, no crash telemetry in v1.

## Where It Lives

**Entirely on the participant's device.** Human Kernel v1 has no backend (Brief v2 §7) — there is no server for data to reach even if the product wanted to send it somewhere. The static application itself (HTML/JS/CSS) is served from GitHub Pages; GitHub Pages, as the host, may log standard web server access data (IP address, user agent, request timestamp) per GitHub's own hosting practices. That logging is GitHub's, not Human Kernel's — disclosed here because it's a real pass-through, not because the product controls it. No analytics script (e.g., no Google Analytics, no Plausible, nothing) is to be added in v1 without revisiting this policy first.

## What Human Kernel Never Does (v1)

- Never transmits vault content, Evidence objects, or dashboard data to any server.
- Never requires an account or login.
- Never shares data between participants — each vault is local and independent.
- Never infers or auto-generates relationships between concepts (OQ-5) — everything in the data model was explicitly written by the user.

## Course-Context Handling

If a course exercise asks participants to *discuss* their dashboard output with facilitators or peers, that sharing is voluntary, verbal or manual (e.g., screen-sharing a card they choose to show), and outside the product entirely — Human Kernel does not build in any submission or export-to-facilitator flow in v1. Facilitators running the exercise should read a short consent statement before participants generate any personal data, along the lines of: *"This tool stores everything locally on your own device. Nothing is transmitted anywhere. Sharing what you see with the group is entirely your choice."* Recommend this exact framing (or Forage's approved equivalent) gets reviewed alongside this document.

## Retention & Deletion

There is no Human-Kernel-side copy to delete, because none is ever created off-device. Retention and deletion are entirely in the participant's hands — clearing browser storage or deleting the vault folder removes everything. This should be stated to participants directly, since "how do I delete my data" is a question a courseware audience will reasonably ask.

## What Changes This Policy

Two triggers should force a revision before shipping the affected feature:

1. **OQ-2 (AI inference) is reopened.** The moment any hosted-API inference path is introduced, this document's core claim — "nothing leaves the device" — becomes false for that feature, and needs explicit, separate consent language, not a quiet edit to this file.
2. **Any sync, export, or multi-device feature is proposed.** Same reasoning — anything that moves data off a single device changes this policy's central claim.

## Open Item

This document has not been reviewed by anyone outside this session. Treat it as a first draft for Sprint 0, not a published policy — see `human-kernel-next-steps.md` item 7 and `human-kernel-risk-register.md` for tracking.
