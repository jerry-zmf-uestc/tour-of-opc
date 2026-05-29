---
name: content-drafting
description: Use when a routed content-team task has approved outline_review and needs LLM-owned article drafting, editing, final packaging, Obsidian Markdown preparation, source note preservation, or final_review materials. This subskill writes 04-draft.md, 05-draft-review.md, 06-final.md, 07-retrospective.md, 08-publish-plan.md, and lessons.yaml as appropriate.
---

# Content Drafting

Produce a readable master draft and final local Markdown from approved evidence and outline.

## Boundary

`opc-router` owns `final_review` and `publish_review`. This skill owns prose quality and editorial judgment.

Do not create channel-specific drafts before `publish_review`.

## Inputs

Read:

- `task.json`
- `01-evidence-pack.md`
- `02-outline.md`
- `03-review-checklist.md`

Use `obsidian-article-draft` when drafting from an approved brief or outline.

## Draft Workflow

1. Confirm `outline_review` is approved in `task.json` or operator context.
2. Choose the article mode from `02-outline.md`.
3. Write thesis-first prose, not claim-by-claim placeholders.
4. Preserve source notes and Obsidian links.
5. Mark unresolved facts with `[verify: ...]`.
6. Write `04-draft.md`.
7. Write `05-draft-review.md` with concrete review risks.

## Content Modes

Pick one mode before drafting. Do not mix modes unless the outline asks for a hybrid.

| Mode | Use when | Shape |
| --- | --- | --- |
| Explanation | The reader needs to understand a concept, trend, architecture, or tradeoff | why this matters, concept model, mechanism, examples, limits, takeaways |
| How-To | The reader wants to perform a task | outcome, prerequisites, steps, verification, failure modes, next options |
| Reference | The reader needs a stable lookup page | scope, definitions, schema/options, examples, edge cases, changelog/source notes |
| Opinion | The article argues for a stance | provocation, thesis, reasons, counterargument, practice change, conclusion |

## Draft Template

Use this frontmatter shape for `04-draft.md` when the task does not provide another template:

```yaml
---
title: ""
slug: ""
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
audience: ""
content_mode: explanation
target_channels: []
source_brief: ""
source_paths: []
external_sources: []
visual_needed: false
published:
  feishu: ""
  yuque: ""
  ima: ""
---
```

Body shape:

```markdown
# Title

## Opening

## Main Argument

## Evidence and Examples

## Limits and Counterpoints

## Practical Takeaways

## Review Checklist

- [ ] Central thesis is explicit.
- [ ] Key claims have source notes.
- [ ] Dates, names, APIs, and statistics are verified.
- [ ] Open questions are marked with `[verify: ...]`.
- [ ] Target channels are listed in frontmatter.

## Source Notes

| Claim | Source | Notes |
| --- | --- | --- |
```

## Final Workflow

After `final_review` approval:

1. Clean up the master draft into `06-final.md`.
2. Keep source notes where useful for local traceability.
3. Write `07-retrospective.md` with generated-vs-refined quality notes.
4. Write `lessons.yaml` with task-specific lessons, not generic boilerplate.
5. Write `08-publish-plan.md` for publish_review.
6. Ensure the canonical final can be copied into `<wiki-root>/writing/finals/`.

## Quality Bar

- The first three paragraphs must make the reader problem and thesis clear.
- The draft should synthesize evidence into an argument, not summarize pages one by one.
- If manual/Codex refinement was needed, record it in retrospective and lessons.

## Handoff

After `publish_review` is approved, hand off to `content-publishing`.
