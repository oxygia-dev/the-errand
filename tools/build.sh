#!/usr/bin/env bash
# Assemble the manuscript and build EPUB + standalone HTML with pandoc.
set -euo pipefail
cd "$(dirname "$0")/.."
out=book
mkdir -p "$out"
{
  cat novel/front-matter.md
  for f in novel/chapters/[0-9][0-9]-*.md; do
    cat "$f"; printf '\n\n'
  done
  cat novel/field-notes.md
} > "$out/the-errand.md"
pandoc "$out/the-errand.md" -o "$out/the-errand.epub" --toc --toc-depth=2 --split-level=2 --css tools/book.css
pandoc "$out/the-errand.md" -s -o "$out/the-errand.html" --toc --toc-depth=2 --css tools/book.css --embed-resources --metadata title="The Errand"
wc -w "$out/the-errand.md"
ls -la "$out"
