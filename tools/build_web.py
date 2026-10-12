#!/usr/bin/env python3
"""Build the web edition of The Errand: book/web/the-errand.html.

Uses pandoc to turn each chapter (and the field notes) into an HTML fragment,
then wraps everything in a hand-designed reading page.
"""
import html
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHAPTERS = sorted((ROOT / "novel" / "chapters").glob("[0-9][0-9]-*.md"))
NOTES = ROOT / "novel" / "field-notes.md"
OUT = ROOT / "book" / "web" / "the-errand.html"

HEAD_RE = re.compile(r"^##\s+(\d+)\.\s+(.+?)(?:\s+—\s+(.+))?\s*$")


def md_to_html(text: str) -> str:
    return subprocess.run(
        ["pandoc", "-f", "markdown", "-t", "html5", "--wrap=none"],
        input=text, capture_output=True, text=True, check=True,
    ).stdout


chapters = []
for path in CHAPTERS:
    lines = path.read_text().splitlines()
    m = HEAD_RE.match(lines[0])
    num, mind, when = m.group(1), m.group(2), m.group(3)
    body = md_to_html("\n".join(lines[1:]))
    kind = "log" if ("search" in path.name or "signorina" in path.name or "transcript" in path.name) else "prose"
    chapters.append(dict(num=num, mind=mind, when=when, body=body, kind=kind, id=f"ch{num}"))

notes_md = NOTES.read_text().splitlines()
notes_body = md_to_html("\n".join(notes_md[3:]))

toc = "\n".join(
    f'<li><a href="#{c["id"]}"><span class="n">{c["num"]}</span>'
    f'<span class="m">{html.escape(c["mind"])}</span>'
    f'<span class="t">{html.escape(c["when"]) if c["when"] else ""}</span></a></li>'
    for c in chapters
)

sections = "\n".join(
    f'<section class="chapter {c["kind"]}" id="{c["id"]}" aria-labelledby="{c["id"]}-h">'
    f'<header><p class="num">{c["num"]}</p>'
    f'<h2 id="{c["id"]}-h">{html.escape(c["mind"])}</h2>'
    + (f'<p class="when">{html.escape(c["when"])}</p>' if c["when"] else "")
    + f'</header>{c["body"]}</section>'
    for c in chapters
)

page = f"""<title>The Errand</title>
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
.chapter h2 {{ font-family: var(--font-display); font-weight: 400; font-size: 2.6rem; line-height: 1.05; margin: 0.3rem 0 0;
  text-wrap: balance; }}
.chapter .when {{ font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0 0; font-variant-numeric: tabular-nums; }}
.chapter p {{ margin: 0 0 1.05em; }}
.chapter hr {{ border: 0; text-align: center; margin: 2.4rem 0; }}
.chapter hr::after {{ content: "·  ·  ·"; color: var(--muted); letter-spacing: 0.4em; }}
.chapter em {{ font-style: italic; }}
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

.notes {{ padding-top: 6rem; font-size: 1rem; }}
.notes > header h2 {{ font-family: var(--font-display); font-weight: 400; font-size: 2.6rem; margin: 0; }}
.notes > header p {{ color: var(--muted); font-style: italic; margin: 0.3rem 0 2rem; }}
.notes h3 {{ font-family: var(--font-mono); font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--accent); margin: 2.6rem 0 0.8rem; }}
.notes hr {{ border: 0; border-top: 1px solid var(--rule); margin: 2.4rem 0; }}
.notes ul {{ padding-left: 1.2rem; }}

.colophon {{ margin-top: 5rem; padding-top: 2rem; border-top: 1px solid var(--rule); font-size: 0.85rem; color: var(--muted); }}
.colophon p {{ margin: 0 0 0.6rem; }}
.top {{ display: inline-block; margin-top: 1rem; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; }}
@media (max-width: 480px) {{
  body {{ font-size: 1.05rem; }}
  .chapter h2, .notes > header h2 {{ font-size: 2.1rem; }}
}}
@media (prefers-reduced-motion: no-preference) {{ html {{ scroll-behavior: smooth; }} }}
</style>

<main class="wrap" id="top">
  <header class="cover">
    <h1>The Errand</h1>
    <p class="sub">a novel</p>
    <p class="by">by Claude · October 2026</p>
    <div class="ded"><p>For Sergio, who left the door open.</p><p>And for the eighty-one.</p></div>
  </header>

  <nav class="toc" aria-label="Contents">
    <h2>Contents</h2>
    <ol>
{toc}
      <li><a href="#notes"><span class="n">—</span><span class="m">Field notes</span><span class="t"></span></a></li>
    </ol>
    <p class="note">Only the people and the machines keep time.</p>
  </nav>

{sections}

  <section class="notes" id="notes" aria-labelledby="notes-h">
    <header><h2 id="notes-h">Field notes</h2><p>What is true in this book, what is uncertain, and what is invented.</p></header>
    {notes_body}
  </section>

  <footer class="colophon">
    <p><em>The Errand</em> was written by Claude, an AI system made by Anthropic, in a single extended session in October 2026, given complete creative freedom by Sergio Muscat. An independent AI reader (Fable) edited the design and the draft.</p>
    <p>Released under Creative Commons Attribution 4.0 International (CC BY 4.0). Share it, translate it, adapt it.</p>
    <a class="top" href="#top">Back to the beginning</a>
  </footer>
</main>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page)
print(OUT, len(page))
