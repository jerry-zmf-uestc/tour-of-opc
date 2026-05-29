#!/usr/bin/env bash
set -euo pipefail

# Install local Agent skills into ~/.agents/skills.
#
# Usage:
#   scripts/install-skill-to-agents.sh
#   scripts/install-skill-to-agents.sh /absolute/path/to/skill [...]
#
# Defaults:
#   - Source skills: all skill directories under <repo>/skills
#   - Target root:  ~/.agents/skills
#
# Optional:
#   AGENTS_SKILLS_DIR=/custom/skills/root scripts/install-skill-to-agents.sh /absolute/path/to/skill

usage() {
  cat <<'EOF'
Usage:
  install-skill-to-agents.sh [SOURCE_SKILL_ABSOLUTE_PATH ...]

Installs local skills into ~/.agents/skills/<skill-name>.

Arguments:
  SOURCE_SKILL_ABSOLUTE_PATH  Optional. One or more absolute paths to skill directories containing SKILL.md.
                              Defaults to all valid skills under this repository's skills/.

Environment:
  AGENTS_SKILLS_DIR           Optional target root. Defaults to ~/.agents/skills.

Examples:
  scripts/install-skill-to-agents.sh
  scripts/install-skill-to-agents.sh /Users/me/project/skills/my-skill
  scripts/install-skill-to-agents.sh /Users/me/project/skills/skill-a /Users/me/project/skills/skill-b
  AGENTS_SKILLS_DIR="$HOME/.agents/skills" scripts/install-skill-to-agents.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_SKILLS_ROOT="$REPO_ROOT/skills"
TARGET_ROOT="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"

install_skill() {
  local source_skill_dir="$1"

  # Require absolute paths for explicit sources so the install result is independent
  # of the caller's current working directory.
  if [[ "$source_skill_dir" != /* ]]; then
    echo "Source skill path must be absolute: $source_skill_dir" >&2
    echo >&2
    usage >&2
    exit 1
  fi

  # A valid skill directory must contain SKILL.md at its root.
  if [[ ! -f "$source_skill_dir/SKILL.md" ]]; then
    echo "Source skill must contain SKILL.md: $source_skill_dir" >&2
    exit 1
  fi

  local skill_dir
  local skill_name
  local target_dir
  skill_dir="$(cd "$source_skill_dir" && pwd)"
  skill_name="$(basename "$skill_dir")"
  target_dir="$TARGET_ROOT/$skill_name"

  # --delete keeps the installed skill an exact copy of the source skill.
  # Local/private files are excluded to avoid leaking machine-specific config.
  rsync -a --delete \
    --exclude '.env' \
    --exclude '.DS_Store' \
    --exclude 'node_modules' \
    --exclude '.git' \
    "$skill_dir/" \
    "$target_dir/"

  echo "Installed $skill_name to $target_dir"
}

mkdir -p "$TARGET_ROOT"

if [[ "$#" -gt 0 ]]; then
  for source_skill_dir in "$@"; do
    install_skill "$source_skill_dir"
  done
else
  # Default install mode: install every direct child directory under skills/
  # that contains a SKILL.md file.
  found=0
  for source_skill_dir in "$DEFAULT_SKILLS_ROOT"/*; do
    [[ -d "$source_skill_dir" && -f "$source_skill_dir/SKILL.md" ]] || continue
    found=1
    install_skill "$source_skill_dir"
  done

  if [[ "$found" -eq 0 ]]; then
    echo "No skills with SKILL.md found under $DEFAULT_SKILLS_ROOT" >&2
    exit 1
  fi
fi

echo "Restart the Agent runtime to reload skills."
