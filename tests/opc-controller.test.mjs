import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { classifyTask } from '../src/opc/router.mjs';
import { approveTask, createTask, ensureWorkspace, getTaskEvents, getTaskStatus, retryTask } from '../src/opc/tasks.mjs';

const makeRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opc-controller-'));

test('classifies development, content, and hybrid tasks', () => {
  assert.equal(classifyTask('修复登录接口 bug，并补充测试').type, 'dev');
  assert.equal(classifyTask('基于 Obsidian 写一篇公众号文章').type, 'content');
  assert.equal(classifyTask('把研发方案整理成飞书技术白皮书').type, 'hybrid');
});

test('initializes the minimum controller and team workspace layout', () => {
  const root = makeRoot();

  const result = ensureWorkspace({ root });

  assert.equal(result.root, root);
  assert.ok(fs.existsSync(path.join(root, 'opc-router', 'router.yaml')));
  assert.ok(fs.existsSync(path.join(root, 'opc-router', 'task-schema.yaml')));
  assert.ok(fs.existsSync(path.join(root, 'opc-router', 'state', 'task-registry.json')));
  assert.ok(fs.existsSync(path.join(root, 'openclaw-rd-team', 'shared', 'tasks')));
  assert.ok(fs.existsSync(path.join(root, 'openclaw-content-team', 'shared', 'tasks')));
  assert.ok(fs.existsSync(path.join(root, 'shared', 'lessons')));
});

test('initializes private workspaces for the router and both teams', () => {
  const root = makeRoot();

  ensureWorkspace({ root });

  const expectedWorkspaces = [
    ['opc-router'],
    ['openclaw-rd-team', 'rd-leader'],
    ['openclaw-rd-team', 'product-pmo'],
    ['openclaw-rd-team', 'design-architect'],
    ['openclaw-rd-team', 'tech-lead'],
    ['openclaw-rd-team', 'fullstack-builder'],
    ['openclaw-rd-team', 'quality-release'],
    ['openclaw-content-team', 'content-leader'],
    ['openclaw-content-team', 'researcher'],
    ['openclaw-content-team', 'planner'],
    ['openclaw-content-team', 'writer'],
    ['openclaw-content-team', 'editor'],
    ['openclaw-content-team', 'publisher']
  ];

  for (const parts of expectedWorkspaces) {
    assert.ok(fs.existsSync(path.join(root, ...parts, 'SOUL.md')), parts.join('/'));
    assert.ok(fs.existsSync(path.join(root, ...parts, 'AGENTS.md')), parts.join('/'));
  }
});

test('creates a content task with registry entry, artifact directory, and event log', () => {
  const root = makeRoot();

  const task = createTask({
    root,
    title: '基于 Obsidian 知识库写一篇 AI Agent Harness 飞书文档'
  });

  assert.match(task.id, /^task-\d{8}-\d{6}-[a-z0-9]{4}$/);
  assert.equal(task.type, 'content');
  assert.equal(task.target_team, 'openclaw-content-team');
  assert.equal(task.status, 'assigned');
  assert.ok(task.artifact_root.endsWith(path.join('openclaw-content-team', 'shared', 'tasks', task.id)));

  const registry = JSON.parse(
    fs.readFileSync(path.join(root, 'opc-router', 'state', 'task-registry.json'), 'utf8')
  );
  assert.equal(registry.tasks.length, 1);
  assert.equal(registry.tasks[0].id, task.id);

  const taskFile = path.join(task.artifact_root, 'task.json');
  const eventLog = path.join(task.artifact_root, 'event-log.jsonl');
  assert.ok(fs.existsSync(taskFile));
  assert.ok(fs.existsSync(eventLog));
  assert.match(fs.readFileSync(eventLog, 'utf8'), /task_created/);
});

test('CLI content task accepts audience, channels, and wiki root inputs', () => {
  const root = makeRoot();
  const wikiRoot = makeRoot();

  const output = execFileSync(process.execPath, [
    'bin/opc.mjs',
    'content',
    '写一篇关于 Harness 的飞书文档',
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
  ], { cwd: path.resolve('.'), encoding: 'utf8' });
  const task = JSON.parse(output);

  assert.equal(task.title, '写一篇关于 Harness 的飞书文档');
  assert.equal(task.inputs.audience, '产品负责人');
  assert.deepEqual(task.inputs.channels, ['feishu', 'wechat']);
  assert.deepEqual(task.inputs.publish_destinations, {
    feishu: 'team-wiki',
    wechat: 'manual'
  });
  assert.equal(task.inputs.wiki_root, wikiRoot);
});

test('CLI content task defaults to the team Obsidian wiki vault', () => {
  const root = makeRoot();

  const output = execFileSync(process.execPath, [
    'bin/opc.mjs',
    'content',
    '写一篇关于团队知识库的飞书文档',
    '--root',
    root
  ], { cwd: path.resolve('.'), encoding: 'utf8', env: { ...process.env, OPC_WIKI_ROOT: '' } });
  const task = JSON.parse(output);

  assert.equal(task.inputs.wiki_root, '/Users/jerry/Documents/knowledge/team-knowledge/opc-wiki');
});

test('CLI run --execute-skill writes a skill handoff request', () => {
  const root = makeRoot();
  const createOutput = execFileSync(process.execPath, [
    'bin/opc.mjs',
    'content',
    '写一篇关于 skill handoff 的飞书文档',
    '--root',
    root
  ], { cwd: path.resolve('.'), encoding: 'utf8', env: { ...process.env, OPC_WIKI_ROOT: '' } });
  const created = JSON.parse(createOutput);

  const runOutput = execFileSync(process.execPath, [
    'bin/opc.mjs',
    'run',
    created.id,
    '--execute-skill',
    '--root',
    root
  ], { cwd: path.resolve('.'), encoding: 'utf8', env: { ...process.env, OPC_WIKI_ROOT: '' } });
  const task = JSON.parse(runOutput);

  assert.equal(task.required_subskill, 'content-research');
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'skill-handoff.md')));
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'skill-execution-request.json')));
});

test('loads task status from the registry', () => {
  const root = makeRoot();
  const task = createTask({ root, title: '开发一个登录页' });

  const status = getTaskStatus({ root, id: task.id });

  assert.equal(status.id, task.id);
  assert.equal(status.type, 'dev');
  assert.equal(status.target_team, 'openclaw-rd-team');
  assert.equal(status.status, 'assigned');
});

test('approves a valid gate and records an approval event', () => {
  const root = makeRoot();
  const task = createTask({ root, title: '基于 Obsidian 写一篇公众号文章' });

  const approved = approveTask({ root, id: task.id, gate: 'outline_review' });
  const events = getTaskEvents({ root, id: task.id });

  assert.equal(approved.approvals.outline_review.status, 'approved');
  assert.equal(approved.status, 'assigned');
  assert.equal(events.at(-1).event_type, 'approval_recorded');
  assert.equal(events.at(-1).gate, 'outline_review');
});

test('rejects approval for a gate not declared on the task', () => {
  const root = makeRoot();
  const task = createTask({ root, title: '开发一个登录页' });

  assert.throws(
    () => approveTask({ root, id: task.id, gate: 'publish_review' }),
    /Gate is not declared/
  );
});

test('retries a task with a reason and reassigns it through the runner', () => {
  const root = makeRoot();
  const task = createTask({ root, title: '开发一个登录页' });

  const retried = retryTask({ root, id: task.id, reason: '补齐测试后重试' });
  const events = getTaskEvents({ root, id: task.id });

  assert.equal(retried.status, 'assigned');
  assert.equal(retried.retries, 1);
  assert.equal(events.at(-2).event_type, 'retry_requested');
  assert.equal(events.at(-2).reason, '补齐测试后重试');
  assert.equal(events.at(-1).event_type, 'task_assigned');
});
