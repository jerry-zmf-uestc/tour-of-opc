# Content Team Workflow

The content team runs as a staged workflow under `opc-router`. The router owns state, approvals, event logs, and final completion. Team roles own the quality of their artifacts and handoffs.

## Stages

1. Intake: normalize topic, audience, channels, source policy, and wiki root.
2. Research: use local Obsidian/LLM Wiki first, then external sources only when current facts are required.
3. Outline: create a source-backed plan and stop at `outline_review`.
4. Draft: create the master Markdown draft and stop at `final_review`.
5. Final: write `06-final.md`, `07-retrospective.md`, `lessons.yaml`, `08-publish-plan.md`, and the Obsidian `writing/finals/` copy, then stop at `publish_review`.
6. Publish closure: after `publish_review`, create local channel drafts, `publish-manifest.json`, `12-publisher-handoff.md`, and `09-publish-log.md`; complete the local task without external side effects unless a dedicated publisher stage is added.

## Routing Rule

Use this workflow for articles, Feishu docs, WeChat drafts, knowledge-base documents, content plans, and Obsidian/wiki-backed writing. Route code changes, bug fixes, CI, deployment, and application implementation back to Team A or a hybrid flow.

## Handoff Rule

Every handoff names the task id, current stage, artifacts, missing evidence, required gate, and exact next command. Avoid unstated transitions; the receiving role should be able to continue from files alone.
