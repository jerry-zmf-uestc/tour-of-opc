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
  const wikiRoot = makeRoot('opc-publish-wiki-');
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
  writeFile(path.join(task.artifact_root, '02-outline.md'), '# Article Outline\n\n## Thesis\n\nHarness 发布门禁。\n');
  writeFile(path.join(task.artifact_root, '03-review-checklist.md'), '# Review Checklist\n\n- [ ] sourced\n');
};

const writeDraftArtifacts = (task) => {
  writeFile(path.join(task.artifact_root, '04-draft.md'), '# Draft\n\nHarness 是 Agent 周围的工程化运行层。\n');
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
    '写一篇关于 Harness 发布门禁的飞书文档',
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

test('opc publish performs a dry-run readiness check without external side effects', () => {
  const root = makeRoot('opc-publish-root-');
  const wikiRoot = makeWiki();
  const task = createCompletedContentTask({ root, wikiRoot });

  const result = jsonCli(['publish', task.id, '--channel', 'feishu', '--root', root]);
  const reportPath = path.join(task.artifact_root, '13-publish-readiness-report.md');
  const manifest = JSON.parse(fs.readFileSync(path.join(task.artifact_root, 'publish-manifest.json'), 'utf8'));

  assert.equal(result.mode, 'dry-run');
  assert.equal(result.channel, 'feishu');
  assert.equal(result.ready, true);
  assert.equal(result.external_publish_attempted, false);
  assert.equal(manifest.external_publish_attempted, false);
  assert.ok(fs.existsSync(reportPath));
  assert.match(fs.readFileSync(reportPath, 'utf8'), /Dry-run only/);

  const status = jsonCli(['status', task.id, '--root', root]);
  assert.equal(status.artifacts.publish_readiness_report, reportPath);
});

test('opc publish --execute refuses real external publishing until adapter is configured', () => {
  const root = makeRoot('opc-publish-root-');
  const wikiRoot = makeWiki();
  const task = createCompletedContentTask({ root, wikiRoot });

  assert.throws(
    () => execFileSync(process.execPath, ['bin/opc.mjs', 'publish', task.id, '--channel', 'feishu', '--execute', '--root', root], {
      cwd: path.resolve('.'),
      encoding: 'utf8',
      stdio: 'pipe'
    }),
    /External publish execution is not implemented/
  );
});
