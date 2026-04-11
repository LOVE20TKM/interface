# Release Flow

This document describes the release path from `interface-test/test` to `interface/main`.

## Goal

Keep `interface/main` aligned with the same commit chain from `interface-test/test` and avoid creating an extra `Merge branch 'test'` commit.

## Remotes

In the local `interface-test` repository:

- `origin` should point to `LOVE20TKM/interface-test`
- `upstream` should point to `LOVE20TKM/interface`

Verify with:

```bash
git remote -v
```

## Default Command

Run from the `interface-test` repository:

```bash
yarn release:test-to-interface-main
```

The command runs `scripts/release-test-to-upstream-main.sh`.

## What The Script Does

1. Verifies the current repository remotes are `interface-test` and `interface`
2. Verifies the current branch is `test`
3. Verifies the working tree is clean
4. Fetches `origin` and `upstream`
5. Verifies local `test` is a fast-forward of `origin/test`
6. Rebases `test` onto `upstream/main`
7. Shows the commits that will be published
8. Asks for confirmation
9. Pushes the rebased branch back to `origin/test` with `--force-with-lease`
10. Pushes the same `HEAD` to `upstream/main`

## Why This Avoids Duplicate History Noise

This flow does not merge `test` into `main` inside GitHub Desktop or with a local merge commit.

Instead, it:

- rebases `test` onto the latest `upstream/main`
- fast-forwards `upstream/main` to the same commit as `test`

That avoids the extra `Merge branch 'test'` entry that appears when using a normal merge.

## Equivalent Git Commands

```bash
git checkout test
git fetch origin
git fetch upstream
git merge-base --is-ancestor origin/test HEAD
git rebase upstream/main
git push --force-with-lease origin test
git push upstream test:main
```

If `git merge-base --is-ancestor origin/test HEAD` exits with a non-zero status, stop there and inspect the divergence before pushing:

```bash
git log --oneline --decorate --graph HEAD...origin/test
```

## Non-Interactive Mode

Skip the confirmation prompt with:

```bash
bash ./scripts/release-test-to-upstream-main.sh --yes
```

Use this only when you already checked the commit list being released.

## Failure Cases

### Rebase conflict

`git rebase upstream/main` stops when `interface/main` changed the same code.

Resolve the conflict, then continue:

```bash
git add <resolved-files>
git rebase --continue
```

### `--force-with-lease` push rejected

This usually means `origin/test` moved since your last fetch.

Check the new remote history before retrying:

```bash
git fetch origin
git log --oneline --decorate HEAD..origin/test
```

### Script stops before rebase because local and remote `test` diverged

This means your local `test` is not a clean fast-forward of `origin/test`.

Inspect both sides before deciding what to keep:

```bash
git fetch origin
git log --oneline --decorate --graph HEAD...origin/test
```

If the remote branch contains work you need, replay your local commits on top of it first.

### Push to `upstream/main` rejected

This usually means `upstream/main` changed after your rebase.

Refresh and replay your branch again:

```bash
git fetch upstream
git rebase upstream/main
```

## What Not To Do

- Do not open the `interface` repository and merge `test` into `main` with GitHub Desktop
- Do not use a normal merge when the goal is a clean linear main history
- Do not force-push `upstream/main`
