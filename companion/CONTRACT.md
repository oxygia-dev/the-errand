# Companion module contract

*Ways of Knowing a Night* is a single web page with five interactive pieces, one per mind. Each piece is one file, `companion/src/<mind>.js`, written to this contract. The build inlines all of them into one HTML file.

## Registration

```js
(function () {
  window.MINDS = window.MINDS || {};
  window.MINDS.dog = {          // dog | bat | bees | crows | tree
    mount(stage, ctx) { /* build everything inside `stage` */ }
  };
})();
```

- **Writing only inside your stage.** `stage` is an empty `<div class="stage">`. Create all of your DOM inside it. Never touch anything outside `stage`, and never use global CSS selectors. If you need styles, inject one `<style>` element whose rules are all prefixed with `.stage[data-mind="<mind>"]`.
- **`ctx` fields:**
  - `ctx.reducedMotion`: a boolean. When it's true, avoid continuous animation; step on interaction instead.
  - `ctx.color(name)`: returns the current CSS colour for a token name: `'paper'`, `'ink'`, `'muted'`, `'rule'`, `'accent'`, `'warm'`, `'panel'`.
  - `ctx.onThemeChange(fn)`: calls `fn` when light/dark switches. Redraw your canvases there.
  - `ctx.audio()`: returns a shared `AudioContext`. Only call it inside a user gesture handler such as a click. It's null if unsupported.
  - `ctx.visible(fn)`: calls `fn(true/false)` when your stage enters or leaves the viewport. Pause animation loops when it isn't visible.
- **No external resources.** No network requests, libraries, images or fonts. Draw everything with Canvas 2D or inline SVG.

## Shared CSS classes (already styled by the shell; use them)

| Class | Purpose |
|---|---|
| `.lede` | one or two sentences telling the player what to do. Plain words, readable by a ten-year-old. |
| `.canvas-wrap` | wraps a `<canvas>`. Width is 100%; you set the height via aspect ratio. Make the canvas crisp with `devicePixelRatio`, and redraw on resize (use a ResizeObserver on the wrap). |
| `.controls` | a flex row that wraps. It holds `<button class="btn">`, `<button class="btn primary">`, `<label class="ctl">text <input type="range"></label>` and `<output class="readout">`. |
| `.result` | the feedback line after the player acts. Use `.result.good` or `.result.miss`. Set `aria-live="polite"`. |
| `.known` | the "What is known" box. Use an `<h4>` plus paragraphs. |
| `.unknown` | the "What isn't known" box. Use an `<h4>` plus paragraphs. |
| `.sources` | a small list of sources, given as plain text (author, year, journal). No links are needed. |

## Requirements

- **Layout.** It must work at 360 px wide (phone) and 1100 px (desktop), with no horizontal overflow. Touch and mouse must both work: use pointer events. Every action also has a keyboard path, such as buttons or arrow keys.
- **Themes.** Both light and dark must work. Use only `ctx.color()` for drawing colours, never hard-coded hex values, except for small details derived from those colours.
- **Start state.** The piece is playable within 3 seconds, and it shows something meaningful at rest, before any interaction.
- **Rounds.** Keep each round short. A round should take under a minute, and the piece must be replayable (a "New trail" / "Another dance" button).
- **Science.** It must be accurate and honest. Mechanics follow real science; where you simplify, say so in `.unknown` or in the lede. Never claim more than is known.
- **Tone.** Restrained, precise and warm. No exclamation marks in the science text. Feedback may be playful but brief.
- **Length.** About 250–600 lines of JS, plain ES2019 with no modules. No `alert`, `confirm` or `prompt`. No localStorage.
- **Text.** All text is in English, kept short. "What is known" has 3–6 short paragraphs or bullets. "What isn't known" has 1–3.

## Testing your piece

```bash
python3 tools/build_companion.py
NODE_PATH=$(npm root -g) node tools/shot_companion.js <mind> <a-scratch-dir>
```

The second command screenshots your section at 390 px and 1100 px, in light and dark, and reports console errors and horizontal overflow. `scrollWidth` must equal the viewport width. Look at the screenshots with the Read tool. Fix what you see, then run them again.

You can also drive interactions with Playwright (clicks, keys) in a throwaway script in your scratch dir to check that a full round works.
