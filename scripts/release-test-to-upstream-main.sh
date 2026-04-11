#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/release-test-to-upstream-main.sh [--yes]

Publishes the current interface-test `test` branch to `upstream/main`
without creating a merge commit.

Options:
  --yes   Skip the confirmation prompt
  -h      Show this help message
  --help  Show this help message
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

require_clean_worktree() {
  local status
  status="$(git status --porcelain)"
  [[ -z "$status" ]] || die "working tree is not clean; commit, stash, or discard changes first"
}

repo_slug_from_url() {
  local url="$1"

  url="${url%.git}"

  if [[ "$url" =~ ^[^@]+@[^:]+:(.+/.+)$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return
  fi

  if [[ "$url" =~ ^[^:]+://[^/]+/(.+/.+)$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return
  fi

  printf '%s\n' "$url"
}

require_origin_test_is_ancestor() {
  if ! git rev-parse --verify origin/test >/dev/null 2>&1; then
    die "remote ref 'origin/test' does not exist; push the branch manually first or fix the remote"
  fi

  if ! git merge-base --is-ancestor origin/test HEAD; then
    cat >&2 <<'EOF'
Error: local test is not a fast-forward of origin/test.
This usually means origin/test moved ahead or diverged from your local branch.

Inspect the difference before releasing:
  git log --oneline --decorate --graph HEAD...origin/test
EOF
    exit 1
  fi
}

require_remote_url() {
  local remote_name="$1"
  local expected_slug="$2"
  local url
  local actual_slug

  url="$(git remote get-url "$remote_name" 2>/dev/null || true)"
  [[ -n "$url" ]] || die "remote '$remote_name' is not configured"
  actual_slug="$(repo_slug_from_url "$url")"
  [[ "$actual_slug" == "$expected_slug" ]] || die "remote '$remote_name' does not point to '$expected_slug' (actual: $url)"
}

confirm_release() {
  local answer

  read -r -p "Push local test to origin/test and upstream/main? [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" || "$answer" == "yes" || "$answer" == "YES" ]] || die "release aborted"
}

assume_yes=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      assume_yes=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repository"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

require_remote_url "origin" "LOVE20TKM/interface-test"
require_remote_url "upstream" "LOVE20TKM/interface"

current_branch="$(git branch --show-current)"
[[ "$current_branch" == "test" ]] || die "current branch must be 'test' (actual: ${current_branch:-detached HEAD})"

require_clean_worktree

echo "Repository: $repo_root"
echo "Branch: $current_branch"
echo "Fetching origin and upstream..."
git fetch origin
git fetch upstream

require_origin_test_is_ancestor

echo "Rebasing test onto upstream/main..."
git rebase upstream/main

require_clean_worktree
git merge-base --is-ancestor upstream/main HEAD || die "test is not a fast-forward of upstream/main after rebase"
release_commits="$(git log --oneline --decorate upstream/main..HEAD)"

echo
echo "Commits to publish from test to upstream/main:"
if [[ -n "$release_commits" ]]; then
  printf '%s\n' "$release_commits"
else
  echo "(none; upstream/main is already aligned)"
fi

echo
echo "Origin target:   $(git remote get-url origin)"
echo "Upstream target: $(git remote get-url upstream)"
echo "Release commit:  $(git rev-parse --short HEAD)"

if [[ "$assume_yes" != "true" ]]; then
  confirm_release
fi

echo "Updating origin/test..."
git push --force-with-lease origin HEAD:test

echo "Updating upstream/main..."
git push upstream HEAD:main

echo "Release complete."
