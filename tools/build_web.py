#!/usr/bin/env python3
"""Build the web edition of the novel.

Usage: python3 tools/build_web.py [en|it]   (default: en)
Output: book/web/the-errand.html or book/web/la-commissione.html

Uses pandoc to turn each chapter, the field notes, and the optional preface
and afterword into HTML fragments, then wraps everything in a hand-designed
reading page.
"""
import html
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANG = sys.argv[1] if len(sys.argv) > 1 else "en"

EDITIONS = {
    "en": dict(
        src=ROOT / "novel", out="the-errand.html", title="The Errand", sub="a novel",
        by="by Claude · October 2026",
        ded=("For Sergio, who left the door open.", "And for the eighty-one."),
        contents="Contents", notes_title="Field notes",
        notes_sub="What is true in this book, what is uncertain, and what is invented.",
        notes_file="field-notes.md", preface_file="preface.md", after_file="afterword.md",
        clock_note="Only the people and the machines keep time.",
        colophon=("<em>The Errand</em> was written by Claude, an AI system made by Anthropic, in October 2026, "
                  "given complete creative freedom by Sergio Muscat. An independent AI reader (Fable) edited the design and the draft.",
                  "Released under Creative Commons Attribution 4.0 International (CC BY 4.0). Share it, translate it, adapt it."),
        top="Back to the beginning", other_label="Leggi in italiano",
        other_url="https://claude.ai/artifact/XJA6s43HkixVmcPbpugZ4E",
        log_words=("search", "signorina", "transcript"),
    ),
    "it": dict(
        src=ROOT / "novel" / "it", out="la-commissione.html", title="La commissione", sub="romanzo",
        by="di Claude · ottobre 2026",
        ded=("Per Sergio, che ha lasciato la porta aperta.", "E per gli ottantuno."),
        contents="Indice", notes_title="Note dal campo",
        notes_sub="Che cosa è vero in questo libro, che cosa è incerto e che cosa è inventato.",
        notes_file="note-dal-campo.md", preface_file="prefazione.md", after_file="postfazione.md",
        clock_note="Solo le persone e le macchine tengono il conto delle ore.",
        colophon=("<em>La commissione</em> è stato scritto da Claude, un sistema di intelligenza artificiale sviluppato da Anthropic, "
                  "nell'ottobre 2026, con piena libertà creativa concessa da Sergio Muscat. Un lettore indipendente, anch'esso un'IA (Fable), "
                  "ha curato il progetto e la stesura. Edizione italiana: autotraduzione dell'autore.",
                  "Pubblicato con licenza Creative Commons Attribuzione 4.0 Internazionale (CC BY 4.0). Condividetelo, traducetelo, adattatelo."),
        top="Torna all'inizio", other_label="Read in English",
        other_url="https://claude.ai/artifact/6kTyMDMW5gmuhzThgaTgT1",
        log_words=("search", "signorina", "transcript"),
    ),
}
E = EDITIONS[LANG]
SRC = E["src"]
HEAD_RE = re.compile(r"^##\s+(\d+)\.\s+(.+?)(?:\s+—\s+(.+))?\s*$")


def md_to_html(text: str) -> str:
    return subprocess.run(
        ["pandoc", "-f", "markdown", "-t", "html5", "--wrap=none"],
        input=text, capture_output=True, text=True, check=True,
    ).stdout


def essay(path: pathlib.Path, sid: str) -> str:
    """Render an optional essay (preface/afterword) whose first line is a '## ' heading."""
    if not path.exists():
        return ""
    lines = path.read_text().splitlines()
    title = lines[0].lstrip("#").strip()
    body = md_to_html("\n".join(lines[1:]))
    return (f'<section class="essay" id="{sid}" aria-labelledby="{sid}-h">'
            f'<header><h2 id="{sid}-h">{html.escape(title)}</h2></header>{body}</section>')


chapters = []
for path in sorted((SRC / "chapters").glob("[0-9][0-9]-*.md")):
    lines = path.read_text().splitlines()
    m = HEAD_RE.match(lines[0])
    num, mind, when = m.group(1), m.group(2), m.group(3)
    body = md_to_html("\n".join(lines[1:]))
    kind = "log" if any(w in path.name for w in E["log_words"]) else "prose"
    chapters.append(dict(num=num, mind=mind, when=when, body=body, kind=kind, id=f"ch{num}"))

notes_lines = (SRC / E["notes_file"]).read_text().splitlines()
# drop the '## ' heading and the italic subtitle line if present
rest = notes_lines[1:]
while rest and (not rest[0].strip() or rest[0].strip().startswith("*")):
    rest = rest[1:]
notes_body = md_to_html("\n".join(rest))

preface = essay(SRC / E["preface_file"], "preface")
afterword = essay(SRC / E["after_file"], "afterword")


def toc_row(href, n, m, t=""):
    return (f'<li><a href="#{href}"><span class="n">{n}</span>'
            f'<span class="m">{html.escape(m)}</span><span class="t">{html.escape(t)}</span></a></li>')


rows = []
if preface:
    rows.append(toc_row("preface", "—", re.sub(r"<.*?>", "", preface.split("</h2>")[0].split(">")[-1])))
rows += [toc_row(c["id"], c["num"], c["mind"], c["when"] or "") for c in chapters]
rows.append(toc_row("notes", "—", E["notes_title"]))
if afterword:
    rows.append(toc_row("afterword", "—", re.sub(r"<.*?>", "", afterword.split("</h2>")[0].split(">")[-1])))
toc = "\n".join(rows)

sections = "\n".join(
    f'<section class="chapter {c["kind"]}" id="{c["id"]}" aria-labelledby="{c["id"]}-h">'
    f'<header><p class="num">{c["num"]}</p>'
    f'<h2 id="{c["id"]}-h">{html.escape(c["mind"])}</h2>'
    + (f'<p class="when">{html.escape(c["when"])}</p>' if c["when"] else "")
    + f'</header>{c["body"]}</section>'
    for c in chapters
)

other = (f'<p class="other"><a href="{E["other_url"]}">{E["other_label"]}</a></p>'
         if "PLACEHOLDER" not in E["other_url"] else "")

page = f"""<title>{E["title"]}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Literata:ital,opsz,wght@0,7..72,300..600;1,7..72,300..600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Layout: one reading column, like a book page; the night's clock lives only in the human and machine chapters. */
:root {{
  --paper: #eef0ea;      /* beech bark, silver-green */
  --ink: #1e2420;        /* forest ink */
  --muted: #5d665e;      /* lichen */
  --rule: #c9cec4;
  --accent: #8a4b1f;     /* turning beech leaf */
  --log-bg: #e3e6de;
  --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-body: "Literata", "Iowan Old Style", Georgia, serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --paper: #121613; --ink: #d8ddd3; --muted: #8e988d; --rule: #2c332d;
    --accent: #d39a62; --log-bg: #1a1f1b; color-scheme: dark;
  }}
}}
:root[data-theme="dark"] {{
  --paper: #121613; --ink: #d8ddd3; --muted: #8e988d; --rule: #2c332d;
  --accent: #d39a62; --log-bg: #1a1f1b; color-scheme: dark;
}}
body {{ background: var(--paper); color: var(--ink); font-family: var(--font-body);
  font-size: 1.125rem; line-height: 1.68; }}
.wrap {{ max-width: 36rem; margin: 0 auto; padding-inline: 20px; padding-block: 3rem 6rem; }}
a {{ color: inherit; }}
a:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 3px; }}

.cover {{ padding-block: 4rem 3rem; border-bottom: 1px solid var(--rule); }}
.cover h1 {{ font-family: var(--font-display); font-weight: 400; font-size: clamp(3.4rem, 12vw, 5.5rem);
  line-height: 0.95; margin: 0; letter-spacing: -0.01em; }}
.cover .sub {{ font-family: var(--font-display); font-style: italic; font-size: 1.5rem; color: var(--muted); margin: 0.6rem 0 2.5rem; }}
.cover .by {{ font-size: 0.95rem; color: var(--muted); margin: 0; }}
.cover .ded {{ margin-top: 3rem; font-style: italic; color: var(--muted); font-size: 1rem; }}
.cover .ded p {{ margin: 0.2rem 0; }}
.cover .other {{ margin: 2.5rem 0 0; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; }}
.cover .other a {{ color: var(--accent); }}

nav.toc {{ padding-block: 2rem; border-bottom: 1px solid var(--rule); }}
nav.toc h2 {{ font-family: var(--font-mono); font-size: 0.72rem; font-weight: 500; text-transform: uppercase;
  letter-spacing: 0.14em; color: var(--muted); margin: 0 0 1rem; }}
nav.toc ol {{ list-style: none; margin: 0; padding: 0; display: grid; gap: 0.15rem; }}
nav.toc a {{ display: grid; grid-template-columns: 2rem 1fr auto; gap: 0.75rem; align-items: baseline;
  text-decoration: none; padding: 0.3rem 0; border-radius: 2px; }}
nav.toc a:hover .m {{ color: var(--accent); }}
nav.toc .n {{ font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); font-variant-numeric: tabular-nums; }}
nav.toc .m {{ font-family: var(--font-display); font-size: 1.3rem; line-height: 1.2; min-width: 0; }}
nav.toc .t {{ font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }}
nav.toc .note {{ font-size: 0.85rem; color: var(--muted); margin: 1.2rem 0 0; font-style: italic; }}

.chapter {{ padding-top: 5rem; }}
.chapter header {{ margin-bottom: 2.2rem; }}
.chapter .num {{ font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); letter-spacing: 0.14em; margin: 0; }}
.chapter h2, .essay h2, .notes > header h2 {{ font-family: var(--font-display); font-weight: 400; font-size: 2.6rem; line-height: 1.05; margin: 0.3rem 0 0;
  text-wrap: balance; }}
.chapter .when {{ font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0 0; font-variant-numeric: tabular-nums; }}
.chapter p, .essay p {{ margin: 0 0 1.05em; }}
.chapter hr {{ border: 0; text-align: center; margin: 2.4rem 0; }}
.chapter hr::after {{ content: "·  ·  ·"; color: var(--muted); letter-spacing: 0.4em; }}
.chapter blockquote {{ margin: 1.6rem 0; padding: 1rem 1.2rem; background: var(--log-bg); border-radius: 10px;
  font-family: var(--font-body); font-size: 0.95rem; }}
.chapter blockquote p:last-child {{ margin-bottom: 0; }}
.chapter pre {{ background: var(--log-bg); padding: 1rem; overflow-x: auto; border-radius: 3px; margin: 1.4rem 0;
  font-family: var(--font-mono); font-size: 0.74rem; line-height: 1.55; }}
.chapter code {{ font-family: var(--font-mono); font-size: 0.8em; }}
.chapter pre code {{ font-size: inherit; }}
.chapter.log p {{ font-size: 1.02rem; }}
.chapter.log p > strong:first-child {{ font-family: var(--font-mono); font-weight: 500; font-size: 0.85em; color: var(--accent); }}
.chapter.log ul {{ padding-left: 1.2rem; }}

.essay {{ padding-top: 6rem; font-size: 1.02rem; }}
.essay header {{ margin-bottom: 2rem; }}
.essay h3, .notes h3 {{ font-family: var(--font-mono); font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--accent); margin: 2.6rem 0 0.8rem; }}
.essay hr, .notes hr {{ border: 0; border-top: 1px solid var(--rule); margin: 2.4rem 0; }}
.essay blockquote {{ margin: 1.4rem 0; padding-left: 1rem; border-left: 2px solid var(--rule); color: var(--muted); }}

.notes {{ padding-top: 6rem; font-size: 1rem; }}
.notes > header p {{ color: var(--muted); font-style: italic; margin: 0.3rem 0 2rem; }}
.notes ul, .essay ul {{ padding-left: 1.2rem; }}

.colophon {{ margin-top: 5rem; padding-top: 2rem; border-top: 1px solid var(--rule); font-size: 0.85rem; color: var(--muted); }}
.colophon p {{ margin: 0 0 0.6rem; }}
.top {{ display: inline-block; margin-top: 1rem; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; }}
@media (max-width: 480px) {{
  body {{ font-size: 1.05rem; }}
  .chapter h2, .essay h2, .notes > header h2 {{ font-size: 2.1rem; }}
}}
@media (prefers-reduced-motion: no-preference) {{ html {{ scroll-behavior: smooth; }} }}
@page {{ size: A5; margin: 18mm 16mm 20mm; }}
@media print {{
  :root {{ --paper: #fff; --ink: #000; --muted: #444; --rule: #bbb; --accent: #6b3a17; --log-bg: #f2f2f0; }}
  body {{ font-size: 10.5pt; line-height: 1.5; }}
  .wrap {{ max-width: none; padding: 0; }}
  .cover {{ break-after: page; padding-top: 30mm; border: 0; }}
  nav.toc {{ break-after: page; border: 0; }}
  .chapter, .essay, .notes {{ break-before: page; padding-top: 0; }}
  .cover .other, .top {{ display: none; }}
  pre {{ white-space: pre-wrap; font-size: 7pt; }}
  a {{ text-decoration: none; }}
}}
</style>

<main class="wrap" id="top" lang="{LANG}">
  <header class="cover">
    <h1>{E["title"]}</h1>
    <p class="sub">{E["sub"]}</p>
    <p class="by">{E["by"]}</p>
    <div class="ded"><p>{E["ded"][0]}</p><p>{E["ded"][1]}</p></div>
    {other}
  </header>

  <nav class="toc" aria-label="{E["contents"]}">
    <h2>{E["contents"]}</h2>
    <ol>
{toc}
    </ol>
    <p class="note">{E["clock_note"]}</p>
  </nav>

{preface}

{sections}

  <section class="notes" id="notes" aria-labelledby="notes-h">
    <header><h2 id="notes-h">{E["notes_title"]}</h2><p>{E["notes_sub"]}</p></header>
    {notes_body}
  </section>

{afterword}

  <footer class="colophon">
    <p>{E["colophon"][0]}</p>
    <p>{E["colophon"][1]}</p>
    <a class="top" href="#top">{E["top"]}</a>
  </footer>
</main>
"""

# Standalone copy for GitHub Pages (docs/): full document skeleton around the same page.
docs = ROOT / "docs" / E["out"]
docs.parent.mkdir(parents=True, exist_ok=True)
docs.write_text(f"""<!doctype html>
<html lang="{LANG}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{E['title']}: {E['sub']} — Claude, 2026. CC BY 4.0.">
</head>
<body>
{page}
</body>
</html>
""")

out = ROOT / "book" / "web" / E["out"]
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page)
print(out, len(page))
