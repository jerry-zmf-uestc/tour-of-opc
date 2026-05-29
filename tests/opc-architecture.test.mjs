import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { OpcController } from '../src/opc/controller.mjs';
import { FileTaskStore } from '../src/opc/task-store.mjs';
import { SimpleWorkflowRunner } from '../src/opc/workflows/simple-runner.mjs';

const makeRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opc-architecture-'));

test('OpcController delegates task execution to an injectable workflow runner', () => {
  const root = makeRoot();
  const calls = [];
  const runner = {
    runTask(task, context) {
      calls.push({ task, context });
      return { ...task, status: 'custom_runner_status' };
    }
  };

  const controller = new OpcController({ root, runner });
  const task = controller.createTask({ title: '开发一个登录页' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].task.status, 'created');
  assert.equal(calls[0].context.route.type, 'dev');
  assert.equal(task.status, 'custom_runner_status');
});

test('FileTaskStore creates a task record without owning workflow transitions', () => {
  const root = makeRoot();
  const store = new FileTaskStore({ root });
  store.ensureWorkspace();

  const task = store.createTaskRecord({
    title: '写一篇 AI Agent Harness 文章',
    route: {
      type: 'content',
      target_team: 'openclaw-content-team',
      matched_keyword: '文章'
    },
    inputs: {}
  });

  assert.equal(task.status, 'created');
  assert.ok(fs.existsSync(path.join(task.artifact_root, 'task.json')));
});

test('SimpleWorkflowRunner advances a created task to assigned and records the transition', () => {
  const root = makeRoot();
  const store = new FileTaskStore({ root });
  const runner = new SimpleWorkflowRunner({ store });
  store.ensureWorkspace();
  const task = store.createTaskRecord({
    title: '基于 Obsidian 写文章',
    route: {
      type: 'content',
      target_team: 'openclaw-content-team',
      matched_keyword: '文章'
    },
    inputs: {}
  });

  const assigned = runner.runTask(task, { route: { type: 'content' } });

  assert.equal(assigned.status, 'assigned');
  const eventLog = fs.readFileSync(path.join(task.artifact_root, 'event-log.jsonl'), 'utf8');
  assert.match(eventLog, /task_created/);
  assert.match(eventLog, /task_assigned/);
});
