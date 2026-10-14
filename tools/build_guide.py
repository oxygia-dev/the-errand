#!/usr/bin/env python3
"""Build the family guide as a standalone web page (EN and IT).

Outputs: docs/guide/index.html, docs/guide/it/index.html (GitHub Pages)
         book/web/guide.html, book/web/guide-it.html (Artifact fragments)
"""
import html, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
EDS = {
  "en": dict(src="guide/talking-with-someone-who-lives-in-the-past.md", title="Talking with someone who lives in the past",
             other=("Italiano", "it/"), back=("The Errand", "../"), out="guide"),
  "it": dict(src="guide/parlare-con-chi-vive-nel-passato.md", title="Parlare con chi vive nel passato",
             other=("English", "../"), back=("La commissione", "../../"), out="guide-it"),
}
CSS = """
:root { --paper:#eef0ea; --ink:#1e2420; --muted:#5d665e; --rule:#c9cec4; --accent:#8a4b1f; --panel:#e3e6de;
  --display:"Instrument Serif", Georgia, serif; --body:"Literata", Georgia, serif; --mono:"IBM Plex Mono", ui-monospace, Menlo, monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper:#121613; --ink:#d8ddd3; --muted:#8e988d; --rule:#2c332d; --accent:#d39a62; --panel:#1a1f1b; color-scheme: dark; } }
:root[data-theme="dark"] { --paper:#121613; --ink:#d8ddd3; --muted:#8e988d; --rule:#2c332d; --accent:#d39a62; --panel:#1a1f1b; color-scheme: dark; }
body { background:var(--paper); color:var(--ink); font-family:var(--body); font-size:1.12rem; line-height:1.65; }
main { max-width:38rem; margin:0 auto; padding-inline:18px; padding-block:2.5rem 5rem; }
a { color:var(--accent); } :focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
.top { font-family:var(--mono); font-size:.75rem; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); display:flex; gap:1rem; flex-wrap:wrap; }
h1 { font-family:var(--display); font-weight:400; font-size:clamp(2.4rem,9vw,3.6rem); line-height:1.02; margin:1.5rem 0 .4rem; text-wrap:balance; }
h1 + p em { color:var(--muted); }
h2 { font-family:var(--display); font-weight:400; font-size:2rem; line-height:1.1; margin:2.8rem 0 .8rem; text-wrap:balance; }
h3 { font-family:var(--mono); font-weight:500; font-size:.85rem; letter-spacing:.04em; color:var(--accent); margin:2rem 0 .6rem; }
blockquote { margin:1.5rem 0; padding:1rem 1.2rem; background:var(--panel); border-left:3px solid var(--accent); border-radius:4px; font-size:1rem; }
blockquote p { margin:0; }
hr { border:0; border-top:1px solid var(--rule); margin:2.5rem 0; }
ul, ol { padding-left:1.3rem; } li { margin:.35rem 0; }
"""
for lang, E in EDS.items():
    src = ROOT / E["src"]
    if not src.exists():
        print("skip", lang); continue
    lines = src.read_text().splitlines()
    body = subprocess.run(["pandoc", "-f", "markdown", "-t", "html5", "--wrap=none"], input="\n".join(lines),
                          capture_output=True, text=True, check=True).stdout
    page = (f'<title>{E["title"]}</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Literata:ital,opsz,wght@0,7..72,300..600;1,7..72,300..600&family=IBM+Plex+Mono:wght@400;500&display=swap">\n'
            f'<style>{CSS}</style>\n<main lang="{lang}">\n<nav class="top"><a href="{E["back"][1]}">← {E["back"][0]}</a><a href="{E["other"][1]}">{E["other"][0]}</a></nav>\n{body}\n</main>\n')
    (ROOT / "book" / "web" / f'{E["out"]}.html').write_text(page)
    d = ROOT / "docs" / "guide" / ("it" if lang == "it" else "")
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(f'<!doctype html>\n<html lang="{lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="description" content="{html.escape(E["title"])}: a short, honest guide for families of people with dementia. Free, CC BY 4.0.">\n<style>html,body{{margin:0}}</style>\n</head>\n<body>\n{page}</body>\n</html>\n')
    print("built", lang)
