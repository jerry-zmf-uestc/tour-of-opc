# Content Team Skill Refactor

## Goal

Move semantic content work out of `src/opc` scripts and into skill-based LLM workflows, while keeping `opc-router` as a deterministic control plane.

This follows the `obsidian-wiki/.skills/` pattern: a root skill pack with small subskills, plus a `SETUP.md` explaining how the pack is installed and used.

## Current Split

`.skills/openclaw-content-team/` is now organized as:

```text
.skills/openclaw-content-team/
├── SKILL.md
├── SETUP.md
├── .skills/
│   ├── content-research/
│   ├── content-planning/
│   ├── content-drafting/
│   ├── content-publishing/
│   ├── content-memory/
│   └── skill-evolution/
├── references/
├── assets/
└── evals/
```

The root `SKILL.md` is now the orchestrator. The subskills own stage-specific semantic work.

## Router-owned

Keep deterministic and safety-critical behavior in `src/opc`:

| Module | Responsibility |
| --- | --- |
| `controller.mjs` | Unified API surface |
| `task-store.mjs` | TaskSpec, registry, events, approvals, artifact paths |
| `router.mjs` | Rule-based initial classification and fallback routing |
| `publisher.mjs` | Dry-run readiness and external side-effect guard |
| `memory-sync.mjs` | Idempotent file export into Obsidian-compatible memory |
| `simple-runner.mjs` | Minimal non-content task status transition |

## LLM-owned

Move these behaviors into skills:

| Current script behavior | Target subskill |
| --- | --- |
| evidence synthesis | `content-research` |
| semantic query expansion | `content-research` |
| missed related page detection | `content-research` |
| thesis and article angle | `content-planning` |
| outline and claim-to-section map | `content-planning` |
| readable article drafting | `content-drafting` |
| editorial review | `content-drafting` |
| task-specific retrospective and lessons | `content-drafting` |
| channel adaptation | `content-publishing` |
| publisher handoff quality | `content-publishing` |
| memory interpretation | `content-memory` |
| lesson clustering and skill patch proposal | `skill-evolution` |

## Runtime Migration Path

The next code refactor should not delete all script behavior at once. Use a staged migration:

1. Keep `content-runner.mjs` as deterministic fallback.
2. Add stage packet generation:

```text
stage-packet.json
stage-instructions.md
```

3. Each `opc run` writes the next stage packet instead of trying to author high-quality semantic artifacts itself.
4. Codex/OpenClaw reads the packet, triggers the right subskill, and writes artifacts back.
5. `opc-router` validates artifact presence, gates, and manifests.
6. Once the skill path is stable, remove or quarantine old template renderers as fallback-only code.

Current state: stage packet generation has replaced the old semantic template renderers. `content-runner.mjs` no longer owns article writing, wiki query synthesis, channel prose, or lessons prose.

## Stage Packet Shape

```json
{
  "task_id": "task-...",
  "stage": "research|planning|drafting|final|publishing|memory|evolution",
  "team": "openclaw-content-team",
  "subskill": "content-research",
  "inputs": ["task.json"],
  "expected_outputs": ["01-evidence-pack.md"],
  "gate_after": "outline_review",
  "router_owned": ["status", "event-log", "approvals"],
  "llm_owned": ["evidence synthesis", "gap analysis"]
}
```

## Design Rule

If output quality depends on interpretation, synthesis, writing, prioritization, or skill reuse, it belongs in a subskill. If correctness depends on idempotence, filesystem safety, status transitions, or side-effect control, it stays in `src/opc`.
