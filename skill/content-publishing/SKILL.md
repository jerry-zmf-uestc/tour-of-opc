---
name: content-publishing
description: Use when a routed content-team task has approved publish_review and needs LLM-owned channel adaptation, Feishu/WeChat/Yuque draft preparation, publish-manifest creation, publisher handoff, or dry-run readiness review. This subskill prepares 09-publish-log.md, channel drafts, 12-publisher-handoff.md, and publish-manifest.json.
---

# Content Publishing

Prepare reviewed content for external channels without causing external side effects by default.

## Boundary

`opc-router` owns publish_review, dry-run readiness checks, and final task completion. This skill owns channel adaptation and publisher handoff quality.

Do not publish externally unless the operator explicitly asks for execution and credentials/destination are verified.

## Inputs

Read:

- `task.json`
- `06-final.md`
- `08-publish-plan.md`
- existing channel drafts or manifest, if present

Use `multi-channel-publisher` for real external publishing after local readiness is confirmed.

## Workflow

1. Confirm publish_review approval.
2. Determine requested channels and destinations from `task.inputs`.
3. Strip private Evidence Appendix content from public channel drafts unless the user asks to keep it.
4. Create local channel drafts:
   - Feishu: `10-feishu-draft.md`
   - WeChat: `11-wechat-draft.md`
   - other channels: stable `channel-draft.md` names
5. Write `publish-manifest.json`.
6. Write `12-publisher-handoff.md`.
7. Write `09-publish-log.md` stating whether external publishing was attempted.

## Dry-run

For readiness checks, use:

```bash
opc publish <task-id> --channel feishu
```

Dry-run must keep `external_publish_attempted` false.

## Channel Rules

### Feishu / Lark

Use local Lark skills only in the external publishing stage:

- `lark-doc` for creating or editing online documents from Markdown.
- `lark-drive` for importing local Markdown, managing files, permissions, comments, and titles.
- `lark-wiki` for placing documents in a knowledge space.

Rules:

- Read `lark-shared` through the relevant Lark skill before auth-sensitive commands.
- Resolve wiki URLs to real object tokens before document operations.
- If the article contains diagrams, consider native Feishu whiteboards via `lark-whiteboard` and `lark-whiteboard-cli`.

### Yuque

Treat Yuque as a verified API target, not an assumed capability. Before publishing, confirm token location, target namespace, create/update behavior, slug policy, image upload behavior, and Markdown compatibility.

### IMA

Current local workflow is inbound: IMA to Obsidian raw sources through `ima-wiki-promotion`. Do not claim IMA outbound publishing unless a write API and credentials have been verified in the current session.

### Generic Markdown Target

For any channel without a dedicated skill:

1. Convert Obsidian links to plain Markdown or absolute target URLs.
2. Remove private `## Source Notes` if the public channel should not expose internal paths.
3. Preserve code fences and Mermaid blocks unless the channel does not support them.
4. Record the manual publishing checklist in `publish_notes`.

## Quality Bar

- Channel drafts should be adapted for the channel, not copied blindly.
- Manifest must include canonical final, Obsidian final, channels, destinations, and local draft paths.
- Missing credentials or destination should be reported, not guessed.

## Handoff

After publishing prep, hand off to `content-memory` for memory sync.
