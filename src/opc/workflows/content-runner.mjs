import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFAULT_SKILL_ROOT = path.join(REPO_ROOT, 'skill');

export class ContentWorkflowRunner {
  constructor({ store } = {}) {
    this.store = store;
  }

  runTask(task, options = {}) {
    if (task.type !== 'content') {
      return task;
    }
    if (task.status === 'completed') {
      return task;
    }

    const current = refreshArtifacts(task);

    if (!hasResearchArtifacts(current)) {
      return writeStagePacket({
        task: current,
        store: this.store,
        stage: 'research',
        subskill: 'content-research',
        inputs: ['task.json'],
        expectedOutputs: ['01-evidence-pack.md', '02-outline.md', '03-review-checklist.md'],
        llmOwned: ['wiki retrieval judgment', 'evidence synthesis', 'gap analysis'],
        gateAfter: 'outline_review',
        executeSkill: options.executeSkill
      });
    }

    if (current.approvals?.outline_review?.status !== 'approved') {
      return requireGate({
        task: current,
        store: this.store,
        gate: 'outline_review',
        message: 'Content research artifacts are ready for outline_review'
      });
    }

    if (!hasDraftArtifacts(current)) {
      return writeStagePacket({
        task: current,
        store: this.store,
        stage: 'drafting',
        subskill: 'content-drafting',
        inputs: ['task.json', '01-evidence-pack.md', '02-outline.md', '03-review-checklist.md'],
        expectedOutputs: ['04-draft.md', '05-draft-review.md'],
        llmOwned: ['article drafting', 'editorial review', 'source note preservation'],
        gateAfter: 'final_review',
        executeSkill: options.executeSkill
      });
    }

    if (current.approvals?.final_review?.status !== 'approved') {
      return requireGate({
        task: current,
        store: this.store,
        gate: 'final_review',
        message: 'Content draft artifacts are ready for final_review'
      });
    }

    if (!hasFinalArtifacts(current)) {
      return writeStagePacket({
        task: current,
        store: this.store,
        stage: 'final',
        subskill: 'content-drafting',
        inputs: ['task.json', '04-draft.md', '05-draft-review.md'],
        expectedOutputs: ['06-final.md', '07-retrospective.md', '08-publish-plan.md', 'lessons.yaml'],
        llmOwned: ['final packaging', 'retrospective interpretation', 'task-specific lesson extraction'],
        gateAfter: 'publish_review',
        executeSkill: options.executeSkill
      });
    }

    let withFinal = current;
    if (!withFinal.artifacts?.obsidian_final) {
      const obsidianFinal = writeObsidianFinal({
        task: withFinal,
        finalPath: path.join(withFinal.artifact_root, '06-final.md'),
        wikiRoot: options.wikiRoot || withFinal.inputs?.wiki_root
      });
      withFinal = {
        ...withFinal,
        artifacts: {
          ...(withFinal.artifacts || {}),
          obsidian_final: obsidianFinal
        }
      };
      this.store.saveTask(withFinal);
      this.store.recordEvent({
        task: withFinal,
        event_type: 'content_obsidian_final_written',
        message: 'Wrote final content to Obsidian writing/finals',
        metadata: { artifact: obsidianFinal }
      });
    }

    if (withFinal.approvals?.publish_review?.status !== 'approved') {
      return requireGate({
        task: withFinal,
        store: this.store,
        gate: 'publish_review',
        message: 'Content final artifacts are ready for publish_review'
      });
    }

    if (!hasPublishArtifacts(withFinal)) {
      return writeStagePacket({
        task: withFinal,
        store: this.store,
        stage: 'publishing',
        subskill: 'content-publishing',
        inputs: ['task.json', '06-final.md', '08-publish-plan.md'],
        expectedOutputs: publishOutputsFor(withFinal),
        llmOwned: ['channel adaptation', 'publisher handoff quality', 'publish manifest preparation'],
        gateAfter: null,
        executeSkill: options.executeSkill
      });
    }

    const completed = {
      ...refreshArtifacts(withFinal),
      required_gate: null,
      required_subskill: null
    };
    this.store.saveTask(completed);
    return this.store.updateTaskStatus({
      task: completed,
      status: 'completed',
      event_type: 'task_completed',
      message: 'Content task completed after publish_review'
    });
  }
}

const artifactPath = (task, name) => path.join(task.artifact_root, name);

const exists = (task, name) => fs.existsSync(artifactPath(task, name));

const hasAll = (task, names) => names.every((name) => exists(task, name));

const hasResearchArtifacts = (task) =>
  hasAll(task, ['01-evidence-pack.md', '02-outline.md', '03-review-checklist.md']);

const hasDraftArtifacts = (task) =>
  hasAll(task, ['04-draft.md', '05-draft-review.md']);

const hasFinalArtifacts = (task) =>
  hasAll(task, ['06-final.md', '07-retrospective.md', '08-publish-plan.md', 'lessons.yaml']);

const hasPublishArtifacts = (task) =>
  hasAll(task, publishOutputsFor(task));

const channelsFor = (task) => {
  const channels = Array.isArray(task.inputs?.channels) && task.inputs.channels.length
    ? task.inputs.channels
    : ['feishu', 'wechat'];
  return [...new Set(channels.map((channel) => String(channel).trim().toLowerCase()).filter(Boolean))];
};

const channelDraftName = (channel) => {
  if (channel === 'feishu') return '10-feishu-draft.md';
  if (channel === 'wechat') return '11-wechat-draft.md';
  return `${slugify(channel, 'channel')}-draft.md`;
};

const publishOutputsFor = (task) => [
  '09-publish-log.md',
  ...channelsFor(task).map(channelDraftName),
  '12-publisher-handoff.md',
  'publish-manifest.json'
];

const refreshArtifacts = (task) => {
  const artifactNames = {
    evidence_pack: '01-evidence-pack.md',
    outline: '02-outline.md',
    review_checklist: '03-review-checklist.md',
    draft: '04-draft.md',
    draft_review: '05-draft-review.md',
    final: '06-final.md',
    retrospective: '07-retrospective.md',
    publish_plan: '08-publish-plan.md',
    publish_log: '09-publish-log.md',
    publisher_handoff: '12-publisher-handoff.md',
    publish_manifest: 'publish-manifest.json',
    lessons: 'lessons.yaml'
  };
  const artifacts = { ...(task.artifacts || {}) };
  for (const [key, fileName] of Object.entries(artifactNames)) {
    const file = artifactPath(task, fileName);
    if (fs.existsSync(file)) artifacts[key] = file;
  }
  for (const channel of channelsFor(task)) {
    const file = artifactPath(task, channelDraftName(channel));
    if (fs.existsSync(file)) artifacts[`${channel}_draft`] = file;
  }
  return { ...task, artifacts };
};

const writeStagePacket = ({ task, store, stage, subskill, inputs, expectedOutputs, llmOwned, gateAfter, executeSkill = false }) => {
  const packetPath = artifactPath(task, 'stage-packet.json');
  const instructionsPath = artifactPath(task, 'stage-instructions.md');
  const packet = {
    version: 1,
    task_id: task.id,
    title: task.title,
    team: task.target_team,
    stage,
    subskill,
    artifact_root: task.artifact_root,
    inputs,
    expected_outputs: expectedOutputs,
    gate_after: gateAfter,
    router_owned: ['status', 'event-log', 'approvals', 'artifact path registration'],
    llm_owned: llmOwned
  };
  fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(instructionsPath, renderStageInstructions(packet));

  const updated = {
    ...task,
    status: 'in_progress',
    required_gate: null,
    required_subskill: subskill,
    stage,
    artifacts: {
      ...(task.artifacts || {}),
      stage_packet: packetPath,
      stage_instructions: instructionsPath
    }
  };
  store.saveTask(updated);
  store.recordEvent({
    task: updated,
    event_type: 'content_stage_packet_created',
    message: `Created ${stage} stage packet for ${subskill}`,
    metadata: { stage, subskill, artifact: 'stage-packet.json' }
  });
  if (!executeSkill) {
    return updated;
  }
  return writeSkillHandoff({ task: updated, store, packet });
};

const writeSkillHandoff = ({ task, store, packet, skillRoot = DEFAULT_SKILL_ROOT }) => {
  const skillFile = path.join(skillRoot, packet.subskill, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    throw new Error(`Skill not found for ${packet.subskill}: ${skillFile}`);
  }

  const requestPath = artifactPath(task, 'skill-execution-request.json');
  const handoffPath = artifactPath(task, 'skill-handoff.md');
  const request = {
    version: 1,
    status: 'ready_for_agent_execution',
    task_id: packet.task_id,
    title: packet.title,
    team: packet.team,
    stage: packet.stage,
    subskill: packet.subskill,
    skill_file: skillFile,
    artifact_root: packet.artifact_root,
    stage_packet: artifactPath(task, 'stage-packet.json'),
    stage_instructions: artifactPath(task, 'stage-instructions.md'),
    inputs: packet.inputs.map((input) => artifactPath(task, input)),
    expected_outputs: packet.expected_outputs,
    gate_after: packet.gate_after,
    router_owned: packet.router_owned,
    llm_owned: packet.llm_owned
  };

  fs.writeFileSync(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  fs.writeFileSync(handoffPath, renderSkillHandoff(request));

  const updated = {
    ...task,
    artifacts: {
      ...(task.artifacts || {}),
      skill_handoff: handoffPath,
      skill_execution_request: requestPath
    }
  };
  store.saveTask(updated);
  store.recordEvent({
    task: updated,
    event_type: 'skill_execution_requested',
    message: `Prepared ${packet.subskill} skill handoff for ${packet.stage}`,
    metadata: { stage: packet.stage, subskill: packet.subskill, artifact: 'skill-handoff.md' }
  });
  return updated;
};

const renderStageInstructions = (packet) => `# Stage Instructions

## Task

${packet.title}

## Stage

${packet.stage}

## Use Subskill

${packet.subskill}

## Inputs

${packet.inputs.map((input) => `- ${input}`).join('\n')}

## Expected Outputs

${packet.expected_outputs.map((output) => `- ${output}`).join('\n')}

## Boundary

- Router-owned: ${packet.router_owned.join(', ')}
- LLM-owned: ${packet.llm_owned.join(', ')}

Write expected outputs into the artifact root, then rerun \`opc run ${packet.task_id}\`.
`;

const renderSkillHandoff = (request) => `# Skill Execution Handoff

## Task

${request.title}

## Stage

${request.stage}

## Subskill

${request.subskill}

## Skill File

${request.skill_file}

## Stage Packet

${request.stage_packet}

## Inputs

${request.inputs.map((input) => `- ${input}`).join('\n')}

## Expected Outputs

${request.expected_outputs.map((output) => `- ${path.join(request.artifact_root, output)}`).join('\n')}

## Execution Contract

1. Read \`stage-packet.json\` and this handoff before writing artifacts.
2. Use the listed skill as the primary instruction source.
3. Write only the expected outputs into the artifact root unless the skill contract explicitly requires another local artifact.
4. Do not approve gates, complete the task, publish externally, or mutate router state.
5. After writing outputs, rerun \`opc run ${request.task_id}\`.
`;

const requireGate = ({ task, store, gate, message }) => {
  const updated = {
    ...refreshArtifacts(task),
    required_gate: gate,
    required_subskill: null
  };
  store.saveTask(updated);
  return store.updateTaskStatus({
    task: updated,
    status: 'waiting_approval',
    event_type: 'approval_required',
    message,
    metadata: { gate }
  });
};

const slugify = (value, fallback) => {
  const slug = String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
};

const writeObsidianFinal = ({ task, finalPath, wikiRoot }) => {
  if (!wikiRoot) {
    throw new Error('Wiki root is required to write final content to Obsidian. Pass --wiki-root or set task inputs.wiki_root.');
  }
  const finalContent = fs.readFileSync(finalPath, 'utf8');
  const finalsDir = path.join(wikiRoot, 'writing', 'finals');
  fs.mkdirSync(finalsDir, { recursive: true });
  const createdDate = String(task.created_at || new Date().toISOString()).slice(0, 10);
  const fileName = `${createdDate}-${slugify(task.title, task.id)}.md`;
  const targetPath = path.join(finalsDir, fileName);
  fs.writeFileSync(targetPath, finalContent);
  return targetPath;
};
