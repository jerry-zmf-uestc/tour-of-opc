#!/bin/bash
#
# content-marketing-team setup — configures skill discovery for all supported AI agents.
#
# Usage: bash setup.sh [relative|absolute]
#   relative  — symlinks use ../-prefixed paths (for project-local agent dirs)
#   absolute  — symlinks use full paths (for global agent dirs, default)
#
# What it does:
#   1. Symlinks skills from the global skill dir into each agent's skills directory:
#      Project-local (relative mode):
#        - .codex/skills/         (Codex)
#        - .openclaw/skills/      (OpenClaw/QClaw)
#        - .trae/skills/          (Trae)
#        - .claude/skills/        (Claude Code)
#      Global (absolute mode):
#        - ~/.codex/skills/       (Codex)
#        - ~/.openclaw/skills/    (OpenClaw/QClaw)
#        - ~/.trae/skills/        (Trae)
#        - ~/.trae-cn/skills/     (Trae CN)
#        - ~/.claude/skills/      (Claude Code)
#   2. Prints a summary of what's ready
#
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Global skill source of truth
GLOBAL_SKILL_DIR="/Users/jerry/Documents/projects/the-way-to-opc/skill"

# install_skills <target_dir> <label> [relative|absolute] [skill-subset...]
# "relative" requires target_dir under $SCRIPT_DIR and emits ../-prefixed
# targets matching the committed symlinks. Extra args restrict the install
# to a named subset of skills.
install_skills() {
  local target_dir="$1"
  local label="$2"
  local mode="${3:-absolute}"
  shift 3 || shift $#
  local subset=("$@")  # empty = install all

  case "$mode" in
    relative|absolute) ;;
    *) echo "install_skills: bad mode '$mode' (want relative|absolute)" >&2; exit 1 ;;
  esac

  local rel_prefix=""
  if [ "$mode" = "relative" ]; then
    # Strip $SCRIPT_DIR prefix; if it doesn't match, target is outside the
    # repo and "relative" isn't meaningful — bail rather than emit a wrong link.
    local rel="${target_dir#"$SCRIPT_DIR"/}"
    if [ "$rel" = "$target_dir" ]; then
      echo "install_skills: relative mode requires target under \$SCRIPT_DIR ($target_dir)" >&2
      exit 1
    fi
    # One ../ per path component in $rel; e.g. .codex/skills → 2 components → ../../
    local slashes="${rel//[^\/]/}"
    local depth=$(( ${#slashes} + 1 )) i
    for (( i=0; i<depth; i++ )); do rel_prefix="../$rel_prefix"; done
  fi

  mkdir -p "$target_dir"
  for skill in "$GLOBAL_SKILL_DIR"/*/; do
    local skill_name link_path link_target
    skill_name="$(basename "$skill")"
    if [ ${#subset[@]} -gt 0 ]; then
      local match=0 want
      for want in "${subset[@]}"; do [ "$want" = "$skill_name" ] && match=1 && break; done
      [ "$match" = 1 ] || continue
    fi
    link_path="$target_dir/$skill_name"
    if [ "$mode" = "relative" ]; then
      # Calculate relative path from target_dir to GLOBAL_SKILL_DIR
      # target_dir is like .../content-marketing-team/.codex/skills
      # We need to go up to project root, then to global skill dir
      link_target="${rel_prefix}../../skill/$skill_name"
    else
      link_target="${skill%/}"
    fi
    if [ -L "$link_path" ]; then
      rm "$link_path"
    elif [ -d "$link_path" ]; then
      echo "⚠️   $link_path is a real directory, skipping symlink"
      continue
    elif [ -f "$link_path" ]; then
      rm "$link_path"
    fi
    ln -s "$link_target" "$link_path"
    # Sanity check: every skill ships a SKILL.md, so a working symlink resolves it.
    [ -e "$link_path/SKILL.md" ] || { echo "install_skills: broken link $link_path → $link_target" >&2; exit 1; }
  done
  echo "✅  Installed skills → $label"
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   content-marketing-team — Agent Skill Setup     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Determine mode from argument or default to absolute
MODE="${1:-absolute}"
case "$MODE" in
  relative|absolute) ;;
  *) echo "Bad mode '$MODE' (want relative|absolute)" >&2; exit 1 ;;
esac

echo "Mode: $MODE"
echo "Global skill source: $GLOBAL_SKILL_DIR"
echo ""

# ── Step 1: Project-local skill dirs (relative mode) ─────────
if [ "$MODE" = "relative" ]; then
  AGENT_DIRS=(
    ".codex/skills"
    ".openclaw/skills"
    ".trae/skills"
    ".claude/skills"
  )

  for agent_dir in "${AGENT_DIRS[@]}"; do
    install_skills "$SCRIPT_DIR/$agent_dir" "$agent_dir/" relative
  done
fi

# ── Step 2: Global skill dirs (absolute mode) ────────────────
if [ "$MODE" = "absolute" ]; then
  install_skills "$HOME/.codex/skills"       "~/.codex/skills/ (Codex)"
  install_skills "$HOME/.openclaw/skills"    "~/.openclaw/skills/ (OpenClaw/QClaw)"
  install_skills "$HOME/.trae/skills"        "~/.trae/skills/ (Trae)"
  install_skills "$HOME/.trae-cn/skills"     "~/.trae-cn/skills/ (Trae CN)"
  install_skills "$HOME/.claude/skills"      "~/.claude/skills/ (Claude Code)"
fi

# ── Step 3: Summary ──────────────────────────────────────────
SKILL_COUNT=$(echo "$GLOBAL_SKILL_DIR"/*/  | tr ' ' '\n' | grep -c /)

echo ""
echo "───────────────────────────────────────────────────"
echo " Setup complete!"
echo ""
echo " Skills found:    $SKILL_COUNT"
echo " Agents ready:    Codex, OpenClaw/QClaw, Trae, Trae CN, Claude Code"
echo ""
echo " Global skill dir: $GLOBAL_SKILL_DIR"
echo ""
echo " Next steps:"
echo "   1. Open this project in your agent"
echo "   2. Use content-marketing-team skill for orchestration"
echo ""
echo "───────────────────────────────────────────────────"
echo ""
