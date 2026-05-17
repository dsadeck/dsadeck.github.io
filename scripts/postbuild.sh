#!/usr/bin/env bash
#
# Post-build steps for GitHub Pages SPA hosting.
#
# 1. Copy index.html to 404.html so any unmatched path (problem detail
#    pages, deep-linked sessions, etc.) still serves the SPA shell —
#    React Router then handles the route client-side.
#
# 2. Drop a .nojekyll so GitHub Pages serves files starting with `_`
#    (Vite emits some) and skips Jekyll processing entirely.
#
# 3. Pre-generate dist/<route>/index.html for every indexable SPA
#    route. Without this, GitHub Pages serves /catalog via the 404
#    fallback with HTTP 404 — Google's URL Inspection sees that and
#    rejects "Request Indexing" with "indexing issues detected".
#    Pre-generating real files makes those paths return HTTP 200 so
#    they're crawlable and rankable.

set -euo pipefail

cd "$(dirname "$0")/.."

cp dist/index.html dist/404.html
touch dist/.nojekyll

# Routes that should be directly reachable from search engines /
# external links. /session is intentionally excluded — it's a flow,
# not a landing page, and shouldn't be indexed.
ROUTES=(catalog stats settings)

for route in "${ROUTES[@]}"; do
  mkdir -p "dist/$route"
  cp dist/index.html "dist/$route/index.html"
done

echo "✓ postbuild: 404.html + .nojekyll + ${#ROUTES[@]} indexable route(s)"
