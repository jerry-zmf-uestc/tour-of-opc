import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const makeRoot = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

const writeFile = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const makeWiki = () => {
  const wikiRoot = makeRoot('opc-memory-wiki-');
  writeFile(path.join(wikiRoot, 'index.md'), '# Index\n\n- [[concepts/harness]]\n');
  writeFile(path.join(wikiRoot, 'concepts', 'harness.md'), '# Harness\n\nHarness 是 Agent 周围的工程化运行层。\n');
  return wikiRoot;
};

const jsonCli = (args) => JSON.parse(execFileSync(process.execPath, ['bin/opc.mjs', ...args], {
  cwd: path.resolve('.'),
  encoding: 'utf8'
}));

const writeResearchArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '01-evidence-pack.md'), '# Evidence Pack\n\n1. Harness 是 Agent 周围的工程化运行层。\n');
  writeFile(path.join(task.artifact_root, '02-outline.md'), '# Article Outline\n\n## Thesis\n\nHarness 记忆同步。\n');
  writeFile(path.join(task.artifact_root, '03-review-checklist.md'), '# Review Checklist\n\n- [ ] sourced\n');
};

const writeDraftArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '04-draft.md'), '# Draft\n\nHarness 记忆同步。\n');
  writeFile(path.join(task.artifact_root, '05-draft-review.md'), '# Draft Review\n\nReady.\n');
};

const writeFinalArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '06-final.md'), `---
title: "${task.title}"
status: final
task_id: ${task.id}
team: openclaw-content-team
---

# ${task.title}

Harness 记忆同步。
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
  writeFile(feishuDraft, '# Feishu Draft\n\nHarness 记忆同步。\n');
  writeFile(wechatDraft, '# WeChat Draft\n\nHarness 记忆同步。\n');
  writeFile(path.join(task.artifact_root, '12-publisher-handoff.md'), '# Publisher Handoff\n\nUse content-publishing.\n');
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
    channels: ['feishu', 'wechat'],
    destinations: {
      feishu: 'team-wiki',
      wechat: 'manual'
    },
    channel_drafts: {
      feishu: feishuDraft,
      wechat: wechatDraft
    }
  }, null, 2)}\n`);
};

const createCompletedContentTask = ({ root, wikiRoot }) => {
  const task = jsonCli([
    'content',
    '写一篇关于 Harness 记忆同步的飞书文档',
    '--root',
    root,
    '--audience',
    '产品负责人',
    '--channel',
    'feishu,wechat',
    '--publish-destination',
    'feishu:team-wiki,wechat:manual',
    '--wiki-root',
    wikiRoot
  ]);

  jsonCli(['run', task.id, '--root', root]);
  writeResearchArtifacts(task);
  jsonCli(['run', task.id, '--root', root]);
  jsonCli(['approve', task.id, 'outline_review', '--root', root]);
  jsonCli(['run', task.id, '--root', root]);
  writeDraftArtifacts(task);
  jsonCli(['run', task.id, '--root', root]);
  jsonCli(['approve', task.id, 'final_review', '--root', root]);
  jsonCli(['run', task.id, '--root', root]);
  writeFinalArtifacts(task);
  jsonCli(['run', task.id, '--root', root]);
  jsonCli(['approve', task.id, 'publish_review', '--root', root]);
  jsonCli(['run', task.id, '--root', root]);
  const ready = jsonCli(['status', task.id, '--root', root]);
  writePublishArtifacts(ready);
  return jsonCli(['run', task.id, '--root', root]);
};

test('opc memory sync writes task memory patch into an Obsidian-compatible vault', () => {
  const root = makeRoot('opc-memory-root-');
  const wikiRoot = makeWiki();
  const memoryRoot = makeRoot('opc-memory-vault-');
  const task = createCompletedContentTask({ root, wikiRoot });

  const result = jsonCli(['memory', 'sync', task.id, '--memory-root', memoryRoot, '--root', root]);

  assert.equal(result.task_id, task.id);
  assert.equal(result.memory_root, memoryRoot);
  assert.equal(result.files.length >= 5, true);
  assert.ok(fs.existsSync(path.join(task.artifact_root, '14-memory-update.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'memory-patch.json')));
  assert.ok(fs.existsSync(path.join(memoryRoot, 'AGENTS.md')));
  assert.ok(fs.existsSync(path.join(memoryRoot, 'runs', `${task.id}.md`)));
  assert.ok(fs.existsSync(path.join(memoryRoot, 'lessons', `${task.id}.md`)));
  assert.ok(fs.existsSync(path.join(memoryRoot, 'teams', 'openclaw-content-team.md')));
  assert.match(fs.readFileSync(path.join(memoryRoot, 'AGENTS.md'), 'utf8'), /Memory Rules/);
  assert.match(fs.readFileSync(path.join(memoryRoot, 'runs', `${task.id}.md`), 'utf8'), /Harness 记忆同步/);

  const patch = JSON.parse(fs.readFileSync(path.join(task.artifact_root, 'memory-patch.json'), 'utf8'));
  assert.equal(patch.task_id, task.id);
  assert.equal(patch.team, 'openclaw-content-team');
  assert.ok(patch.memory_updates.some((item) => item.path === `runs/${task.id}.md`));

  const status = jsonCli(['status', task.id, '--root', root]);
  assert.equal(status.artifacts.memory_update, path.join(task.artifact_root, '14-memory-update.md'));
  assert.equal(status.artifacts.memory_patch, path.join(task.artifact_root, 'memory-patch.json'));
});

test('opc memory sync defaults to the team Obsidian memory vault', () => {
  const root = makeRoot('opc-memory-root-');
  const wikiRoot = makeWiki();
  const task = createCompletedContentTask({ root, wikiRoot });

  const result = jsonCli(['memory', 'sync', task.id, '--root', root]);

  assert.equal(result.memory_root, '/Users/jerry/Documents/knowledge/team-knowledge/opc-memory');
  assert.ok(fs.existsSync(path.join('/Users/jerry/Documents/knowledge/team-knowledge/opc-memory', 'runs', `${task.id}.md`)));
});
