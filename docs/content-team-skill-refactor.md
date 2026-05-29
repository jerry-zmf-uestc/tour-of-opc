# Content Team Skill Refactor

## Goal

Move semantic content work out of `src/opc` scripts and into skill-based LLM workflows, while keeping `opc-router` as a deterministic control plane.

This follows the `obsidian-wiki/.skills/` pattern, but the local repository now separates reusable skills from the content-team project package.

## Current Split

Reusable skills are now organized under `skill/`:

```text
skill/
├── content-research/
├── content-planning/
├── content-drafting/
├── content-publishing/
├── content-memory/
└── skill-evolution/
```

The content-team project package is now organized as:

```text
projects/content-marketing-team/
├── SKILL.md
├── SETUP.md
├── references/
├── assets/
├── evals/
├── .codex/skills/
├── .claude/skills/
├── .openclaw/skills/
└── .trae/skills/
```

The project `SKILL.md` is the orchestrator. The reusable skills own stage-specific semantic work. Runtime-specific skill directories link back to `skill/` so Codex, Claude, OpenClaw, and Trae can use the same skill contracts.

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

3. Each plain `opc run` writes the next stage packet instead of trying to author high-quality semantic artifacts itself.
4. `opc run --execute-skill` additionally writes a concrete handoff:

```text
skill-execution-request.json
skill-handoff.md
```

5. Codex/OpenClaw reads the request, triggers the right skill, and writes artifacts back.
6. `opc-router` validates artifact presence, gates, and manifests.
7. Once the skill path is stable, remove or quarantine old template renderers as fallback-only code.

Current state: stage packet generation has replaced the old semantic template renderers. `content-runner.mjs` no longer owns article writing, wiki query synthesis, channel prose, or lessons prose. `--execute-skill` is a minimal deterministic handoff generator; it does not call an LLM by itself.

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
