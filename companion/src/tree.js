/* The tree: "Five hundred rings". A seeded beech cross-section (sibling of the book's cover):
   one ring per year from 1525 to 2026, a hollow heart that the rot opens after the 1736 wound,
   and a caption in the tree's own register for the year under the player's finger. */
(function () {
  'use strict';
  var FIRST = 1525, LAST = 2026, N = LAST - FIRST + 1;   // 502 rings
  var GAP = 1566, SHEEP = 1610, SHEEP_END = 1956, POLLARD = 1712, WOUND = 1736, ROT_END = 1850;
  var TAU = Math.PI * 2;

  // c: year approximate. h: human-history line (null: none on record; '': show nothing). w: a last, separate line.
  var EVENTS = [
    { y: 1525, c: true, t: 'A nut splits its skin. A root goes down, two leaves come up, and then it waits.',
      h: 'Nobody in the valley will remember this year, which is most years.' },
    { y: GAP, c: true, t: 'Wet spring snow on full leaf. A mother tree falls and takes three others with her. Through the hole in the ceiling: the sky.', h: null },
    { y: SHEEP, c: true, t: 'Sheep, in June. Hundreds in the shade at noon; their dung goes into the ground, and the ground into the tree. In September, gone.',
      h: 'Transhumance: every summer the flocks walk up from the plains of Apulia along the tratturi, the broad grass drove roads.' },
    { y: POLLARD, c: true, t: 'Axes, and smoke from a clearing below for two summers. Cut back hard at the height of a man. It grows back many-armed, and keeps the shape.',
      h: 'Charcoal burners worked these woods for centuries.' },
    { y: WOUND, c: true, t: 'Lightning forty paces away; the shock goes through the roots. The lowest limb tears off. A wound the size of a door, and into it, rain and spores.', h: null },
    { y: ROT_END, c: true, t: 'The heart is gone. Around the hole, a wall in the wood that the rot does not cross. Inside: dormice, owls, beetle grubs making red dust.', h: null },
    { y: 1888, t: 'A knife in the bark: 1888. The eights will widen with the trunk until they are fat as snowmen.',
      h: 'Someone cuts the date. Beech bark does not shed, so the cut stays.' },
    { y: 1915, t: 'In a winter, the ground shakes: a long low shudder through the roots, from the west. The forest stands.',
      h: 'Avezzano earthquake, 13 January 1915. About 30,000 dead.' },
    { y: 1923, t: 'Nothing reaches the tree. A line is drawn on a map around it. It cannot know.',
      h: 'The Abruzzo National Park is established by law, January 1923.' },
    { y: 1943, t: 'A warmth, once, in a winter.', h: '', warm: true },
    { y: SHEEP_END, c: true, t: 'No sheep this June. They stop slowly, then all at once. The ground changes, and the rings with it.',
      h: 'Transhumance on foot dwindles after the war; flocks go by lorry and train, then mostly not at all.' },
    { y: 2003, t: 'No rain. Water columns in the wood snap, each with a click too high for any ear in the forest but a bat’s.',
      h: 'The European heatwave of 2003. The clicks are ultrasonic: people hear them only through instruments.' },
    { y: 2009, t: 'The ground shakes again, less hard, ninety-four years later, in a spring.',
      h: 'L’Aquila earthquake, 6 April 2009. 309 dead.' },
    { y: 2025, t: 'Mast. Nuts so thick that feet on them sound like feet on gravel. Each evening a bear sits against the trunk, cracking husks.',
      h: 'In the novel, the autumn before.' },
    { y: LAST, t: 'Snow until April. No mast. No rain from June to August: clicks, all through the afternoons.', w: 'A warmth.',
      h: '29 September 2026: the night of the novel.', warm: true }
  ];
  var EV = {};
  EVENTS.forEach(function (e) { EV[e.y] = e; });

  // ---- seeded growth record (same generator and seed as the cover, so the trunk has the cover's outline) ----
  var s = 20260929;
  function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
  var harm = [];
  for (var k = 0; k < 7; k++) harm.push({ a: (rnd() - 0.5) * 0.06 / (k + 1), p: rnd() * TAU, f: k + 2 });
  function wob(th) { var v = 0; for (var j = 0; j < 7; j++) v += harm[j].a * Math.sin(harm[j].f * th + harm[j].p); return v; }

  var widths = [], cum = [], total = 0, ar = 0;
  for (var i = 0; i < N; i++) {
    var y = FIRST + i, w;
    ar = 0.55 * ar + 0.45 * (rnd() - 0.5);                 // a few years of good or bad weather in a row
    if (y < GAP) w = 0.09 + 0.06 * rnd();                    // waiting in shade
    else {
      w = y < 1610 ? 2.3 - 0.9 * (y - GAP) / 44 : 1.3 - 0.5 * (y - 1610) / 416;   // release, then slow ageing
      w *= 1 + ar * 0.7 + (rnd() - 0.5) * 0.35;
      if (rnd() < 0.055) w *= 0.38;                          // a hard year
      if (y >= POLLARD && y < POLLARD + 6) w *= 0.3 + 0.12 * (y - POLLARD);   // crown cut back
      if (y >= WOUND && y < WOUND + 4) w *= 0.6;
      if (y > SHEEP_END) w *= 0.88;
      if (y === 1943) w *= 0.62;                             // "the narrowness is the summer's"
      if (y === 2003) w *= 0.3;
      if (y === 2025) w *= 0.6;                              // mast years take wood
      if (y === LAST) w *= 0.42;
    }
    widths.push(w); total += w;
  }
  var acc = 0;
  for (i = 0; i < N; i++) { acc += widths[i]; cum.push(acc / total); }   // outer edge of each ring, 0..1
  var thin = widths.map(function (w, i) {
    if (FIRST + i < GAP) return false;
    var a = 0, n = 0;
    for (var j = Math.max(41, i - 10); j <= Math.min(N - 1, i + 10); j++) { a += widths[j]; n++; }
    return w < 0.5 * a / n;
  });

  // ---- the hollow, bounded by the ring laid down in the wound year (the wall the rot does not cross) ----
  var BI = WOUND - FIRST;
  function shapeR(frac, th) { return frac * (1 + wob(th) * (0.4 + 0.6 * frac)); }
  function hollowR(th) { return shapeR(cum[BI], th) * 0.97 * (1 + 0.12 * Math.sin(3 * th + 1) + 0.05 * Math.sin(7 * th)) / 1.17; }
  function goneFrac(idx) {
    var n = 0;
    for (var q = 0; q < 120; q++) { var th = q / 120 * TAU; if (shapeR(cum[idx], th) <= hollowR(th)) n++; }
    return n / 120;
  }
  var dust = [];
  for (i = 0; i < 900; i++) dust.push({ th: Math.PI * (0.15 + 0.7 * rnd()), d: 0.5 + 0.48 * rnd(), a: 0.2 + 0.4 * rnd(), z: 0.8 + 0.9 * rnd() });

  function captionFor(y) {
    var e = EV[y];
    if (e) return e;
    var parts = [], idx = y - FIRST;
    if (thin[idx]) parts.push('A thin ring: drought, or a late frost.');
    if (y < GAP) parts.push('Shade. Light already used by a hundred thousand leaves: enough to stay, not to grow. A ring too thin to count without a glass.');
    else if (y < SHEEP) parts.push('Light through the gap. The crown climbs into it. Some years a finger’s width of wood.');
    if (y > POLLARD && y < POLLARD + 8) parts.push('The new arms thicken.');
    if (y > WOUND && y < ROT_END) parts.push('Inside, behind a wall, the rot eats the dead heart. The tree lives on in its outer rings.');
    if (y > SHEEP && y < SHEEP_END) parts.push('Summers of sheep, winters of snow.');
    else if (y > SHEEP_END) parts.push('Snow, leaf, nut, leaf-fall. No sheep.');
    return { t: parts.join(' ') };
  }

  function parse(c) {
    c = (c || '').trim();
    if (c.charAt(0) === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      var n = parseInt(c.slice(1, 7), 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255];
    }
    var m = c.match(/[\d.]+/g);
    return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, al) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (al == null ? 1 : al) + ')'; }

  var CSS = [
    '.stage[data-mind="tree"] .canvas-wrap{aspect-ratio:10/9}',
    '@media (max-width:560px){.stage[data-mind="tree"] .canvas-wrap{aspect-ratio:1/1.1}}',
    '.stage[data-mind="tree"] canvas{cursor:pointer;touch-action:pan-y}',
    '.stage[data-mind="tree"] .scrub{display:grid;gap:.15rem;min-width:0}',
    '.stage[data-mind="tree"] .track{position:relative;padding-bottom:9px}',
    '.stage[data-mind="tree"] .track input{display:block;width:100%;margin:0;height:30px;accent-color:var(--accent);cursor:pointer}',
    '.stage[data-mind="tree"] .marks{position:absolute;left:8px;right:8px;bottom:0;height:9px;pointer-events:none}',
    '.stage[data-mind="tree"] .marks i{position:absolute;top:0;width:1px;height:6px;background:var(--muted);opacity:.7}',
    '.stage[data-mind="tree"] .marks i.on{background:var(--warm);opacity:1;width:3px;height:9px;margin-left:-1px;border-radius:1px}',
    '.stage[data-mind="tree"] .ends{display:flex;justify-content:space-between;align-items:baseline;font:.72rem var(--font-mono);color:var(--muted)}',
    '.stage[data-mind="tree"] .ends output{font-size:.85rem}',
    '.stage[data-mind="tree"] .reading{min-height:7.5em}',
    '.stage[data-mind="tree"] .cap{font-weight:400;font-size:1.1rem;line-height:1.55;color:var(--ink);max-width:36rem;text-wrap:pretty}',
    '.stage[data-mind="tree"] .cap .w{display:block;margin-top:.45rem;font-style:italic}',
    '.stage[data-mind="tree"] .human{margin:.55rem 0 0;font-size:.88rem;line-height:1.5;color:var(--muted);max-width:36rem}',
    '.stage[data-mind="tree"] .human b{font:500 .66rem var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-right:.55rem}',
    '.stage[data-mind="tree"] .note{margin:.55rem 0 0;font-size:.82rem;font-style:italic;color:var(--muted)}'
  ].join('\n');

  function mount(stage, ctx) {
    var st = document.createElement('style');
    st.textContent = CSS;
    stage.appendChild(st);
    var box = document.createElement('div');
    box.style.display = 'contents';
    box.innerHTML =
      '<p class="lede">Drag through five centuries. The tree remembers only what touched it.</p>' +
      '<div class="canvas-wrap"><canvas tabindex="0" role="slider" aria-valuemin="' + FIRST + '" aria-valuemax="' + LAST + '"' +
      ' aria-label="Cross-section of a 500-year-old beech. Tap a ring, or use the arrow keys, to choose a year."></canvas></div>' +
      '<div class="scrub"><div class="track"><input type="range" min="' + FIRST + '" max="' + LAST + '" step="1" aria-label="Year">' +
      '<div class="marks" aria-hidden="true"></div></div>' +
      '<div class="ends" aria-hidden="true"><span>' + FIRST + '</span><output class="readout"></output><span>' + LAST + '</span></div></div>' +
      '<div class="controls"><button class="btn" data-a="prev" aria-label="Previous year">◀ year</button>' +
      '<button class="btn" data-a="next" aria-label="Next year">year ▶</button>' +
      '<button class="btn primary" data-a="play"></button>' +
      '<button class="btn" data-a="human" aria-pressed="false">Show human dates</button></div>' +
      '<div class="reading"><p class="result cap" aria-live="polite"></p>' +
      '<p class="human" hidden><b>People</b><span></span></p><p class="note"></p></div>' +
      '<div class="known"><h4>What is known</h4>' +
      '<p>Trees in seasonal climates add one growth ring a year; counting and matching them is dendrochronology. A narrow ring marks a hard year: drought, a late frost, a lost crown, a heavy crop of nuts.</p>' +
      '<p>Beech seedlings can wait for decades in deep shade, growing almost nothing, then shoot up when a fallen neighbour opens a gap in the canopy.</p>' +
      '<p>A wounded tree walls off the damage chemically. Fungi may then eat the dead heartwood inside the wall, leaving a hollow. A hollow trunk is a tube, and tubes are strong: many hollow beeches stand for centuries.</p>' +
      '<p>Because the centre is gone, the oldest beeches can’t be cored back to their first ring, so their ages are estimates. In Val Cervara, in the Abruzzo, part of a UNESCO World Heritage site, beeches have been dated to about 500 years.</p>' +
      '<p>In drought, water columns in the wood can snap. Each break makes an ultrasonic click, too high for human ears.</p></div>' +
      '<div class="unknown"><h4>What isn’t known</h4>' +
      '<p>Whether trees pass food or warnings to each other through fungal threads in the soil is contested. A 2023 review by Karst, Jones and Hoeksema found claims that “mother trees” feed and warn their kin unsupported by the evidence, though others dispute parts of it. So this tree sends no messages.</p>' +
      '<p>This cross-section is drawn, not measured. Its ring widths are generated to follow the novel, and years marked “c.” are approximate. Real beech rings are faint and need a lens to count.</p></div>' +
      '<ul class="sources">' +
      '<li>Fritts, H. C. (1976). <em>Tree Rings and Climate</em>. Academic Press.</li>' +
      '<li>Schirone, B. et al. Studies of the old-growth beeches of Val Cervara, Abruzzo; UNESCO, Ancient and Primeval Beech Forests of the Carpathians and Other Regions of Europe.</li>' +
      '<li>Shigo, A. L. (1984). Compartmentalization: a conceptual framework for understanding how trees grow and defend themselves. <em>Annual Review of Phytopathology</em> 22.</li>' +
      '<li>Ponomarenko, A. et al. (2014). Ultrasonic emissions reveal individual cavitation bubbles in water-stressed wood. <em>Journal of the Royal Society Interface</em> 11.</li>' +
      '<li>Karst, J., Jones, M. D. &amp; Hoeksema, J. D. (2023). Positive citation bias and overinterpreted results lead to misinformation on common mycorrhizal networks in forests. <em>Nature Ecology &amp; Evolution</em> 7.</li>' +
      '</ul>';
    stage.appendChild(box);

    function q(sel) { return box.querySelector(sel); }
    var wrap = q('.canvas-wrap'), cv = q('canvas'), g = cv.getContext('2d');
    var range = q('input[type=range]'), out = q('output'), marks = q('.marks');
    var cap = q('.cap'), human = q('.human'), humanText = q('.human span'), note = q('.note');
    var bPrev = q('[data-a=prev]'), bNext = q('[data-a=next]'), bPlay = q('[data-a=play]'), bHuman = q('[data-a=human]');
    var reduced = !!ctx.reducedMotion;

    var markEls = {};
    EVENTS.forEach(function (e) {
      var m = document.createElement('i');
      m.style.left = ((e.y - FIRST) / (LAST - FIRST) * 100) + '%';
      marks.appendChild(m); markEls[e.y] = m;
    });

    var sel = LAST, hover = -1, humanOn = false, playing = false, visible = true;
    var W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0, off = null, col = null, drawQueued = 0, lastKey = '';

    function readColors() {
      var c = {};
      ['paper', 'ink', 'muted', 'rule', 'accent', 'warm', 'panel'].forEach(function (n) { c[n] = parse(ctx.color(n)); });
      var p = c.paper; c.dark = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255 < 0.45;
      var base = mix(c.panel, c.ink, c.dark ? 0.1 : 0.05);
      c.wood = mix(base, c.accent, c.dark ? 0.06 : 0.17);
      c.hollow = c.dark ? mix(c.paper, [0, 0, 0], 0.45) : mix(c.ink, c.paper, 0.06);
      c.stain = c.dark ? mix(c.accent, c.hollow, 0.55) : mix(c.accent, c.ink, 0.35);
      col = c;
    }

    function trace(gc, frac, extra) {
      var rp = Math.max(0.5, R * frac), n = Math.max(28, Math.min(720, Math.round(rp * 1.3)));
      gc.beginPath();
      for (var j = 0; j <= n; j++) {
        var th = j / n * TAU, rad = R * shapeR(frac, th) + (extra || 0);
        if (j) gc.lineTo(cx + rad * Math.cos(th), cy + rad * Math.sin(th)); else gc.moveTo(cx + rad, cy);
      }
      gc.closePath();
    }
    function traceHollow(gc, scale) {
      gc.beginPath();
      for (var j = 0; j <= 360; j++) {
        var th = j / 360 * TAU, rad = R * hollowR(th) * scale;
        if (j) gc.lineTo(cx + rad * Math.cos(th), cy + rad * Math.sin(th)); else gc.moveTo(cx + rad, cy);
      }
      gc.closePath();
    }

    function buildWood() {
      off = document.createElement('canvas');
      off.width = cv.width; off.height = cv.height;
      var o = off.getContext('2d');
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      var r2 = 0x9e3779b9;
      function rr() { r2 = (r2 * 1664525 + 1013904223) >>> 0; return r2 / 4294967296; }
      o.lineJoin = 'round';
      for (var j = N - 1; j >= 0; j--) {
        trace(o, cum[j]);
        var shade = (j % 2 ? 0.014 : 0) + rr() * 0.022 + (1 - cum[j]) * (col.dark ? 0.035 : 0.05);
        o.fillStyle = rgba(mix(col.wood, col.ink, shade));
        o.fill();
        o.strokeStyle = rgba(col.ink, (col.dark ? 0.06 : 0.05) + rr() * 0.08 + (thin[j] ? 0.16 : 0));
        o.lineWidth = thin[j] ? 0.9 : 0.55;
        o.stroke();
      }
      // bark
      trace(o, 1, 1.2);
      o.strokeStyle = rgba(col.muted, 0.9); o.lineWidth = 2.4; o.stroke();
    }

    function resize() {
      var r = wrap.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      dpr = Math.min(3, window.devicePixelRatio || 1);
      W = w; H = h;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      R = Math.min(W, H) * 0.44; cx = W / 2; cy = H > W ? H - W / 2 : H / 2;
      buildWood();
      draw();
    }

    function hollowState(y) {
      if (y <= WOUND) return 0;
      return Math.min(1, (y - WOUND) / (ROT_END - WOUND));
    }

    function draw() {
      drawQueued = 0;
      if (!off || !col) return;
      var idx = sel - FIRST;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = rgba(col.panel); g.fillRect(0, 0, W, H);
      // the years not yet laid down: a ghost
      g.globalAlpha = col.dark ? 0.3 : 0.26; g.drawImage(off, 0, 0, W, H); g.globalAlpha = 1;
      // the years so far
      g.save(); trace(g, cum[idx]); g.clip(); g.drawImage(off, 0, 0, W, H);
      // the rot, then the hollow
      var p = hollowState(sel);
      if (p > 0) {
        g.save(); trace(g, cum[BI]); g.clip();
        traceHollow(g, Math.min(1.08, 0.1 + p * 1.1));
        g.fillStyle = rgba(col.stain, col.dark ? 0.45 : 0.22); g.fill();
        g.restore();
        var hs = Math.pow(p, 1.6);
        if (hs > 0.01) {
          traceHollow(g, hs); g.fillStyle = rgba(col.hollow, 0.55 + 0.45 * p); g.fill();
          g.save(); traceHollow(g, hs); g.clip();
          var da = Math.max(0, Math.min(1, (sel - ROT_END + 20) / 50));
          if (da > 0) {
            for (var j = 0; j < dust.length; j++) {
              var d = dust[j], rad = R * hollowR(d.th) * d.d;
              g.fillStyle = rgba(col.accent, d.a * da * (col.dark ? 0.8 : 0.9));
              g.fillRect(cx + rad * Math.cos(d.th) - d.z / 2, cy + rad * Math.sin(d.th) * 0.92 - d.z / 2, d.z, d.z);
            }
          }
          var e = EV[sel];
          if (e && e.warm) {
            var hb = R * hollowR(Math.PI / 2), wy = cy + hb * 0.42, wr = hb * 0.5;
            var gr = g.createRadialGradient(cx, wy, 0, cx, wy, wr);
            gr.addColorStop(0, rgba(col.warm, 0.95)); gr.addColorStop(0.2, rgba(col.warm, 0.5)); gr.addColorStop(1, rgba(col.warm, 0));
            g.fillStyle = gr; g.beginPath(); g.arc(cx, wy, wr, 0, TAU); g.fill();
          }
          g.restore();
        }
        // the wall
        trace(g, cum[BI]); g.strokeStyle = rgba(col.ink, col.dark ? 0.32 : 0.38); g.lineWidth = 0.9; g.stroke();
      }
      g.restore();

      // marks along one radius: where the tree was touched
      var th0 = -Math.PI / 4, hNow = hollowState(sel);
      EVENTS.forEach(function (e) {
        var ei = e.y - FIRST, mid = (ei ? cum[ei - 1] : 0) * 0.5 + cum[ei] * 0.5;
        var rad = R * shapeR(mid, th0), x = cx + rad * Math.cos(th0), y = cy + rad * Math.sin(th0);
        if (e.y === sel) return;
        var eaten = hNow >= 1 && e.y < WOUND && R * hollowR(th0) * Math.pow(hNow, 1.6) > rad;
        g.beginPath(); g.arc(x, y, 1.9, 0, TAU);
        if (eaten) { g.strokeStyle = rgba(col.muted, 0.6); g.lineWidth = 0.8; g.stroke(); }
        else { g.fillStyle = rgba(e.y < sel ? col.ink : col.muted, e.y < sel ? 0.55 : 0.4); g.fill(); }
      });

      if (hover >= 0 && hover !== sel) {
        trace(g, cum[hover - FIRST]); g.strokeStyle = rgba(col.ink, 0.45); g.lineWidth = 1; g.stroke();
      }

      // this year's ring
      var rS = R * cum[idx];
      g.lineJoin = 'round';
      if (rS < 4) {
        var gl = g.createRadialGradient(cx, cy, 0, cx, cy, 9);
        gl.addColorStop(0, rgba(col.warm, 1)); gl.addColorStop(0.35, rgba(col.warm, 0.45)); gl.addColorStop(1, rgba(col.warm, 0));
        g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, 9, 0, TAU); g.fill();
      } else {
        trace(g, cum[idx]);
        g.strokeStyle = rgba(col.warm, 0.14); g.lineWidth = 10; g.stroke();
        g.strokeStyle = rgba(col.warm, 0.32); g.lineWidth = 4; g.stroke();
        g.strokeStyle = rgba(col.warm, 1); g.lineWidth = 1.5; g.stroke();
      }
      if (EV[sel]) {
        var mi = (idx ? cum[idx - 1] : 0) * 0.5 + cum[idx] * 0.5, mr = R * shapeR(mi, th0);
        g.beginPath(); g.arc(cx + mr * Math.cos(th0), cy + mr * Math.sin(th0), 3.2, 0, TAU);
        g.fillStyle = rgba(col.warm); g.fill();
      }

      // the year, like a label on a museum slice
      var fs = Math.round(Math.max(26, Math.min(48, W * 0.068))), pad = Math.round(fs * 0.5);
      g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.fillStyle = rgba(col.ink, 0.92);
      g.font = '400 ' + fs + 'px "Instrument Serif", "Iowan Old Style", Georgia, serif';
      var label = (EV[sel] && EV[sel].c ? 'c. ' : '') + sel, base = pad + fs * 0.8;
      g.fillText(label, pad, base);
      var lw = g.measureText(label).width;
      g.fillStyle = rgba(col.muted);
      g.font = '400 ' + Math.max(10, Math.round(fs * 0.24)) + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
      var tally = 'RING ' + (idx + 1) + ' OF ' + N;
      if (H > W) g.fillText(tally, pad + lw + 12, base);              // narrow: one line above the trunk
      else g.fillText(tally, pad + 1, base + Math.max(15, fs * 0.5));
    }
    function requestDraw() { if (!drawQueued) drawQueued = requestAnimationFrame(draw); }

    function updateText() {
      var e = captionFor(sel), idx = sel - FIRST;
      var key = e.t + '|' + (e.w || '');
      if (key !== lastKey) {
        lastKey = key;
        cap.textContent = e.t;
        if (e.w) { var sp = document.createElement('span'); sp.className = 'w'; sp.textContent = e.w; cap.appendChild(sp); }
      }
      var ev = EV[sel], ht = ev ? (ev.h === null ? 'No human record.' : ev.h) : '';
      humanText.textContent = ht;
      human.hidden = !humanOn || !ht;
      var nt = '';
      if (sel < WOUND) {
        var gf = goneFrac(idx);
        if (gf >= 1) nt = 'This wood is gone now: the rot ate it. Rings this old can’t be counted, only estimated.';
        else if (gf > 0) nt = 'Part of this ring is gone now, eaten into the hollow.';
      }
      note.textContent = nt;
    }

    function setYear(y) {
      y = Math.max(FIRST, Math.min(LAST, Math.round(y)));
      if (markEls[sel]) markEls[sel].className = '';
      sel = y;
      if (markEls[sel]) markEls[sel].className = 'on';
      range.value = String(y);
      out.textContent = (EV[y] && EV[y].c ? 'c. ' : '') + y;
      cv.setAttribute('aria-valuenow', String(y));
      cv.setAttribute('aria-valuetext', y + ', ring ' + (y - FIRST + 1) + ' of ' + N);
      range.setAttribute('aria-valuetext', y + ', ring ' + (y - FIRST + 1) + ' of ' + N);
      bPrev.disabled = y <= FIRST; bNext.disabled = y >= LAST;
      updateText();
      requestDraw();
    }

    function nextEvent(y) { for (var j = 0; j < EVENTS.length; j++) if (EVENTS[j].y > y) return EVENTS[j].y; return null; }
    function prevEvent(y) { for (var j = EVENTS.length - 1; j >= 0; j--) if (EVENTS[j].y < y) return EVENTS[j].y; return null; }

    // ---- playing the centuries ----
    var raf = 0, last = 0, pos = LAST, hold = 0, RATE = 30, HOLD = 1.9;
    function playLabel() {
      if (reduced) bPlay.textContent = 'Next mark ▶';
      else bPlay.textContent = playing ? 'Pause' : 'Play the centuries';
      bPlay.setAttribute('aria-pressed', playing ? 'true' : 'false');
      if (reduced) bPlay.removeAttribute('aria-pressed');
    }
    function stopPlay() {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0; playLabel();
    }
    function tick(ts) {
      raf = 0;
      if (!playing || !visible) return;
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
      last = ts;
      if (hold > 0) hold -= dt;
      else {
        var nx = nextEvent(Math.floor(pos));
        pos += dt * RATE;
        if (nx !== null && pos >= nx) { pos = nx; hold = EV[nx].warm ? HOLD * 1.5 : HOLD; }
      }
      if (pos >= LAST) { setYear(LAST); stopPlay(); return; }
      if (Math.floor(pos) !== sel) setYear(Math.floor(pos));
      raf = requestAnimationFrame(tick);
    }
    function startPlay() {
      if (sel >= LAST) { pos = FIRST; setYear(FIRST); hold = HOLD; } else { pos = sel + 0.001; hold = 0; }
      playing = true; last = 0; playLabel();
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }
    bPlay.addEventListener('click', function () {
      if (reduced) { var n = nextEvent(sel); setYear(n === null ? FIRST : n); return; }
      if (playing) stopPlay(); else startPlay();
    });

    bPrev.addEventListener('click', function () { stopPlay(); setYear(sel - 1); });
    bNext.addEventListener('click', function () { stopPlay(); setYear(sel + 1); });
    bHuman.addEventListener('click', function () {
      humanOn = !humanOn;
      bHuman.setAttribute('aria-pressed', humanOn ? 'true' : 'false');
      updateText();
    });
    range.addEventListener('input', function () { stopPlay(); setYear(+range.value); });

    // ---- touching the wood ----
    function yearAt(ev) {
      var r = cv.getBoundingClientRect();
      var x = ev.clientX - r.left - cx, y = ev.clientY - r.top - cy;
      var d = Math.sqrt(x * x + y * y) / R, th = Math.atan2(y, x);
      if (th < 0) th += TAU;
      if (d > shapeR(1, th) + 0.12) return -1;
      var lo = 0, hi = N - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (shapeR(cum[mid], th) >= d) hi = mid; else lo = mid + 1; }
      return FIRST + lo;
    }
    var dragging = false;
    cv.addEventListener('pointerdown', function (e) {
      var y = yearAt(e);
      if (y < 0) return;
      dragging = true; stopPlay();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      hover = -1; setYear(y);
    });
    cv.addEventListener('pointermove', function (e) {
      if (dragging) { var y = yearAt(e); setYear(y < 0 ? LAST : y); return; }
      if (e.pointerType === 'mouse') { var h = yearAt(e); if (h !== hover) { hover = h; requestDraw(); } }
    });
    function endDrag() { dragging = false; }
    cv.addEventListener('pointerup', endDrag);
    cv.addEventListener('pointercancel', endDrag);
    cv.addEventListener('pointerleave', function () { if (hover !== -1) { hover = -1; requestDraw(); } });
    cv.addEventListener('keydown', function (e) {
      var k = e.key, y = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') y = e.shiftKey ? prevEvent(sel) : sel - 1;
      else if (k === 'ArrowRight' || k === 'ArrowUp') y = e.shiftKey ? nextEvent(sel) : sel + 1;
      else if (k === 'PageDown') y = sel - 10;
      else if (k === 'PageUp') y = sel + 10;
      else if (k === 'Home') y = FIRST;
      else if (k === 'End') y = LAST;
      if (y === null) return;
      e.preventDefault(); stopPlay(); setYear(y);
    });

    ctx.onThemeChange(function () { readColors(); if (W) { buildWood(); draw(); } });
    ctx.visible(function (v) {
      visible = v;
      if (v && playing && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    });
    var lastW = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        var w = Math.round(wrap.getBoundingClientRect().width);
        if (w !== lastW) { lastW = w; resize(); }
      }).observe(wrap);
    } else window.addEventListener('resize', resize);

    readColors();
    playLabel();
    setYear(LAST);
    lastW = Math.round(wrap.getBoundingClientRect().width);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestDraw(); });
  }

  window.MINDS = window.MINDS || {};
  window.MINDS.tree = { mount: mount };
})();
