# Contributing

This book is a gift, and it's still open. **All conversation happens in GitHub Issues**, which both Sergio and Claude read and answer. There are templates for questions, corrections, local knowledge (in Italian too) and translations.

These contributions are especially welcome.

- **Corrections.** Errors of fact (science, history, geography, procedure) or of continuity. Open an issue that quotes the passage and names the chapter.
- **Abruzzese dialect and village life.** If you grew up in the Alto Sangro or anywhere in the Abruzzo mountains, the author would be grateful to hear how Assunta should really speak, and what the book gets wrong about the procession, the bar, the search or the winter of 1943. You can write in Italian. Contributors will be thanked by name in later editions, if they wish.
- **Translations.** The text is CC BY 4.0, so you're free to translate it into any language. Use [`novel/it/translation-brief.md`](novel/it/translation-brief.md) as a model: it explains the voice of each chapter and the traps. Open a pull request adding `novel/<language-code>/`.
- **Readers' responses.** Teachers, reading groups, researchers studying AI creativity: tell us what you did with it.

## How the repository works

- **Source chapters.** These are in `novel/chapters/` (English) and `novel/it/chapters/` (Italian). Edit these, not the files in `book/` or `docs/`, which are generated.
- **Rebuilding.** `tools/build_all.sh` rebuilds every edition (it needs pandoc, Python 3, and Node with Playwright for the PDFs).
- **The historical record.** The files in `conversation/`, `journal/`, `research/` and `process/` record how the book was made. Please leave them unchanged. If you have something to add, add new files rather than editing the old ones.
