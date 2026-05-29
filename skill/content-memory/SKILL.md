---
name: content-memory
description: Use when a routed content-team task is completed or meaningfully failed and needs Obsidian-compatible memory export, lesson write-back, run memory creation, memory-patch review, or team memory update. This subskill coordinates opc memory sync and prepares lessons for later self-evolution.
---

# Content Memory

Export durable task memory without turning the router into a scheduler.

## Boundary

`opc-router` provides the deterministic `opc memory sync` command. This skill owns interpretation: what the lesson means, whether it is promotable, and what should be reviewed later.

Do not implement heartbeat scheduling here. The host runtime can call the command.

## Inputs

Read:

- `task.json`
- `event-log.jsonl`
- `07-retrospective.md`
- `lessons.yaml`
- `publish-manifest.json`, if present
- `memory-patch.json`, if present

## Workflow

1. Confirm task completion or meaningful failure.
2. Review whether `lessons.yaml` captures real task-specific signals.
3. If lessons are too generic, propose a better lesson entry before promotion.
4. Run or instruct:

```bash
opc memory sync <task-id> --memory-root /Users/jerry/Documents/knowledge/team-knowledge/opc-memory
```

5. Inspect `14-memory-update.md` and `memory-patch.json`.
6. Summarize what was written into `runs/`, `lessons/`, and `teams/`.

## Quality Bar

- Store task-specific records in `runs/` and `lessons/`.
- Do not promote a single lesson directly into a permanent team rule unless the user explicitly approves.
- Never write secrets, cookies, tokens, or personal credentials into memory.

## Handoff

When multiple lessons accumulate, hand off to `skill-evolution` for clustering and skill patch proposals.
