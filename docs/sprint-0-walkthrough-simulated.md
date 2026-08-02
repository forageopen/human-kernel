# Human Kernel — Simulated Sprint 0 Walkthrough (Pre-Mortem)

**What this is:** a pre-mortem — a standard practice of role-playing the likely objections of the people who aren't in the room yet, so gaps get caught on paper instead of in a real meeting. No Senior Programmer or Fullstack Developer has been hired/engaged as of this document. This simulates their most probable pushback on each open item, based on normal engineering practice, so Adam isn't walking into the real Sprint 0 blind — and so this project has a paper trail of actual reasoning behind it instead of just a stated conclusion.

**What this is not:** a transcript of a real meeting, and not a substitute for one. Do not hand this to an actual hired Senior Programmer as "notes from our last sync" — that would misrepresent a simulation as a real event to a real collaborator, which is a different and worse problem than an unresolved open question. Present it to them as what it is: "here's the thinking so far, tell us where it's wrong."

**Disposition:** per Adam's direct instruction (2026-08-02), every item below is now **Approved (Founder)** — operative for planning and Sprint 1 scheduling purposes. The distinction preserved throughout is *who* approved it and *how*, not whether it's approved. Real engineering/research review remains recommended, at the points noted, but is no longer blocking.

---

## 1. OQ-1 — Local Storage Engine (flat JSON)

**Thought process:** the honest reason flat JSON was attractive is simplicity and inspectability, not performance. A competent Senior Programmer's first move would be to ask for the actual numbers: how many notes per vault, how often does re-parse trigger, how large does `observation` text typically run.

**Challenge a real reviewer would raise:** "What happens on every keystroke if you're re-parsing and rewriting the whole index file? And what if the browser tab closes mid-write — do you get a corrupted, half-written JSON file?"

**Resolution:** two concrete mitigations, added here so they're not lost before Sprint 1:
- **Debounce, don't re-parse on every keystroke.** Re-parse on file save / a short idle timeout, not on every character typed.
- **Atomic write pattern.** Write the new index to a temp file, then rename over the old one. A rename is effectively instant and can't leave a half-written file behind — standard practice for any flat-file storage that can't use a database's transaction guarantees.

**Status:** Approved (Founder, 2026-08-02). Both mitigations above are now part of the working spec — see Spec v0.1 addendum. Real-world vault size testing still recommended once Sprint 1 has working code, not before.

## 2. OQ-3 — Browser Support Matrix (Chromium-only)

**Thought process:** the real question isn't "is Chromium-only reasonable" (it is, for v1) — it's "what happens to the person who shows up on the unsupported 20%."

**Challenge a real reviewer would raise:** "Silently failing or showing a blank screen on Safari is worse than being Chromium-only in the first place. What's the actual fallback experience?"

**Resolution:** the app must feature-detect the File System Access API on load and show an explicit, named message — "Human Kernel needs Chrome, Edge, or Brave. [Browser detected] isn't supported yet — here's how to switch" — rather than a silent failure or a generic error. This is now a stated requirement, not an assumption the team will remember to add later.

**Status:** Approved (Founder, 2026-08-02). Explicit unsupported-browser messaging is a new, named requirement (fold into EPIC-3 in the backlog before Sprint 1 planning). Confirming actual Forage cohort device policy remains recommended, not blocking.

## 3. Tension C — Kernel Module Boundaries

**Thought process:** the proposed 5-module split (`vault-reader` → `evidence-parser` → `compiler` → `store` → `dashboard`) answers "who owns what" for a static parse. It doesn't answer what happens on the second parse.

**Challenge a real reviewer would raise:** "When one file changes, do you re-parse the entire vault from scratch, or just the affected Parameters? If it's full re-parse every time, say so explicitly — don't let 'incremental' quietly become an assumption nobody tested."

**Resolution:** full re-parse of the entire vault on every change, for v1. Explicitly not incremental. This is a reasonable simplification at the vault sizes R1 already accepts (dozens to low hundreds of notes) and keeps the compiler stateless and easy to test (Test Plan already leans on this: re-parsing an unchanged vault must reproduce a byte-identical file). Incremental recomputation is a named future optimization, not a silent gap.

**Status:** Approved (Founder, 2026-08-02). Module boundaries and the full-re-parse-per-change model are both now the working architecture. Flag "incremental recompilation" in the backlog as an explicit Post-MVD item so it isn't forgotten (added to `human-kernel-agile-backlog.md` as a note under EPIC-1).

## 4. Tension D — Reference Material Handling

**Thought process:** the standing instruction ("don't reconstruct from him") is about not treating the mentor's dashboard as a source of taxonomy. It says nothing about whether there's anything genuinely useful in the other four files that's being thrown away by ignoring them entirely.

**Challenge a real reviewer (or a skeptical Adam, reviewing his own call) would raise:** "Are we excluding these because they're actually irrelevant, or just because nobody's had time to look?"

**Resolution:** the honest answer is the second one — nobody has looked, full stop. Excluding them from Spec v0.1's *authority* (domain taxonomy, parameter definitions) is still correct regardless — that's a sourcing-discipline call, not a quality call, and it stands on its own logic even before anyone reads the files. But it's worth separating two different actions being bundled together: (a) never treat them as a schema/taxonomy source without review — permanent, and (b) never read them at all for general inspiration — not actually required by the standing instruction, and worth revisiting once there's spare time.

**Status:** Approved (Founder, 2026-08-02) on action (a) — permanent exclusion from Spec authority without review, no change. Action (b) — a low-priority, non-binding read-through by Adam, whenever convenient — added to `human-kernel-reference-material-dossier.md` as an optional note, not a task with a deadline.

## 5. Domain Ontology (Spec v0.1 §1)

**Thought process:** the six domains were defined for the first time in Spec v0.1, with no existing framework to check them against (Tension D again — the mentor's document that might contain a competing taxonomy is unread). The real risk isn't that the definitions are "wrong" in some absolute sense — it's that content gets authored against them before anyone with framework expertise (Researcher role, per RACI) has stress-tested them.

**Challenge a real reviewer would raise:** "Reality" and "Civilization" have real conceptual overlap — is a company's internal culture "Reality" (external condition) or "Civilization" (institutional context)? If two people tag the same observation differently, the data gets inconsistent in a way no compiler rule catches.

**Resolution:** add one disambiguating rule rather than relitigating the whole taxonomy: **Reality is what constrains a specific person without their consent or ongoing participation (a market, a law, a physical location); Civilization is what shapes them through participation in a group they belong to (an employer's culture, a family, a professional community).** A company's culture, in this framing, is Civilization; a company's market conditions are Reality. This distinction goes in Spec v0.1 as an addendum, not a rewrite.

**Status:** Approved (Founder, 2026-08-02), with the Reality/Civilization disambiguation folded in. Full Researcher validation of the six-domain framework remains recommended before content authoring scales up (per R9 in the risk register), but no longer blocks Sprint 1 or MVD.

---

## What This Simulation Cannot Actually Do

It cannot know Forage's real cohort device data (item 2), it cannot know whether the five unreviewed files (item 4) contain something that would genuinely change the architecture, and it cannot replace a real programmer's judgment on whether the storage/module decisions hold up against constraints only visible once actual code exists. Treat every "Approved" above as Adam's call to proceed, recorded honestly as Adam's call — not as evidence that the questions themselves have stopped being worth asking later.
