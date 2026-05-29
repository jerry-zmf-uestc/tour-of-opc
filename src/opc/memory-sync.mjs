import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_TEAM_MEMORY_ROOT = '/Users/jerry/Documents/knowledge/team-knowledge/opc-memory';

const nowIso = () => new Date().toISOString();

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const writeText = (file, content) => {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
};

const writeJson = (file, value) => {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
};

const readIfExists = (file) => (file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

const relativeMemoryPath = (file, memoryRoot) => path.relative(memoryRoot, file).split(path.sep).join('/');

const memoryRootFor = ({ root, memoryRoot }) =>
  memoryRoot ? path.resolve(memoryRoot) : process.env.OPC_MEMORY_ROOT || DEFAULT_TEAM_MEMORY_ROOT;

const ensureMemoryVault = (memoryRoot) => {
  const dirs = ['agents', 'decisions', 'lessons', 'people', 'playbooks', 'projects', 'runs', 'teams'];
  for (const dir of dirs) {
    ensureDir(path.join(memoryRoot, dir));
  }

  writeText(path.join(memoryRoot, 'AGENTS.md'), `# AGENTS.md

## Memory Rules

- Keep this vault Obsidian-compatible: plain Markdown, stable relative links, and no secrets.
- Store task-level facts in \`runs/\` and reusable patterns in \`lessons/\`.
- Promote repeated lessons into \`playbooks/\` or team memory only after review.
- Do not use this vault as a scheduler; the host runtime owns automation and wakeups.
`);

  const todoPath = path.join(memoryRoot, 'TODO.md');
  if (!fs.existsSync(todoPath)) {
    writeText(todoPath, '# TODO\n\n- Review new memory patches before promoting them into playbooks or skills.\n');
  }
};

const renderRunMemory = ({ task, retrospective, manifest }) => `---
task_id: ${task.id}
team: ${task.target_team}
status: ${task.status}
created_at: ${task.created_at}
updated_at: ${task.updated_at}
---

# ${task.title}

## Summary

- Team: ${task.target_team}
- Type: ${task.type}
- Status: ${task.status}
- Artifact root: ${task.artifact_root}

## Key Artifacts

${Object.entries(task.artifacts || {}).map(([name, file]) => `- ${name}: ${file}`).join('\n') || '- No artifacts recorded.'}

## Retrospective Snapshot

${retrospective.trim() || 'No retrospective artifact was available at sync time.'}

## Publish Snapshot

${manifest ? `- Channels: ${(manifest.channels || []).join(', ') || 'none'}\n- External publish attempted: ${manifest.external_publish_attempted === true}` : '- No publish manifest was available at sync time.'}
`;

const renderLessonMemory = ({ task, lessons }) => `---
task_id: ${task.id}
team: ${task.target_team}
source: lessons.yaml
---

# Lessons - ${task.title}

## Source Lessons

\`\`\`yaml
${lessons.trim() || 'No lessons.yaml artifact was available at sync time.'}
\`\`\`

## Promotion Guidance

- Treat this as L1 evidence.
- Promote to team memory or playbooks only after repeated signal or explicit review.
- If the lesson implies a skill change, create a separate patch proposal and validate it with tests.
`;

const renderTeamMemory = ({ task }) => `# ${task.target_team}

## Scope

This team memory file tracks stable operating guidance for ${task.target_team}.

## Current Memory Sources

- Latest synced task: [[runs/${task.id}|${task.title}]]
- Latest lesson candidate: [[lessons/${task.id}|Lessons - ${task.title}]]

## Promotion Rule

Task memories are evidence. Stable team rules should be promoted from repeated runs, reviewed lessons, or explicit operator approval.
`;

const renderRouterAgentMemory = () => `# opc-router

## Memory Sync Contract

\`opc memory sync <task-id>\` exports task artifacts into an Obsidian-compatible shared memory vault.

The command is idempotent for the same task and does not schedule, wake, publish, deploy, or call external services.
`;

const renderProjectMemory = () => `# OpenClaw Operating Desk

## Shared Memory Model

- \`runs/\` stores task-specific execution memory.
- \`lessons/\` stores L1 lesson candidates.
- \`teams/\` stores reviewed team-level memory.
- \`playbooks/\` stores promoted repeatable procedures.
`;

const renderMemoryUpdate = ({ task, memoryRoot, files }) => `# Memory Update

## Task

${task.title}

## Memory Root

${memoryRoot}

## Files Written

${files.map((file) => `- ${relativeMemoryPath(file, memoryRoot)}`).join('\n')}

## Notes

- This update writes durable memory artifacts only.
- Host OpenClaw automation may call this command, but scheduling is intentionally outside opc-router.
`;

export class MemorySyncer {
  constructor({ store }) {
    this.store = store;
  }

  syncTask({ id, memoryRoot } = {}) {
    const task = this.store.getTaskStatus(id);
    const targetRoot = memoryRootFor({ root: this.store.root, memoryRoot });
    ensureMemoryVault(targetRoot);

    const lessons = readIfExists(task.artifacts?.lessons);
    const retrospective = readIfExists(task.artifacts?.retrospective);
    const manifest = task.artifacts?.publish_manifest && fs.existsSync(task.artifacts.publish_manifest)
      ? JSON.parse(fs.readFileSync(task.artifacts.publish_manifest, 'utf8'))
      : null;

    const files = [
      path.join(targetRoot, 'runs', `${task.id}.md`),
      path.join(targetRoot, 'lessons', `${task.id}.md`),
      path.join(targetRoot, 'teams', `${task.target_team}.md`),
      path.join(targetRoot, 'agents', 'opc-router.md'),
      path.join(targetRoot, 'projects', 'openclaw-operating-desk.md')
    ];

    writeText(files[0], renderRunMemory({ task, retrospective, manifest }));
    writeText(files[1], renderLessonMemory({ task, lessons }));
    writeText(files[2], renderTeamMemory({ task }));
    writeText(files[3], renderRouterAgentMemory());
    writeText(files[4], renderProjectMemory());

    const patch = {
      version: 1,
      task_id: task.id,
      team: task.target_team,
      synced_at: nowIso(),
      memory_root: targetRoot,
      memory_updates: files.map((file) => ({
        path: relativeMemoryPath(file, targetRoot),
        absolute_path: file
      })),
      artifact_sources: {
        task: path.join(task.artifact_root, 'task.json'),
        event_log: path.join(task.artifact_root, 'event-log.jsonl'),
        lessons: task.artifacts?.lessons || null,
        retrospective: task.artifacts?.retrospective || null,
        publish_manifest: task.artifacts?.publish_manifest || null
      }
    };

    const memoryUpdatePath = path.join(task.artifact_root, '14-memory-update.md');
    const patchPath = path.join(task.artifact_root, 'memory-patch.json');
    writeText(memoryUpdatePath, renderMemoryUpdate({ task, memoryRoot: targetRoot, files }));
    writeJson(patchPath, patch);

    const updated = {
      ...task,
      artifacts: {
        ...(task.artifacts || {}),
        memory_update: memoryUpdatePath,
        memory_patch: patchPath
      },
      updated_at: nowIso()
    };
    this.store.saveTask(updated);
    this.store.recordEvent({
      task: updated,
      event_type: 'memory_sync_completed',
      message: 'Synced task memory into shared Obsidian-compatible vault',
      metadata: {
        memory_root: targetRoot,
        files: files.map((file) => relativeMemoryPath(file, targetRoot))
      }
    });

    return {
      task_id: task.id,
      memory_root: targetRoot,
      files
    };
  }
}
