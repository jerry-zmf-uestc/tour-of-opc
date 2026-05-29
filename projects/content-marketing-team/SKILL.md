---
name: openclaw-content-team
description: Use when routing or executing content-team work in OpenClaw/QClaw: writing articles, Feishu docs, WeChat drafts, Obsidian llm-wiki based research, evidence-backed outlines, drafts, final reviews, publishing preparation, retrospectives, or lessons. This is the orchestration skill for the content team; use it before directly using article research, draft, or publishing skills so task state, gates, artifacts, and team boundaries stay aligned with opc-router.
---

# OpenClaw Content Team

Content-team orchestration for turning local Obsidian/LLM Wiki knowledge into reviewable articles, documents, and channel-ready drafts.

This skill does not replace the specialist skills. It defines the team protocol that connects `opc-router`, the content workspace, and reusable specialist skills.

## Skill Pack Layout

This package follows the `obsidian-wiki/.skills/` pattern while keeping reusable skills in `/Users/jerry/Documents/projects/the-way-to-opc/skill`. The project skill is the orchestrator, and focused skills own the semantic work.

| Stage | Subskill |
| --- | --- |
| Research and evidence | `skill/content-research` |
| Thesis, angle, and outline | `skill/content-planning` |
| Drafting and editing | `skill/content-drafting` |
| Channel packaging and publishing handoff | `skill/content-publishing` |
| Memory sync and lesson export | `skill/content-memory` |
| Lesson clustering and skill patch proposals | `skill/skill-evolution` |

Use `SETUP.md` when installing, linking, or explaining this skill pack to another agent runtime.

## Role Boundary

`opc-router` owns global routing, task status, approval gates, and completion.

`openclaw-content-team` owns content workflow quality:

- `content-leader`: accepts the routed task, chooses the workflow, checks handoffs, and produces the final delivery summary.
- `researcher`: builds an evidence-backed source pack from local wiki and approved external sources.
- `planner`: turns evidence into thesis, title options, audience framing, and outline.
- `writer`: creates the master Obsidian Markdown draft from approved evidence and outline.
- `editor`: checks factual grounding, structure, style, unresolved verification markers, and final readiness.
- `publisher`: adapts an approved final draft to Feishu/Lark, WeChat, Yuque, IMA-ready Markdown, or another requested channel.

Specialists produce artifacts and reviews. They do not mark the task `completed`; that remains the router's responsibility.

## Reusable Skill Stack

Use these existing skills instead of duplicating their domain logic:

| Need | Reuse |
| --- | --- |
| Multi-agent handoff and quality gates | `/Users/jerry/Documents/projects/the-way-to-opc/skill/agent-team-orchestration` |
| Team workspace and role materialization | `/Users/jerry/Documents/projects/the-way-to-opc/skill/multi-agent-builder` |
| Local wiki setup, query, ingest, lint, and maintenance | `/Users/jerry/Documents/projects/the-way-to-the-ai-engineer/skills/obsidian-llm-wiki` |
| Evidence-backed topic research | `/Users/jerry/Documents/projects/the-way-to-opc/skill/content-research` |
| Obsidian Markdown drafting | `/Users/jerry/Documents/projects/the-way-to-opc/skill/content-drafting` |
| Feishu/Lark, Yuque, IMA-ready, or generic Markdown publishing | `/Users/jerry/Documents/projects/the-way-to-opc/skill/content-publishing` |
| IMA/WeChat candidate intake into local wiki | `/Users/jerry/Documents/projects/the-way-to-the-ai-engineer/skills/ima-wiki-promotion` |
| Yuque to Obsidian source sync | `/Users/jerry/Documents/projects/the-way-to-the-ai-engineer/skills/yuque-maintainer` |

Use `content-research` before `content-drafting` unless the user provides an approved brief, outline, or evidence map.

Use `content-publishing` only after the content has passed `final_review` and the requested channel has passed `publish_review`.

Use the local subskills first when operating inside OpenClaw/QClaw task artifacts. They can delegate to the reusable article and publishing skills while preserving `opc-router` gates and artifact contracts.

## Progressive References

Read only the reference needed for the current stage:

| File | Read when |
| --- | --- |
| `references/workflow.md` | Running or changing the content workflow |
| `references/artifact-contract.md` | Checking filenames, task metadata, or Obsidian write-back |
| `references/quality-gates.md` | Reviewing `outline_review`, `final_review`, or `publish_review` |
| `references/channel-drafts.md` | Creating local Feishu, WeChat, or generic channel draft packages |

Use `assets/templates/publish-plan.md` and `assets/templates/publish-log.md` when changing publish-stage copy or expected fields.

## Current Router Contract

The current local implementation is deterministic and file-based:

```bash
opc content "文章主题"
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki --execute-skill
opc approve <task-id> outline_review
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki --execute-skill
opc approve <task-id> final_review
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki --execute-skill
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
opc approve <task-id> publish_review
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki --execute-skill
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
opc publish <task-id> --channel feishu
opc memory sync <task-id> --memory-root /Users/jerry/Documents/knowledge/team-knowledge/opc-memory
```

Current P2-E artifacts live under the content team shared task directory:

```text
stage-packet.json
stage-instructions.md
skill-execution-request.json
skill-handoff.md
01-evidence-pack.md
02-outline.md
03-review-checklist.md
04-draft.md
05-draft-review.md
06-final.md
07-retrospective.md
08-publish-plan.md
09-publish-log.md
10-feishu-draft.md
11-wechat-draft.md
12-publisher-handoff.md
13-publish-readiness-report.md
14-memory-update.md
memory-patch.json
publish-manifest.json
lessons.yaml
task.json
event-log.jsonl
```

The router also writes the canonical final draft to `<wiki-root>/writing/finals/`. Do not create external Feishu, WeChat, Yuque, or IMA artifacts until `publish_review` is approved and explicit destinations are selected.

`opc memory sync` writes reviewed task memory into `/Users/jerry/Documents/knowledge/team-knowledge/opc-memory` by default unless `OPC_MEMORY_ROOT` or `--memory-root` overrides it. The command is idempotent and has no external side effects. It does not implement heartbeat scheduling; OpenClaw or another host runtime may call it from its own heartbeat/automation layer.

## Workflow

### 1. Intake

Normalize the task into a content task:

- topic or working title
- audience
- intended channels
- stance or rough idea
- source policy, defaulting to `local_wiki_first`
- optional wiki root or vault hint

If the task is actually a product change, bugfix, deployment, or architecture implementation, hand it back to `opc-router` for Team A or hybrid routing.

### 2. Research

Use local wiki first:

1. Query `index.md`, `concepts/`, `entities/`, `comparisons/`, and `queries/`.
2. Prefer compiled wiki pages over raw notes for framing.
3. Inspect raw pages only when exact provenance or wording matters.
4. Mark weak evidence instead of inventing missing provenance.
5. For current facts, product versions, pricing, laws, or community status, verify from current official or primary sources.

Output:

- `01-evidence-pack.md`

The evidence pack must include candidate pages, source references, claims, confidence, gaps, and unresolved verification tasks.

### 3. Planning

Turn evidence into a human-reviewable plan:

- thesis
- title candidates
- reader problem
- section outline
- claim-to-section mapping
- missing sources or counterpoints

Output:

- `02-outline.md`
- `03-review-checklist.md`

Stop at `outline_review`. Do not draft before the outline is approved.

### 4. Drafting

After `outline_review` is approved:

1. Use `content-drafting` rules for the master draft shape.
2. Preserve source notes and Obsidian links.
3. Keep unresolved facts visible with `[verify: ...]`.
4. Avoid channel-specific formatting in the master draft.

Output:

- `04-draft.md`
- `05-draft-review.md`

Stop at `final_review`. Do not create final content before the final review is approved.

### 5. Final Packaging

After `final_review` is approved:

1. Produce a cleaned final Markdown artifact.
2. Preserve enough source notes for traceability.
3. Produce a retrospective that records what worked, what remained weak, and which claims were source-backed.
4. Produce `lessons.yaml` for future self-evolution.
5. Write the canonical final to Obsidian `writing/finals/`.
6. Produce a local publish plan for `publish_review`.

Output:

- `06-final.md`
- `07-retrospective.md`
- `08-publish-plan.md`
- `lessons.yaml`
- `<wiki-root>/writing/finals/YYYY-MM-DD-slug.md`

Stop at `publish_review`. Do not complete the task until the publish review gate is approved.

### 6. Publishing

Publishing is a separate stage:

1. Require `publish_review`.
2. Use `content-publishing`.
3. Treat local Markdown as canonical.
4. Do not auto-publish to Feishu, WeChat, Yuque, or IMA without an explicit approved channel target.
5. Record created or updated external URLs in a publish log and local frontmatter where appropriate.
6. If no external destination is selected yet, create local channel drafts, `publish-manifest.json`, `12-publisher-handoff.md`, and `09-publish-log.md` stating that no external publishing was attempted, then complete the local task.
7. Use `opc publish <task-id> --channel <name>` for a dry-run readiness check. This creates `13-publish-readiness-report.md` and still does not publish externally.

## Quality Gates

`outline_review` checks:

- the topic and audience are explicit
- evidence exists for core claims
- weak or missing evidence is visible
- the outline is not just a list of wiki excerpts

`final_review` checks:

- the draft follows the approved outline or explains deviations
- central claims have source notes
- unresolved `[verify: ...]` items are either resolved or accepted
- private paths and internal notes are acceptable for the target artifact

`publish_review` checks:

- target channels are explicit
- credentials and destination spaces are available
- source notes are handled according to channel policy
- no external side effect will happen without user approval

## Lessons Contract

Every local-final or failed content task should create a `lessons.yaml` entry with:

```yaml
task_id: ""
team: openclaw-content-team
task_type: content
outcome: awaiting_publish_review
patterns:
  successful: []
  failed: []
recommendations:
  keep: []
  change: []
promote_to:
  - content-team/MEMORY.md
  - docs/AI双团队中控方案.md
```

Lessons are raw evidence for self-evolution. Do not immediately mutate skills or playbooks from a single lesson; promote only after repeated signal or explicit user approval.

Use `opc memory sync <task-id>` after local completion or meaningful failure to export the lesson into shared memory:

```text
<memory-root>/
├── AGENTS.md
├── runs/<task-id>.md
├── lessons/<task-id>.md
├── teams/openclaw-content-team.md
├── agents/opc-router.md
└── projects/openclaw-operating-desk.md
```

Keep task-specific records in `runs/` and `lessons/`; only promote stable, reviewed knowledge into team memory, playbooks, or skill patches.

## Failure Handling

Use `blocked` when required user input, wiki root, credentials, or source material is missing.

Use `failed` when an artifact cannot be produced or a quality gate cannot be satisfied.

Use `retrying` only with a recorded reason. Preserve previous artifacts; new runs should add events and overwrite only deterministic stage artifacts for the same task.

## Handoff Format

When handing off between roles, include:

- task id
- current stage
- artifact paths
- gate required next
- risks or missing evidence
- exact next command or action

Example:

```text
Task: task-...
Stage: outline_review
Artifacts: 01-evidence-pack.md, 02-outline.md, 03-review-checklist.md
Risk: comparison evidence is thin.
Next: user approves outline_review or requests more research.
```
