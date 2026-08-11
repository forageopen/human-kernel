---
doc_id: PRODUCT-PRINCIPLES
authority: governing-philosophy
retrieval_purpose: >
  Operating methodology and decision filters: ABIM (full), MVD (full),
  the three laws of the kernel, design concept, the operating principle,
  strategic notes, and the mission filter. This is the judgment layer,
  not the implementation layer.
consult_when: [product-boundary-judgment, build-no-build-call, scope-filter,
  re-induction-after-evidence, assumption-control]
skip_when: routine execution already inside an established MVD boundary —
  a frontend agent implementing a scoped ticket does not need this file
depends_on: []
related:
  - PRODUCT-SPEC.md    # concrete application of MVD to the kernel
  - PRODUCT-ROADMAP.md # phased application of the ABIM operating loop
  - PRODUCT-DECISIONS.md # assumption control / ADR mechanics referenced by ABIM Section 13, Section 15
source_files:
  - "ABIM — Agile Backward-Induction Project Management.md"
  - "MVD — Minimum Viable Delivery.md"
  - "Product spec for browser native app.md"
reconstructed: 2026-08-10
never_paraphrase: true
integrity: ABIM and MVD are reproduced in full, unmodified — neither model is stripped down or split across documents.
---

# PRODUCT-PRINCIPLES.md

## 1. ABIM — Agile Backward-Induction Project Management

**Version:** 0.2  
**Status:** Experimental operating methodology  
**Use:** Solo product, creative technology, software, knowledge systems, AI-assisted production

### 1. Core Principle

> **Think backward from the desired outcome. Build forward in small deliveries. Validate against reality. Re-induce from evidence.**

ABIM combines:

- Agile iteration
    
- Backward induction
    
- Design thinking
    
- MVD
    
- Resource reuse
    
- Lean experimentation
    
- Lightweight governance
    
- AI-agent orchestration
    

**Primary objective:** minimize unnecessary work while preserving delivery discipline.

### 2. Operating Loop

```text
PROBLEM
  ↓
OUTCOME
  ↓
BACKWARD INDUCTION
  ↓
CAPABILITY
  ↓
REQUIREMENT
  ↓
RESOURCE / PATTERN SEARCH
  ↓
MVD
  ↓
BUILD
  ↓
VALIDATE
  ↓
EVIDENCE
  ↓
RE-INDUCE
  ↓
NEXT MVD
```

The loop is non-linear. Evidence can invalidate earlier assumptions and send the project backward.

### 3. Outcome Before Feature

Do not start with:

> What feature should we build?

Start with:

> What should the user be able to see, understand, decide, or accomplish?

Preferred outcome test:

> **"After using this, the user can now see ____."**

Examples:

- Hidden relationships
    
- Duplicated work
    
- Organizational bottlenecks
    
- Conflicting evidence
    
- Missing documentation
    
- Approval chains
    
- Knowledge gaps
    
- Project dependencies
    

If a feature has no clear outcome, **defer, modify, or remove it**.

### 4. MVD

> Build the smallest complete delivery that produces the intended outcome.

MVD should have:

- Essential functionality
    
- Low delivery complexity
    
- Cohesive experience
    
- Fast usability
    

Do not optimize for feature count. Optimize for **visible outcome**.

### 5. Backward Induction

Work backward from outcome to implementation.

```text
OUTCOME
  ↑
USER BEHAVIOR
  ↑
EXPERIENCE
  ↑
CAPABILITY
  ↑
REQUIREMENT
  ↑
COMPONENT
  ↑
IMPLEMENTATION
```

At each level:

> **What must be true for the previous level to work?**

Do not assume a component or feature is necessary. Derive it from the desired outcome and observable user behavior.

### 6. Forward Execution

Once the MVD is defined:

```text
MVD → DESIGN → BUILD → INTEGRATE → TEST → RELEASE
```

**Backward induction determines what to build.**

**Forward execution determines how to build it.**

### 7. Resource Arbitrage

Before building, search for suitable existing solutions.

```text
REUSE → COMPOSE → ADAPT → BUILD
```

Search:

- Open-source software
    
- Libraries
    
- Models
    
- Datasets
    
- Standards
    
- Infrastructure
    
- UX patterns
    
- Documentation
    
- Existing project artifacts
    

Do not rebuild solved infrastructure without a reason.

### 8. Pattern Mining

Treat existing products as a pattern library.

```text
DESIRED EXPERIENCE
  ↓
EXISTING PRODUCTS
  ↓
PATTERN EXTRACTION
  ↓
COMPARISON
  ↓
RECOMBINATION
  ↓
NEW SOLUTION
```

Extract interaction, navigation, information architecture, visual hierarchy, data representation, feedback, and workflow patterns.

Innovation should focus on the actual problem or useful recombination, not novelty for its own sake.

### 9. Design Thinking

Use design thinking primarily for **problem framing and validation**.

Minimum sequence:

```text
OBSERVE → DEFINE → OUTCOME → PROTOTYPE → TEST
```

Use workshops when multiple perspectives materially improve the decision.

For solo work, use evidence gathering and structured reflection instead.

### 10. Agile

Agile provides the iteration and adaptation mechanism.

```text
PLAN → BUILD → TEST → RELEASE → LEARN → ADAPT
```

ABIM changes the planning unit from generic task completion to **outcome-driven MVD delivery**.

An iteration should produce useful capability or evidence.

### 11. Validation

```text
MVD → BUILD → TEST → REAL USE → OBSERVATION → EVIDENCE
```

**BUILT ≠ VALIDATED**

Evidence states:

- **VALIDATED** — intended outcome supported
    
- **PARTIALLY VALIDATED** — value exists but assumptions need adjustment
    
- **INVALIDATED** — intended outcome not produced
    
- **UNKNOWN** — insufficient evidence
    

### 12. Re-Induction

When evidence contradicts the current model, do not automatically add features.

Move backward:

```text
FEATURE
  ↑
CAPABILITY
  ↑
USER BEHAVIOR
  ↑
OUTCOME
```

Locate the failed assumption.

Possible actions:

**CONTINUE | MODIFY | REDUCE | REPLACE | DEFER | KILL**

### 13. Assumption Control

Important assumptions must remain explicit.

```text
UNKNOWN
  ↓
HYPOTHESIS
  ↓
TESTING
  ↓
VALIDATED / INVALIDATED
```

Never allow an assumption to silently become treated as fact.

### 14. Lightweight Governance

Track only information that materially affects execution:

- Scope
    
- Time
    
- Resources
    
- Risks
    
- Dependencies
    
- Decisions
    
- Quality
    
- Constraints
    
- Evidence
    

Administrative work must justify its existence through improved control, communication, or decision-making.

### 15. Agent Protocol

#### Before acting

1. Read project index.
    
2. Identify current outcome.
    
3. Identify current MVD.
    
4. Read relevant specifications.
    
5. Identify assumptions.
    
6. Search existing resources.
    
7. Confirm contribution to the current MVD.
    

#### During execution

1. Stay within MVD boundary.
    
2. Reuse before rebuilding.
    
3. Record consequential decisions.
    
4. Surface contradictions.
    
5. Separate facts from assumptions.
    
6. Do not silently expand scope.
    

#### Before completion

Verify:

- Essential functionality
    
- Cohesive experience
    
- Fast enough
    
- Acceptance criteria met
    
- No critical blockers
    
- Intended outcome visible
    

Then record:

- Delivered
    
- Worked
    
- Failed
    
- Unknown
    
- Next step
    

Return to backward induction.

### 16. Anti-Patterns

Detect and resist:

- Feature accumulation
    
- Scope drift
    
- Premature architecture
    
- Reinvention
    
- Ceremony without decision value
    
- False completion
    
- Founder confirmation bias
    
- Over-documentation
    
- Technology-first development
    

### 17. Master Decision Filter

```text
1. WHAT OUTCOME?
2. WHAT USER CHANGE?
3. WHAT MUST BE TRUE?
4. DOES THIS WORK CONTRIBUTE?
5. CAN WE REUSE SOMETHING?
6. WHAT IS THE SMALLEST COHERENT DELIVERY?
7. HOW WILL WE VALIDATE IT?
```

If the work cannot answer these, **pause and reassess before implementation**.

### 18. ABIM Operating Model

> **Reason backward.**
> 
> **Reuse existing solutions.**
> 
> **Deliver the smallest coherent useful increment.**
> 
> **Build forward.**
> 
> **Validate against reality.**
> 
> **Treat evidence as superior to assumption.**
> 
> **Re-induce when reality disagrees.**
> 
> **Repeat.**

```text
OUTCOME
→ BACKWARD INDUCTION
→ RESOURCE ARBITRAGE
→ MVD
→ BUILD
→ VALIDATE
→ EVIDENCE
→ RE-INDUCE
→ NEXT MVD
```

## 2. MVD — Minimum Viable Delivery

**Minimum Viable Delivery** is the smallest complete delivery that produces the intended user outcome.

### MVD Requirements

Every MVD should have:

- **Essential functionality** — only what is required for the core outcome.
    
- **Easy to complete** — low implementation complexity and short delivery cycle.
    
- **Cohesive design system** — consistent enough to feel like one system.
    
- **Fast load** — performance is part of viability.
    

### MVD Filter

Every feature must complete this sentence:

> **"After using this, the user can now see ____."**

The blank must describe a **concrete insight, relationship, state, or decision-relevant result**.

Examples:

- Hidden relationships
    
- Duplicated work
    
- Organizational bottlenecks
    
- Conflicting evidence
    
- Missing documentation
    
- Approval chains
    
- Knowledge gaps
    
- Project dependencies
    

If a feature cannot produce a meaningful answer to this sentence, **defer or remove it**.

### Knowledge Management Constraint

The primary problem is not simply **sorting information**.

The system should reduce the cognitive burden of handling **large chunks of information** and make meaningful structure visible.

Therefore:

> **Do not optimize for storing or sorting more knowledge. Optimize for making useful relationships and patterns visible.**

### Scope Rule

Build the smallest delivery that proves the core insight.

Do not add features merely because they are:

- Technically possible
    
- Aesthetically appealing
    
- Convenient
    
- Scalable
    
- Interesting
    
- Expected in a conventional knowledge-management product
    

**MVD = minimum functionality required to make the intended insight visible.**

## 3. The Three Laws of the Kernel

#### The three laws of the kernal

###### 1. Extract and compile, never hallucinate.
The system observes patterns, not creates identity.
The kernel does not create identity, meaning, or truth from nothing.
It observes, maps, and compiles existing patterns.

Every parameter must correspond to a recognizable pattern of human conditioning:
Biology, environment, culture, memory, behaviour, incentives, relationships, or experience.

No hidden assumptions.
No arbitrary labels.
No manufactured personality.

If a parameter cannot be traced to a human pattern, it does not belong in the system.


###### 2. Every transformation requires a witness. — **[KIV, not an applied rule yet — see ADR-007, `PRODUCT-DECISIONS.md` Section 11]**

~~"Talk is cheap. Every claim has a witness."~~
~~A claim without a reproducible witness is speculation.~~
~~Every transformation must have:~~
~~- Input~~
~~- Process~~
~~- Output~~
~~- Verification method~~

~~The kernel must allow inspection (traceability).~~

~~If changing a rule does not produce a measurable change, the rule is meaningless.~~

~~If the pattern cannot be reproduced, tallied, or challenged, it is not knowledge.~~

###### 3. The kernel must remain forkable.

MIT license.
Public specification.
Transparent architecture.

A tool that cannot be examined, modified, or inherited becomes an authority over the user.

The kernel exists to increase human sovereignty, not replace it.
In align with these three ideas
- Distributed knowledge systems
- Idea decentralization
- Self-replicating frameworks

## 4. Design Concept

#### Design Concept

1. ERP as Git
2. The "fold" is the kernel; the fold should be: 1. Deterministic, 2. Reproducible & 3. Inspectable ( if you run the same input twice, you should get the same output.)
3. Measure by benchmark (The system avoids "Trust me, this architecture is better.", therefore instead: "Here is the benchmark. Here is the executable comparison. Run it.")
4. Ownership principle; Open specification + Forkable implementation + Local ownership (the MIT/open source rule is not just licensing.)

## 5. The Operating Principle

## The operating principle

I would write one sentence and use it to reject or accept every feature.

> **Does this help the user see something they could not easily see before?**

Examples.

OCR?

Yes.

It exposes information.

Search?

Yes.

It finds hidden evidence.

Knowledge graph?

Yes.

Relationships become visible.

Timeline?

Yes.

Sequence becomes visible.

Chatbot?

Maybe.

Only if it increases visibility.

Fancy AI agent?

Maybe not.

If it merely automates without increasing understanding, it doesn't fit the mission.

## 6. Strategic Notes

###### Note: Opportunity
I think the next concept worth studying is the browser itself. Once you understand that the browser is effectively a sandboxed operating system with its own storage, networking, graphics, and computation, you'll understand why surprisingly sophisticated applications like code editors, note-taking apps, diagramming tools, and even lightweight IDEs can live entirely on GitHub Pages. 

Note: What replace server database?
IndexedDB, LocalStorage, & Cache

Focus on **information presentation** rather than data storage.

###### Note: Benefit

Benefit
This prevents the biggest danger of digital twins: **confident hallucination disguised as self-knowledge.**

The kernel does not measure whether a person has become ideal. It reveals the conditions that produced the person, so they can reclaim authorship over what continues.

Narrow audience with painful problems.

## 7. Mission Filter (Evidence Vault)

> Applied to: `PRODUCT-SPEC.md` Section Layer 1: Evidence Vault.

The important thing:

Do not build "a knowledge management platform."

Build a **single moment of magic**:

"I gave it chaos. It gave me a map."

That is enough to prove the category.
