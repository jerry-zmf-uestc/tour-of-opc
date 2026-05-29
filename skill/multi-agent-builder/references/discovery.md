# Discovery

Use this file for role discovery and user confirmation.

## Minimal questions
Ask only missing items, in this order:
1. Objective
2. Scope: strategy only, or strategy + execution
3. Constraints: timeline, budget, compliance, tool stack

Do not ask channel questions before creation. Channel binding belongs to the post-creation stage.

## Auto-completion
- Start from a domain prototype: product/engineering, growth/marketing, ops/support.
- Do not add engineering roles unless the objective explicitly includes implementation.
- If the timeline is tight, prefer fewer roles with broader ownership.
- If compliance is explicit, add a security/compliance role as core.
- Mark inferred items as assumptions and ask for confirmation.

## Split and merge rules
Split roles only when all are true:
- unique primary artifact
- unique decision authority
- real throughput or quality gain

Do not split when the context is the same and only tools or output format differ.

Default target: `3-6` specialist roles plus one `team-leader`.
If more than `8` specialist roles are proposed, require explicit justification.

## Confirmation contract
Before creation:
- confirm final roles
- confirm core vs optional vs deferred
- confirm proceed now

During confirmation:
- mirror the user's language
- show role display names and value only
- do not show agent ids until final report
