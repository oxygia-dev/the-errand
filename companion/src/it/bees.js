/* The bees: "Read the dance". Decode a honeybee waggle dance and find the flowers on a map of the valley. */
(function () {
  'use strict';
  window.MINDS = window.MINDS || {};
  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  var SEC_PER_KM = 1.0; // rounded rule of thumb; real calibrations vary

  function rgba(c, a) {
    c = String(c || '#888').trim();
    var r, g, b, m;
    if (c[0] === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else if ((m = c.match(/[\d.]+/g)) && m.length >= 3) { r = +m[0]; g = +m[1]; b = +m[2]; } else return c;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function lum(c) { var m = rgba(c, 1).match(/[\d.]+/g); return m ? (0.3 * m[0] + 0.59 * m[1] + 0.11 * m[2]) / 255 : 1; }
  function norm360(a) { return ((a % 360) + 360) % 360; }
  function norm180(a) { return norm360(a + 180) - 180; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function hhmm(h) { var m = Math.round(h * 60); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function fmtKm(km) { return km < 1 ? Math.round(km * 1000 / 10) * 10 + ' m' : km.toFixed(1).replace('.', ',') + ' km'; }
  function rrect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function pill(g, text, x, y, font, color, bg, W) {
    g.font = font; var w = g.measureText(text).width, hgt = parseFloat(font.match(/(\d+)px/)[1]) * 1.5;
    if (W) x = Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, x));
    if (bg) { g.fillStyle = bg; rrect(g, x - w / 2 - 4, y - hgt / 2, w + 8, hgt, 4); g.fill(); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + 0.5);
  }

  // Approximate sun azimuth (degrees clockwise from north) in late September at ~41.8°N, 13.9°E, clock time CEST.
  function sunAzimuth(hours) {
    var lat = 41.8 * DEG, dec = -1.5 * DEG, h = (hours - 12.92) * 15 * DEG;
    return norm360(Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) / DEG + 180);
  }

  // The valley around Assunta's hive, in km (x east, y north). Fictional, after the novel.
  function forestEdge(x) { return 1.15 + 0.22 * Math.sin(1.5 * x + 0.6) + 0.09 * Math.sin(3.9 * x + 1.0); }
  var RIVER = [[-3.4, -1.0], [-2.4, -1.3], [-1.6, -1.5], [-0.8, -1.15], [0.0, -1.34], [0.9, -1.22], [1.7, -0.95], [2.4, -1.25], [3.4, -1.1]];
  var TRACK = [[0.06, -0.08], [0.34, 0.2], [0.62, 0.52], [0.72, 0.95], [0.58, 1.5], [0.7, 2.2], [0.6, 3.4]];
  var CEM = { x: 0.48, y: 0.3, w: 0.2, h: 0.13 };
  var FIELDS = [
    { x: 1.9, y: -0.45, rx: 0.6, ry: 0.3, kind: 'field' }, { x: 2.0, y: 0.72, rx: 0.5, ry: 0.26, kind: 'field' },
    { x: 0.3, y: -2.15, rx: 0.75, ry: 0.35, kind: 'field' }, { x: -2.1, y: 0.25, rx: 0.55, ry: 0.5, kind: 'stony' }
  ];
  var SITES = [
    { what: 'l’edera sul muro del cimitero', short: 'edera, cimitero', x: 0.48, y: 0.3, j: 0.05 },
    { what: 'i settembrini in un giardino ai margini del paese', short: 'settembrini', x: -0.2, y: -0.15, j: 0.03 },
    { what: 'gli ultimi fiori sulla riva del fiume', short: 'fiori sulla riva', x: -1.6, y: -1.4, j: 0.12 },
    { what: 'l’edera sul vecchio ponte di pietra', short: 'edera, ponte di pietra', x: 0.9, y: -1.22, j: 0.02 },
    { what: 'l’erica al margine della faggeta', short: 'erica', x: -1.0, y: forestEdge(-1.0) - 0.06, j: 0.04 },
    { what: 'la santoreggia sul pendio sassoso', short: 'santoreggia', x: -2.1, y: 0.25, j: 0.2 },
    { what: 'un campo di trifoglio tardivo', short: 'trifoglio tardivo', x: 1.9, y: -0.45, j: 0.25 },
    { what: 'gli ultimi cardi lungo la mulattiera', short: 'cardi', x: 0.66, y: 0.74, j: 0.04 },
    { what: 'l’edera su una capanna di pastori diroccata', short: 'edera, capanna', x: 2.0, y: 0.72, j: 0.1 },
    { what: 'l’origano selvatico nel prato oltre il fiume', short: 'origano selvatico', x: 0.3, y: -2.15, j: 0.25 }
  ];

  var CSS = [
    '.bees-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:1rem;min-width:0}',
    '.bees-panel{margin:0;min-width:0;display:grid;gap:.35rem}',
    '.canvas-wrap{aspect-ratio:1/1}',
    '.bees-map canvas{cursor:crosshair}',
    '.bees-cap{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:.2rem .8rem;font:.76rem var(--font-mono);color:var(--muted);min-height:1.3em}',
    '.bees-explain{margin:-.6rem 0 0;color:var(--muted);font-size:.92rem;min-height:1.2em}',
    '.bees-explain:empty{display:none}'
  ].map(function (r) { return '.stage[data-mind="bees"] ' + r; }).join('\n');

  function mount(stage, ctx) {
    var C = {}, dark = false;
    function readColors() {
      ['paper', 'ink', 'muted', 'rule', 'accent', 'warm', 'panel'].forEach(function (n) { C[n] = ctx.color(n) || '#888'; });
      dark = lum(C.paper) < 0.5;
      C.deep = dark ? C.paper : C.ink; C.pale = dark ? C.ink : C.paper;
    }
    readColors();

    function el(tag, cls, text, parent) {
      var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text;
      (parent || stage).appendChild(e); return e;
    }
    el('style', null, CSS);
    el('p', 'lede', 'Una delle api di Assunta è tornata da certi fiori, da qualche parte nella valle, e nel buio del favo danza per dire dove sono. L’angolo del suo scodinzolio rispetto alla verticale è l’angolo dei fiori rispetto al sole, e ogni secondo di scodinzolio vale più o meno un chilometro: leggi la sua danza, poi tocca la mappa dove pensi che siano i fiori.');
    var grid = el('div', 'bees-grid');
    var fig1 = el('figure', 'bees-panel', null, grid);
    var combWrap = el('div', 'canvas-wrap', null, fig1);
    var comb = el('canvas', null, null, combWrap);
    comb.setAttribute('role', 'img');
    var cap1 = el('figcaption', 'bees-cap', null, fig1);
    var waggleOut = el('output', 'readout', 'scodinzolio: –', cap1);
    el('span', null, 'il favo, appeso in verticale', cap1);
    var fig2 = el('figure', 'bees-panel bees-map', null, grid);
    var mapWrap = el('div', 'canvas-wrap', null, fig2);
    var map = el('canvas', null, null, mapWrap);
    map.tabIndex = 0;
    map.setAttribute('aria-label', 'Mappa della valle vista dall’alto, con il nord in alto e l’arnia al centro. Fai clic o tocca dove pensi che siano i fiori, oppure sposta il segnaposto con le frecce e premi Invio.');
    var cap2 = el('figcaption', 'bees-cap', null, fig2);
    var sunOut = el('output', 'readout', '', cap2);
    var guessNote = el('span', null, 'la valle dall’alto, nord in alto', cap2);

    var controls = el('div', 'controls');
    var bNew = el('button', 'btn primary', 'Un’altra danza', controls); bNew.type = 'button';
    var bPlay = null;
    if (ctx.reducedMotion) { bPlay = el('button', 'btn', 'Riproduci una volta', controls); bPlay.type = 'button'; }
    var bSun = el('button', 'btn', 'Mostra il sole sul favo', controls); bSun.type = 'button'; bSun.setAttribute('aria-pressed', 'false');
    var bSlow = el('button', 'btn', 'Rallenta', controls); bSlow.type = 'button'; bSlow.setAttribute('aria-pressed', 'false');
    var bSound = el('button', 'btn', 'Suono', controls); bSound.type = 'button'; bSound.setAttribute('aria-pressed', 'false');
    var result = el('p', 'result'); result.setAttribute('aria-live', 'polite');
    var explain = el('p', 'bees-explain'); explain.setAttribute('aria-live', 'polite');

    var known = el('div', 'known');
    el('h4', null, 'Che cosa si sa', known);
    [
      'Verso l’alto vuol dire verso il sole. Sul favo verticale, l’angolo della corsa scodinzolante rispetto alla verticale è uguale all’angolo del cibo rispetto alla direzione del sole, orario per orario. Karl von Frisch lo scoprì, e per questo condivise il premio Nobel del 1973.',
      'Uno scodinzolio più lungo vuol dire cibo più lontano: nelle api mellifere europee, più o meno un secondo di scodinzolio per ogni chilometro. Tra una corsa e l’altra la danzatrice torna indietro con un giro, una volta a sinistra e una a destra, disegnando un otto. Le api correggono anche l’angolo man mano che il sole si sposta durante il giorno.',
      'Nell’arnia è buio, quindi chi segue la danza non guarda. Le seguaci si stringono dietro la danzatrice e la leggono al tatto con le antenne, e attraverso i movimenti d’aria e le vibrazioni che produce; durante lo scodinzolio le sue ali ronzano a brevi raffiche di circa 200–300 Hz.',
      'La danza recluta; non comanda. Le seguaci sentono anche l’odore dei fiori sulla danzatrice e assaggiano il nettare che lei offre, e spesso seguono diverse corse prima di partire.',
      'Funziona. Nel 2005 Joe Riley e colleghi hanno seguito le api reclutate con un radar armonico: sono volate nella direzione indicata dalla danza, fino a circa la distanza giusta, e poi hanno cercato i fiori nei dintorni.'
    ].forEach(function (t) { el('p', null, t, known); });
    var unknown = el('div', 'unknown');
    el('h4', null, 'Che cosa non si sa', unknown);
    [
      'Il rapporto esatto tra durata dello scodinzolio e distanza cambia da colonia a colonia, tra sottospecie e paesaggi, anche perché le api stimano la distanza da quanto velocemente il paesaggio scorre davanti ai loro occhi. "Un secondo, un chilometro" è una regola arrotondata, e qui le posizioni del sole sono approssimative (fine settembre, Italia centrale).',
      'Quanto le seguaci si affidino alla danza piuttosto che all’odore e alla propria memoria cambia con la situazione, e i ricercatori ne discutono ancora. Le danze vere, inoltre, variano da una corsa all’altra più di questa.'
    ].forEach(function (t) { el('p', null, t, unknown); });
    var src = el('ul', 'sources');
    [
      'von Frisch, K. (1967). The Dance Language and Orientation of Bees. Harvard University Press.',
      'Riley, J. R. et al. (2005). The flight paths of honeybees recruited by the waggle dance. Nature 435.',
      'Seeley, T. D. (2010). Honeybee Democracy. Princeton University Press.',
      'Esch, H. E. et al. (2001). Honeybee dances communicate distances measured by optic flow. Nature 411.',
      'Kirchner, W. H. (1993). Acoustical communication in honeybees. Apidologie 24.',
      'Grüter, C. & Farina, W. M. (2009). The honeybee waggle dance: can we follow the steps? Trends in Ecology & Evolution 24.'
    ].forEach(function (t) { el('li', null, t, src); });

    // ---------- state
    var round = null, revealed = false, guess = null, hover = null, kb = null;
    var showSun = false, slow = false, visible = true, playOnce = false;
    var dance = { phase: 'waggle', t: 0, side: 1, dur: 1, ang: 0, wall: 0, shown: -1 };
    var followers = [];

    function newRound() {
      var hours = 8 + Math.floor(Math.random() * 55) / 6; // 8:00 to 17:00 in 10-minute steps
      var s = SITES[Math.floor(Math.random() * SITES.length)], x, y, d, tries = 0;
      do { x = s.x + rnd(-s.j, s.j); y = s.y + rnd(-s.j, s.j); d = Math.hypot(x, y); } while ((d < 0.2 || d > 2.5) && ++tries < 20);
      var az = sunAzimuth(hours), bear = norm360(Math.atan2(x, y) / DEG);
      round = { hours: hours, sun: az, site: s, x: x, y: y, dist: d, bear: bear, theta: norm180(bear - az), D: d * SEC_PER_KM };
      revealed = false; guess = null; hover = null; kb = null;
      result.textContent = ''; result.className = 'result'; explain.textContent = '';
      guessNote.textContent = 'la valle dall’alto, nord in alto';
      sunOut.textContent = hhmm(hours) + ' · direzione del sole ≈ ' + Math.round(az) + '°';
      comb.setAttribute('aria-label', 'Un’ape che danza sul favo. La sua corsa scodinzolante punta ' + Math.round(Math.abs(round.theta)) + ' gradi ' +
        (round.theta >= 0 ? 'in senso orario' : 'in senso antiorario') + ' rispetto alla verticale e dura circa ' + round.D.toFixed(1).replace('.', ',') + ' secondi.');
      startRun(true);
      initFollowers();
      if (ctx.reducedMotion) dance.phase = 'static';
      waggleOut.textContent = ctx.reducedMotion ? 'scodinzolio: ' + round.D.toFixed(1).replace('.', ',') + ' s' : 'scodinzolio: 0,0 s';
      drawComb(); drawMap();
    }

    // ---------- comb
    var cg = comb.getContext('2d'), CW = 300, combCache = null;
    var mg = map.getContext('2d'), MW = 300, mapCache = null;
    var dpr = 1;
    function size(cv, wrap) {
      var w = Math.max(100, Math.round(wrap.clientWidth)); dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr); return w;
    }
    function offscreen(w) { var c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(w * dpr); var g = c.getContext('2d'); g.scale(dpr, dpr); return { c: c, g: g }; }

    function drawBee(g, x, y, ang, L, o) {
      o = o || {};
      g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = o.alpha == null ? 1 : o.alpha;
      var line = dark ? rgba(C.warm, 0.5) : rgba(C.ink, 0.45);
      g.lineWidth = Math.max(0.6, L * 0.02); g.strokeStyle = line;
      g.save(); g.rotate(o.swing || 0); // abdomen swings from the waist
      g.beginPath(); g.ellipse(0, L * 0.2, L * 0.17, L * 0.29, 0, 0, TAU); g.fillStyle = o.body || C.warm; g.fill(); g.stroke();
      g.save(); g.clip(); g.fillStyle = rgba(C.deep, 0.62);
      for (var i = 0; i < 3; i++) g.fillRect(-L, L * (0.12 + i * 0.12), 2 * L, L * 0.055);
      g.restore(); g.restore();
      g.fillStyle = rgba(C.deep, 0.85);
      g.beginPath(); g.arc(0, -L * 0.1, L * 0.14, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.arc(0, -L * 0.3, L * 0.09, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-L * 0.04, -L * 0.37); g.quadraticCurveTo(-L * 0.12, -L * 0.48, -L * 0.17, -L * 0.52);
      g.moveTo(L * 0.04, -L * 0.37); g.quadraticCurveTo(L * 0.12, -L * 0.48, L * 0.17, -L * 0.52); g.stroke();
      g.fillStyle = rgba(C.pale, o.buzz ? 0.35 : 0.55); g.strokeStyle = rgba(C.deep, 0.35);
      var spread = o.buzz ? 0.55 : 0.28;
      [-1, 1].forEach(function (sd) {
        g.beginPath(); g.ellipse(sd * L * 0.12, L * 0.06, L * 0.09, L * 0.24, sd * spread, 0, TAU); g.fill(); g.stroke();
      });
      g.restore();
    }

    function buildComb() {
      var o = offscreen(CW), g = o.g, W = CW, r = W / 40, dx = Math.sqrt(3) * r, dy = 1.5 * r, rand = seeded(7);
      g.fillStyle = C.panel; g.fillRect(0, 0, W, W);
      g.lineWidth = 1; g.strokeStyle = dark ? rgba(C.ink, 0.13) : rgba(C.ink, 0.14);
      for (var row = -1; row * dy < W + r; row++) {
        var y = row * dy;
        for (var col = -1; col * dx < W + dx; col++) {
          var x = col * dx + (row & 1 ? dx / 2 : 0), q = rand(), d = Math.hypot(x - W / 2, y - W / 2) / W;
          g.beginPath();
          for (var k = 0; k < 6; k++) { var a = TAU * k / 6 + Math.PI / 6; g.lineTo(x + r * 0.92 * Math.cos(a), y + r * 0.92 * Math.sin(a)); }
          g.closePath();
          if (d > 0.42 && q < 0.7) g.fillStyle = rgba(C.warm, (dark ? 0.14 : 0.08) + 0.08 * rand());
          else if (d > 0.3 && q < 0.12) g.fillStyle = rgba(C.accent, 0.22);
          else g.fillStyle = rgba(C.deep, 0.02 + 0.05 * rand());
          g.fill(); g.stroke();
        }
      }
      var vg = g.createRadialGradient(W / 2, W / 2, W * 0.25, W / 2, W / 2, W * 0.75);
      vg.addColorStop(0, rgba(C.deep, 0)); vg.addColorStop(1, rgba(C.deep, dark ? 0.55 : 0.2));
      g.fillStyle = vg; g.fillRect(0, 0, W, W);
      for (var i = 0; i < 9; i++) { // resting sisters around the dance floor
        var ang = (-50 + i * 31 + rand() * 12) * DEG, rr = W * (0.36 + rand() * 0.08);
        drawBee(g, W / 2 + Math.cos(ang) * rr, W / 2 + Math.sin(ang) * rr, rand() * TAU, W * 0.1, { alpha: 0.5, body: C.accent });
      }
      g.strokeStyle = C.ink; g.fillStyle = C.ink; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(W / 2, W * 0.1); g.lineTo(W / 2, W * 0.03); g.stroke();
      g.beginPath(); g.moveTo(W / 2 - 5, W * 0.03 + 6); g.lineTo(W / 2, W * 0.03 - 1); g.lineTo(W / 2 + 5, W * 0.03 + 6); g.fill();
      pill(g, 'su', W / 2 + 22, W * 0.06, '12px "IBM Plex Mono", monospace', C.ink, rgba(C.panel, 0.85));
      combCache = o.c;
    }

    function runGeom(D, ang, side) {
      var W = CW, L = W * (0.1 + 0.11 * Math.min(D, 2.6)), d = [Math.sin(ang), -Math.cos(ang)], n = [Math.cos(ang), Math.sin(ang)];
      var a = [W / 2 - d[0] * L / 2, W / 2 - d[1] * L / 2], b = [W / 2 + d[0] * L / 2, W / 2 + d[1] * L / 2], w = W * 0.12 + L * 0.25;
      return { a: a, b: b, d: d, n: n, L: L,
        c1: [b[0] + n[0] * w * side + d[0] * w * 0.5, b[1] + n[1] * w * side + d[1] * w * 0.5],
        c2: [a[0] + n[0] * w * side - d[0] * w * 0.5, a[1] + n[1] * w * side - d[1] * w * 0.5] };
    }
    function bez(G, u) {
      var v = 1 - u, p = [G.b, G.c1, G.c2, G.a], co = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
      var dc = [-3 * v * v, 3 * v * v - 6 * u * v, 6 * u * v - 3 * u * u, 3 * u * u];
      var x = 0, y = 0, tx = 0, ty = 0;
      for (var i = 0; i < 4; i++) { x += co[i] * p[i][0]; y += co[i] * p[i][1]; tx += dc[i] * p[i][0]; ty += dc[i] * p[i][1]; }
      return { x: x, y: y, h: Math.atan2(tx, -ty) };
    }

    var RETURN_T = 1.5;
    function startRun(first) {
      dance.phase = 'waggle'; dance.t = 0; if (!first) dance.side = -dance.side;
      var scatter = first ? 0 : 1;
      dance.ang = (round.theta + scatter * rnd(-3, 3)) * DEG;
      dance.dur = round.D * (1 + scatter * rnd(-0.04, 0.04));
      dance.geom = runGeom(round.D, dance.ang, dance.side);
      dance.shown = -1;
      buzz(true);
    }
    function dancerPos() {
      var G = dance.geom;
      if (dance.phase === 'waggle') {
        var u = Math.min(1, dance.t / dance.dur), wig = Math.sin(dance.wall * TAU * 7);
        return { x: G.a[0] + G.d[0] * G.L * u + G.n[0] * wig * CW * 0.01, y: G.a[1] + G.d[1] * G.L * u + G.n[1] * wig * CW * 0.01, h: dance.ang, swing: wig * 0.35, buzz: true };
      }
      var p = bez(G, ease(Math.min(1, dance.t / RETURN_T))); p.swing = 0; return p;
    }
    var FOFF = [[-0.11, 0.05], [-0.11, -0.05], [-0.03, 0.085], [-0.03, -0.085]];
    function initFollowers() {
      var p = dancerPos();
      followers = FOFF.map(function (f) { var q = followTarget(p, f); return { x: q.x, y: q.y }; });
    }
    function followTarget(p, f) {
      var a = dance.ang, dx = Math.sin(a), dy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
      return { x: p.x + (dx * f[0] + nx * f[1]) * CW, y: p.y + (dy * f[0] + ny * f[1]) * CW };
    }

    function step(dt, wdt) {
      dance.wall += wdt; dance.t += dt;
      if (dance.phase === 'waggle') {
        var shown = Math.floor(Math.min(dance.t, dance.dur) * 10);
        if (shown !== dance.shown) { dance.shown = shown; waggleOut.textContent = 'scodinzolio: ' + (shown / 10).toFixed(1).replace('.', ',') + ' s'; }
        if (dance.t >= dance.dur) {
          waggleOut.textContent = 'scodinzolio: ' + dance.dur.toFixed(1).replace('.', ',') + ' s';
          dance.phase = 'return'; dance.t = 0; buzz(false);
        }
      } else if (dance.t >= RETURN_T) {
        if (playOnce) { playOnce = false; startRun(true); buzz(false); dance.phase = 'static'; return; }
        startRun(false);
      }
      var p = dancerPos(), rate = dance.phase === 'waggle' ? 3 : 0.8;
      followers.forEach(function (f, i) {
        var q = followTarget(p, FOFF[i]), k = Math.min(1, rate * dt);
        f.x += (q.x - f.x) * k; f.y += (q.y - f.y) * k;
      });
    }

    function drawRunDiagram(g, G) {
      var W = CW, amp = W * 0.012, n = 60;
      g.strokeStyle = C.accent; g.lineWidth = 1.6; g.beginPath();
      for (var i = 0; i <= n; i++) {
        var u = i / n, s = Math.sin(u * TAU * 7) * amp;
        g.lineTo(G.a[0] + G.d[0] * G.L * u + G.n[0] * s, G.a[1] + G.d[1] * G.L * u + G.n[1] * s);
      }
      g.stroke();
      var e = [G.b[0] + G.d[0] * W * 0.05, G.b[1] + G.d[1] * W * 0.05];
      g.beginPath(); g.moveTo(G.b[0], G.b[1]); g.lineTo(e[0], e[1]); g.stroke();
      arrowHead(g, e[0], e[1], Math.atan2(G.d[1], G.d[0]), 8, C.accent);
      g.setLineDash([4, 4]); g.strokeStyle = rgba(C.ink, 0.45); g.lineWidth = 1.2;
      [1, -1].forEach(function (sd) {
        var H = runGeom(round.D, dance.ang, sd);
        g.beginPath(); g.moveTo(H.b[0], H.b[1]); g.bezierCurveTo(H.c1[0], H.c1[1], H.c2[0], H.c2[1], H.a[0], H.a[1]); g.stroke();
        var q = bez(H, 0.82); arrowHead(g, q.x, q.y, q.h - Math.PI / 2, 6, rgba(C.ink, 0.6));
      });
      g.setLineDash([]);
      var lx = G.a[0] - G.d[0] * W * 0.17, ly = Math.max(W * 0.2, Math.min(W * 0.86, G.a[1] - G.d[1] * W * 0.17));
      pill(g, 'scodinzolio ' + round.D.toFixed(1).replace('.', ',') + ' s', lx, ly, '12px "IBM Plex Mono", monospace', C.accent, rgba(C.panel, 0.88), W);
    }
    function arrowHead(g, x, y, a, s, col) {
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col;
      g.beginPath(); g.moveTo(s * 0.4, 0); g.lineTo(-s * 0.7, -s * 0.5); g.lineTo(-s * 0.7, s * 0.5); g.closePath(); g.fill(); g.restore();
    }
    function sunGlyph(g, x, y, r) {
      g.fillStyle = C.warm; g.strokeStyle = C.warm; g.lineWidth = Math.max(1.2, r * 0.22);
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      for (var i = 0; i < 8; i++) {
        var a = i * TAU / 8; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45);
        g.lineTo(x + Math.cos(a) * r * 2, y + Math.sin(a) * r * 2); g.stroke();
      }
    }

    function drawComb() {
      if (!round || !combCache) return;
      var g = cg, W = CW, G = dance.geom;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.drawImage(combCache, 0, 0, W, W);
      if (showSun) {
        sunGlyph(g, W / 2 - W * 0.13, W * 0.06, W * 0.022);
        g.setLineDash([3, 5]); g.strokeStyle = rgba(C.warm, 0.8); g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(W / 2, W / 2); g.lineTo(W / 2, W * 0.12); g.stroke(); g.setLineDash([]);
        var r = W * 0.3, a0 = -Math.PI / 2, a1 = a0 + round.theta * DEG;
        g.strokeStyle = C.warm; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, W / 2, r, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
        var am = (a0 + a1) / 2, side = round.theta >= 0 ? 'a destra' : 'a sinistra';
        pill(g, Math.round(Math.abs(round.theta)) + '° ' + side + ' della verticale', W / 2 + Math.cos(am) * (r + 18), W / 2 + Math.sin(am) * (r + 18),
          '12px "IBM Plex Mono", monospace', C.ink, rgba(C.panel, 0.9), W);
        pill(g, 'la verticale sta per il sole', W / 2, W - 16, 'italic 12px Literata, Georgia, serif', C.ink, rgba(C.panel, 0.9), W);
      }
      var still = dance.phase === 'static';
      if (still) drawRunDiagram(g, G);
      else {
        var u = dance.phase === 'waggle' ? Math.min(1, dance.t / dance.dur) : 1;
        var fade = dance.phase === 'waggle' ? 0.55 : 0.55 * (1 - Math.min(1, dance.t / RETURN_T));
        g.strokeStyle = rgba(C.accent, fade); g.lineWidth = 2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(G.a[0], G.a[1]); g.lineTo(G.a[0] + G.d[0] * G.L * u, G.a[1] + G.d[1] * G.L * u); g.stroke();
      }
      var p = still ? { x: G.a[0], y: G.a[1], h: dance.ang, swing: 0 } : dancerPos();
      if (!still) followers.forEach(function (f) {
        drawBee(g, f.x, f.y, Math.atan2(p.x - f.x, -(p.y - f.y)), W * 0.1, { alpha: 0.85, body: C.accent });
      });
      drawBee(g, p.x, p.y, p.h, W * 0.11, { swing: p.swing, buzz: p.buzz });
    }

    // ---------- loop
    var raf = 0, last = 0;
    function running() { return visible && round && (playOnce || (!ctx.reducedMotion && dance.phase !== 'static')); }
    function frame(ts) {
      raf = 0;
      var wdt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
      step(wdt * (slow ? 0.4 : 1), wdt);
      drawComb();
      if (running()) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && running()) { last = 0; raf = requestAnimationFrame(frame); } }

    // ---------- sound (optional): bursts of ~250 Hz during the waggle
    var ac = null, env = null, soundOn = false;
    function buildSound() {
      ac = ctx.audio && ctx.audio(); if (!ac) return false;
      if (env) return true;
      var osc = ac.createOscillator(), lp = ac.createBiquadFilter(), amp = ac.createGain(), lfo = ac.createOscillator(), depth = ac.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = 250; lp.type = 'lowpass'; lp.frequency.value = 800;
      lfo.frequency.value = 15; depth.gain.value = 0.5; amp.gain.value = 0.5;
      env = ac.createGain(); env.gain.value = 0;
      osc.connect(lp); lp.connect(amp); amp.connect(env); env.connect(ac.destination); lfo.connect(depth); depth.connect(amp.gain);
      osc.start(); lfo.start(); return true;
    }
    function buzz(on) {
      if (!env || !ac) return;
      var now = ac.currentTime; env.gain.cancelScheduledValues(now); env.gain.setValueAtTime(env.gain.value, now);
      if (on && soundOn && visible && running()) {
        env.gain.setTargetAtTime(0.05, now, 0.015);
        env.gain.setTargetAtTime(0, now + dance.dur / (slow ? 0.4 : 1), 0.02);
      } else env.gain.setTargetAtTime(0, now, 0.02);
    }

    // ---------- map
    var S = 150, K = 1;
    function P(x, y) { return [S + x * K, S - y * K]; }
    function smoothPath(g, pts) {
      var p = pts.map(function (q) { return P(q[0], q[1]); });
      g.beginPath(); g.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < p.length - 1; i++) g.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
      g.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    }
    function buildMap() {
      var o = offscreen(MW), g = o.g, W = MW, rand = seeded(11), i, q, x, y;
      S = W / 2; K = S * 0.86 / 2.7;
      g.fillStyle = C.panel; g.fillRect(0, 0, W, W);
      FIELDS.forEach(function (f) {
        q = P(f.x, f.y); g.beginPath(); g.ellipse(q[0], q[1], f.rx * K, f.ry * K, -0.2, 0, TAU);
        g.fillStyle = f.kind === 'field' ? rgba(C.warm, 0.1) : rgba(C.muted, 0.08); g.fill();
        g.fillStyle = f.kind === 'field' ? rgba(C.warm, 0.4) : rgba(C.muted, 0.4);
        for (i = 0; i < 70; i++) {
          var a = rand() * TAU, rr = Math.sqrt(rand());
          g.fillRect(q[0] + Math.cos(a) * rr * f.rx * K * 0.9, q[1] + Math.sin(a) * rr * f.ry * K * 0.9, 1.4, 1.4);
        }
      });
      g.beginPath(); g.moveTo(0, 0);
      for (x = -3.5; x <= 3.5; x += 0.05) { q = P(x, forestEdge(x)); g.lineTo(q[0], q[1]); }
      g.lineTo(W, 0); g.closePath(); g.fillStyle = rgba(C.muted, 0.13); g.fill();
      g.lineWidth = 0.8;
      for (i = 0; i < 420; i++) {
        x = rand() * 7 - 3.5; y = forestEdge(x) + 0.04 + rand() * 2.4;
        q = P(x, y); if (q[1] < -6) continue;
        g.beginPath(); g.arc(q[0], q[1], K * (0.035 + rand() * 0.025), 0, TAU);
        g.fillStyle = rgba(C.muted, 0.12); g.fill(); g.strokeStyle = rgba(C.muted, 0.32); g.stroke();
      }
      smoothPath(g, RIVER); g.strokeStyle = rgba(C.muted, 0.5); g.lineWidth = Math.max(4, K * 0.07); g.lineCap = 'round'; g.stroke();
      smoothPath(g, RIVER); g.strokeStyle = rgba(C.pale, 0.45); g.lineWidth = 1.2; g.stroke();
      q = P(0.9, -1.22); g.strokeStyle = rgba(C.ink, 0.6); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(q[0] - 5, q[1] - 6); g.lineTo(q[0] + 5, q[1] - 6); g.moveTo(q[0] - 5, q[1] + 6); g.lineTo(q[0] + 5, q[1] + 6); g.stroke();
      smoothPath(g, TRACK); g.setLineDash([3, 3]); g.strokeStyle = rgba(C.ink, 0.35); g.lineWidth = 1.1; g.stroke(); g.setLineDash([]);
      q = P(CEM.x, CEM.y); g.save(); g.translate(q[0], q[1]); g.rotate(-0.25);
      g.fillStyle = rgba(C.ink, 0.06); g.strokeStyle = rgba(C.ink, 0.6); g.lineWidth = 1.3;
      g.fillRect(-CEM.w * K / 2, -CEM.h * K / 2, CEM.w * K, CEM.h * K); g.strokeRect(-CEM.w * K / 2, -CEM.h * K / 2, CEM.w * K, CEM.h * K);
      g.fillStyle = rgba(C.ink, 0.5);
      for (i = 0; i < 4; i++) { g.beginPath(); g.ellipse((-0.3 + i * 0.2) * CEM.w * K, -CEM.h * K * 0.15, 1.8, 4, 0, 0, TAU); g.fill(); }
      g.restore();
      for (i = 0; i < 34; i++) {
        var a2 = rand() * TAU, r2 = Math.sqrt(rand()); x = -0.38 + Math.cos(a2) * r2 * 0.44; y = -0.5 + Math.sin(a2) * r2 * 0.3;
        if (Math.hypot(x, y) < 0.14) continue;
        q = P(x, y); var s = K * (0.045 + rand() * 0.03);
        g.save(); g.translate(q[0], q[1]); g.rotate(rand() * 0.8 - 0.4);
        g.fillStyle = rgba(C.ink, 0.16); g.strokeStyle = rgba(C.ink, 0.45); g.lineWidth = 0.8;
        g.fillRect(-s / 2, -s / 2, s, s * 0.8); g.strokeRect(-s / 2, -s / 2, s, s * 0.8); g.restore();
      }
      g.setLineDash([2, 4]); g.strokeStyle = rgba(C.muted, 0.6); g.lineWidth = 1;
      [1, 2].forEach(function (km) { g.beginPath(); g.arc(S, S, km * K, 0, TAU); g.stroke(); });
      g.setLineDash([]);
      var mono = '11px "IBM Plex Mono", monospace', serif = 'italic 12px Literata, Georgia, serif', bg = rgba(C.panel, 0.8);
      [1, 2].forEach(function (km) { q = P(km * Math.sin(118 * DEG), km * Math.cos(118 * DEG)); pill(g, km + ' km', q[0], q[1], mono, C.muted, bg); });
      [['Pietrafonda', -0.45, -0.9], ['cimitero', 0.5, 0.52], ['Rio Freddo', -1.9, -1.75], ['faggeta', -1.5, 2.05]].forEach(function (l) {
        q = P(l[1], l[2]); pill(g, l[0], q[0], q[1], serif, rgba(C.ink, 0.75), bg, W);
      });
      pill(g, 'N ↑', 18, 14, mono, C.muted, null);
      q = P(0, 0); g.fillStyle = C.warm; g.strokeStyle = C.deep; g.lineWidth = 1.2;
      rrect(g, q[0] - 7, q[1] - 6, 14, 12, 2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(q[0] - 7, q[1] - 1); g.lineTo(q[0] + 7, q[1] - 1); g.moveTo(q[0] - 7, q[1] + 3); g.lineTo(q[0] + 7, q[1] + 3); g.stroke();
      pill(g, 'arnia', q[0], q[1] + 15, mono, C.ink, bg);
      mapCache = o.c;
    }
    function bearingXY(b, r) { return P(Math.sin(b * DEG) * r, Math.cos(b * DEG) * r); }
    function marker(g, x, y, col, alpha) {
      var q = P(x, y); g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = 2;
      g.beginPath(); g.arc(q[0], q[1], 8, 0, TAU); g.moveTo(q[0] - 12, q[1]); g.lineTo(q[0] - 4, q[1]); g.moveTo(q[0] + 4, q[1]); g.lineTo(q[0] + 12, q[1]);
      g.moveTo(q[0], q[1] - 12); g.lineTo(q[0], q[1] - 4); g.moveTo(q[0], q[1] + 4); g.lineTo(q[0], q[1] + 12); g.stroke(); g.globalAlpha = 1;
      return q;
    }
    function flower(g, x, y) {
      var q = P(x, y), i;
      g.fillStyle = C.warm; g.strokeStyle = C.deep; g.lineWidth = 1;
      for (i = 0; i < 5; i++) { var a = i * TAU / 5; g.beginPath(); g.ellipse(q[0] + Math.cos(a) * 5, q[1] + Math.sin(a) * 5, 4.2, 2.8, a, 0, TAU); g.fill(); g.stroke(); }
      g.fillStyle = C.deep; g.beginPath(); g.arc(q[0], q[1], 2.6, 0, TAU); g.fill();
      return q;
    }
    function drawMap() {
      if (!round || !mapCache) return;
      var g = mg, W = MW, rs = 2.85, mono = '11px "IBM Plex Mono", monospace', bg = rgba(C.panel, 0.88), i, q;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.drawImage(mapCache, 0, 0, W, W);
      g.strokeStyle = rgba(C.warm, 0.45); g.lineWidth = 1; g.beginPath(); g.arc(S, S, rs * K, 0, TAU); g.stroke();
      if (showSun || revealed) {
        for (i = -150; i <= 180; i += 30) {
          var b = round.sun + i, a1 = bearingXY(b, rs - (i % 90 ? 0.08 : 0.16)), a2 = bearingXY(b, rs);
          g.strokeStyle = rgba(C.warm, 0.8); g.lineWidth = 1.5; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.stroke();
        }
      }
      var s0 = bearingXY(round.sun, 0.2), s1 = bearingXY(round.sun, rs - 0.2);
      g.setLineDash([4, 4]); g.strokeStyle = rgba(C.warm, 0.7); g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(s0[0], s0[1]); g.lineTo(s1[0], s1[1]); g.stroke(); g.setLineDash([]);
      q = bearingXY(round.sun, rs); sunGlyph(g, q[0], q[1], S * 0.04);
      if (!revealed) {
        var lt = 'sole ' + hhmm(round.hours); g.font = mono;
        var back = S * 0.14 + Math.abs(Math.sin(round.sun * DEG)) * (g.measureText(lt).width / 2 + 4);
        q = bearingXY(round.sun, rs - back / K); pill(g, lt, q[0], q[1], mono, C.ink, bg, W);
      }
      if (revealed) {
        var r = 0.55, a0 = round.sun, a1b = round.sun + round.theta;
        g.strokeStyle = C.warm; g.lineWidth = 2; g.beginPath();
        g.arc(S, S, r * K, (Math.min(a0, a1b) - 90) * DEG, (Math.max(a0, a1b) - 90) * DEG); g.stroke();
        var t = P(round.x, round.y); g.strokeStyle = C.warm; g.lineWidth = 2;
        g.beginPath(); g.moveTo(S, S); g.lineTo(t[0], t[1]); g.stroke();
        if (guess) {
          var gq = P(guess.x, guess.y); g.setLineDash([5, 4]); g.strokeStyle = C.accent; g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(S, S); g.lineTo(gq[0], gq[1]); g.stroke(); g.setLineDash([]);
          marker(g, guess.x, guess.y, C.accent, 1);
        }
        q = flower(g, round.x, round.y);
        pill(g, round.site.short, q[0], q[1] + (q[1] > W - 30 ? -18 : 18), mono, C.ink, bg, W);
        var mid = (a0 + a1b) / 2; q = bearingXY(mid, r + 0.28);
        if (Math.abs(round.theta) >= 6) pill(g, Math.round(Math.abs(round.theta)) + '°', q[0], q[1], mono, C.warm, bg, W);
      } else {
        var m = hover || kb;
        if (m) {
          q = marker(g, m.x, m.y, C.accent, hover ? 0.6 : 1);
          pill(g, fmtKm(Math.hypot(m.x, m.y)), q[0], q[1] - 20, mono, C.accent, bg, W);
        }
      }
    }
    function toKm(e) {
      var r = map.getBoundingClientRect(), sx = MW / r.width;
      return { x: ((e.clientX - r.left) * sx - S) / K, y: -((e.clientY - r.top) * sx - S) / K };
    }

    function judge(p) {
      if (revealed || !round) return;
      guess = { x: p.x, y: p.y }; revealed = true; hover = null;
      var gd = Math.hypot(p.x, p.y), gb = norm360(Math.atan2(p.x, p.y) / DEG);
      var angErr = Math.round(Math.abs(norm180(gb - round.bear))), dErr = Math.abs(gd - round.dist) * 1000;
      var miss = Math.hypot(p.x - round.x, p.y - round.y) * 1000, dTxt = dErr < 995 ? Math.round(dErr / 10) * 10 + ' m' : (dErr / 1000).toFixed(1).replace('.', ',') + ' km';
      var good = miss < 150 || (angErr <= 15 && dErr <= Math.max(250, 250 * round.dist));
      if (gd < 0.05) {
        result.textContent = 'Questa è l’arnia stessa. Lei aveva trovato ' + round.site.what + ', a ' + fmtKm(round.dist) + '.';
        good = false;
      } else if (good) {
        result.textContent = 'Vicino: scarto di ' + angErr + '° e ' + dTxt + '. Le sue sorelle troverebbero ' + round.site.what + '.';
      } else {
        result.textContent = 'Fuori di ' + angErr + '° in direzione e di ' + dTxt + ' in distanza. Aveva trovato ' + round.site.what + '.';
      }
      result.className = 'result ' + (good ? 'good' : 'miss');
      var th = Math.round(Math.abs(round.theta)), side = round.theta >= 0 ? 'a destra' : 'a sinistra';
      explain.textContent = (th > 172 ? 'Il suo scodinzolio puntava dritto in giù, quindi i fiori stavano dalla parte opposta al sole. ' :
        th < 4 ? 'Il suo scodinzolio puntava dritto in su, quindi i fiori stavano verso il sole. ' :
        'Il suo scodinzolio puntava ' + th + '° ' + side + ' della verticale, quindi i fiori stavano ' + th + '° ' + side + ' del sole. ') +
        'Uno scodinzolio di ' + round.D.toFixed(1).replace('.', ',') + ' s vuol dire circa ' + fmtKm(round.dist) + '.';
      guessNote.textContent = 'la tua ipotesi: ' + fmtKm(gd) + ', direzione ' + Math.round(gb) + '°';
      drawMap();
    }

    // ---------- input
    var down = null;
    map.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
    map.addEventListener('pointerup', function (e) {
      if (!down) return;
      var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved < 12 && e.button === 0) judge(toKm(e));
    });
    map.addEventListener('pointercancel', function () { down = null; });
    map.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || revealed) return;
      hover = toKm(e); drawMap();
    });
    map.addEventListener('pointerleave', function () { if (hover) { hover = null; drawMap(); } });
    map.addEventListener('keydown', function (e) {
      if (revealed) return;
      var st = e.shiftKey ? 0.25 : 0.05, mv = { ArrowUp: [0, st], ArrowDown: [0, -st], ArrowLeft: [-st, 0], ArrowRight: [st, 0] }[e.key];
      if (mv) {
        e.preventDefault(); kb = kb || { x: 0, y: 0 };
        kb.x = Math.max(-2.9, Math.min(2.9, kb.x + mv[0])); kb.y = Math.max(-2.9, Math.min(2.9, kb.y + mv[1]));
        guessNote.textContent = 'segnaposto: ' + fmtKm(Math.hypot(kb.x, kb.y)) + ', direzione ' + Math.round(norm360(Math.atan2(kb.x, kb.y) / DEG)) + '° · Invio per scegliere';
        drawMap();
      } else if ((e.key === 'Enter' || e.key === ' ') && kb) { e.preventDefault(); judge(kb); }
    });
    map.addEventListener('focus', function () {
      if (!revealed && !kb) { guessNote.textContent = 'le frecce spostano il segnaposto (Maiusc per passi lunghi)'; }
    });

    bNew.addEventListener('click', function () { newRound(); kick(); });
    if (bPlay) bPlay.addEventListener('click', function () { startRun(true); playOnce = true; initFollowers(); kick(); buzz(true); });
    function toggle(btn, v) { btn.setAttribute('aria-pressed', v ? 'true' : 'false'); }
    bSun.addEventListener('click', function () { showSun = !showSun; toggle(bSun, showSun); drawComb(); drawMap(); });
    bSlow.addEventListener('click', function () { slow = !slow; toggle(bSlow, slow); if (dance.phase === 'waggle') buzz(true); });
    bSound.addEventListener('click', function () {
      if (!soundOn && !buildSound()) { bSound.disabled = true; bSound.textContent = 'Niente suono qui'; return; }
      soundOn = !soundOn; toggle(bSound, soundOn); buzz(soundOn && dance.phase === 'waggle');
    });

    ctx.visible(function (v) { visible = v; if (v) kick(); else buzz(false); });
    ctx.onThemeChange(function () { readColors(); buildComb(); buildMap(); drawComb(); drawMap(); });
    function resize() {
      var oldCW = CW;
      CW = size(comb, combWrap); MW = size(map, mapWrap);
      buildComb(); buildMap();
      if (round) {
        var k = CW / oldCW; dance.geom = runGeom(round.D, dance.ang, dance.side);
        followers.forEach(function (f) { f.x *= k; f.y *= k; });
      }
      drawComb(); drawMap();
    }
    if ('ResizeObserver' in window) {
      var pending = 0;
      new ResizeObserver(function () { if (!pending) pending = requestAnimationFrame(function () { pending = 0; resize(); }); }).observe(combWrap);
    } else window.addEventListener('resize', resize);
    CW = size(comb, combWrap); MW = size(map, mapWrap); buildComb(); buildMap();
    newRound();
    kick();
  }

  window.MINDS.bees = { mount: mount };
})();
