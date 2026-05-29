#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { parseArgs, resolveOpenClawPaths } from './openclaw_paths.mjs';
import {
  SHARED_DIRS,
  WORKSPACE_DIRS,
  WORKSPACE_FILES,
  WORKSPACE_STATE_FILE,
  permissionProfileFor,
  requiredAgentsMarkers,
  requiredSoulSections,
  roleIdFor
} from './team_schema.mjs';

const args = parseArgs(process.argv.slice(2));
const team = args.team; const roles=(args.roles||'').split(',').map(s=>s.trim()).filter(Boolean); const accountId=args['account-id']||'';
const leaderId = args['leader-id'] || `${team}-team-leader`;
if(!team||!roles.length) throw new Error('missing --team/--roles');
const { cfgPath, teamRoot } = resolveOpenClawPaths(args, team);
const roleIdMap = new Map(roles.map((role) => [role, roleIdFor(team, role)]));
const resolvedRoleIds = roles.map(r=>roleIdMap.get(r));
const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));
const issues=[];
const amap = new Map((cfg.agents?.list||[]).filter(a=>a&&a.id).map(a=>[a.id,a]));
for(const rid0 of roles){
  const rid=roleIdMap.get(rid0);
  const a=amap.get(rid); if(!a){issues.push(`missing agent: ${rid}`); continue;}
  if(!rid.startsWith(`${team}-`)) issues.push(`agent id is not team-namespaced: ${rid}`);
  if(a.tools?.profile === 'full') issues.push(`${rid} uses unsafe full tool profile`);
  const expectedProfile = permissionProfileFor(rid0);
  if(a.tools?.permissionProfile !== expectedProfile) issues.push(`${rid} permissionProfile should be ${expectedProfile}`);
  if(!Array.isArray(a.tools?.allowed) || a.tools.allowed.length === 0) issues.push(`${rid} missing tools.allowed whitelist`);
  const sa=a.subagents?.allowAgents||[];
  if(sa.includes('*')) issues.push(`${rid} contains wildcard subagent permission`);
  if(rid0==='team-leader'){
    for(const x0 of roles.filter(r=>r!=='team-leader')){
      const x=roleIdMap.get(x0);
      if(!sa.includes(x)) issues.push(`team-leader missing allowAgents: ${x}`);
    }
  } else if(!sa.includes(leaderId)) issues.push(`${rid} missing allowAgents: ${leaderId}`);
}
if(accountId){
  const ok=(cfg.bindings||[]).some(b=>b.agentId===leaderId && b.match?.accountId===accountId);
  if(!ok) issues.push('missing team-leader binding');
}
const root=teamRoot;
for(const dir of SHARED_DIRS) if(!fs.existsSync(path.join(root,'shared',dir))) issues.push(`missing shared/${dir}`);
for(const rid0 of roles){
  const rid=roleIdMap.get(rid0);
  const wd=path.join(root,rid);
  for(const file of WORKSPACE_FILES){
    const p=path.join(wd,file); if(!fs.existsSync(p)) {issues.push(`missing ${rid}/${file}`); continue;}
    if(file!=='USER.md' && fs.readFileSync(p,'utf8').trim().length<40) issues.push(`placeholder-like ${rid}/${file}`);
  }
  for(const dir of WORKSPACE_DIRS){
    const p = path.join(wd, dir);
    if(!fs.existsSync(p)) issues.push(`missing ${rid}/${dir}`);
    else if(!fs.statSync(p).isDirectory()) issues.push(`${rid}/${dir} is not a directory`);
  }
  const workspaceStatePath = path.join(wd, WORKSPACE_STATE_FILE);
  if(!fs.existsSync(workspaceStatePath)) {
    issues.push(`missing ${rid}/${WORKSPACE_STATE_FILE}`);
  } else {
    try {
      const state = JSON.parse(fs.readFileSync(workspaceStatePath,'utf8'));
      if(state.agentId !== rid) issues.push(`${rid}/.openclaw/workspace-state.json agentId mismatch`);
      if(state.workspaceRoot !== wd) issues.push(`${rid}/.openclaw/workspace-state.json workspaceRoot mismatch`);
      if(state.sharedRoot !== `${root}/shared`) issues.push(`${rid}/.openclaw/workspace-state.json sharedRoot mismatch`);
    } catch {
      issues.push(`invalid JSON in ${rid}/.openclaw/workspace-state.json`);
    }
  }
  const soulPath = path.join(wd,'SOUL.md');
  const agentsPath = path.join(wd,'AGENTS.md');
  const bootstrapPath = path.join(wd,'BOOTSTRAP.md');
  const toolsPath = path.join(wd,'TOOLS.md');
  if(fs.existsSync(soulPath)){
    const soul = fs.readFileSync(soulPath,'utf8');
    for(const section of requiredSoulSections(rid0)) if(!soul.includes(section)) issues.push(`${rid}/SOUL.md missing section: ${section}`);
    if(!soul.includes(`${root}/shared/`)) issues.push(`${rid}/SOUL.md missing shared path policy`);
    if(rid0 === 'team-leader' && !soul.includes('不直接承担 specialist')) issues.push(`${rid}/SOUL.md missing team-leader implementation boundary`);
  }
  if(fs.existsSync(agentsPath)){
    const agents = fs.readFileSync(agentsPath,'utf8');
    for(const marker of requiredAgentsMarkers(rid0)) if(!agents.includes(marker)) issues.push(`${rid}/AGENTS.md missing ${marker} rule`);
  }
  if(fs.existsSync(bootstrapPath)){
    const bootstrap = fs.readFileSync(bootstrapPath,'utf8');
    for(const marker of ['SOUL.md', 'AGENTS.md', 'USER.md', 'TOOLS.md']) if(!bootstrap.includes(marker)) issues.push(`${rid}/BOOTSTRAP.md missing ${marker} boot rule`);
    if(!bootstrap.includes(`${root}/shared`)) issues.push(`${rid}/BOOTSTRAP.md missing shared path`);
  }
  if(fs.existsSync(toolsPath)){
    const toolsDoc = fs.readFileSync(toolsPath,'utf8');
    for(const marker of ['Permission Profile', 'allowed', 'workspace:', 'team_shared:']) if(!toolsDoc.includes(marker)) issues.push(`${rid}/TOOLS.md missing ${marker}`);
  }
}
console.log(JSON.stringify({status:issues.length?'partially_ready':'ready',team,leaderId,config:cfgPath,teamRoot,issues},null,2));
