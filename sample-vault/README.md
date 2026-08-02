# Sample Vault — Reference Profile

This is a real vault: Adam Rosman's own self-documentation, used with his explicit
authorization as the public, open-source reference profile for Human Kernel
(2026-08-02: "i wanna use my profile as sample - treat my profile as open source
digital twin reference model for audience from now on").

It is not a synthetic demo. Every `[!evidence]` block below is compiled — with no
edits to the substance — from real notes in his personal vault
(`COMMANDER/About Me`). `dates` on each block are the real file modification
timestamps read from disk, not invented.

`sample-data/index.json` is generated *from these files* by
`scripts/build-sample-data.mjs`, running the exact same
`parseVaultFile -> compile -> serialize` pipeline a visitor's own vault goes
through (`src/dashboard/app.ts`'s `loadSampleIndex`). Nothing in the sample
dashboard is hand-written JSON.

## What's deliberately excluded, and why

Before touching this vault, Adam commissioned an open-source readiness audit
(`OPEN_SOURCE_AUDIT.md`, 31 March 2026, 18 files reviewed). Its verdict: the
*architecture* (layered self-documentation as digital-twin input) is publishable;
specific *data* is not, without redaction. This sample vault follows that audit's
own Readiness Gate:

- **Excluded outright (audit: HOLD/NOISE, highest risk or zero signal):**
  `1. Basic Information.md` (PII - DOB, blood type, exact birthplace), `4. Social
  & Relationships.md` and `Adam Mum's Profile.md` (named third parties who never
  consented to publication), `11. Medical History & Health Condition.md`
  (specific diagnoses, psychiatric framing) — the audit calls this the
  single highest-risk file in the vault — plus the redundant/placeholder files
  it flagged as noise (`7. Hobbies & Passions.md`, `9. Emotional Well-being.md`,
  `Strength.md`, `Opportunity.md`, `Personal branding opportunity.md`).
- **Excluded from `2. Personality & Mindset.md`:** section 2.13 (Political &
  Social Views) — the audit flags this as carrying "disproportionate
  reputational risk" and no architectural value for the digital-twin demo.
  Excluded in full, not softened.
- **Corrected, not copied:** the source file lists Ni-Fe-Ti-Se as the INFP
  cognitive-function stack. That's the canonical INFJ stack, not INFP (INFP is
  Fi-Ne-Si-Te) — a real error the audit caught. Rather than publish a wrong
  claim under a "never invent" project, the compiled Evidence below states the
  self-identified MBTI/Enneagram types only, without asserting a specific
  function-stack ordering.
- **Trimmed:** the marriage/family speculation line in `10. Legacy & Life
  Philosophy.md` (audit: "not philosophically significant, will distract
  readers from the methodology").

What's kept is the audit's own "Ready" and "Conditional-with-changes-applied"
tier: personality/cognitive self-model, thinking style, emotional triggers,
blindspots, faith practice (kept attributed to his real name per his own
subsequent instruction — the audit flagged this as a decision only he could
make, and "use my profile, real name, from now on" is that decision), values,
and life philosophy.

**One live judgment call, flagged rather than made silently:** the Spirituality
file carries audit-flagged "Privacy — MEDIUM" risk specifically because it's
attached to a real, named identity. It's included here because Adam's own
"use my profile... from now on" instruction reads as choosing attributed
transparency over anonymization project-wide — but that specific file is the
one place the audit asked for an explicit sign-off, so: Adam, if you want
`spirituality.md` pulled or re-anonymized, say so and it comes out.

## Known real limitation: the heatmap will look bursty, not evenly spread

The real file-modification dates cluster on one evening (2025-06-22, six
files within ~40 minutes — a single documentation sprint) plus two outliers
(`Position.md` 2026-05-15, `Thinking.md` 2026-07-04). The dashboard's overview
defaults to whichever month has the most real Evidence, so it will show one
dense day and near-silence around it. That's the real pattern in the data —
a documentation burst, not a daily habit — and it's left as-is rather than
inventing a smoother-looking month, per this project's one non-negotiable
rule (Brief v2 §10: no claim without linked Evidence).
