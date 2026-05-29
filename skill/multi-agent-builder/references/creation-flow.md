# Creation Flow

Use this file after the user confirms roles.

## Core sequence
1. Normalize role ids to team-namespaced ids: `<team>-<role>`
2. Define each role contract: mission, outputs, dependencies, escalation target
3. Prefer a star topology around `team-leader`
4. Materialize config and workspaces with `scripts/create_team.mjs`
5. Validate readiness before reporting success

## Team layout
Keep one `teamRoot`:

```text
<teamRoot>/
├── <team>-team-leader/
├── <team>-<specialist-role>/
└── shared/
```

Each agent subdirectory is a full OpenClaw workspace root.
`shared/` exists only once at team root.

## Workspace contents
Each agent workspace must include:
- `SOUL.md`
- `AGENTS.md`
- `IDENTITY.md`
- `USER.md`
- `BOOTSTRAP.md`
- `TOOLS.md`
- `HEARTBEAT.md`
- `MEMORY.md`
- `.openclaw/workspace-state.json`
- `memory/`
- `skills/`

## Shared directories
Create:
- `requirements/`
- `architecture/`
- `design/`
- `implementation/`
- `qa/`
- `artifacts/`
- `reviews/`
- `decisions/`

## Readiness gate
Return `ready` only when:
- config entries exist for every role
- no role uses broad `full` tool profile
- A2A boundaries are explicit
- every workspace has the required shape
- SOUL/AGENTS contain the required sections
- shared directories exist
