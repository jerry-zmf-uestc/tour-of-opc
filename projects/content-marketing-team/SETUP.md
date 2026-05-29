# OpenClaw Content Team Setup

Skill-based content workflow for OpenClaw/QClaw. The router owns state; the agent and skills own semantic work.

This pack follows the same pattern as `obsidian-wiki/.skills/`: a root orchestration skill plus focused subskills. There is no requirement to move all behavior into Node scripts. Scripts should create task folders, update state, and verify artifact contracts. LLM-owned stages should be handled by skills.

## Quick Start

From the project root:

```bash
opc content "文章主题" \
  --audience "目标读者" \
  --channel feishu,wechat \
  --publish-destination feishu:team-wiki,wechat:manual \
  --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
```

Then run the gated workflow:

```bash
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
opc approve <task-id> outline_review
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
opc approve <task-id> final_review
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
opc approve <task-id> publish_review
opc run <task-id> --wiki-root /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
opc publish <task-id> --channel feishu
opc memory sync <task-id> --memory-root /Users/jerry/Documents/knowledge/team-knowledge/opc-memory
```

Default local paths:

```text
Team wiki: /Users/jerry/Documents/knowledge/team-knowledge/opc-wiki
Team memory: /Users/jerry/Documents/knowledge/team-knowledge/opc-memory
```

## Subskills

| Skill | Purpose |
| --- | --- |
| `content-research` | Build `01-evidence-pack.md` from local wiki sources and explicit gaps |
| `content-planning` | Turn evidence into thesis, angle, outline, and review checklist |
| `content-drafting` | Produce `04-draft.md`, `05-draft-review.md`, and a reviewed final draft |
| `content-publishing` | Create channel drafts, publish manifest, handoff, and dry-run readiness |
| `content-memory` | Export task lessons into Obsidian-compatible shared memory |
| `skill-evolution` | Cluster lessons and propose reviewed skill patches |

## Router-owned

Keep these deterministic responsibilities in `src/opc`:

- TaskSpec creation and persistence
- task registry and event log writes
- approval gates and status transitions
- artifact path registration
- dry-run safety checks
- idempotent memory file export

The router should not decide article thesis, rewrite prose, infer lessons, or mutate skill rules from a single run.

## LLM-owned

Use skills and the model for semantic work:

- query expansion and source relevance judgment
- evidence synthesis and gap analysis
- article thesis, angle, and outline
- readable drafting and editing
- channel adaptation
- retrospective interpretation
- lesson clustering and skill patch proposals

## Artifact Contract

Subskills write into the task artifact directory created by `opc-router`:

```text
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
publish-manifest.json
memory-patch.json
lessons.yaml
task.json
event-log.jsonl
```

## Design Rule

If the work is deterministic and safety-critical, keep it in `src/opc`. If the work requires semantic understanding, synthesis, writing judgment, or skill reuse, move it into a subskill.
