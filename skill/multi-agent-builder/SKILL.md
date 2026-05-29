---
name: multi-agent-builder
description: Build a reusable multi-agent team in OpenClaw from a user goal (e.g., "create a product-engineering team", "build a marketing ops team"). Use when the user wants role analysis, role confirmation, agent-by-agent creation plan, collaboration protocol, handoff flow, and channel-binding checklist. Mirror the user's language (English/Chinese/other) throughout the interaction and outputs.
---

# Team Builder

Design and materialize a reusable multi-agent team from a user goal. Mirror the user's language and keep the flow lightweight: discover roles, confirm scope, create the team, validate readiness, then return the report plus channel-binding guidance.

## Core flow
1. Discover the smallest useful role set.
2. Confirm core vs optional roles before creation.
3. Materialize config and workspaces with `scripts/create_team.mjs`.
4. Validate readiness; do not claim `ready` if validation fails.
5. Return the team report, workspace layout, and channel-binding blueprint.

## Creation rules
- Always include `team-leader`.
- All agent ids are team-namespaced: `<team>-<role>`.
- Keep one `teamRoot`, with one private workspace per role plus one shared directory.
- Each agent workspace must be a complete OpenClaw workspace root.
- Use least privilege; do not assign broad `full` tool profiles by default.
- Specialist outputs go to `shared/`; `team-leader` orchestrates and reports.

## Path resolution
Resolve OpenClaw paths in this order:
1. CLI args: `--config`, `--team-root`, `--openclaw-home`
2. Process env: `OPENCLAW_CONFIG`, `OPENCLAW_TEAM_ROOT`, `OPENCLAW_HOME`
3. Skill-root `.env`
4. User-confirmed default `/root/.openclaw`

If the default path was not confirmed and no explicit path is provided, ask for `openclaw.json` or `OPENCLAW_HOME`.

## Guardrails
- No confirmation needed for internal deterministic setup: config edits, workspace creation, A2A boundaries.
- Confirmation required for channel credentials and irreversible external side effects.
- Optional skills are recommendations, not auto-installs.
- If scanner and fallback are unavailable, skip install and report the blocker.
- Never auto-restart the gateway.

## References
- `references/discovery.md`: role discovery and confirmation
- `references/creation-flow.md`: creation sequence and readiness gates
- `references/provisioning.md`: permissions and install policy
- `references/collaboration.md`: runtime protocol and final handoff
- `references/workspace-templates.md`: workspace and role-doc shape
- `references/role-catalog.md`: domain starter sets
- `references/examples.md`: example team archetypes
- `references/channel-binding-blueprints.md`: post-creation binding plans
- `references/failure-modes.md`: recovery policy
- `references/role-display-mapping.json`: localized role display names
