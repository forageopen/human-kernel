# Mockup Reconciliation - 2026-08-02

Three static HTML mockups were uploaded and reviewed against the shipped app before this rebuild: `index.html` (a link hub), `human-kernel-war-room.html` (a personal dashboard), and `human-kernel-benchmark-console.html` (a taxonomy browser). All three are labeled "Human Kernel v2.0" against a "FORAGE Six Domains v2.1" domain model. This note records what each one is, what's already been absorbed into the real app, what's worth keeping as future backlog, and what's being deliberately left out - so none of it gets silently lost, and none of it gets half-built twice.

The single biggest difference between the mockups and the shipped app: the mockups are fixture data hand-written into a `<script>` block (`evidenceData = {...}`), not wired to any real pipeline. The shipped app compiles from real parsed notes (`vault-reader -> evidence-parser -> compiler -> store`). Every mockup idea below is judged against that constraint - if it needs data that doesn't exist yet, it's future backlog, not a gap in this rebuild.

## What each mockup is

`index.html` is a two-card link hub ("War Room" / "Kernel Console") with a tagline, "A mirror, not a scorecard." Nothing in it beyond navigation and framing copy.

`human-kernel-war-room.html` is the closest analog to the shipped dashboard: an Immersive/Inspect mode toggle, a Basic Information card (initial-letter avatar, bio, self-reported MBTI/Enneagram), a SWOT Condition Map (progress-bar quadrants), a DISC Pattern card (explicitly empty - "No DISC instrument ingested"), a Causal Condition Map (Environment -> Condition -> Pattern -> Outcome, four clickable stages), a Life Trajectory timeline (four milestone dots), and a resizable-in-spirit (fixed 420px, not actually draggable) evidence drawer with a close control.

`human-kernel-benchmark-console.html` is a taxonomy reference browser, not a personal profile: an accordion over six domains (Reality / Human / Civilization / Strategy / Adaptation / Legacy - the same six codes the shipped schema already uses for `Domain`), each expanding into tabbed concept groups, described as "97 compiled concepts, four levels deep" in the link hub's own copy. It also carries illustrative-only stats ("Evidence Records: 1,248", "Traceability: 94%") explicitly marked `(illustrative)` in the markup itself.

## Already absorbed or superseded

- **Evidence drawer, resizable + movable + closable.** The mockups' drawer is fixed-size and click-to-open only. The rebuilt drawer (`src/dashboard/render.ts` + `draggable.ts`) is genuinely resizable (native `resize:both`), genuinely draggable, and opens on a real heatmap day instead of a hardcoded key into a fixture object.
- **Immersive/Inspect mode gating evidence behind a toggle.** The war room mockup locks the drawer behind an "INSPECT" mode ("Evidence access is disabled in Immersive Mode"). This exact pattern was already built into the real app once (2026-08-02, EPIC-3.1) and removed the same day after live verification showed the scroll-lock was broken and the gating added friction with no real benefit - see `CHANGELOG.md`'s "Removed" section. Not resurrecting it here; the mockup predates that decision, not the other way around.
- **Avatar.** Mockup uses a static initial-letter circle. The shipped avatar (`src/dashboard/avatar.ts`) is a generative 8-bit-style pixel portrait with regenerate-on-click, per direct request - a strict upgrade, nothing to reconcile.
- **Six-domain taxonomy.** The benchmark console's six domain codes (REA/HUM/CIV/STR/ADA/LEG) already match `src/types.ts`'s `Domain` union one-for-one. Good confirmation the schema and this older prototype agree at the data-model level, even though naming/versioning below didn't carry over.

## Worth keeping as future backlog (not built now, and shouldn't be guessed at)

Every one of these needs real ingested evidence before it can compile honestly - Principle 1 ("extract or compile, never invent - no claim without linked Evidence") blocks building any of them today. The mockup itself already agrees: SWOT's Weakness/Threat quadrants and the entire DISC card render as empty/"AWAITING WITNESS" in the mockup, not filled with invented content. That's the right instinct, just not something to fabricate a "shipped version" of yet.

- SWOT Condition Map (Strength/Opportunity have mockup content; Weakness/Threat are correctly empty)
- DISC Pattern card (correctly empty in the mockup - no instrument ingested)
- Causal Condition Map (Environment -> Condition -> Pattern -> Outcome as a four-stage clickable flow)
- Life Trajectory timeline (milestone dots on a horizontal axis)
- The full Six Domains taxonomy browser (97 concepts, four accordion levels) - this is a reference/browse experience for the domain model itself, distinct from "a single compiled profile," and is a separate epic-sized feature, not a card to slot into the current rebuild.

## Left out on purpose

- The "v2.0" / "FORAGE Six Domains v2.1" / "supersedes the retired Four Horses framework" version-tagging language. The shipped app doesn't carry any version number in its own UI copy, and nothing in this session's brief asked for that tagging to be adopted. Flagging this as an open naming question rather than guessing: if there's a real versioned domain-model document behind "v2.1" / "Four Horses," it hasn't been supplied here either (same situation as the missing Adaptive Daily OS doc below) - point us at it and both can get reconciled together.
- Illustrative-only numbers presented as if real ("Evidence Records: 1,248", "Traceability: 94%"). The mockup itself flags these `(illustrative)` in the markup; the shipped app doesn't carry placeholder statistics forward at all, real or fake - see the public-ready copy pass, same date.

## Still missing, unrelated to these 3 files

None of the three mockups contain anything resembling a six-window daily model, prayer times, or a notepad - confirming (again) that `Adaptive-Daily-OS-Three-Layer-Model.md`, referenced but never actually delivered this session, is genuinely a different, separate document. The Time Window / Best Time For cards just built are explicitly flagged in the UI as illustrative placeholders pending that file - see `src/dashboard/time-window.ts`'s file header.
