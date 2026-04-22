# PR Conflict Resolution (Branch conflict after PR creation)

If GitHub says your branch has conflicts, run this from your branch locally.

## 1) Preview what will happen (dry run)
```bash
npm run pr:resolve-conflicts
```

## 2) Execute auto-resolution flow
```bash
node scripts/resolve-pr-conflicts.mjs --execute --prefer=ours
```

Use `--prefer=theirs` if you want incoming `main` changes to win for auto-resolvable files.

## What the script does
1. `git fetch origin`
2. `git rebase origin/main`
3. Detects conflicted files
4. Auto-resolves conflicts for:
   - `docs/**`
   - `.github/workflows/**`
   - `scripts/**`
   - `package.json`
5. Stops and prints any files that still require manual resolution

## 3) Finish manually when needed
If manual files remain:
```bash
git status
git add <resolved-files>
git rebase --continue
```

## 4) Push updated branch
```bash
git push --force-with-lease
```

Then refresh the PR page; the conflict warning should clear.
