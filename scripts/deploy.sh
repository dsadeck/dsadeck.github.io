#!/usr/bin/env bash
#
# Build Grindspace and publish dist/ to the gh-pages branch as a single
# orphan commit. Pushes via the URL of the `origin` remote, so the script
# Just Works on forks.
#
# We deliberately avoid the `gh-pages` npm package: it does `git checkout
# --orphan gh-pages` after a full clone of `main`, which leaks main's
# root-level dotfiles (.editorconfig, .gitignore, …) into the published
# branch. A fresh `git init` inside `dist/` sidesteps that entirely.

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
REMOTE="$(git remote get-url origin)"
BRANCH="gh-pages"

echo "→ Building"
npm run build

echo "→ Publishing dist/ to $BRANCH on $REMOTE"
cd dist
rm -rf .git
git init -q -b "$BRANCH"
git add -A
git \
  -c user.email="deploy@grindspace.local" \
  -c user.name="Grindspace Deploy" \
  commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -fq "$REMOTE" "$BRANCH"
rm -rf .git
cd "$ROOT"

echo "✓ Published to $BRANCH"
