---
name: skill-evolution
description: Use when an agent team has accumulated lessons, retrospectives, memory patches, or repeated content-team failures and needs LLM-owned lesson clustering, playbook promotion, skill patch proposals, or self-evolution review. This subskill proposes changes to skills but does not mutate SKILL.md without review and tests.
---

# Skill Evolution

Turn repeated task lessons into reviewed playbooks or skill patch proposals.

## Boundary

This skill analyzes evidence and proposes changes. It does not directly approve its own patch.

`opc-router` owns task history and artifact locations. The operator or reviewer approves skill changes.

## Inputs

Read:

- `/Users/jerry/Documents/knowledge/team-knowledge/opc-memory/lessons/*.md`
- `/Users/jerry/Documents/knowledge/team-knowledge/opc-memory/runs/*.md`
- task `lessons.yaml`
- task retrospectives
- existing `openclaw-content-team` skills and references
- tests or evals related to the proposed behavior

## Workflow

1. Gather lessons from at least two related tasks, unless the user explicitly asks to process a single critical failure.
2. Cluster lessons by failure mode, successful pattern, gate issue, retrieval issue, drafting issue, publishing issue, or memory issue.
3. Decide the promotion level:
   - L1: keep as task lesson
   - L2: team memory or playbook
   - L3: skill/reference/template/eval patch
4. Write a skill patch proposal before editing.
5. Include evidence, affected files, expected behavior change, and verification plan.
6. Only apply changes after operator approval or explicit instruction.

## Patch Proposal Format

```markdown
# Skill Patch Proposal

## Evidence

## Repeated Pattern

## Proposed Change

## Files Affected

## Risks

## Verification
```

## Quality Bar

- Do not promote one-off preferences into rules.
- Do not remove safety gates to improve convenience.
- Every skill patch should include either an eval update, a test update, or a documented manual verification path.

## Handoff

After approval, use `skill-creator` conventions to update the relevant skill files and run verification.
