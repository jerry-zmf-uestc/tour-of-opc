import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { OpcController } from '../src/opc/controller.mjs';

const makeRoot = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

const writeFile = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const makeWiki = () => {
  const wikiRoot = makeRoot('opc-wiki-');
  writeFile(
    path.join(wikiRoot, 'index.md'),
    `# Index

- [[concepts/harness.md|Harness]] — Harness 是 Agent 周围的工程化运行层。
- [[comparisons/sdd-vs-harness.md|SDD vs Harness]] — SDD 解决做什么，Harness 解决如何可控地做。
`
  );
  writeFile(
    path.join(wikiRoot, 'concepts', 'harness.md'),
    `---
title: Harness
summary: Harness 是把非确定性 Agent 能力接入工程系统的适配层。
---

# Harness

- Harness 是 Agent 周围的工程化运行层。
- Harness 需要 Guides、Sensors 和 Garbage Collection。
- 每次失败后应把经验写回系统。
`
  );
  writeFile(
    path.join(wikiRoot, 'comparisons', 'sdd-vs-harness.md'),
    `---
title: SDD vs Harness
summary: SDD 解决做什么，Harness 解决如何可控地做。
---

# SDD vs Harness

- SDD 解决做什么。
- Harness 解决如何可控地执行。
`
  );
  return wikiRoot;
};

const writeResearchArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '01-evidence-pack.md'), `# Evidence Pack

## Topic

${task.title}

## Claims

1. Harness 是 Agent 周围的工程化运行层。
   - source_refs: [[concepts/harness.md]]
   - confidence: high
`);
  writeFile(path.join(task.artifact_root, '02-outline.md'), '# Article Outline\n\n## Thesis\n\nHarness explains controllable Agent execution.\n');
  writeFile(path.join(task.artifact_root, '03-review-checklist.md'), '# Review Checklist\n\n- [ ] Claims are sourced.\n');
};

const writeDraftArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '04-draft.md'), `# ${task.title}

## Thesis

Harness 是 Agent 周围的工程化运行层。

## Source Notes

- [[concepts/harness.md]]
`);
  writeFile(path.join(task.artifact_root, '05-draft-review.md'), '# Draft Review\n\n- [x] Draft is ready for final review.\n');
};

const writeFinalArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '06-final.md'), `---
title: "${task.title}"
status: final
task_id: ${task.id}
team: openclaw-content-team
---

# ${task.title}

Harness 是 Agent 周围的工程化运行层。
`);
  writeFile(path.join(task.artifact_root, '07-retrospective.md'), '# Retrospective\n\n## Claims With Sources\n\n- concepts/harness.md\n');
  writeFile(path.join(task.artifact_root, '08-publish-plan.md'), '# Publish Plan\n\n- Required gate: publish_review\n');
  writeFile(path.join(task.artifact_root, 'lessons.yaml'), `task_id: ${task.id}
team: openclaw-content-team
outcome: awaiting_publish_review
`);
};

const writePublishArtifacts = (task) => {
  const feishuDraft = path.join(task.artifact_root, '10-feishu-draft.md');
  const wechatDraft = path.join(task.artifact_root, '11-wechat-draft.md');
  writeFile(path.join(task.artifact_root, '09-publish-log.md'), '# Publish Log\n\nNo external publishing was attempted.\n');
  writeFile(feishuDraft, '# Feishu Draft\n\nHarness 是 Agent 周围的工程化运行层。\n');
  writeFile(wechatDraft, '# WeChat Draft\n\nHarness 是 Agent 周围的工程化运行层。\n');
  writeFile(path.join(task.artifact_root, '12-publisher-handoff.md'), '# Publisher Handoff\n\nUse content-publishing for external handoff.\n');
  writeFile(path.join(task.artifact_root, 'publish-manifest.json'), `${JSON.stringify({
    version: 1,
    task_id: task.id,
    title: task.title,
    team: 'openclaw-content-team',
    status: 'ready_for_external_publisher',
    external_publish_attempted: false,
    canonical: {
      final: path.join(task.artifact_root, '06-final.md'),
      obsidian_final: task.artifacts?.obsidian_final || null,
      publish_plan: path.join(task.artifact_root, '08-publish-plan.md')
    },
    channels: task.inputs?.channels || ['feishu', 'wechat'],
    destinations: task.inputs?.publish_destinations || {},
    channel_drafts: {
      feishu: feishuDraft,
      wechat: wechatDraft
    }
  }, null, 2)}\n`);
};

const completeContentTask = ({ controller, task, wikiRoot }) => {
  controller.runTask(task.id, { wikiRoot });
  writeResearchArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'outline_review' });
  controller.runTask(task.id, { wikiRoot });
  writeDraftArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'final_review' });
  controller.runTask(task.id, { wikiRoot });
  writeFinalArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'publish_review' });
  controller.runTask(task.id, { wikiRoot });
  writePublishArtifacts(controller.getTaskStatus(task.id));
  return controller.runTask(task.id, { wikiRoot });
};

test('opc run writes a research stage packet instead of semantic content artifacts', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content'
  });

  const updated = controller.runTask(task.id, { wikiRoot });

  assert.equal(updated.status, 'in_progress');
  assert.equal(updated.required_subskill, 'content-research');
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'stage-packet.json')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'stage-instructions.md')));
  assert.equal(fs.existsSync(path.join(task.artifact_root, '01-evidence-pack.md')), false);

  const packet = JSON.parse(fs.readFileSync(path.join(task.artifact_root, 'stage-packet.json'), 'utf8'));
  assert.equal(packet.stage, 'research');
  assert.equal(packet.subskill, 'content-research');
  assert.deepEqual(packet.expected_outputs, ['01-evidence-pack.md', '02-outline.md', '03-review-checklist.md']);

  const events = controller.getTaskEvents(task.id);
  assert.equal(events.at(-1).event_type, 'content_stage_packet_created');
});

test('opc run requests outline approval after research artifacts are written by skills', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content'
  });

  controller.runTask(task.id, { wikiRoot });
  writeResearchArtifacts(task);
  const waiting = controller.runTask(task.id, { wikiRoot });

  assert.equal(waiting.status, 'waiting_approval');
  assert.equal(waiting.required_gate, 'outline_review');
  assert.equal(fs.existsSync(path.join(task.artifact_root, '04-draft.md')), false);
});

test('approved outline run writes a drafting stage packet', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content'
  });

  controller.runTask(task.id, { wikiRoot });
  writeResearchArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'outline_review' });
  const drafted = controller.runTask(task.id, { wikiRoot });

  assert.equal(drafted.status, 'in_progress');
  assert.equal(drafted.required_subskill, 'content-drafting');
  assert.equal(fs.existsSync(path.join(task.artifact_root, '04-draft.md')), false);
  const packet = JSON.parse(fs.readFileSync(path.join(task.artifact_root, 'stage-packet.json'), 'utf8'));
  assert.equal(packet.stage, 'drafting');

  const events = controller.getTaskEvents(task.id);
  assert.ok(events.some((event) => event.event_type === 'content_stage_packet_created'));
});

test('draft artifacts written by skills request final review', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content'
  });

  controller.runTask(task.id, { wikiRoot });
  writeResearchArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'outline_review' });
  controller.runTask(task.id, { wikiRoot });
  writeDraftArtifacts(task);
  const finalReview = controller.runTask(task.id, { wikiRoot });

  assert.equal(finalReview.status, 'waiting_approval');
  assert.equal(finalReview.required_gate, 'final_review');
});

test('approved final review writes final stage packet and then obsidian final after skill artifacts', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content'
  });

  controller.runTask(task.id, { wikiRoot });
  writeResearchArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'outline_review' });
  controller.runTask(task.id, { wikiRoot });
  writeDraftArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'final_review' });
  const finalPacket = controller.runTask(task.id, { wikiRoot });

  assert.equal(finalPacket.status, 'in_progress');
  assert.equal(finalPacket.required_subskill, 'content-drafting');
  assert.equal(JSON.parse(fs.readFileSync(path.join(task.artifact_root, 'stage-packet.json'), 'utf8')).stage, 'final');

  writeFinalArtifacts(task);
  const readyToPublish = controller.runTask(task.id, { wikiRoot });

  assert.equal(readyToPublish.status, 'waiting_approval');
  assert.equal(readyToPublish.required_gate, 'publish_review');
  assert.ok(fs.existsSync(path.join(task.artifact_root, '06-final.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, '07-retrospective.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, '08-publish-plan.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'lessons.yaml')));
  assert.match(fs.readFileSync(path.join(task.artifact_root, '06-final.md'), 'utf8'), /status: final/);
  assert.match(fs.readFileSync(path.join(task.artifact_root, 'lessons.yaml'), 'utf8'), /outcome: awaiting_publish_review/);
  assert.ok(readyToPublish.artifacts.obsidian_final.includes('/writing/finals/'));
  assert.ok(fs.existsSync(readyToPublish.artifacts.obsidian_final));
  assert.match(fs.readFileSync(readyToPublish.artifacts.obsidian_final, 'utf8'), /status: final/);

  const events = controller.getTaskEvents(task.id);
  assert.ok(events.some((event) => event.event_type === 'content_obsidian_final_written'));
  assert.equal(events.at(-1).event_type, 'approval_required');
  assert.equal(events.at(-1).gate, 'publish_review');
});

test('approved publish review writes publishing stage packet and completes after skill artifacts', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content',
    inputs: {
      channels: ['feishu', 'wechat'],
      publish_destinations: {
        feishu: 'team-wiki',
        wechat: 'manual'
      }
    }
  });

  controller.runTask(task.id, { wikiRoot });
  writeResearchArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'outline_review' });
  controller.runTask(task.id, { wikiRoot });
  writeDraftArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'final_review' });
  controller.runTask(task.id, { wikiRoot });
  writeFinalArtifacts(task);
  controller.runTask(task.id, { wikiRoot });
  controller.approveTask({ id: task.id, gate: 'publish_review' });
  const publishPacket = controller.runTask(task.id, { wikiRoot });

  assert.equal(publishPacket.status, 'in_progress');
  assert.equal(publishPacket.required_subskill, 'content-publishing');

  writePublishArtifacts(controller.getTaskStatus(task.id));
  const completed = controller.runTask(task.id, { wikiRoot });

  assert.equal(completed.status, 'completed');
  assert.equal(completed.required_gate, null);
  assert.ok(fs.existsSync(path.join(task.artifact_root, '09-publish-log.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, '10-feishu-draft.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, '11-wechat-draft.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, '12-publisher-handoff.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'publish-manifest.json')));
  assert.match(fs.readFileSync(path.join(task.artifact_root, '09-publish-log.md'), 'utf8'), /No external publishing was attempted/);
  assert.match(fs.readFileSync(path.join(task.artifact_root, '10-feishu-draft.md'), 'utf8'), /Feishu Draft/);
  assert.match(fs.readFileSync(path.join(task.artifact_root, '11-wechat-draft.md'), 'utf8'), /WeChat Draft/);
  assert.match(fs.readFileSync(path.join(task.artifact_root, '12-publisher-handoff.md'), 'utf8'), /content-publishing/);
  const manifest = JSON.parse(fs.readFileSync(path.join(task.artifact_root, 'publish-manifest.json'), 'utf8'));
  assert.equal(manifest.task_id, task.id);
  assert.equal(manifest.external_publish_attempted, false);
  assert.equal(manifest.destinations.feishu, 'team-wiki');
  assert.ok(manifest.channel_drafts.feishu.endsWith('10-feishu-draft.md'));

  const events = controller.getTaskEvents(task.id);
  assert.equal(events.at(-1).event_type, 'task_completed');
});

test('content workflow can be completed when all semantic artifacts are supplied by skills', () => {
  const root = makeRoot('opc-content-');
  const wikiRoot = makeWiki();
  const controller = new OpcController({ root });
  const task = controller.createTask({
    title: '写一篇关于 Harness 技术原理及应用的文章',
    type: 'content',
    inputs: {
      channels: ['feishu', 'wechat'],
      publish_destinations: {
        feishu: 'team-wiki',
        wechat: 'manual'
      }
    }
  });

  const completed = completeContentTask({ controller, task, wikiRoot });

  assert.equal(completed.status, 'completed');
  assert.equal(completed.required_gate, null);
  assert.equal(completed.required_subskill, null);
});
