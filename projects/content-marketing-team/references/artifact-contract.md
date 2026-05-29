# Artifact Contract

Content tasks write deterministic artifacts into the content team shared task directory and may write a canonical final copy back to Obsidian.

## Task Directory

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
memory-patch.json
publish-manifest.json
lessons.yaml
task.json
event-log.jsonl
```

Only create channel drafts for requested channels. The default local channels are `feishu` and `wechat`.

## Obsidian Write-Back

After `final_review`, write the canonical final draft to:

```text
<wiki-root>/writing/finals/YYYY-MM-DD-slug.md
```

The Obsidian copy is the local source of truth for later human editing. Do not write to external platforms from this stage.

## Memory Write-Back

After completion or a meaningful failure, export task memory with:

```bash
opc memory sync <task-id> --memory-root /Users/jerry/Documents/knowledge/team-knowledge/opc-memory
```

If `--memory-root` is omitted, the router writes to:

```text
/Users/jerry/Documents/knowledge/team-knowledge/opc-memory
```

The command writes:

```text
14-memory-update.md
memory-patch.json
<memory-root>/AGENTS.md
<memory-root>/runs/<task-id>.md
<memory-root>/lessons/<task-id>.md
<memory-root>/teams/<team>.md
```

This is an idempotent export command, not a heartbeat scheduler. Host OpenClaw heartbeat or automation can call it when appropriate.

## Task Metadata

Content task `inputs` may include:

```json
{
  "topic": "optional topic override",
  "audience": "target reader",
  "channels": ["feishu", "wechat"],
  "publish_destinations": {
    "feishu": "team-wiki",
    "wechat": "manual"
  },
  "wiki_root": "/absolute/path/to/wiki"
}
```

`required_gate` must point to the next human approval gate. Specialist artifacts alone do not complete a task.
