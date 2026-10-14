/* The bat: "A flicker in a held note". How a lesser horseshoe bat finds a moth among leaves.
   Model: constant-frequency call near 110 kHz, Doppler shift of echoes while flying, Doppler shift
   compensation, wingbeat glints, rain masking. Sound is transposed down by a factor of 40. */
(function () {
  'use strict';
  var C = 343;          // speed of sound in air, m/s
  var REF = 110;        // kHz: reference frequency, where the echo is held
  var BAND = 0.8;       // kHz: half-width of the drawn band of sharpest hearing (schematic)
  var FMIN = 105.4, FMAX = 114.6;
  var DIV = 40;         // pitch divisor for the sound
  var SLOW = 6;         // wingbeats slowed six-fold so the flutter is audible and visible
  var WINDOW = 2.6;     // seconds of (slowed) time across the display
  var ROUNDS = 5, COLW = 2, TAU = Math.PI * 2;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) * 2; }
  // Echo from a stationary object when the bat flies toward it at v m/s.
  function echoOf(call, v) { return call * (C + v) / (C - v); }
  // The call that brings the echo back exactly at REF.
  function compCall(v) { return REF * (C - v) / (C + v); }
  // How well the bat's hearing resolves detail at frequency f (1 inside the sharp band).
  function bandFactor(f) {
    var d = Math.abs(f - REF) - BAND;
    return d <= 0 ? 1 : Math.max(0.08, Math.exp(-d * d));
  }

  var P = '.stage[data-mind="bat"] ';
  var CSS = [
    P + '.bat-nosound { font: .8rem var(--font-mono, monospace); color: var(--muted); }',
    P + '.bat-score { margin-left: auto; color: var(--muted); }',
    P + '.controls + .controls { margin-top: -.2rem; }',
    P + '.ctl input[type=range] { width: 6.5rem; }',
    P + '.canvas-wrap { touch-action: pan-y; }'
  ].join('\n');

  function mount(stage, ctx) {
    var S = {
      speed: 3, comp: true, rain: false, call: compCall(3), t: 0, scroll: 0, cols: [], acc: 0,
      roundNo: 1, score: 0, answered: false, round: null, everOff: false, raf: 0, last: 0
    };
    var pal = {}, L = null, G = null, A = null, carry = 0, carryA = 0, carryH = 0;
    var reduced = !!ctx.reducedMotion;

    function readPal() {
      ['paper', 'ink', 'muted', 'rule', 'accent', 'warm', 'panel'].forEach(function (k) {
        pal[k] = ctx.color(k) || '#888';
      });
    }

    /* ---------- DOM ---------- */
    var style = el('style'); style.textContent = CSS; stage.appendChild(style);
    var lede = el('p', 'lede', 'Un pipistrello ferro di cavallo caccia tenendo una sola nota, lunga e acuta, e ascoltando un tremolio nella sua eco. ' +
      'Guarda la linea luminosa dell’eco, o premi Ascolta, e decidi a ogni turno: tra le foglie si nasconde una falena? ' +
      'Il richiamo vero è di circa 110 kHz, troppo acuto per l’orecchio umano, così qui il suono è abbassato di quaranta volte, a circa 2,75 kHz.');
    var wrap = el('div', 'canvas-wrap');
    var cv = el('canvas');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'In alto, uno schizzo del pipistrello in volo tra i tronchi. In basso, un grafico delle frequenze: una linea tenue per il richiamo che il pipistrello emette, ' +
      'una linea luminosa per l’eco che sente e una fascia ombreggiata dove il suo udito è più fine. Una falena appare come strisce tremolanti sulla linea dell’eco.');
    wrap.appendChild(cv);

    var senses = el('div', 'controls');
    var btnListen = el('button', 'btn', 'Ascolta');
    btnListen.type = 'button'; btnListen.setAttribute('aria-pressed', 'false');
    var noSound = el('span', 'bat-nosound', 'suono non disponibile'); noSound.hidden = true;
    var btnComp = el('button', 'btn', 'Compensazione Doppler: attiva');
    btnComp.type = 'button'; btnComp.setAttribute('aria-pressed', 'true');
    var spdLabel = el('label', 'ctl', 'Velocità ');
    var spd = el('input'); spd.type = 'range'; spd.min = '0'; spd.max = '5'; spd.step = '0.1'; spd.value = '3';
    spdLabel.appendChild(spd);
    var spdOut = el('output', 'readout', '3,0 m/s');
    var btnRain = el('button', 'btn', 'Pioggia');
    btnRain.type = 'button'; btnRain.setAttribute('aria-pressed', 'false');
    [btnListen, noSound, btnComp, spdLabel, spdOut, btnRain].forEach(function (n) { senses.appendChild(n); });

    var game = el('div', 'controls');
    var btnMoth = el('button', 'btn primary', 'Falena!'); btnMoth.type = 'button';
    var btnLeaves = el('button', 'btn', 'Solo foglie'); btnLeaves.type = 'button';
    var btnNext = el('button', 'btn', 'Prossimo turno'); btnNext.type = 'button'; btnNext.hidden = true;
    var scoreOut = el('output', 'readout bat-score');
    [btnMoth, btnLeaves, btnNext, scoreOut].forEach(function (n) { game.appendChild(n); });
    var result = el('p', 'result'); result.setAttribute('aria-live', 'polite');

    var known = el('div', 'known');
    known.appendChild(el('h4', null, 'Che cosa si sa'));
    [
      'Il rinolofo minore (Rhinolophus hipposideros) emette i richiami dal naso, indirizzati da una piega di pelle a forma di ferro di cavallo. Ogni richiamo è una nota lunga di tono quasi costante, circa 110 kHz: più di cinque volte più acuta della nota più alta che un giovane essere umano riesca a sentire.',
      'Volare verso le cose alza il tono dei loro echi (effetto Doppler); a 5 m/s, di circa 3 kHz. I rinolofi abbassano il richiamo esattamente di tanto, così l’eco torna a un tono di riferimento fisso, dove il loro udito è sintonizzato più finemente. Si chiama compensazione dello spostamento Doppler.',
      'Foglie e tronchi restituiscono un’eco ferma. Un’ala che batte fa tremolare l’eco in intensità e in tono, una volta a ogni battito: "luccichii acustici" che fanno spiccare un insetto nel groviglio degli echi. I rinolofi riescono perfino a usarli per distinguere alcuni insetti.',
      'Il ritardo dell’eco dà la distanza: il suono impiega circa 6 ms per raggiungere una cosa a un metro e tornare indietro.',
      'La pioggia riempie l’aria di rumore e assorbe le frequenze alte. Quando piove, i pipistrelli cacciano meno.'
    ].forEach(function (t) { known.appendChild(el('p', null, t)); });

    var unknown = el('div', 'unknown');
    unknown.appendChild(el('h4', null, 'Che cosa non si sa'));
    unknown.appendChild(el('p', null, 'Che cosa sia tutto questo per il pipistrello. Nagel (1974) sosteneva che possiamo descrivere il meccanismo per intero e non sapere ancora che cosa si provi a percepire col sonar. "Tremolio" e "luccichio" sono parole nostre, non sue.'));
    unknown.appendChild(el('p', null, 'Questo è uno schizzo, non una registrazione. I richiami veri arrivano a raffiche di qualche decina di millisecondi, non come un’unica nota infinita. Qui il tono è diviso per 40 e i battiti d’ala sono rallentati di circa sei volte. La larghezza della fascia più fine e l’effetto della pioggia sono disegnati in modo schematico, e ogni pipistrello è diverso.'));

    var sources = el('ul', 'sources');
    [
      'Schnitzler H-U & Denzinger A (2011). Auditory fovea and Doppler shift compensation: adaptations for flutter detection in echolocating bats using CF-FM signals. Journal of Comparative Physiology A 197.',
      'von der Emde G & Schnitzler H-U (1990). Classification of insects by echolocating greater horseshoe bats. Journal of Comparative Physiology A 167.',
      'Frontiers in Ecology and Evolution (2022), on rain and bat activity.',
      'Nagel T (1974). What is it like to be a bat? The Philosophical Review 83.'
    ].forEach(function (t) { sources.appendChild(el('li', null, t)); });

    [lede, wrap, senses, game, result, known, unknown, sources].forEach(function (n) { stage.appendChild(n); });

    if (!(window.AudioContext || window.webkitAudioContext)) { btnListen.hidden = true; noSound.hidden = false; }

    /* ---------- forest (world positions in metres, looping) ---------- */
    var LOOP = 40;
    function makeLayer(gapMin, gapMax, wMin, wMax) {
      var out = [], x = rand(0, 1);
      while (x < LOOP - 1) {
        var blobs = [], nb = 3 + (Math.random() * 4 | 0);
        for (var i = 0; i < nb; i++) blobs.push([rand(-1.6, 1.6), rand(0.02, 0.55), rand(0.6, 1.3)]);
        out.push({ x: x, w: rand(wMin, wMax), blobs: blobs });
        x += rand(gapMin, gapMax);
      }
      return out;
    }
    var far = makeLayer(0.8, 1.8, 0.5, 1), near = makeLayer(1.6, 3, 0.9, 1.6);

    /* ---------- model ---------- */
    function targetCall() { return S.comp ? compCall(S.speed) : REF; }
    function currentEcho() { return echoOf(S.call, S.speed); }
    function mothVis(band) {
      var r = S.round;
      return r && r.moth ? r.strength * band * (S.rain ? 0.4 : 1) : 0;
    }
    function makeCol(t) {
      var echo = currentEcho();
      if (S.comp) echo += 0.07 * Math.sin(t * 2.3) + 0.04 * Math.sin(t * 5.1); // compensation is close, not perfect
      var band = bandFactor(echo), r = S.round;
      var c = { call: S.call, echo: echo, band: band, amp: 1, glint: 0, gh: 0, fm: 0, jit: 0, fg: 0, fgh: 0, specks: null };
      if (r.moth) {
        var ph = t * r.wing / SLOW + r.phase;
        var pulse = Math.pow(0.5 + 0.5 * Math.cos(TAU * ph), 9);
        var vis = mothVis(band);
        c.glint = vis * pulse;
        c.gh = 0.25 + 1.1 * pulse;
        c.amp = 1 + 0.6 * vis * pulse;
        c.fm = vis * 0.16 * Math.sin(TAU * ph);
      }
      if (S.rain) {
        c.jit = gauss() * 0.2;
        c.specks = [];
        var n = 2 + (Math.random() * 5 | 0);
        for (var i = 0; i < n; i++) {
          c.specks.push(Math.random() < 0.55 ? echo + gauss() * 1.3 : rand(FMIN, FMAX), rand(0.12, 0.5));
        }
        if (carry > 0) { c.fg = carryA; c.fgh = carryH; carry--; }
        else if (Math.random() < 0.03) {
          carry = Math.random() < 0.5 ? 1 : 2; carryA = rand(0.2, 0.5); carryH = rand(0.3, 1.2);
          c.fg = carryA; c.fgh = carryH;
        }
      }
      return c;
    }
    function prefill() {
      if (!L) return;
      S.call = targetCall(); S.cols = []; S.acc = 0; carry = 0;
      for (var i = L.n - 1; i >= 0; i--) S.cols.push(makeCol(S.t - i * L.dtCol));
    }

    /* ---------- layout ---------- */
    function resize() {
      var W = wrap.clientWidth;
      if (!W) return;
      var ar = W < 520 ? 1 : 1.65;
      wrap.style.aspectRatio = ar === 1 ? '1 / 1' : '1.65 / 1';
      var H = Math.round(W / ar), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      G = cv.getContext('2d');
      G.setTransform(dpr, 0, 0, dpr, 0, 0);
      var fh = Math.round(H * 0.3), sx = W < 520 ? 36 : 44;
      var sy = fh + 12, sw = W - sx - 10, sh = H - sy - 24;
      var n = Math.ceil(sw / COLW);
      var changed = !L || L.n !== n;
      L = { W: W, H: H, fh: fh, sx: sx, sy: sy, sw: sw, sh: sh, n: n, dtCol: WINDOW / n, ppm: W / 6.5, narrow: W < 520 };
      if (changed && S.round) prefill();
    }

    /* ---------- drawing ---------- */
    function drawBat(g, x, y, s, flap) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = pal.ink; g.globalAlpha = 0.92;
      g.beginPath(); g.ellipse(0, 0, 9, 4.2, 0, 0, TAU); g.fill();
      g.beginPath(); g.arc(8.5, -1.2, 3.6, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(7, -3.5); g.lineTo(8.2, -10); g.lineTo(10.6, -3.6); g.closePath(); g.fill();
      var tipY = -15 * flap - 1, midY = -7 * flap;
      g.beginPath(); g.moveTo(3, -2);
      g.quadraticCurveTo(-1, tipY * 0.7, -5, tipY);
      g.quadraticCurveTo(-8, midY, -14, midY + 3);
      g.quadraticCurveTo(-9, 0, -4, 1.5);
      g.closePath(); g.fill();
      g.restore();
    }
    function drawMoth(g, x, y, s) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = pal.warm; g.globalAlpha = 1;
      g.beginPath(); g.ellipse(-3, -2, 4.5, 3, -0.6, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(3, -2, 4.5, 3, 0.6, 0, TAU); g.fill();
      g.fillStyle = pal.ink; g.beginPath(); g.ellipse(0, 0, 1.2, 4, 0, 0, TAU); g.fill();
      g.restore();
    }
    function drawLayer(g, layer, par, alphaT, alphaL, fh) {
      var ppm = L.ppm;
      layer.forEach(function (tr) {
        var sx = ((tr.x - S.scroll * par) % LOOP + LOOP) % LOOP;
        var x = sx * ppm - 40;
        if (x > L.W + 40) return;
        var w = tr.w * ppm * 0.09 + 3;
        g.fillStyle = pal.muted; g.globalAlpha = alphaT;
        g.fillRect(x - w / 2, 0, w, fh);
        g.globalAlpha = alphaL;
        tr.blobs.forEach(function (b) {
          g.beginPath(); g.ellipse(x + b[0] * w * 1.6, b[1] * fh, 9 * b[2], 5.5 * b[2], 0, 0, TAU); g.fill();
        });
      });
    }
    function drawForest(g) {
      var W = L.W, fh = L.fh, t = S.t;
      g.save(); g.beginPath(); g.rect(0, 0, W, fh); g.clip();
      g.fillStyle = pal.ink; g.globalAlpha = 0.06; g.fillRect(0, 0, W, fh);
      drawLayer(g, far, 0.6, 0.22, 0.16, fh);
      var bs = Math.max(0.85, Math.min(1.4, W / 520));
      var bx = W * 0.12, by = fh * 0.45, nose = bx + 12 * bs;
      // the call spreading ahead: a faint cone and travelling wavefronts
      var reach = (W - nose) * (S.rain ? 0.55 : 1);
      g.fillStyle = pal.accent; g.globalAlpha = 0.07;
      g.beginPath(); g.moveTo(nose, by - 2); g.lineTo(W, by - fh * 0.42); g.lineTo(W, by + fh * 0.42); g.lineTo(nose, by + 2); g.fill();
      g.strokeStyle = pal.accent; g.lineWidth = 1.5;
      for (var i = 0; i < 5; i++) {
        var r = ((t * 0.35 + i / 5) % 1) * reach;
        g.globalAlpha = 0.55 * (1 - r / reach);
        g.beginPath(); g.arc(nose, by, r + 2, -0.4, 0.4); g.stroke();
      }
      drawLayer(g, near, 1, 0.42, 0.3, fh);
      // distance ticks
      g.fillStyle = pal.muted; g.globalAlpha = 0.9; g.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      for (var m = 1; m <= 4; m++) {
        var tx = nose + m * L.ppm;
        g.fillRect(tx, fh - 9, 1, 5);
        g.fillStyle = pal.panel; g.globalAlpha = 0.8; g.fillRect(tx - 12, fh - 21, 24, 12);
        g.fillStyle = pal.muted; g.globalAlpha = 1;
        g.fillText(m + ' m', tx, fh - 12);
      }
      g.fillRect(nose, fh - 5, 4 * L.ppm, 1);
      drawBat(g, bx, by, bs, reduced ? 0.6 : Math.sin(t * TAU * 2.2));
      // reveal
      var rd = S.round;
      if (S.answered) {
        g.font = '11px "IBM Plex Mono", ui-monospace, monospace'; g.textBaseline = 'middle';
        if (rd.moth) {
          var mx = nose + rd.dist * L.ppm, my = by + rd.dy * fh;
          var wob = reduced ? 1 : 0.75 + 0.25 * Math.sin(t * TAU * rd.wing / SLOW);
          drawMoth(g, mx, my, bs * wob);
          var label = 'falena · ' + rd.dist.toFixed(1).replace('.', ',') + ' m · eco ' + Math.round(2000 * rd.dist / C) + ' ms';
          var lw = g.measureText(label).width, ly = my < fh * 0.4 ? my + 16 : my - 16;
          var lx = Math.min(W - lw / 2 - 6, Math.max(lw / 2 + 6, mx));
          g.globalAlpha = 0.85; g.fillStyle = pal.panel; g.fillRect(lx - lw / 2 - 4, ly - 8, lw + 8, 16);
          g.globalAlpha = 1; g.fillStyle = pal.ink; g.textAlign = 'center'; g.fillText(label, lx, ly);
        } else {
          var txt = 'nessuna falena: solo foglie e tronchi';
          var tw = g.measureText(txt).width;
          g.globalAlpha = 0.85; g.fillStyle = pal.panel; g.fillRect(W - tw - 14, 6, tw + 8, 16);
          g.globalAlpha = 1; g.fillStyle = pal.ink; g.textAlign = 'right'; g.fillText(txt, W - 10, 14);
        }
      }
      if (S.rain) {
        g.strokeStyle = pal.muted; g.lineWidth = 1; g.globalAlpha = 0.55;
        g.beginPath();
        var nr = Math.round(W / 9);
        for (var k = 0; k < nr; k++) {
          var x = ((k * 53.7 + t * 40) % (W + 20)) - 10, y = ((k * 91.3 + t * 300) % (fh + 24)) - 12;
          g.moveTo(x, y); g.lineTo(x - 3, y + 9);
        }
        g.stroke();
      }
      g.restore();
    }
    function drawSpec(g) {
      var x0 = L.sx, y0 = L.sy, w = L.sw, h = L.sh, cols = S.cols, n = cols.length;
      function fy(f) { return y0 + (FMAX - f) / (FMAX - FMIN) * h; }
      g.globalAlpha = 0.6; g.fillStyle = pal.paper; g.fillRect(x0, y0, w, h);
      g.fillStyle = pal.rule; g.globalAlpha = 1;
      g.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      g.textBaseline = 'middle'; g.textAlign = 'right';
      for (var f = 106; f <= 114; f++) {
        g.fillStyle = pal.rule; g.fillRect(x0, Math.round(fy(f)), w, 1);
        if (f % 2 === 0) { g.fillStyle = pal.muted; g.fillText(String(f), x0 - 5, fy(f)); }
      }
      var bt = fy(REF + BAND), bb = fy(REF - BAND);
      g.fillStyle = pal.accent; g.globalAlpha = 0.14; g.fillRect(x0, bt, w, bb - bt);
      g.globalAlpha = 0.6; g.strokeStyle = pal.accent; g.lineWidth = 1; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(x0, Math.round(fy(REF)) + 0.5); g.lineTo(x0 + w, Math.round(fy(REF)) + 0.5); g.stroke();
      g.setLineDash([]);

      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
      var i, c, x;
      // call sent
      g.fillStyle = pal.muted; g.globalAlpha = 0.65;
      for (i = 0; i < n; i++) { c = cols[i]; g.fillRect(x0 + w - (n - i) * COLW, fy(c.call) - 1, COLW, 2); }
      // rain speckle
      if (S.rain) {
        g.fillStyle = pal.muted;
        for (i = 0; i < n; i++) {
          c = cols[i]; if (!c.specks) continue; x = x0 + w - (n - i) * COLW;
          for (var k = 0; k < c.specks.length; k += 2) { g.globalAlpha = c.specks[k + 1]; g.fillRect(x, fy(c.specks[k]) - 1, 2, 2); }
        }
      }
      // echo heard: blurred outside the sharp band, smeared in rain
      g.fillStyle = pal.ink;
      for (i = 0; i < n; i++) {
        c = cols[i]; x = x0 + w - (n - i) * COLW;
        var th = 2 + 7 * (1 - c.band) + (S.rain ? 3 : 0);
        g.globalAlpha = Math.min(1, (0.28 + 0.67 * c.band) * (S.rain ? 0.75 : 1) * c.amp);
        g.fillRect(x, fy(c.echo + c.jit + c.fm) - th / 2, COLW, th);
      }
      // glints: real ones from the wingbeat, false ones from raindrops
      g.fillStyle = pal.warm;
      for (i = 0; i < n; i++) {
        c = cols[i]; x = x0 + w - (n - i) * COLW;
        var gl = c.glint > c.fg ? c.glint : c.fg, gh = c.glint > c.fg ? c.gh : c.fgh;
        if (gl < 0.015) continue;
        var e = c.echo + c.jit;
        g.globalAlpha = Math.min(1, gl * 1.1); g.fillRect(x, fy(e + gh), COLW, fy(e - gh) - fy(e + gh));
        g.globalAlpha = Math.min(1, gl * 1.6); g.fillRect(x, fy(e + gh * 0.35), COLW, fy(e - gh * 0.35) - fy(e + gh * 0.35));
      }
      g.restore();

      // labels
      var first = cols[0], last = cols[n - 1];
      g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      if (first) {
        var ey = fy(first.echo) - 8 - 3.5 * (1 - first.band), cy = fy(first.call) + 14;
        if (Math.abs(first.echo - first.call) < 0.4) cy = Math.max(cy, fy(first.echo) + 16);
        var et = first.band < 0.6 ? 'eco sentita · sfocata' : 'eco sentita', etw = g.measureText(et).width;
        g.fillStyle = pal.panel; g.globalAlpha = 0.85; g.fillRect(x0 + 3, ey - 11, etw + 6, 13);
        g.fillStyle = pal.ink; g.globalAlpha = 1; g.fillText(et, x0 + 6, ey);
        g.fillStyle = pal.muted; g.fillText('richiamo emesso', x0 + 6, cy);
      }
      g.textAlign = 'right';
      var shw = g.measureText('udito più fine').width;
      g.fillStyle = pal.panel; g.globalAlpha = 0.85; g.fillRect(x0 + w - shw - 9, bt - 15, shw + 6, 13);
      g.fillStyle = pal.accent; g.globalAlpha = 1;
      g.fillText('udito più fine', x0 + w - 6, bt - 4);
      g.fillStyle = pal.muted;
      g.fillText('tempo →', x0 + w, y0 + h + 16);
      g.textAlign = 'left';
      g.fillText('kHz', 4, y0 + h + 16);
      if (last) {
        g.fillStyle = pal.ink;
        g.fillText('richiamo ' + last.call.toFixed(1).replace('.', ',') + ' → eco ' + currentEcho().toFixed(1).replace('.', ','), x0, y0 + h + 16);
      }
    }
    function draw() {
      if (!L || !G) return;
      G.clearRect(0, 0, L.W, L.H);
      drawForest(G);
      drawSpec(G);
      G.globalAlpha = 1;
    }

    /* ---------- animation ---------- */
    function frame(now) {
      var dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000));
      S.last = now;
      S.call += (targetCall() - S.call) * (1 - Math.exp(-dt / 0.3));
      S.t += dt; S.scroll += S.speed * dt;
      if (L) {
        S.acc += dt / L.dtCol;
        while (S.acc >= 1) { S.acc -= 1; S.cols.push(makeCol(S.t - S.acc * L.dtCol)); }
        if (S.cols.length > L.n) S.cols.splice(0, S.cols.length - L.n);
      }
      setAudio();
      draw();
      S.raf = requestAnimationFrame(frame);
    }
    function startLoop() {
      if (S.raf || reduced) return;
      S.last = performance.now();
      S.raf = requestAnimationFrame(frame);
    }
    function stopLoop() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }

    /* ---------- sound ---------- */
    function startAudio() {
      var ac = ctx.audio();
      if (!ac) { btnListen.hidden = true; noSound.hidden = false; return; }
      try {
        var now = ac.currentTime, hz = currentEcho() * 1000 / DIV;
        var a = { ac: ac, nodes: [], last: {} };
        function gain(v) { var gn = ac.createGain(); gn.gain.value = v; return gn; }
        a.master = gain(0); a.master.connect(ac.destination);
        // clutter: the steady echo, plus a fainter, later copy from the trees further away
        a.osc = ac.createOscillator(); a.osc.type = 'sine'; a.osc.frequency.value = hz;
        a.clutter = gain(0.5); a.osc.connect(a.clutter); a.clutter.connect(a.master);
        var dly = ac.createDelay(0.1); dly.delayTime.value = 0.012;
        var g2 = gain(0.22); a.osc.connect(dly); dly.connect(g2); g2.connect(a.master);
        // moth: the same note, pulsed and wobbled once per (slowed) wingbeat
        a.mosc = ac.createOscillator(); a.mosc.type = 'sine'; a.mosc.frequency.value = hz;
        a.mvca = gain(0); a.mosc.connect(a.mvca); a.mvca.connect(a.master);
        a.lfo = ac.createOscillator();
        a.lfo.setPeriodicWave(ac.createPeriodicWave(new Float32Array([0, 1, 0.8, 0.55, 0.3, 0.12]), new Float32Array(6)));
        a.lfo.frequency.value = S.round.wing / SLOW;
        a.am = gain(0); a.fm = gain(0);
        a.lfo.connect(a.am); a.am.connect(a.mvca.gain);
        a.lfo.connect(a.fm); a.fm.connect(a.mosc.frequency);
        // rain: band-passed noise
        var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        a.noise = ac.createBufferSource(); a.noise.buffer = buf; a.noise.loop = true;
        var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = REF * 1000 / DIV; bp.Q.value = 0.7;
        a.rain = gain(0); a.noise.connect(bp); bp.connect(a.rain); a.rain.connect(a.master);
        a.nodes = [a.osc, a.mosc, a.lfo, a.noise];
        a.nodes.forEach(function (o) { o.start(now); });
        a.master.gain.setTargetAtTime(0.09, now, 0.08);
        A = a;
        setAudio(true);
        btnListen.textContent = 'Ferma'; btnListen.setAttribute('aria-pressed', 'true');
      } catch (err) {
        btnListen.hidden = true; noSound.hidden = false; A = null;
      }
    }
    function stopAudio() {
      var a = A; A = null;
      btnListen.textContent = 'Ascolta'; btnListen.setAttribute('aria-pressed', 'false');
      if (!a) return;
      try {
        var now = a.ac.currentTime;
        a.master.gain.cancelScheduledValues(now);
        a.master.gain.setValueAtTime(a.master.gain.value, now);
        a.master.gain.setTargetAtTime(0, now, 0.04);
      } catch (e) { /* ignore */ }
      setTimeout(function () {
        a.nodes.forEach(function (o) { try { o.stop(); } catch (e) { /* already stopped */ } });
        try { a.master.disconnect(); } catch (e) { /* ignore */ }
      }, 400);
    }
    function setP(param, key, v, tol, force) {
      if (!force && A.last[key] != null && Math.abs(A.last[key] - v) < tol) return;
      A.last[key] = v;
      param.setTargetAtTime(v, A.ac.currentTime, 0.05);
    }
    function setAudio(force) {
      if (!A) return;
      var echo = currentEcho(), hz = echo * 1000 / DIV, vis = mothVis(bandFactor(echo));
      var m = 0.6 * vis;
      setP(A.osc.frequency, 'f', hz, 0.05, force);
      setP(A.mosc.frequency, 'mf', hz, 0.05, force);
      setP(A.mvca.gain, 'base', m * 0.5, 0.003, force);
      setP(A.am.gain, 'am', m * 0.5, 0.003, force);
      setP(A.fm.gain, 'fm', vis * 22, 0.2, force);
      setP(A.lfo.frequency, 'lfo', S.round.wing / SLOW, 0.01, force);
      setP(A.rain.gain, 'rain', S.rain ? 0.45 : 0, 0.01, force);
      setP(A.clutter.gain, 'cl', S.rain ? 0.35 : 0.5, 0.01, force);
    }

    /* ---------- game ---------- */
    function updScore() {
      scoreOut.value = 'Turno ' + S.roundNo + ' di ' + ROUNDS + ' · ' + S.score + ' giusti';
      scoreOut.textContent = scoreOut.value;
    }
    function newRound() {
      S.round = {
        moth: Math.random() < 0.5, strength: rand(0.4, 0.95), wing: rand(35, 70),
        phase: Math.random(), dist: rand(1.2, 4.4), dy: rand(-0.2, 0.2)
      };
      S.answered = false;
      btnMoth.disabled = false; btnLeaves.disabled = false; btnNext.hidden = true;
      result.textContent = ''; result.className = 'result';
      updScore(); prefill(); setAudio(); draw();
    }
    function answer(saidMoth) {
      if (S.answered) return;
      S.answered = true;
      var r = S.round, ok = saidMoth === r.moth, band = bandFactor(currentEcho()), msg;
      if (ok) S.score++;
      var where = ' Era ' + r.dist.toFixed(1).replace('.', ',') + ' m più avanti, così la sua eco è tornata dopo ' + Math.round(2000 * r.dist / C) +
        ' ms. Le sue ali battevano circa ' + Math.round(r.wing) + ' volte al secondo (qui rallentate).';
      if (r.moth && ok) msg = 'Presa.' + where;
      else if (r.moth) {
        msg = 'C’era una falena, ed è scappata.' + where;
        if (band < 0.6) msg += S.comp ? ' Il suo tremolio cadeva fuori dal tuo udito più fine.' : ' Senza compensazione, la sua eco è scivolata fuori dal tuo udito più fine.';
        else if (S.rain) msg += ' La pioggia ha nascosto il suo tremolio.';
        else msg += r.strength < 0.6 ? ' Stavolta il suo tremolio era debole.' : ' Cerca strisce che si ripetono a ritmo regolare.';
      } else if (ok) msg = 'Giusto: solo foglie e tronchi, ogni eco ferma.';
      else msg = 'Solo foglie. Hai addentato un rametto.' + (S.rain ? ' Anche la pioggia fa scintillare l’eco, ma non a ritmo.' : '');
      if (S.roundNo >= ROUNDS) {
        msg += ' Notte finita: ' + S.score + ' su ' + ROUNDS + '.' + (S.everOff ? '' : ' La prossima notte, prova a spegnere la compensazione alla massima velocità.');
        btnNext.textContent = 'Nuova notte';
      } else btnNext.textContent = 'Prossimo turno';
      result.textContent = msg;
      result.className = 'result ' + (ok ? 'good' : 'miss');
      btnNext.hidden = false;
      btnNext.focus();
      btnMoth.disabled = true; btnLeaves.disabled = true;
      updScore(); draw();
    }

    /* ---------- events ---------- */
    function changed() {
      if (reduced) { prefill(); draw(); }
      setAudio();
    }
    btnListen.addEventListener('click', function () { if (A) stopAudio(); else startAudio(); });
    btnComp.addEventListener('click', function () {
      S.comp = !S.comp;
      if (!S.comp) S.everOff = true;
      btnComp.textContent = 'Compensazione Doppler: ' + (S.comp ? 'attiva' : 'spenta');
      btnComp.setAttribute('aria-pressed', String(S.comp));
      changed();
    });
    btnRain.addEventListener('click', function () {
      S.rain = !S.rain;
      btnRain.setAttribute('aria-pressed', String(S.rain));
      changed();
    });
    spd.addEventListener('input', function () {
      S.speed = +spd.value;
      spdOut.value = S.speed.toFixed(1).replace('.', ',') + ' m/s';
      spdOut.textContent = spdOut.value;
      changed();
    });
    btnMoth.addEventListener('click', function () { answer(true); });
    btnLeaves.addEventListener('click', function () { answer(false); });
    btnNext.addEventListener('click', function () {
      if (S.roundNo >= ROUNDS) { S.roundNo = 1; S.score = 0; } else S.roundNo++;
      newRound();
      btnMoth.focus();
    });

    readPal();
    resize();
    newRound();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { var w = L && L.W; resize(); if (!L || L.W !== w || !S.raf) draw(); }).observe(wrap);
    } else window.addEventListener('resize', function () { resize(); draw(); });
    ctx.onThemeChange(function () { readPal(); draw(); });
    ctx.visible(function (v) {
      if (v) startLoop();
      else { stopLoop(); if (A) stopAudio(); }
    });
    startLoop();
  }

  window.MINDS = window.MINDS || {};
  window.MINDS.bat = { mount: mount };
})();
