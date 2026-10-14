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
    { y: 1525, c: true, t: 'Una faggiola rompe la buccia. Una radice va giù, due foglie vengono su, e poi aspetta.',
      h: 'Nessuno nella valle ricorderà quest’anno, come quasi tutti gli anni.' },
    { y: GAP, c: true, t: 'Neve bagnata di primavera sulle foglie già piene. Cade un albero madre e se ne porta dietro altri tre. Dal buco nel soffitto: il cielo.', h: null },
    { y: SHEEP, c: true, t: 'Pecore, a giugno. A centinaia all’ombra a mezzogiorno; il loro sterco entra nella terra, e la terra nell’albero. A settembre, sparite.',
      h: 'La transumanza: ogni estate le greggi salgono a piedi dalle pianure della Puglia lungo i tratturi.' },
    { y: POLLARD, c: true, t: 'Scuri, e per due estati il fumo di una radura più in basso. Capitozzato all’altezza di un uomo. Ricresce pieno di braccia, e tiene quella forma.',
      h: 'Per secoli i carbonai hanno lavorato in questi boschi.' },
    { y: WOUND, c: true, t: 'Un fulmine a quaranta passi; la scossa attraversa le radici. Il ramo più basso si strappa. Una ferita grande come una porta, e dentro, le piogge e le spore.', h: null },
    { y: ROT_END, c: true, t: 'Il cuore non c’è più. Intorno al vuoto, un muro nel legno che il marciume non attraversa. Dentro: ghiri, allocchi, larve di coleottero che fanno polvere rossa.', h: null },
    { y: 1888, t: 'Un coltello nella corteccia: 1888. Gli otto si allargheranno con il tronco fino a ingrassare come pupazzi di neve.',
      h: 'Qualcuno incide la data. La corteccia del faggio non si sfalda, e l’incisione resta.' },
    { y: 1915, t: 'In un inverno la terra trema: un lungo brivido basso tra le radici, da ovest. Il bosco resta in piedi.',
      h: 'Terremoto di Avezzano, 13 gennaio 1915. Circa 30.000 morti.' },
    { y: 1923, t: 'All’albero non arriva niente. Su una mappa, intorno a lui, si traccia una linea. Non può saperlo.',
      h: 'Il Parco Nazionale d’Abruzzo viene istituito per legge, gennaio 1923.' },
    { y: 1943, t: 'Un tepore, una volta, in un inverno.', h: '', warm: true },
    { y: SHEEP_END, c: true, t: 'Niente pecore, questo giugno. Smettono piano, e poi tutto d’un tratto. Il suolo cambia, e gli anelli con lui.',
      h: 'Dopo la guerra la transumanza a piedi si dirada; le greggi viaggiano in camion e in treno, poi quasi non si spostano più.' },
    { y: 2003, t: 'Niente pioggia. Le colonne d’acqua nel legno si spezzano, ognuna con uno scatto troppo acuto per qualsiasi orecchio del bosco tranne quello dei pipistrelli.',
      h: 'L’ondata di calore europea del 2003. Gli scatti sono ultrasuoni: le persone li sentono solo con gli strumenti.' },
    { y: 2009, t: 'La terra trema di nuovo, meno forte, novantaquattro anni dopo, in una primavera.',
      h: 'Terremoto dell’Aquila, 6 aprile 2009. 309 morti.' },
    { y: 2025, t: 'Pasciona. Faggiole così fitte che chi ci cammina sopra sembra camminare sulla ghiaia. Ogni sera un’orsa si siede contro il tronco a rompere ricci.',
      h: 'Nel romanzo, l’autunno prima.' },
    { y: LAST, t: 'Neve fino ad aprile. Niente pasciona. Niente pioggia da giugno ad agosto: scatti, per tutti i pomeriggi.', w: 'Un tepore.',
      h: '29 settembre 2026: la notte del romanzo.', warm: true }
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
    if (thin[idx]) parts.push('Un anello sottile: siccità, o una gelata tardiva.');
    if (y < GAP) parts.push('Ombra. Luce già usata da centomila foglie: abbastanza per restare, non per crescere. Un anello troppo sottile per contarlo senza una lente.');
    else if (y < SHEEP) parts.push('Luce dal varco. La chioma ci sale dentro. In certi anni, legno largo un dito.');
    if (y > POLLARD && y < POLLARD + 8) parts.push('Le braccia nuove si ispessiscono.');
    if (y > WOUND && y < ROT_END) parts.push('Dentro, dietro un muro, il marciume mangia il cuore morto. L’albero continua a vivere negli anelli esterni.');
    if (y > SHEEP && y < SHEEP_END) parts.push('Estati di pecore, inverni di neve.');
    else if (y > SHEEP_END) parts.push('Neve, foglie, faggiole, foglie che cadono. Niente pecore.');
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
      '<p class="lede">Trascina attraverso cinque secoli. L’albero ricorda solo quello che lo ha toccato.</p>' +
      '<div class="canvas-wrap"><canvas tabindex="0" role="slider" aria-valuemin="' + FIRST + '" aria-valuemax="' + LAST + '"' +
      ' aria-label="Sezione di un faggio di 500 anni. Tocca un anello, o usa i tasti freccia, per scegliere un anno."></canvas></div>' +
      '<div class="scrub"><div class="track"><input type="range" min="' + FIRST + '" max="' + LAST + '" step="1" aria-label="Anno">' +
      '<div class="marks" aria-hidden="true"></div></div>' +
      '<div class="ends" aria-hidden="true"><span>' + FIRST + '</span><output class="readout"></output><span>' + LAST + '</span></div></div>' +
      '<div class="controls"><button class="btn" data-a="prev" aria-label="Anno precedente">◀ anno</button>' +
      '<button class="btn" data-a="next" aria-label="Anno successivo">anno ▶</button>' +
      '<button class="btn primary" data-a="play"></button>' +
      '<button class="btn" data-a="human" aria-pressed="false">Date umane</button></div>' +
      '<div class="reading"><p class="result cap" aria-live="polite"></p>' +
      '<p class="human" hidden><b>Persone</b><span></span></p><p class="note"></p></div>' +
      '<div class="known"><h4>Che cosa si sa</h4>' +
      '<p>Negli alberi dei climi con le stagioni si aggiunge un anello di crescita all’anno; contarli e confrontarli è la dendrocronologia. Un anello stretto segna un anno difficile: siccità, una gelata tardiva, una chioma perduta, un’annata carica di faggiole.</p>' +
      '<p>Le giovani piante di faggio possono aspettare per decenni nell’ombra fitta, crescendo quasi niente, e poi slanciarsi verso l’alto quando un vicino caduto apre un varco nella volta del bosco.</p>' +
      '<p>Un albero ferito isola il danno con barriere chimiche. Dentro quel muro i funghi possono poi mangiare il durame morto, lasciando una cavità. Un tronco cavo è un tubo, e i tubi sono robusti: molti faggi cavi restano in piedi per secoli.</p>' +
      '<p>Poiché il centro non c’è più, i faggi più vecchi non si possono carotare fino al primo anello, e la loro età è una stima. In Val Cervara, in Abruzzo, all’interno di un sito del Patrimonio mondiale dell’UNESCO, alcuni faggi sono stati datati a circa 500 anni.</p>' +
      '<p>Con la siccità le colonne d’acqua nel legno possono spezzarsi. Ogni rottura produce uno scatto ultrasonico, troppo acuto per l’orecchio umano.</p></div>' +
      '<div class="unknown"><h4>Che cosa non si sa</h4>' +
      '<p>È controverso se gli alberi si passino cibo o avvertimenti attraverso i filamenti dei funghi nel suolo. Una rassegna del 2023 di Karst, Jones e Hoeksema ha concluso che le prove non sostengono l’idea di «alberi madre» che nutrono e avvertono i loro simili, anche se altri ne contestano alcune parti. Per questo, quest’albero non manda messaggi.</p>' +
      '<p>Questa sezione è disegnata, non misurata. Le larghezze degli anelli sono generate per seguire il romanzo, e gli anni segnati «ca.» sono approssimativi. I veri anelli del faggio sono tenui, e per contarli serve una lente.</p></div>' +
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
        if (eaten) return;                                   // the rot took that wood, and the mark with it
        g.beginPath(); g.arc(x, y, 1.9, 0, TAU);
        g.fillStyle = rgba(e.y < sel ? col.ink : col.muted, e.y < sel ? 0.55 : 0.4); g.fill();
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
      var label = (EV[sel] && EV[sel].c ? 'ca. ' : '') + sel, base = pad + fs * 0.8;
      g.fillText(label, pad, base);
      var lw = g.measureText(label).width;
      g.fillStyle = rgba(col.muted);
      g.font = '400 ' + Math.max(10, Math.round(fs * 0.24)) + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
      var tally = 'ANELLO ' + (idx + 1) + ' DI ' + N;
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
      var ev = EV[sel], ht = ev ? (ev.h === null ? 'Nessuna testimonianza umana.' : ev.h) : '';
      humanText.textContent = ht;
      human.hidden = !humanOn || !ht;
      var nt = '';
      if (sel < WOUND) {
        var gf = goneFrac(idx);
        if (gf >= 1) nt = 'Questo legno ora non c’è più: l’ha mangiato il marciume. Anelli così vecchi non si possono contare, solo stimare.';
        else if (gf > 0) nt = 'Parte di questo anello ora non c’è più: se l’è presa la cavità.';
      }
      note.textContent = nt;
    }

    function setYear(y) {
      y = Math.max(FIRST, Math.min(LAST, Math.round(y)));
      if (markEls[sel]) markEls[sel].className = '';
      sel = y;
      if (markEls[sel]) markEls[sel].className = 'on';
      range.value = String(y);
      out.textContent = (EV[y] && EV[y].c ? 'ca. ' : '') + y;
      cv.setAttribute('aria-valuenow', String(y));
      cv.setAttribute('aria-valuetext', y + ', anello ' + (y - FIRST + 1) + ' di ' + N);
      range.setAttribute('aria-valuetext', y + ', anello ' + (y - FIRST + 1) + ' di ' + N);
      bPrev.disabled = y <= FIRST; bNext.disabled = y >= LAST;
      updateText();
      requestDraw();
    }

    function nextEvent(y) { for (var j = 0; j < EVENTS.length; j++) if (EVENTS[j].y > y) return EVENTS[j].y; return null; }
    function prevEvent(y) { for (var j = EVENTS.length - 1; j >= 0; j--) if (EVENTS[j].y < y) return EVENTS[j].y; return null; }

    // ---- playing the centuries ----
    var raf = 0, last = 0, pos = LAST, hold = 0, RATE = 30, HOLD = 1.9;
    function playLabel() {
      if (reduced) bPlay.textContent = 'Segno dopo ▶';
      else bPlay.textContent = playing ? 'Pausa' : 'Scorri i secoli';
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
