# Channel Drafts

Channel drafts are local preparation artifacts created after `publish_review`. They adapt the canonical final Markdown enough for a human or publisher skill to continue.

## Feishu Draft

Create `10-feishu-draft.md` for the `feishu` channel. It should preserve the article structure, remove internal evidence appendix by default, and include a checklist for Lark document destination, source-note policy, and import method.

Use `lark-doc`, `lark-drive`, or `lark-wiki` only in a later external publishing stage with explicit credentials and destination.

## WeChat Draft

Create `11-wechat-draft.md` for the `wechat` channel. It should preserve the main article, remove internal evidence appendix by default, and include a checklist for title, cover image, author note, and private-path cleanup.

Do not assume a WeChat API write path. Treat this as a local draft until a verified publisher exists.

## Generic Channels

For other channels, create a local Markdown file named `<channel>-draft.md` with a destination checklist. Record all local draft paths in `09-publish-log.md`.

## Publisher Handoff

After channel drafts are generated, create:

- `publish-manifest.json`: machine-readable paths, channels, destinations, and guardrails.
- `12-publisher-handoff.md`: human-readable handoff for `content-publishing`.

The handoff is the boundary between local preparation and external side effects. It should name the destination, credentials still required, and the canonical Obsidian final path.

## Publish Dry-Run

Use `opc publish <task-id> --channel <name>` to validate the manifest, selected channel, destination, and local draft. The dry-run writes `13-publish-readiness-report.md` and keeps `external_publish_attempted: false`.

`opc publish --execute` must not be used until a real publisher adapter has been configured and reviewed. If no adapter is present, the command should fail rather than pretending to publish.
