/* The dog: "Which way did she go?" Reading time in a scent trail. */
(function () {
  window.MINDS = window.MINDS || {};

  var STOPS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360]; // minutes since her newest step
  var N = 10, MAX_SNIFFS = 5, GAP = 1, PARTS = 24, SNIFF_MS = 900, GHOST_MS = 3400;
  var S = '.stage[data-mind="dog"] ';
  var CSS = [
    S + '.canvas-wrap { aspect-ratio: 16 / 9; }',
    '@media (max-width: 560px) { ' + S + '.canvas-wrap { aspect-ratio: 1 / 0.95; } }',
    S + 'canvas:focus-visible { outline-offset: -3px; }',
    S + '.dog-tokens { display: inline-flex; align-items: center; gap: .4rem; font: .82rem var(--font-mono); color: var(--muted); }',
    S + '.dog-tok { display: inline-block; width: 14px; height: 10px; background: var(--accent);' +
      ' border-radius: 50% 50% 46% 46% / 64% 64% 36% 36%; transition: opacity .35s, transform .35s; }',
    S + '.dog-tok.used { opacity: .16; transform: scale(.78); }',
    S + '.dog-last { color: var(--muted); font-weight: 400; }',
    S + '.dog-choose { display: grid; grid-template-columns: auto 1fr 1fr; gap: .6rem; align-items: center; }',
    S + '.dog-went { font: italic 1.05rem var(--font-body); color: var(--ink); padding-right: .2rem; }',
    S + '.dog-choose .btn { line-height: 1.25; padding-block: .55rem; }',
    S + '.dog-choose .arr { font-size: 1.15em; }',
    '@media (max-width: 420px) { ' + S + '.ctl input[type=range] { width: 7.5rem; } }'
  ].join('\n');

  function fmt(m) {
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + r + ' min' : '');
  }
  // Two-part fade: some scent evaporates within minutes, some lingers for hours (illustrative rates).
  function strength(age, rain) {
    var s = 0.6 * Math.pow(2, -age / 20) + 0.4 * Math.pow(2, -age / 240);
    return rain ? s * 0.3 : s;
  }
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(-2.5, Math.min(2.5, z));
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  window.MINDS.dog = {
    mount: function (stage, ctx) {
      var reduced = !!ctx.reducedMotion;
      var style = document.createElement('style');
      style.textContent = CSS; stage.appendChild(style);

      function el(tag, cls, html, parent) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        (parent || stage).appendChild(e);
        return e;
      }

      el('p', 'lede', 'Qualcuno è passato su questo sentiero poco fa. Ogni passo lascia un odore che svanisce invecchiando, ' +
        'così i passi più recenti sono quelli che odorano di più. Tocca fino a cinque impronte per annusarle, poi di’ da che parte è andata.');
      var wrap = el('div', 'canvas-wrap');
      var cv = el('canvas', null, null, wrap);
      cv.tabIndex = 0; cv.setAttribute('role', 'application');
      cv.setAttribute('aria-label', 'Una pista di dieci impronte, numerate da sinistra a destra. ' +
        'Le frecce sinistra e destra spostano il naso; Invio annusa.');

      var row1 = el('div', 'controls');
      var tokWrap = el('span', 'dog-tokens', 'Annusate ', row1);
      var toks = [];
      for (var k = 0; k < MAX_SNIFFS; k++) toks.push(el('span', 'dog-tok', null, tokWrap));
      var lastOut = el('output', 'readout dog-last', null, row1);

      var row2 = el('div', 'dog-choose');
      el('span', 'dog-went', 'È andata', row2).setAttribute('aria-hidden', 'true');
      var btnL = el('button', 'btn primary', '<span class="arr" aria-hidden="true">←</span> di qua', row2);
      var btnR = el('button', 'btn primary', 'di qua <span class="arr" aria-hidden="true">→</span>', row2);
      btnL.setAttribute('aria-label', 'È andata a sinistra');
      btnR.setAttribute('aria-label', 'È andata a destra');
      var result = el('p', 'result'); result.setAttribute('aria-live', 'polite');

      var row3 = el('div', 'controls');
      var lab = el('label', 'ctl', 'Da quanto è passata ', row3);
      var slider = el('input', null, null, lab);
      slider.type = 'range'; slider.min = 0; slider.max = STOPS.length - 1; slider.step = 1; slider.value = 1;
      var timeOut = el('output', 'readout', null, row3);
      var rainBtn = el('button', 'btn', 'Pioggia forte', row3); rainBtn.setAttribute('aria-pressed', 'false');
      var newBtn = el('button', 'btn', 'Nuova pista', row3);
      var tallyOut = el('output', 'readout', null, row3);

      el('div', 'known', '<h4>Che cosa si sa</h4><ul>' +
        '<li>Chi cammina lascia a ogni passo cellule della pelle e odore. L’odore evapora e si disperde, così una pista è una fila di età diverse: i passi più vecchi sono più deboli.</li>' +
        '<li>In uno studio del 2005, cani addestrati capivano in che direzione era andata una persona da circa cinque impronte, un paio di secondi di cammino.</li>' +
        '<li>Un cane ha all’incirca da 125 a 300 milioni di cellule recettrici olfattive, secondo la razza. Una persona ne ha circa 5–6 milioni.</li>' +
        '<li>Un cane che segue una pista annusa a colpi brevi, spesso diversi al secondo. L’aria che espira esce dalle fessure ai lati del naso, così non soffia via l’odore che sta entrando.</li>' +
        '<li>La pioggia forte e l’acqua corrente spezzano una pista. L’aria fresca, umida e ferma e uno spesso strato di foglie possono conservarla per ore.</li></ul>');
      el('div', 'unknown', '<h4>Che cosa non si sa</h4><ul>' +
        '<li>Alexandra Horowitz sostiene che i cani sentano l’odore del tempo stesso: debole è prima, forte è adesso. È un’ipotesi ben fondata, non un fatto misurato.</li>' +
        '<li>Come i cani leggano esattamente la direzione non è stabilito. La differenza di intensità tra i passi è la spiegazione più accreditata, e i cani combinano anche la traccia a terra con l’odore portato dall’aria, in modi non del tutto compresi.</li>' +
        '<li>Questa pista è semplificata. Qui i suoi passi sono a un minuto l’uno dall’altro, perché si veda la differenza, e le velocità con cui l’odore svanisce sono inventate. Quelle vere dipendono dal tempo, dal terreno e dalla persona.</li></ul>');
      el('ul', 'sources', '<li>Hepper, P. G. &amp; Wells, D. L. (2005). How many footsteps do dogs need to determine the direction of an odour trail? <em>Chemical Senses</em> 30.</li>' +
        '<li>Horowitz, A. (2009). <em>Inside of a Dog</em>. Scribner.</li>' +
        '<li>Craven, B. A., Paterson, E. G. &amp; Settles, G. S. (2010). The fluid dynamics of canine olfaction. <em>Journal of the Royal Society Interface</em> 7.</li>');

      // ---------- state ----------
      var g = cv.getContext('2d');
      var bg = document.createElement('canvas'), blob = document.createElement('canvas');
      var W = 0, H = 0, dpr = 1, sc = 1, dark = false, mono = 'monospace', cache = {};
      var R = null, geo = null, T = STOPS[1], rain = false;
      var phase = 'sniff', sniffsLeft = MAX_SNIFFS, cursor = 4, hover = -1, focused = false;
      var sniffing = null, ghost = null, wins = 0, plays = 0;
      var running = false, visible = true, raf = 0, lastT = 0;
      var drops = [];
      for (k = 0; k < 90; k++) drops.push({ x: Math.random() * 1.3, y: Math.random(), l: 0.03 + Math.random() * 0.05, s: 0.9 + Math.random() * 0.7 });

      function rgba(name, a) {
        var c = cache[name];
        if (!c) {
          var s = ctx.color(name) || '#888', m;
          if (s[0] === '#') {
            if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
            c = [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
          } else if ((m = s.match(/[\d.]+/g))) c = [+m[0], +m[1], +m[2]];
          else c = [128, 128, 128];
          cache[name] = c;
        }
        return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')';
      }
      function readTheme() {
        cache = {}; rgba('paper');
        var p = cache.paper;
        dark = (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) < 128;
        mono = getComputedStyle(stage).getPropertyValue('--font-mono').trim() || 'monospace';
        var n = Math.round(48 * dpr);
        blob.width = blob.height = n;
        var b = blob.getContext('2d'), gr = b.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
        gr.addColorStop(0, rgba('warm', 1)); gr.addColorStop(0.45, rgba('warm', 0.45)); gr.addColorStop(1, rgba('warm', 0));
        b.clearRect(0, 0, n, n); b.fillStyle = gr; b.fillRect(0, 0, n, n);
      }

      function ageOf(i) { return T + (R.dir > 0 ? (N - 1 - i) : i) * GAP; }
      function val(i) {
        var st = R.steps[i], s = strength(ageOf(i), rain);
        return Math.max(0, s * (1 + (rain ? 0.10 : 0.015) * st.z1) + (rain ? 0.02 : 0.005) * st.z2);
      }
      function newestIdx() { return R.dir > 0 ? N - 1 : 0; }
      function oldestIdx() { return R.dir > 0 ? 0 : N - 1; }

      // ---------- round ----------
      function newRound() {
        var side0 = Math.random() < 0.5 ? 1 : -1, wa = Math.random() * Math.PI * 2;
        R = {
          dir: Math.random() < 0.5 ? -1 : 1,
          yc: 0.46 + Math.random() * 0.08,
          a1: 0.07 + Math.random() * 0.1, f1: 0.45 + Math.random() * 0.8, p1: Math.random(),
          a2: 0.015 + Math.random() * 0.03, f2: 1.6 + Math.random() * 1.2, p2: Math.random(),
          wx: Math.cos(wa) * 0.5, wy: Math.sin(wa) * 0.5, steps: [], leaves: [], t0: performance.now()
        };
        for (var i = 0; i < N; i++) {
          var parts = [];
          for (var j = 0; j < PARTS; j++) {
            parts.push({ u: Math.random(), a: Math.random() * 6.283, d: 0.25 + Math.random() * 0.75,
              off: Math.random(), per: 3500 + Math.random() * 2500, spin: (Math.random() - 0.5) * 1.4, sz: 0.7 + Math.random() * 0.6 });
          }
          R.steps.push({ z1: gauss(), z2: gauss(), side: (i % 2 ? 1 : -1) * side0, parts: parts, sniffed: false, tSniff: 0 });
        }
        var cols = ['muted', 'muted', 'rule', 'rule', 'rule', 'warm', 'accent'];
        for (i = 0; i < 420; i++) {
          R.leaves.push({ x: Math.random(), y: Math.random(), r: Math.random() * 6.283, l: 3.5 + Math.random() * 6.5,
            c: cols[(Math.random() * cols.length) | 0], a: Math.random() });
        }
        phase = 'sniff'; sniffsLeft = MAX_SNIFFS; cursor = 4; sniffing = null; ghost = null;
        btnL.disabled = btnR.disabled = false; newBtn.classList.remove('primary');
        result.textContent = ''; result.className = 'result';
        lastOut.textContent = 'Tocca un’impronta per annusarla.';
        updateTokens();
        if (W) { layout(); renderBg(); }
        requestDraw();
      }

      function pathY(u) {
        var m = H > W * 0.8 ? 1.3 : 1; // swing wider on tall phone canvases
        return R.yc + m * (R.a1 * Math.sin(6.283 * (R.f1 * u + R.p1)) + R.a2 * Math.sin(6.283 * (R.f2 * u + R.p2)));
      }
      function layout() {
        var M = 260, pts = [], cum = [0], i;
        for (i = 0; i <= M; i++) {
          var u = -0.06 + 1.12 * i / M;
          pts.push([u * W, pathY(u) * H]);
          if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        }
        geo = { pts: pts, cum: cum, steps: [] };
        var sA = cum[Math.round(0.13 / 1.12 * M)], sB = cum[Math.round(0.99 / 1.12 * M)];
        for (i = 0; i < N; i++) {
          var p = at(sA + (sB - sA) * i / (N - 1)), side = R.steps[i].side, off = 5.5 * sc;
          p.x = p.cx + p.nx * side * off; p.y = p.cy + p.ny * side * off;
          geo.steps.push(p);
        }
      }
      function at(s) {
        var c = geo.cum, lo = 0, hi = c.length - 1;
        s = clamp(s, 0, c[hi]);
        while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (c[mid] < s) lo = mid; else hi = mid; }
        var a = geo.pts[lo], b = geo.pts[hi], f = (s - c[lo]) / ((c[hi] - c[lo]) || 1);
        var L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
        return { s: s, cx: a[0] + (b[0] - a[0]) * f, cy: a[1] + (b[1] - a[1]) * f, tx: tx, ty: ty, nx: -ty, ny: tx };
      }

      // ---------- drawing ----------
      function strokePath(c, w, color) {
        c.lineWidth = w; c.strokeStyle = color; c.beginPath();
        geo.pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
        c.stroke();
      }
      function leaf(c, L, alphaMul) {
        var len = L.l * sc;
        c.save();
        c.translate(L.x * W, L.y * H); c.rotate(L.r);
        c.fillStyle = rgba(L.c, (L.c === 'rule' ? 0.45 + 0.4 * L.a : 0.07 + 0.12 * L.a) * alphaMul);
        c.beginPath(); c.moveTo(-len, 0);
        c.bezierCurveTo(-len * 0.4, -len * 0.75, len * 0.5, -len * 0.5, len, 0); c.bezierCurveTo(len * 0.5, len * 0.5, -len * 0.4, len * 0.75, -len, 0);
        c.fill(); c.strokeStyle = rgba('panel', 0.5 * alphaMul); c.lineWidth = 0.6;
        c.beginPath(); c.moveTo(-len * 0.8, 0); c.lineTo(len * 1.1, 0); c.stroke(); c.restore();
      }
      function renderBg() {
        bg.width = Math.round(W * dpr); bg.height = Math.round(H * dpr);
        var b = bg.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
        b.fillStyle = rgba('panel'); b.fillRect(0, 0, W, H);
        var nL = Math.min(R.leaves.length, Math.round(W * H / 950)), i;
        for (i = 0; i < nL * 0.8; i++) leaf(b, R.leaves[i], 1);
        b.lineCap = 'round'; b.lineJoin = 'round';
        var core = dark ? 'rule' : 'paper';
        strokePath(b, 46 * sc, rgba('rule', dark ? 0.3 : 0.22));
        strokePath(b, 38 * sc, rgba(core, dark ? 0.6 : 0.5));
        strokePath(b, 28 * sc, rgba(core, dark ? 0.6 : 0.6));
        for (i = 0; i < geo.pts.length; i += 2) { // grit along the path
          var p = geo.pts[i], q = R.leaves[i % R.leaves.length];
          b.fillStyle = rgba('muted', 0.12 + 0.1 * q.a);
          b.beginPath(); b.arc(p[0] + (q.x - 0.5) * 34 * sc, p[1] + (q.y - 0.5) * 30 * sc, 0.6 + q.a * 1.1, 0, 6.283); b.fill();
        }
        for (i = Math.ceil(nL * 0.8); i < nL; i++) leaf(b, R.leaves[i], 0.7);
      }
      function roundRect(x, y, w, h, r) {
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
      }
      function chipAt(i, dist) {
        var p = geo.steps[i], s = R.steps[i].side;
        return { x: p.cx + p.nx * s * dist, y: p.cy + p.ny * s * dist };
      }
      function setFont() { g.font = '500 ' + Math.round(11 * Math.max(sc, 0.95)) + 'px ' + mono; }
      function box(cx, cy, w, h) { return { x: clamp(cx - w / 2, 2, W - w - 2), y: clamp(cy - h / 2, 2, H - h - 2), w: w, h: h }; }
      function chipRect(i) {
        var c = chipAt(i, 27 * sc + 3);
        setFont();
        return box(c.x, c.y, g.measureText(val(i).toFixed(2).replace('.', ',')).width + 12, 22);
      }
      function overlap(a, b) {
        var dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        return dx > 0 && dy > 0 ? dx * dy : 0;
      }
      // Place an age tag near an end step where it covers no reading, footstep or arrow.
      function tagRect(i, txt, avoid) {
        setFont();
        var w = g.measureText(txt).width + 14, h = 20, p = geo.steps[i], sd = R.steps[i].side;
        var o = (i === 0 ? -1 : 1), best = null, bestA = 1e9;
        var cands = [[sd * 58, 0], [sd * 58, o * 30], [0, o * (w / 2 + 24)], [-sd * 32, o * (w / 2 + 6)],
          [-sd * 58, 0], [sd * 82, 0], [-sd * 58, o * 30], [sd * 82, -o * 30]];
        for (var k = 0; k < cands.length; k++) {
          var cn = cands[k][0] * sc, ct = cands[k][1];
          var r = box(p.cx + p.nx * cn + p.tx * ct, p.cy + p.ny * cn + p.ty * ct, w, h), area = 0;
          avoid.forEach(function (b) { area += overlap(r, b); });
          if (area < bestA) { bestA = area; best = r; }
          if (!area) break;
        }
        return best;
      }
      function drawChip(i, a, strong) {
        var v = val(i), txt = v.toFixed(2).replace('.', ','), r = chipRect(i), x = r.x, y = r.y, w = r.w, h = r.h;
        g.globalAlpha = a;
        roundRect(x, y, w, h, 5);
        g.fillStyle = rgba('paper', 0.92); g.fill();
        g.lineWidth = 1; g.strokeStyle = strong ? rgba('accent', 0.8) : rgba('rule', 1); g.stroke();
        g.fillStyle = strong ? rgba('ink') : rgba('muted');
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(txt, x + w / 2, y + 9);
        g.fillStyle = rgba('rule', 1); g.fillRect(x + 6, y + h - 6, w - 12, 2.5);
        g.fillStyle = rgba('warm', 0.95); g.fillRect(x + 6, y + h - 6, (w - 12) * Math.min(1, v), 2.5);
        g.globalAlpha = 1;
      }
      function drawTag(r, txt, a) {
        var x = r.x, y = r.y, w = r.w, h = r.h;
        setFont();
        g.globalAlpha = a;
        roundRect(x, y, w, h, 10);
        g.fillStyle = rgba('accent', 1); g.fill();
        g.fillStyle = rgba('paper'); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(txt, x + w / 2, y + h / 2 + 0.5);
        g.globalAlpha = 1;
      }
      function drawNose(x, y, k) {
        g.save(); g.translate(x, y); g.scale(k * sc * 1.2, k * sc * 1.2);
        g.fillStyle = rgba('accent'); g.strokeStyle = rgba('panel', 0.9); g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(-11, -4); g.bezierCurveTo(-11, -10.5, 11, -10.5, 11, -4);
        g.bezierCurveTo(11, 2, 5, 5, 1.6, 6.5); g.lineTo(0, 9); g.lineTo(-1.6, 6.5);
        g.bezierCurveTo(-5, 5, -11, 2, -11, -4); g.fill(); g.stroke();
        g.strokeStyle = rgba('panel', 0.95); g.fillStyle = rgba('panel', 0.95); g.lineWidth = 1.1; g.lineCap = 'round';
        [-1, 1].forEach(function (d) {
          g.beginPath(); g.ellipse(d * 4.4, -2.2, 2.6, 1.7, d * 0.45, 0, 6.283); g.fill();
          g.beginPath(); g.moveTo(d * 6.6, -1.2); g.quadraticCurveTo(d * 8.6, 0.6, d * 8, 3); g.stroke(); // side slit: the out-breath leaves here
        });
        g.beginPath(); g.moveTo(0, 0.5); g.lineTo(0, 6); g.stroke();
        g.fillStyle = rgba('paper', 0.35);
        g.beginPath(); g.ellipse(-3.5, -7, 3.4, 1.2, -0.15, 0, 6.283); g.fill(); g.restore();
      }

      function draw(t) {
        if (!W || !geo) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.drawImage(bg, 0, 0, W, H);
        var i, p, st;
        // footsteps: plain ovals, the same front and back, so only scent gives the direction away
        for (i = 0; i < N; i++) {
          p = geo.steps[i];
          g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.ty, p.tx));
          g.fillStyle = rgba('ink', dark ? 0.2 : 0.11);
          g.strokeStyle = R.steps[i].sniffed ? rgba('accent', 0.8) : rgba('muted', 0.45); g.lineWidth = 1;
          g.beginPath(); g.ellipse(0, 0, 6.5 * sc, 3.6 * sc, 0, 0, 6.283); g.fill(); g.stroke();
          g.restore();
        }
        // scent clouds: density and brightness follow the current strength
        var sn = sniffing && !reduced ? (t - sniffing.t0) / SNIFF_MS : 2;
        var rise = reduced ? 1 : clamp((t - R.t0) / 900, 0, 1); // the whole trail breathes in at once: no laying order to give her away
        g.save();
        g.globalCompositeOperation = dark ? 'lighter' : 'source-over';
        for (i = 0; i < N; i++) {
          p = geo.steps[i]; st = R.steps[i];
          var v = val(i), thr = 0.06 + v, amp = (dark ? 0.05 : 0.06) + (dark ? 0.2 : 0.3) * Math.sqrt(v);
          var pull = sniffing && sniffing.i === i && sn < 1 ? Math.sin(Math.PI * Math.min(1, sn * 1.4)) * 0.85 : 0;
          for (var j = 0; j < PARTS; j++) {
            var q = st.parts[j];
            if (q.u > thr) continue;
            var ph = reduced ? q.off : ((t / q.per + q.off) % 1);
            var r = 3 + q.d * 30 * sc * Math.pow(ph, 0.7), an = q.a + ph * q.spin;
            var x = p.x + Math.cos(an) * r + R.wx * ph * 16 * sc, y = p.y + Math.sin(an) * r + R.wy * ph * 16 * sc;
            if (pull) { x += (p.x - x) * pull; y += (p.y - 4 * sc - y) * pull; }
            var size = (7 + 8 * ph) * q.sz * sc * (1 - pull * 0.6);
            g.globalAlpha = amp * rise * Math.sin(Math.PI * ph);
            g.drawImage(blob, x - size, y - size, size * 2, size * 2);
          }
        }
        g.restore();
        // rain
        if (rain) {
          g.fillStyle = rgba('muted', dark ? 0.06 : 0.07); g.fillRect(0, 0, W, H);
          g.strokeStyle = rgba('ink', dark ? 0.2 : 0.16); g.lineWidth = 1;
          g.beginPath();
          drops.forEach(function (d) {
            var x = d.x * W - d.y * H * 0.3, y = d.y * H, l = d.l * H;
            g.moveTo(x, y); g.lineTo(x - l * 0.3, y + l);
          });
          g.stroke();
        }
        // reveal: her ghost walks the trail from oldest step to newest
        var gp = 0, done = phase === 'reveal';
        if (ghost) {
          gp = reduced ? 1 : clamp((t - ghost.t0) / GHOST_MS, 0, 1);
          done = gp >= 1;
          var sOld = geo.steps[oldestIdx()].s, sNew = geo.steps[newestIdx()].s;
          var s0 = sOld - R.dir * 40 * sc, s1 = sNew + R.dir * 46 * sc, sg = s0 + (s1 - s0) * gp;
          // dotted line behind her
          g.save(); g.setLineDash([2, 6]); g.lineCap = 'round';
          g.strokeStyle = rgba('accent', 0.75); g.lineWidth = 2;
          var sTo = R.dir > 0 ? Math.min(sg, sNew) : Math.max(sg, sNew);
          if (R.dir * (sTo - sOld) > 0) {
            g.beginPath();
            for (var m = 0; m <= 40; m++) {
              var a = at(sOld + (sTo - sOld) * m / 40);
              if (m) g.lineTo(a.cx, a.cy); else g.moveTo(a.cx, a.cy);
            }
            g.stroke();
          }
          g.restore();
          for (i = 0; i < N; i++) { // each step glows as she passes it
            var since = R.dir * (sg - geo.steps[i].s) / (Math.abs(s1 - s0) || 1) * GHOST_MS;
            if (since > 0 && since < 900 && !reduced) {
              p = geo.steps[i];
              g.strokeStyle = rgba('accent', 0.7 * (1 - since / 900)); g.lineWidth = 2;
              g.beginPath(); g.arc(p.x, p.y, (8 + since / 60) * sc, 0, 6.283); g.stroke();
            }
          }
          if (gp < 1) {
            var gpos = at(sg), fade = gp > 0.85 ? (1 - gp) / 0.15 : Math.min(1, gp * 6);
            g.save(); g.translate(gpos.cx, gpos.cy); g.rotate(Math.atan2(gpos.ty * R.dir, gpos.tx * R.dir));
            g.globalAlpha = fade;
            g.fillStyle = rgba('ink', dark ? 0.35 : 0.25);
            g.beginPath(); g.ellipse(-1 * sc, 0, 5 * sc, 11 * sc, 0, 0, 6.283); g.fill();
            g.fillStyle = rgba('ink', dark ? 0.5 : 0.38);
            g.beginPath(); g.arc(1.5 * sc, 0, 5 * sc, 0, 6.283); g.fill();
            g.restore();
          }
          if (done) { // arrowhead past her newest step
            var e = at(sNew + R.dir * 30 * sc), ux = e.tx * R.dir, uy = e.ty * R.dir;
            g.strokeStyle = rgba('accent', 1); g.lineWidth = 2.5; g.lineCap = 'round'; g.lineJoin = 'round';
            g.beginPath();
            g.moveTo(e.cx - ux * 9 * sc + e.nx * 7 * sc, e.cy - uy * 9 * sc + e.ny * 7 * sc);
            g.lineTo(e.cx, e.cy);
            g.lineTo(e.cx - ux * 9 * sc - e.nx * 7 * sc, e.cy - uy * 9 * sc - e.ny * 7 * sc);
            g.stroke();
          }
        }
        // cursor and nose
        var nosey = -1, nk = 1;
        if (sniffing && sn < 1) { nosey = sniffing.i; nk = 1 - 0.1 * Math.abs(Math.sin(sn * Math.PI * 6)); }
        else if (phase === 'sniff' && (hover >= 0 || focused)) nosey = hover >= 0 ? hover : cursor;
        if (nosey >= 0) {
          p = geo.steps[nosey];
          g.strokeStyle = rgba('accent', 0.9); g.lineWidth = 1.5;
          g.beginPath(); g.arc(p.x, p.y, 13 * sc, 0, 6.283); g.stroke();
        }
        // readings
        for (i = 0; i < N; i++) {
          st = R.steps[i];
          var ca = 0;
          if (st.sniffed) ca = reduced ? 1 : clamp((t - st.tSniff - SNIFF_MS * 0.6) / 300, 0, 1);
          else if (ghost) {
            var passed = reduced ? 1 : clamp((R.dir * (geo.steps[i].s - geo.steps[oldestIdx()].s) / (Math.abs(geo.steps[newestIdx()].s - geo.steps[oldestIdx()].s) || 1)) * 0.75 + 0.25, 0, 1);
            ca = clamp((gp - passed * 0.8) * 4, 0, 1) * 0.9;
          }
          if (ca > 0) drawChip(i, ca, st.sniffed);
        }
        if (ghost && done) {
          var ta = reduced ? 1 : clamp((t - ghost.t0 - GHOST_MS) / 400, 0, 1);
          var avoid = [], ni = newestIdx(), oi = oldestIdx(), arr = at(geo.steps[ni].s + R.dir * 30 * sc);
          for (i = 0; i < N; i++) {
            avoid.push(chipRect(i));
            avoid.push({ x: geo.steps[i].x - 9, y: geo.steps[i].y - 9, w: 18, h: 18 });
          }
          avoid.push({ x: arr.cx - 12, y: arr.cy - 12, w: 24, h: 24 });
          var tn = fmt(ageOf(ni)) + ' fa', to = fmt(ageOf(oi)) + ' fa', rn = tagRect(ni, tn, avoid);
          avoid.push(rn);
          drawTag(rn, tn, ta);
          drawTag(tagRect(oi, to, avoid), to, ta);
        }
        if (nosey >= 0) {
          p = geo.steps[nosey];
          var lift = sniffing && sniffing.i === nosey && sn < 1 ? 4 : 17;
          drawNose(p.x, p.y - lift * sc, nk);
        }
      }

      // ---------- loop ----------
      function frame(t) {
        if (!running) return;
        var dt = Math.min(0.05, (t - (lastT || t)) / 1000);
        lastT = t;
        if (rain) drops.forEach(function (d) { d.y += d.s * dt * 1.6; if (d.y > 1.05) { d.y = -0.1; d.x = Math.random() * 1.3; } });
        if (sniffing && t - sniffing.t0 > SNIFF_MS + 400) sniffing = null;
        draw(t);
        raf = requestAnimationFrame(frame);
      }
      function start() {
        if (running || reduced || !visible) return;
        running = true; lastT = 0;
        raf = requestAnimationFrame(frame);
      }
      function stop() { running = false; cancelAnimationFrame(raf); }
      function requestDraw() { if (!running) draw(performance.now()); }

      // ---------- actions ----------
      function updateTokens() {
        toks.forEach(function (tk, i) { tk.classList.toggle('used', i >= sniffsLeft); });
        tokWrap.setAttribute('aria-label', 'Annusate rimaste: ' + sniffsLeft + ' su ' + MAX_SNIFFS);
      }
      function sniffSound() {
        var ac = ctx.audio && ctx.audio();
        if (!ac) return;
        try {
          var len = Math.round(ac.sampleRate * 0.07), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
          for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
          for (var k = 0; k < 4; k++) {
            var src = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
            src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1500 + k * 120; f.Q.value = 0.9;
            gn.gain.value = 0.05;
            src.connect(f); f.connect(gn); gn.connect(ac.destination);
            src.start(ac.currentTime + k * 0.14);
          }
        } catch (e) { /* sound is optional */ }
      }
      function sniff(i) {
        if (phase !== 'sniff' || i < 0) return;
        cursor = i;
        var st = R.steps[i];
        if (!st.sniffed) {
          if (sniffsLeft <= 0) { lastOut.textContent = 'Annusate finite. Da che parte è andata?'; requestDraw(); return; }
          sniffsLeft--; st.sniffed = true; st.tSniff = performance.now();
          updateTokens();
          sniffSound();
        }
        sniffing = { i: i, t0: performance.now() };
        lastOut.textContent = 'Impronta ' + (i + 1) + ' di ' + N + ': intensità ' + val(i).toFixed(2).replace('.', ',') +
          (sniffsLeft ? '' : '. Sono cinque. Da che parte?');
        requestDraw();
      }
      function choose(d) {
        if (phase !== 'sniff') return;
        phase = 'reveal'; hover = -1; cv.style.cursor = 'default';
        var right = d === R.dir, used = MAX_SNIFFS - sniffsLeft, faint = rain || T >= 120;
        plays++; if (right) wins++;
        var way = R.dir > 0 ? 'di qua →' : '← di qua';
        var ages = ' Il suo passo più recente era di ' + fmt(ageOf(newestIdx())) + ' fa, il più vecchio qui di ' + fmt(ageOf(oldestIdx())) + ' fa.';
        var msg;
        if (right) {
          msg = (used ? 'Sì. È andata ' : 'Colpo di fortuna. È andata ') + way + '.' + ages +
            (used && faint ? ' Su una pista così debole, un po’ è fortuna.' : '');
        } else {
          msg = 'Non stavolta. È andata ' + way + '.' + ages + ' ' +
            (!used ? 'Una o due annusate aiuterebbero.' : rain ? 'La pioggia forte aveva lavato via quasi tutto il suo odore.'
              : T >= 120 ? 'Dopo ore, passi vecchi e nuovi hanno quasi lo stesso odore.'
              : spread() < 5 ? 'Le impronte lontane tra loro mostrano la differenza più grande.' : 'I suoi passi più nuovi sono i più forti.');
        }
        result.textContent = msg;
        result.className = 'result ' + (right ? 'good' : 'miss');
        tallyOut.textContent = 'Giuste ' + wins + ' su ' + plays;
        btnL.disabled = btnR.disabled = true;
        newBtn.classList.add('primary');
        lastOut.textContent = 'Ora si vedono tutte e dieci le impronte.';
        ghost = { t0: performance.now() };
        if (document.activeElement === btnL || document.activeElement === btnR) newBtn.focus();
        requestDraw();
      }
      function spread() {
        var lo = N, hi = -1;
        R.steps.forEach(function (st, i) { if (st.sniffed) { lo = Math.min(lo, i); hi = Math.max(hi, i); } });
        return hi - lo;
      }
      function conditionsChanged() {
        timeOut.textContent = fmt(T);
        if (phase === 'reveal' || sniffsLeft < MAX_SNIFFS) newRound();
        else requestDraw();
      }

      function nearest(e) {
        var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = -1, bd = 1e9;
        for (var i = 0; i < N; i++) {
          var p = geo.steps[i], d = Math.hypot(p.x - x, p.y - y);
          if (d < bd) { bd = d; best = i; }
        }
        return bd < 30 * Math.max(sc, 1) ? best : -1;
      }
      var down = null;
      cv.addEventListener('pointermove', function (e) {
        if (!geo || phase !== 'sniff') return;
        var h = e.pointerType === 'mouse' ? nearest(e) : -1;
        if (h !== hover) { hover = h; cv.style.cursor = h >= 0 ? 'pointer' : 'default'; requestDraw(); }
      });
      cv.addEventListener('pointerleave', function () { if (hover >= 0) { hover = -1; requestDraw(); } });
      cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
      cv.addEventListener('pointercancel', function () { down = null; });
      cv.addEventListener('pointerup', function (e) {
        if (!down || !geo) return;
        var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down = null;
        if (moved < 12) sniff(nearest(e));
      });
      cv.addEventListener('focus', function () { focused = true; requestDraw(); });
      cv.addEventListener('blur', function () { focused = false; requestDraw(); });
      cv.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowLeft' || k === 'ArrowUp') cursor = Math.max(0, cursor - 1);
        else if (k === 'ArrowRight' || k === 'ArrowDown') cursor = Math.min(N - 1, cursor + 1);
        else if (k === 'Home') cursor = 0;
        else if (k === 'End') cursor = N - 1;
        else if (k === 'Enter' || k === ' ') { sniff(cursor); e.preventDefault(); return; }
        else return;
        e.preventDefault(); hover = -1; focused = true;
        if (phase === 'sniff') lastOut.textContent = 'Naso sull’impronta ' + (cursor + 1) + ' di ' + N + '. Invio per annusare.';
        requestDraw();
      });
      btnL.addEventListener('click', function () { choose(-1); });
      btnR.addEventListener('click', function () { choose(1); });
      newBtn.addEventListener('click', newRound);
      slider.addEventListener('input', function () { T = STOPS[+slider.value]; conditionsChanged(); });
      rainBtn.addEventListener('click', function () {
        rain = !rain; rainBtn.setAttribute('aria-pressed', String(rain)); conditionsChanged();
      });

      function resize() {
        var w = wrap.clientWidth, h = wrap.clientHeight;
        if (!w || !h) return;
        W = w; H = h; dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        sc = clamp(W / 680, 0.85, 1.15);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        readTheme(); layout(); renderBg(); requestDraw();
      }
      ctx.onThemeChange(function () { if (W) { readTheme(); renderBg(); requestDraw(); } });
      ctx.visible(function (v) { visible = v; if (v) start(); else stop(); });

      timeOut.textContent = fmt(T);
      newRound();
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
      else window.addEventListener('resize', resize);
      resize();
      start();
    }
  };
})();
