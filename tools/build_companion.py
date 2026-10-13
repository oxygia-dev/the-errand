#!/usr/bin/env python3
"""Build 'Ways of Knowing a Night' into one self-contained HTML file.

Outputs:
  book/web/companion.html      — page fragment (for the Artifact viewer, which adds the document skeleton)
  docs/companion/index.html    — full standalone document (GitHub Pages)
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
shell = (ROOT / "companion" / "shell.html").read_text()
mods = []
for name in ["dog", "bat", "bees", "crows", "tree"]:
    f = ROOT / "companion" / "src" / f"{name}.js"
    if f.exists():
        mods.append(f"<script>/* {name}.js */\n{f.read_text()}\n</script>")
page = shell.replace("{{MODULES}}", "\n".join(mods)).replace("{{BOOK_URL}}", "https://oxygia-dev.github.io/the-errand/")
(ROOT / "book" / "web").mkdir(parents=True, exist_ok=True)
(ROOT / "book" / "web" / "companion.html").write_text(page)
doc = ROOT / "docs" / "companion" / "index.html"
doc.parent.mkdir(parents=True, exist_ok=True)
doc.write_text('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
               '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
               '<meta name="description" content="Try to perceive like five minds from the novel The Errand: a dog, a bat, bees, crows and a 500-year-old beech.">\n'
               '<meta property="og:image" content="https://oxygia-dev.github.io/the-errand/cover/the-errand.png">\n'
               '<style>html,body{margin:0}</style>\n</head>\n<body>\n' + page + '\n</body>\n</html>\n')
print("modules:", len(mods), "->", doc)
