#!/usr/bin/env bash
# Assemble the manuscript and build EPUB + standalone HTML with pandoc.
# Usage: tools/build.sh [en|it]   (default: en)
set -euo pipefail
cd "$(dirname "$0")/.."
lang="${1:-en}"
if [ "$lang" = "it" ]; then
  src=novel/it; name=la-commissione; preface=prefazione.md; notes=note-dal-campo.md; after=postfazione.md; title="La commissione"
else
  src=novel; name=the-errand; preface=preface.md; notes=field-notes.md; after=afterword.md; title="The Errand"
fi
out=book
mkdir -p "$out"
{
  cat "$src/front-matter.md"
  [ -f "$src/$preface" ] && { cat "$src/$preface"; printf '\n\n'; }
  for f in "$src"/chapters/[0-9][0-9]-*.md; do cat "$f"; printf '\n\n'; done
  cat "$src/$notes"; printf '\n\n'
  [ -f "$src/$after" ] && cat "$src/$after"
} > "$out/$name.md"
pandoc "$out/$name.md" -o "$out/$name.epub" --toc --toc-depth=2 --split-level=2 --css tools/book.css
pandoc "$out/$name.md" -s -o "$out/$name.html" --toc --toc-depth=2 --css tools/book.css --embed-resources --metadata title="$title"
wc -w "$out/$name.md"
