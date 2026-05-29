# Provisioning

Use this file for permissions, tools, and skill-install decisions.

## Permission policy
Apply least privilege by default.

Role defaults:
- `team-leader` -> `team-leader-standard`
- `product-manager`, `growth-lead` -> `planner-low-risk`
- `performance-analyst` -> `analyst-low-risk`
- `tech-architect` -> `architect-standard`
- `backend/frontend/fullstack-engineer`, `automation-engineer` -> `builder-standard`
- `qa-engineer` -> `tester-standard`
- `campaign-operator` -> `operator-standard`

Never assign `full` by default.

## Install policy
- Required skills: install only after scanner decision is `install`
- Optional skills: recommend only; do not auto-install
- `MEDIUM` risk: require explicit user confirmation
- `HIGH` or `EXTREME`: block for review
- No scanner and no fallback: skip and report blocker

## Security decision shape
For each candidate skill, record:
- source
- version
- scanner used
- risk level
- risk signals
- decision
- reason

Top-level summary:
- requested
- installed
- blocked
- skipped

## Validation
Per role, confirm:
- required tool whitelist exists
- permission profile matches the role
- collaboration callback path exists
- unresolved blockers are surfaced in the final report
