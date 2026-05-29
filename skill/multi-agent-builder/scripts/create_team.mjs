#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { parseArgs, resolveOpenClawPaths } from './openclaw_paths.mjs';
import { buildTeamReport } from './team_schema.mjs';

const args = parseArgs(process.argv.slice(2));
const team = args.team;
const roles = args.roles;
const accountId = args['account-id'] || '';
const locale = args.locale || 'zh-CN';
const channel = args.channel || 'telegram';
const model = args.model || 'openai-codex/gpt-5.3-codex';
if (!team || !roles) {
  console.error('missing --team and/or --roles');
  process.exit(2);
}
const roleList = roles.split(',').map((item) => item.trim()).filter(Boolean);
const { cfgPath, teamRoot, openclawHome } = resolveOpenClawPaths(args, team);

const run = (file, extra=[]) => {
  const r = spawnSync('node', [new URL(file, import.meta.url).pathname, ...extra], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout || '');
    console.error(r.stderr || '');
    process.exit(r.status || 1);
  }
  return r.stdout.trim();
};

const common = [
  '--team', team,
  '--roles', roles,
  '--channel', channel,
  '--locale', locale,
  '--model', model,
  '--config', cfgPath,
  '--team-root', teamRoot,
  '--openclaw-home', openclawHome,
  ...(accountId?['--account-id',accountId]:[])
];
const m = run('./materialize_team.mjs', common);
const v = run('./validate_team.mjs', common);
const vr = JSON.parse(v);
if (vr.status !== 'ready') {
  console.log(JSON.stringify({ ok:false, stage:'validate', result: vr }, null, 2));
  process.exit(3);
}
const report = buildTeamReport({ team, roles: roleList, teamRoot, cfgPath, locale });
console.log(JSON.stringify({ ok:true, materialize: JSON.parse(m), validate: vr, report }, null, 2));
