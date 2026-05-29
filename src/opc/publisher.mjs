import fs from 'node:fs';
import path from 'node:path';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const renderReadinessReport = ({ task, manifest, channel, draftPath }) => `# Publish Readiness Report

## Task

${task.title}

## Mode

Dry-run only. No external publishing was attempted.

## Channel

${channel}

## Destination

${manifest.destinations?.[channel] || 'not selected'}

## Draft

${draftPath}

## Canonical Sources

- Final: ${manifest.canonical?.final || 'missing'}
- Obsidian final: ${manifest.canonical?.obsidian_final || 'missing'}
- Publish plan: ${manifest.canonical?.publish_plan || 'missing'}

## Checks

- [x] publish-manifest.json exists.
- [x] Requested channel is declared in manifest.
- [x] Local channel draft exists.
- [x] external_publish_attempted remains false.

## Next Step

Configure a real external publisher adapter, then rerun with explicit execution approval.
`;

export class ContentPublisher {
  constructor({ store }) {
    this.store = store;
  }

  publishTask({ id, channel, execute = false }) {
    if (execute) {
      throw new Error('External publish execution is not implemented. Run without --execute for dry-run readiness checks.');
    }

    const task = this.store.getTaskStatus(id);
    const manifestPath = task.artifacts?.publish_manifest;
    if (!manifestPath || !fs.existsSync(manifestPath)) {
      throw new Error(`Publish manifest is missing for task ${id}`);
    }

    const manifest = readJson(manifestPath);
    const selectedChannel = channel || manifest.channels?.[0];
    if (!selectedChannel) {
      throw new Error(`No publish channel selected for task ${id}`);
    }
    if (!manifest.channels?.includes(selectedChannel)) {
      throw new Error(`Channel is not declared in publish manifest: ${selectedChannel}`);
    }

    const draftPath = manifest.channel_drafts?.[selectedChannel];
    if (!draftPath || !fs.existsSync(draftPath)) {
      throw new Error(`Channel draft is missing for ${selectedChannel}`);
    }

    const reportPath = path.join(task.artifact_root, '13-publish-readiness-report.md');
    fs.writeFileSync(reportPath, renderReadinessReport({ task, manifest, channel: selectedChannel, draftPath }));

    const updated = {
      ...task,
      artifacts: {
        ...(task.artifacts || {}),
        publish_readiness_report: reportPath
      }
    };
    this.store.saveTask(updated);
    this.store.recordEvent({
      task: updated,
      event_type: 'content_publish_dry_run_completed',
      message: `Publish dry-run completed for ${selectedChannel}`,
      metadata: { channel: selectedChannel, artifact: '13-publish-readiness-report.md' }
    });

    return {
      task_id: id,
      mode: 'dry-run',
      channel: selectedChannel,
      ready: true,
      external_publish_attempted: false,
      destination: manifest.destinations?.[selectedChannel] || null,
      draft: draftPath,
      report: reportPath
    };
  }
}
