---
name: content-planning
description: Use when a routed content-team task has an evidence pack and needs LLM-owned thesis selection, article angle, audience framing, outline planning, claim-to-section mapping, title candidates, or outline_review preparation. This subskill writes 02-outline.md and 03-review-checklist.md.
---

# Content Planning

Turn research evidence into a reviewable writing plan.

## Boundary

`opc-router` owns the `outline_review` gate. This skill prepares the materials for that gate.

Do not draft body prose before `outline_review` is approved.

## Inputs

Read:

- `task.json`
- `01-evidence-pack.md`
- existing planning notes, if any

## Workflow

1. Identify the strongest thesis that is actually supported by the evidence.
2. Define reader problem, promise, angle, and non-goals.
3. Choose article mode: technical explainer, implementation plan, product analysis, tutorial, review, or synthesis.
4. Map each core claim to a section.
5. Surface missing evidence, weak claims, and counterpoints.
6. Write `02-outline.md` and `03-review-checklist.md`.

## Output Contract

`02-outline.md` includes:

- title candidates
- target reader
- thesis
- article mode
- section-by-section outline
- claim-to-section map
- source refs per section
- gaps and decisions needed before drafting

`03-review-checklist.md` includes:

- claim traceability checks
- structure checks
- reader-fit checks
- factual risk checks
- publish-readiness blockers

## Quality Bar

- The outline must not be a list of wiki excerpts.
- Each section needs a reason to exist.
- If evidence is thin, recommend more research instead of forcing an outline.

## Handoff

When `outline_review` is approved by `opc-router`, hand off to `content-drafting`.
