#!/usr/bin/env node
import { OpcController } from '../src/opc/controller.mjs';
import { defaultWorkspaceRoot } from '../src/opc/task-store.mjs';

const DEFAULT_TEAM_WIKI_ROOT = '/Users/jerry/Documents/knowledge/team-knowledge/opc-wiki';

const args = process.argv.slice(2);

const usage = () => `Usage:
  opc init [--root <path>]
  opc new <title> [--root <path>] [--type dev|content|hybrid|ops]
  opc dev <title> [--root <path>]
  opc content <title> [--audience <text>] [--channel <a,b>] [--publish-destination <channel:target,...>] [--wiki-root <path>] [--root <path>]
  opc status <task-id> [--root <path>]
  opc list [--root <path>]
  opc approve <task-id> <gate> [--root <path>]
  opc retry <task-id> [--reason <reason>] [--root <path>]
  opc events <task-id> [--root <path>]
  opc run <task-id> [--wiki-root <path>] [--execute-skill] [--root <path>]
  opc publish <task-id> [--channel <name>] [--execute] [--root <path>]
  opc memory sync <task-id> [--memory-root <path>] [--root <path>]
`;

const takeOption = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  args.splice(index, 2);
  return value;
};

const takeFlag = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
};

const root = takeOption('--root') || defaultWorkspaceRoot();
const explicitType = takeOption('--type');
const reason = takeOption('--reason') || '';
const explicitWikiRoot = takeOption('--wiki-root');
const wikiRoot = explicitWikiRoot || process.env.OPC_WIKI_ROOT || DEFAULT_TEAM_WIKI_ROOT;
const audience = takeOption('--audience');
const channelInput = takeOption('--channel') || takeOption('--channels');
const publishDestinationInput = takeOption('--publish-destination') || takeOption('--publish-destinations');
const memoryRoot = takeOption('--memory-root') || process.env.OPC_MEMORY_ROOT;
const executePublish = takeFlag('--execute');
const executeSkill = takeFlag('--execute-skill');
const command = args.shift();
const controller = new OpcController({ root });

const parseChannels = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parsePublishDestinations = (value) => Object.fromEntries(
  parseChannels(value).map((item) => {
    const [channel, ...targetParts] = item.split(':');
    return [channel.trim(), targetParts.join(':').trim() || 'manual'];
  }).filter(([channel]) => channel)
);

try {
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(usage());
    process.exit(0);
  }

  if (command === 'init') {
    const result = controller.init();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'new' || command === 'dev' || command === 'content') {
    const title = args.join(' ').trim();
    const type = command === 'new' ? explicitType : command;
    const inputs = {};
    if (audience) inputs.audience = audience;
    if (channelInput) inputs.channels = parseChannels(channelInput);
    if (publishDestinationInput) inputs.publish_destinations = parsePublishDestinations(publishDestinationInput);
    if (type === 'content' && wikiRoot) inputs.wiki_root = wikiRoot;
    const task = controller.createTask({ title, type, inputs });
    process.stdout.write(`${JSON.stringify(task, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'status') {
    const id = args[0];
    const task = controller.getTaskStatus(id);
    process.stdout.write(`${JSON.stringify(task, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'list') {
    process.stdout.write(`${JSON.stringify(controller.listTasks(), null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'approve') {
    const [id, gate] = args;
    const task = controller.approveTask({ id, gate });
    process.stdout.write(`${JSON.stringify(task, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'retry') {
    const id = args[0];
    const task = controller.retryTask({ id, reason });
    process.stdout.write(`${JSON.stringify(task, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'events') {
    const id = args[0];
    process.stdout.write(`${JSON.stringify(controller.getTaskEvents(id), null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'run') {
    const id = args[0];
    const task = controller.runTask(id, { wikiRoot, executeSkill });
    process.stdout.write(`${JSON.stringify(task, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'publish') {
    const id = args[0];
    const channel = channelInput ? parseChannels(channelInput)[0] : undefined;
    const result = controller.publishTask({ id, channel, execute: executePublish });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(0);
  }

  if (command === 'memory') {
    const [subcommand, id] = args;
    if (subcommand !== 'sync') {
      throw new Error(`Unsupported memory command: ${subcommand || '(missing)'}`);
    }
    const result = controller.syncMemory({ id, memoryRoot });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(0);
  }

  process.stderr.write(`Unknown command: ${command}\n\n${usage()}`);
  process.exit(2);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
