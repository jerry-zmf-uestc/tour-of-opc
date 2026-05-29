---
name: content-research
description: Use when a routed content-team task needs LLM-owned Obsidian/LLM Wiki research, evidence pack creation, source ranking, query expansion, source gap detection, or claim-to-source mapping before outline_review. This subskill writes or improves 01-evidence-pack.md while preserving opc-router artifact contracts.
---

# Content Research

Build an evidence-backed source pack for a routed content-team task.

## Boundary

`opc-router` owns task state, gates, and artifact paths. This skill owns semantic research quality.

Do not mark the task complete. Do not approve gates. Do not publish externally.

## Inputs

Read:

- `task.json`
- existing `01-evidence-pack.md`, if present
- local wiki root from `task.inputs.wiki_root`, `--wiki-root`, or operator instruction
- relevant pages from Obsidian/LLM Wiki

Use existing wiki skills when useful:

- `obsidian-llm-wiki`
- `wiki-query`
- `obsidian-article-research`

## Workflow

1. Extract topic, audience, channels, and stance from `task.json`.
2. Search the compiled wiki first: `index.md`, `concepts/`, `entities/`, `comparisons/`, `queries/`.
3. Expand queries semantically. Include English/Chinese variants, adjacent concepts, and known project vocabulary.
4. Read only the strongest candidate pages, then inspect raw/source pages when exact provenance matters.
5. Separate direct evidence, useful context, counterpoints, and gaps.
6. Write `01-evidence-pack.md`.

## Output Format

`01-evidence-pack.md` should include:

- topic and audience
- thesis candidates
- ranked candidate pages with reason for inclusion
- claims mapped to source refs
- confidence and evidence type
- counterpoints and unresolved gaps
- missed-related-pages when a page looks relevant but was not in initial recall

## Article Research Brief Format

When the operator asks for a brief or the planning stage needs a richer handoff, use this shape inside the evidence pack or as an appendix:

```markdown
## Topic

- Working title:
- Audience:
- Intended channel:
- Reader problem:
- Proposed stance:

## One-Sentence Thesis

State the article's central claim in one sentence.

## Evidence Map

| Use | Claim or material | Source | Strength |
| --- | --- | --- | --- |
| Direct support |  | vault path or URL | strong/medium/weak |
| Context |  | vault path or URL | strong/medium/weak |
| Counterpoint |  | vault path or URL | strong/medium/weak |

## Outline Seed

1. Hook and framing
2. Background or problem setup
3. Main argument section
4. Supporting case or example
5. Counterargument or limitation
6. Practical takeaway

## Open Questions

List facts, claims, names, dates, API details, or examples that still need verification.

## Recommended Next Step

Choose one: draft now, collect more local sources, or verify current external facts first.
```

Strength guide:

- `strong`: source has clear provenance and directly supports the claim.
- `medium`: source is relevant but partial, older, or interpretive.
- `weak`: source is unsourced, anecdotal, or only indirectly related.

## Quality Bar

- Every central claim needs a source path or explicit `[verify: ...]`.
- Do not claim “no gaps” if strong related pages were found manually after initial recall.
- Prefer source/raw pages over synthesis pages for exact facts.
- Record weak provenance instead of hiding it.

## Handoff

After writing `01-evidence-pack.md`, hand off to `content-planning` for `02-outline.md` and `03-review-checklist.md`.
