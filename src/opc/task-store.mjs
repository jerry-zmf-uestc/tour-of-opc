import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { renderRouterYaml, TEAM_TARGETS } from './router.mjs';

const RD_SHARED_DIRS = ['tasks', 'specs', 'architecture', 'implementation', 'qa', 'deploy', 'reviews', 'decisions', 'lessons'];
const CONTENT_SHARED_DIRS = ['tasks', 'briefs', 'source-packs', 'outlines', 'drafts', 'reviews', 'publish', 'decisions', 'lessons'];
const GLOBAL_SHARED_DIRS = ['task-registry', 'playbooks', 'decisions', 'retrospectives', 'lessons', 'skill-patch-proposals', 'metrics'];
const RD_ROLES = ['rd-leader', 'product-pmo', 'design-architect', 'tech-lead', 'fullstack-builder', 'quality-release'];
const CONTENT_ROLES = ['content-leader', 'researcher', 'planner', 'writer', 'editor', 'publisher'];

export const defaultWorkspaceRoot = () =>
  process.env.OPC_WORKSPACE_ROOT || path.join(os.homedir(), '.qclaw', 'teams');

export const registryPathFor = (root) => path.join(root, 'opc-router', 'state', 'task-registry.json');

const nowIso = () => new Date().toISOString();

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const writeIfMissing = (file, content) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content);
  }
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const writeJson = (file, value) => {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

const renderTaskSchemaYaml = () => `version: 1
required:
  - id
  - title
  - type
  - target_team
  - status
  - artifact_root
statuses:
  - created
  - classified
  - assigned
  - planning
  - in_progress
  - review
  - waiting_approval
  - approved
  - delivery
  - completed
  - blocked
  - failed
  - retrying
  - archived
  - cancelled
types:
  - dev
  - content
  - hybrid
  - ops
`;

const roleScope = (role) => {
  const scopes = {
    'rd-leader': 'Own the BMAD delivery flow for Team A and report back to opc-router.',
    'product-pmo': 'Turn user goals into PRD, acceptance criteria, dependencies, and task plans.',
    'design-architect': 'Produce UI, architecture, API, data, security, and deployment constraints.',
    'tech-lead': 'Review technical feasibility, implementation strategy, risks, and code quality.',
    'fullstack-builder': 'Use Codex to implement frontend/backend tasks and provide verification handoffs.',
    'quality-release': 'Run tests, build, health checks, release checks, and rollback planning.',
    'content-leader': 'Own the content pipeline, quality gates, publishing rhythm, and team handoffs.',
    researcher: 'Search Obsidian LLM Wiki, build source packs, and identify evidence gaps.',
    planner: 'Define audience, thesis, angle, titles, and article structure.',
    writer: 'Draft local Obsidian Markdown from approved briefs and outlines.',
    editor: 'Review structure, facts, citations, style, and unresolved verification markers.',
    publisher: 'Adapt reviewed drafts for Feishu and other channels, then record publication state.'
  };
  return scopes[role] || 'Deliver role-specific work through shared artifacts and explicit handoffs.';
};

const renderSoul = ({ id, role, scope }) => `# SOUL.md - ${id}

## Role

${role}

## Scope

${scope}

## Boundaries

- Write deliverables to the team shared directory.
- Do not approve your own specialist output.
- Escalate missing permissions, unclear requirements, or external side effects.
- Do not publish externally or deploy to production without approval from opc-router.
`;

const renderAgents = ({ id }) => `# AGENTS.md - ${id}

## Handoff

Every handoff must include:

- What changed or was produced
- Artifact paths
- Verification steps
- Known risks or unresolved items
- Requested next action
`;

const ensureAgentWorkspace = ({ dir, id, role, scope }) => {
  ensureDir(dir);
  ensureDir(path.join(dir, 'memory'));
  ensureDir(path.join(dir, 'skills'));
  ensureDir(path.join(dir, '.openclaw'));
  writeIfMissing(path.join(dir, 'SOUL.md'), renderSoul({ id, role, scope }));
  writeIfMissing(path.join(dir, 'AGENTS.md'), renderAgents({ id }));
  writeIfMissing(path.join(dir, 'MEMORY.md'), `# MEMORY.md - ${id}\n\nNo promoted lessons yet.\n`);
};

const formatDatePart = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const newTaskId = () => `task-${formatDatePart(new Date())}-${crypto.randomBytes(2).toString('hex')}`;

const approvalGatesFor = (type) => {
  if (type === 'dev') {
    return ['prd_review', 'architecture_review', 'deploy_review'];
  }
  if (type === 'hybrid') {
    return ['source_review', 'outline_review', 'final_review', 'publish_review'];
  }
  if (type === 'ops') {
    return [];
  }
  return ['outline_review', 'final_review', 'publish_review'];
};

const outputsFor = (type) => {
  if (type === 'dev') {
    return ['prd', 'architecture', 'tasks', 'qa_report', 'deploy_report'];
  }
  if (type === 'hybrid') {
    return ['team_a_source_pack', 'brief', 'draft', 'final', 'publish_log'];
  }
  if (type === 'ops') {
    return ['operation_log'];
  }
  return ['research_brief', 'source_pack', 'outline', 'draft', 'final', 'publish_log'];
};

const artifactRootFor = ({ root, targetTeam, id }) => {
  if (targetTeam === TEAM_TARGETS.hybrid) {
    return path.join(root, 'shared', 'task-registry', id);
  }
  return path.join(root, targetTeam, 'shared', 'tasks', id);
};

export class FileTaskStore {
  constructor({ root = defaultWorkspaceRoot() } = {}) {
    this.root = root;
  }

  ensureWorkspace() {
    const routerRoot = path.join(this.root, TEAM_TARGETS.ops);
    ensureDir(path.join(routerRoot, 'logs'));
    ensureDir(path.join(routerRoot, 'state'));
    ensureAgentWorkspace({
      dir: routerRoot,
      id: TEAM_TARGETS.ops,
      role: 'Unified controller',
      scope: 'Route tasks, own global state, manage approvals, and archive lessons.'
    });

    for (const dir of RD_SHARED_DIRS) {
      ensureDir(path.join(this.root, TEAM_TARGETS.dev, 'shared', dir));
    }
    for (const role of RD_ROLES) {
      ensureAgentWorkspace({
        dir: path.join(this.root, TEAM_TARGETS.dev, role),
        id: `${TEAM_TARGETS.dev}-${role}`,
        role,
        scope: roleScope(role)
      });
    }
    for (const dir of CONTENT_SHARED_DIRS) {
      ensureDir(path.join(this.root, TEAM_TARGETS.content, 'shared', dir));
    }
    for (const role of CONTENT_ROLES) {
      ensureAgentWorkspace({
        dir: path.join(this.root, TEAM_TARGETS.content, role),
        id: `${TEAM_TARGETS.content}-${role}`,
        role,
        scope: roleScope(role)
      });
    }
    for (const dir of GLOBAL_SHARED_DIRS) {
      ensureDir(path.join(this.root, 'shared', dir));
    }

    writeIfMissing(path.join(routerRoot, 'router.yaml'), renderRouterYaml());
    writeIfMissing(path.join(routerRoot, 'task-schema.yaml'), renderTaskSchemaYaml());
    writeIfMissing(registryPathFor(this.root), `${JSON.stringify({ version: 1, updated_at: null, tasks: [] }, null, 2)}\n`);

    return {
      root: this.root,
      router_root: routerRoot,
      registry_path: registryPathFor(this.root)
    };
  }

  createTaskRecord({ title, route, inputs = {} }) {
    if (!title || !String(title).trim()) {
      throw new Error('Task title is required');
    }
    this.ensureWorkspace();
    const id = newTaskId();
    const createdAt = nowIso();
    const artifactRoot = artifactRootFor({ root: this.root, targetTeam: route.target_team, id });
    ensureDir(artifactRoot);
    const task = {
      id,
      title,
      type: route.type,
      target_team: route.target_team,
      owner: 'opc-router',
      status: 'created',
      created_at: createdAt,
      updated_at: createdAt,
      matched_keyword: route.matched_keyword ?? null,
      inputs,
      context_sources: ['repo://current', 'obsidian://llm-wiki'],
      approval_gates: approvalGatesFor(route.type),
      outputs: outputsFor(route.type),
      artifact_root: artifactRoot
    };

    this.saveTask(task);
    this.recordEvent({
      task,
      event_type: 'task_created',
      message: `Created ${task.type} task for ${task.target_team}`
    });
    return task;
  }

  saveTask(task) {
    writeJson(path.join(task.artifact_root, 'task.json'), task);
    this.upsertRegistrySummary(task);
  }

  updateTaskStatus({ task, status, event_type, message, metadata = {} }) {
    const updated = {
      ...task,
      status,
      updated_at: nowIso()
    };
    this.saveTask(updated);
    this.recordEvent({ task: updated, event_type, message, metadata });
    return updated;
  }

  approveGate({ id, gate }) {
    const task = this.getTaskStatus(id);
    if (!task.approval_gates.includes(gate)) {
      throw new Error(`Gate is not declared on task ${id}: ${gate}`);
    }
    const approvedAt = nowIso();
    const approvals = {
      ...(task.approvals || {}),
      [gate]: {
        status: 'approved',
        approved_at: approvedAt
      }
    };
    const allApproved = task.approval_gates.every((item) => approvals[item]?.status === 'approved');
    const nextStatus = allApproved ? 'approved' : task.status === 'waiting_approval' ? 'assigned' : task.status;
    const updated = {
      ...task,
      approvals,
      status: nextStatus,
      updated_at: approvedAt
    };
    this.saveTask(updated);
    this.recordEvent({
      task: updated,
      event_type: 'approval_recorded',
      message: `Approved gate ${gate}`,
      metadata: { gate }
    });
    return updated;
  }

  requestRetry({ id, reason = '' }) {
    const task = this.getTaskStatus(id);
    const updated = {
      ...task,
      status: 'retrying',
      retries: (task.retries || 0) + 1,
      retry_reason: reason,
      updated_at: nowIso()
    };
    this.saveTask(updated);
    this.recordEvent({
      task: updated,
      event_type: 'retry_requested',
      message: reason ? `Retry requested: ${reason}` : 'Retry requested',
      metadata: { reason }
    });
    return updated;
  }

  getTaskStatus(id) {
    if (!id) {
      throw new Error('Task id is required');
    }
    this.ensureWorkspace();
    const registry = readJson(registryPathFor(this.root));
    const summary = registry.tasks.find((item) => item.id === id);
    if (!summary) {
      throw new Error(`Task not found: ${id}`);
    }
    const taskFile = path.join(summary.artifact_root, 'task.json');
    return fs.existsSync(taskFile) ? readJson(taskFile) : summary;
  }

  listTasks() {
    this.ensureWorkspace();
    return readJson(registryPathFor(this.root)).tasks;
  }

  getTaskEvents(id) {
    const task = this.getTaskStatus(id);
    const eventLog = path.join(task.artifact_root, 'event-log.jsonl');
    if (!fs.existsSync(eventLog)) {
      return [];
    }
    return fs
      .readFileSync(eventLog, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  recordEvent({ task, event_type, message, metadata = {} }) {
    const event = {
      task_id: task.id,
      event_type,
      status: task.status,
      target_team: task.target_team,
      message,
      ...metadata,
      created_at: nowIso()
    };
    const line = `${JSON.stringify(event)}\n`;
    fs.appendFileSync(path.join(task.artifact_root, 'event-log.jsonl'), line);
    fs.appendFileSync(path.join(this.root, TEAM_TARGETS.ops, 'logs', 'event-log.jsonl'), line);
  }

  upsertRegistrySummary(task) {
    const registryFile = registryPathFor(this.root);
    const registry = readJson(registryFile);
    const summary = {
      id: task.id,
      title: task.title,
      type: task.type,
      target_team: task.target_team,
      status: task.status,
      artifact_root: task.artifact_root,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
    registry.tasks = registry.tasks.filter((item) => item.id !== task.id);
    registry.tasks.push(summary);
    registry.updated_at = task.updated_at;
    writeJson(registryFile, registry);
  }
}
