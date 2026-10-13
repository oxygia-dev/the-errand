#!/usr/bin/env bash
# Rebuild every edition: markdown, EPUB, HTML, web pages (book/web + docs/), PDFs, and Pages downloads.
set -euo pipefail
cd "$(dirname "$0")/.."
for lang in en it; do tools/build.sh "$lang"; python3 tools/build_web.py "$lang"; done
NODE_PATH="$(npm root -g)" node tools/build_pdf.js
mkdir -p docs/downloads
cp book/the-errand.epub book/the-errand.pdf book/la-commissione.epub book/la-commissione.pdf docs/downloads/
