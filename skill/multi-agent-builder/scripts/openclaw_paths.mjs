import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, '..');

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
};

const expandTeam = (value, team) => {
  if (!value) return value;
  return value
    .replaceAll('${team}', team)
    .replaceAll('{{team}}', team)
    .replaceAll('<team>', team);
};

export const parseArgs = (argv) =>
  Object.fromEntries(
    argv
      .map((v, i, a) => (v.startsWith('--') ? [v.slice(2), a[i + 1]] : null))
      .filter(Boolean)
  );

export const resolveOpenClawPaths = (args, team) => {
  const fileEnv = parseEnvFile(path.join(skillRoot, '.env'));
  const openclawHome =
    args['openclaw-home'] ||
    process.env.OPENCLAW_HOME ||
    fileEnv.OPENCLAW_HOME ||
    '/root/.openclaw';
  const cfgPath =
    args.config ||
    process.env.OPENCLAW_CONFIG ||
    fileEnv.OPENCLAW_CONFIG ||
    path.join(openclawHome, 'openclaw.json');
  const teamRoot =
    args['team-root'] ||
    process.env.OPENCLAW_TEAM_ROOT ||
    fileEnv.OPENCLAW_TEAM_ROOT ||
    path.join(openclawHome, `workspace-${team}`);

  return {
    cfgPath: expandTeam(cfgPath, team),
    teamRoot: expandTeam(teamRoot, team),
    openclawHome: expandTeam(openclawHome, team)
  };
};
