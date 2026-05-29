#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { parseArgs, resolveOpenClawPaths } from './openclaw_paths.mjs';
import {
  SHARED_DIRS,
  WORKSPACE_STATE_FILE,
  FALLBACK_MODELS,
  buildWorkspaceArtifacts,
  displayForRole,
  permissionProfileFor,
  renderRoleDocs,
  renderTeamDirectoryLines,
  roleIdFor,
  toolsForProfile
} from './team_schema.mjs';

const args = parseArgs(process.argv.slice(2));
const team = args.team;
const roles = (args.roles||'').split(',').map(s=>s.trim()).filter(Boolean);
const leaderId = args['leader-id'] || `${team}-team-leader`;
const channel = args.channel || 'telegram';
const accountId = args['account-id'] || '';
const locale = args.locale || 'zh-CN';
const model = args.model || 'openai-codex/gpt-5.3-codex';
if (!team || roles.length===0) throw new Error('missing --team/--roles');
const { cfgPath, teamRoot } = resolveOpenClawPaths(args, team);
const roleIdMap = new Map(roles.map((role) => [role, roleIdFor(team, role)]));

const originalRaw = fs.readFileSync(cfgPath,'utf8');
const cfg = JSON.parse(originalRaw);
cfg.agents ??= {}; cfg.agents.list ??= []; cfg.bindings ??= [];
if (!Array.isArray(cfg.agents.list)) throw new Error('invalid config: agents.list must be array');
if (!Array.isArray(cfg.bindings)) throw new Error('invalid config: bindings must be array');
fs.mkdirSync(teamRoot,{recursive:true});
for (const dir of SHARED_DIRS) fs.mkdirSync(path.join(teamRoot,'shared',dir),{recursive:true});

const resolvedRoleIds = roles.map(r => roleIdMap.get(r));
cfg.agents.list = cfg.agents.list.filter(a => !resolvedRoleIds.includes(a?.id));
const teamDirectoryLines = renderTeamDirectoryLines(roles, roleIdMap, locale);

for (const rid0 of roles){
  const rid = roleIdMap.get(rid0);
  const { displayName, emoji } = displayForRole(rid0, locale, team);
  const permissionProfile = permissionProfileFor(rid0);
  const tools = toolsForProfile(permissionProfile);
  const agent = {
    id: rid,
    workspace: `${teamRoot}/${rid}`,
    model: {primary:model, fallbacks:FALLBACK_MODELS},
    identity: {name: displayName, emoji},
    tools,
    subagents: {allowAgents: rid0==='team-leader' ? roles.filter(x=>x!=='team-leader').map(x=>roleIdMap.get(x)) : [leaderId]}
  };
  cfg.agents.list.push(agent);

  fs.mkdirSync(agent.workspace,{recursive:true});
  const { soul, agents } = renderRoleDocs({
    role: rid0,
    agentId: rid,
    displayName,
    team,
    leaderId,
    locale,
    teamRoot,
    teamDirectoryLines
  });
  const identity = `# IDENTITY.md\n\n- display_name: ${displayName}\n- agent_id: ${rid}\n- locale: ${locale}\n`;
  fs.writeFileSync(path.join(agent.workspace,'SOUL.md'),soul);
  fs.writeFileSync(path.join(agent.workspace,'AGENTS.md'),agents);
  fs.writeFileSync(path.join(agent.workspace,'IDENTITY.md'),identity);
  fs.writeFileSync(path.join(agent.workspace,'USER.md'),'# USER.md\n');
  const artifacts = buildWorkspaceArtifacts({
    workspace: agent.workspace,
    agentId: rid,
    displayName,
    locale,
    teamName: team,
    teamSharedRoot: `${teamRoot}/shared`,
    permissionProfile,
    tools,
    isLeader: rid0 === 'team-leader'
  });
  fs.mkdirSync(path.join(agent.workspace, '.openclaw'), { recursive: true });
  fs.mkdirSync(path.join(agent.workspace, 'memory'), { recursive: true });
  fs.mkdirSync(path.join(agent.workspace, 'skills'), { recursive: true });
  fs.writeFileSync(path.join(agent.workspace, 'BOOTSTRAP.md'), artifacts.bootstrap);
  fs.writeFileSync(path.join(agent.workspace, 'TOOLS.md'), artifacts.toolsDoc);
  fs.writeFileSync(path.join(agent.workspace, 'HEARTBEAT.md'), artifacts.heartbeat);
  fs.writeFileSync(path.join(agent.workspace, 'MEMORY.md'), artifacts.memory);
  fs.writeFileSync(
    path.join(agent.workspace, WORKSPACE_STATE_FILE),
    JSON.stringify(artifacts.workspaceState, null, 2)
  );
}

if (accountId){
  cfg.bindings = cfg.bindings.filter(b => !(resolvedRoleIds.includes(b?.agentId) && b?.match?.accountId===accountId));
  cfg.bindings.push({agentId:leaderId, match:{channel, accountId}});
}

// atomic + rollback-safe write
const out = JSON.stringify(cfg, null, 2);
JSON.parse(out); // ensure serializable JSON
const bakPath = `${cfgPath}.bak.materialize`;
const tmpPath = `${cfgPath}.tmp.materialize`;
if (!fs.existsSync(bakPath)) fs.writeFileSync(bakPath, originalRaw);
fs.writeFileSync(tmpPath, out);
fs.renameSync(tmpPath, cfgPath);
console.log(JSON.stringify({ok:true,team,leaderId,roles:resolvedRoleIds,config:cfgPath,teamRoot,shared:`${teamRoot}/shared`, backup:bakPath}));
