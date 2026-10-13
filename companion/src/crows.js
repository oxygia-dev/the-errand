/* The crows: "We know the faces." Face memory, and how a roost passes it on. */
(function () {
  window.MINDS = window.MINDS || {};
  // Human skin and hair tones are natural colours, not theme colours; everything else comes from ctx.color().
  var SKIN = ['#f3d7c2', '#e7bf9d', '#d4a27c', '#bb845c', '#986444', '#764c31', '#573624'];
  var HAIR = ['#1e1a17', '#3b2a1f', '#6b4428', '#9a5a2e', '#c9a46c', '#8e8c87', '#d9d5cd'];
  var HAIRN = ['black', 'dark brown', 'brown', 'auburn', 'fair', 'grey', 'white'];
  var STYLEN = ['short', 'side-parted', 'long', 'curly', 'tied-up', 'balding', 'bobbed'];
  var HATN = ['', 'a flat cap', 'a brimmed hat', 'a knitted hat', 'a headscarf'];
  var HEADS = [[26, 33, 0.42], [28.5, 30.5, 0.56], [24, 35, 0.36], [27.5, 32, 0.8]]; // rx, ry, jaw
  var EYES = [[9.5, 2.3], [11, 2.6], [12.5, 2.2]]; // spacing, size
  var CORE = ['head', 'skin', 'hairStyle', 'hairColor', 'brows', 'eyes', 'nose', 'mouth', 'glasses', 'beard'];
  var NV = { head: 4, skin: 7, hairStyle: 7, hairColor: 7, brows: 3, eyes: 3, nose: 3, mouth: 3, glasses: 3, beard: 4 };
  var STEP = 5.5, TAU = Math.PI * 2;
  var LEARN = [
    { role: 'danger', text: 'This face caught you in a net and put a ring on your leg. Danger.' },
    { role: 'gives', text: 'This face leaves crusts on the wall behind the houses. Gives.' },
    { role: 'neither', text: 'This face walks the road every morning and does nothing to you. Neither.' }
  ];
  var S = '.stage[data-mind="crows"] ';
  var CSS = [
    S + '.canvas-wrap { aspect-ratio: 10 / 7; }',
    '@media (max-width: 560px) { ' + S + '.canvas-wrap { aspect-ratio: 4 / 5; } }',
    S + '.crow-step { display: block; font: 500 .72rem var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--accent); margin-bottom: .25rem; }',
    S + '.crow-hits { position: absolute; inset: 0; }',
    S + '.crow-hit { position: absolute; margin: 0; padding: 0; border: 0; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }',
    S + '.crow-hit:hover { box-shadow: inset 0 0 0 2px var(--rule); }',
    S + '.crow-hit:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }',
    S + '.crow-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }',
    S + '.btn[hidden], ' + S + '.readout[hidden] { display: none; }'
  ].join('\n');
  function ri(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[ri(a.length)]; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function clone(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = ri(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function parse(c) {
    c = String(c || '').trim();
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    }
    var m = c.match(/[\d.]+/g);
    return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function mix(a, b, t) {
    var A = parse(a), B = parse(b);
    return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(',') + ')';
  }
  function lum(c) { var p = parse(c); return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]; }
  // ---- Faces -------------------------------------------------------------
  function newFace(hatMax) {
    var f = {};
    CORE.forEach(function (k) { f[k] = ri(NV[k]); });
    f.glasses = Math.random() < 0.5 ? 0 : 1 + ri(2);
    f.beard = Math.random() < 0.62 ? 0 : 1 + ri(3);
    f.hat = Math.random() < 0.45 ? 0 : 1 + ri(hatMax == null ? 4 : hatMax);
    if (f.hat === 4) f.beard = 0;
    f.hatTone = ri(4); f.coat = ri(4); f.earring = !f.beard && Math.random() < 0.3; f.turn = 0; f.tilt = 0;
    return f;
  }
  // Count the core features that differ and can actually be seen (a headscarf hides hair, a knitted hat its style).
  function visDiff(a, b) {
    var n = 0, scarf = a.hat === 4 || b.hat === 4, beanie = a.hat === 3 || b.hat === 3;
    CORE.forEach(function (k) {
      if (a[k] === b[k]) return;
      if (scarf && (k === 'hairStyle' || k === 'hairColor')) return;
      if (beanie && k === 'hairStyle') return;
      n++;
    });
    return n;
  }
  function stranger(target, others, minD, hatMax) {
    var f;
    for (var i = 0; i < 300; i++) {
      f = newFace(hatMax);
      if ((!target || visDiff(f, target) >= minD) && others.every(function (o) { return visDiff(f, o) >= 2; })) return f;
    }
    return f;
  }
  function lookalike(target, k) {
    var f;
    for (var i = 0; i < 60; i++) {
      f = clone(target); f.turn = 0; f.tilt = 0;
      shuffle(CORE.slice()).slice(0, k).forEach(function (key) { f[key] = (f[key] + 1 + ri(NV[key] - 1)) % NV[key]; });
      f.hat = ri(3); f.hatTone = ri(4); f.coat = ri(4); if (f.beard) f.earring = false;
      if (visDiff(f, target) >= k) return f;
    }
    return f;
  }
  // The same person on another day: different hat or coat, later a slight turn of the head. Core features stay.
  function variant(t, season) {
    var f = clone(t);
    if (season >= 3 || (season === 2 && Math.random() < 0.6)) {
      f.hat = pick([0, 1, 2, 3].filter(function (h) { return h !== t.hat; })); f.hatTone = ri(4);
    }
    if (season >= 3) { f.turn = (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.15); f.tilt = (Math.random() - 0.5) * 0.12; }
    f.coat = ri(4);
    return f;
  }
  function describe(f) {
    var p = [];
    if (f.hat === 4) p.push('a headscarf');
    else if (f.hairStyle === 5) p.push(HAIRN[f.hairColor] + ' hair, balding');
    else p.push(HAIRN[f.hairColor] + ' ' + STYLEN[f.hairStyle] + ' hair');
    if (f.glasses) p.push(['', 'round glasses', 'square glasses'][f.glasses]);
    if (f.beard) p.push(['', 'a moustache', 'a beard', 'a small beard'][f.beard]);
    if (f.hat && f.hat < 4) p.push(HATN[f.hat]);
    return p.join(', ');
  }
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function arch(c, x, y, w, h) {
    var r = Math.min(w, h) * 0.45;
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h); c.closePath();
  }
  function headPath(c, rx, ry, jaw) {
    c.beginPath(); c.moveTo(-rx, 0);
    c.bezierCurveTo(-rx, -ry * 1.33, rx, -ry * 1.33, rx, 0);
    c.bezierCurveTo(rx, ry * 0.62, rx * jaw, ry, 0, ry);
    c.bezierCurveTo(-rx * jaw, ry, -rx, ry * 0.62, -rx, 0);
    c.closePath();
  }
  function hairFront(c, s, rx, ry) {
    var R = rx + 1.6, T = ry + 2, sideY = s === 2 ? 8 : s === 6 ? 4 : -3, h;
    c.beginPath(); c.moveTo(-R, sideY); c.bezierCurveTo(-R, -T * 1.36, R, -T * 1.36, R, sideY);
    if (s === 1) {
      c.lineTo(rx - 1.5, -4); c.quadraticCurveTo(rx * 0.95, -ry * 0.62, rx * 0.3, -ry * 0.66);
      c.quadraticCurveTo(-rx * 0.45, -ry * 0.62, -rx * 0.85, -ry * 0.2); c.lineTo(-rx + 1.5, -3);
    } else if (s === 2) {
      c.lineTo(rx - 1, 8); c.quadraticCurveTo(rx * 0.75, -ry * 0.45, 0, -ry * 0.72); c.quadraticCurveTo(-rx * 0.75, -ry * 0.45, -rx + 1, 8);
    } else if (s === 6) {
      c.lineTo(rx - 1, 4); c.lineTo(rx * 0.84, -ry * 0.42); c.quadraticCurveTo(0, -ry * 0.34, -rx * 0.84, -ry * 0.42); c.lineTo(-rx + 1, 4);
    } else if (s === 3) {
      var n = 7, px = rx - 1, py = -3;
      c.lineTo(px, py);
      for (var i = 1; i <= n; i++) {
        var a = Math.PI * i / n, qx = (rx - 1) * Math.cos(a), qy = -3 - ry * 0.5 * Math.sin(a);
        var mx = (px + qx) / 2, my = (py + qy) / 2, d = Math.hypot(mx, my - 2) || 1;
        c.quadraticCurveTo(mx - mx / d * 4, my - (my - 2) / d * 4, qx, qy); px = qx; py = qy;
      }
    } else {
      h = s === 4 ? 0.68 : 0.58;
      c.lineTo(rx - 1.5, -4); c.quadraticCurveTo(rx * 0.85, -ry * h, 0, -ry * h); c.quadraticCurveTo(-rx * 0.85, -ry * h, -rx + 1.5, -4);
    }
    c.closePath();
  }
  // Draws a face with its head centre at (x, y); u is pixels per face unit (a head is about 55 units wide).
  function drawFace(c, f, x, y, u, P) {
    var hd = HEADS[f.head], rx = hd[0], ry = hd[1], jaw = hd[2];
    var skin = SKIN[f.skin], hair = HAIR[f.hairColor], skinD = mix(skin, P.deep, 0.14), line = mix(skin, P.deep, 0.55);
    var tx = (f.turn || 0) * 9, sc = f.hat === 4, hatC = P.hat[f.hatTone], hatD = mix(hatC, P.deep, 0.3);
    var sp = EYES[f.eyes][0], er = EYES[f.eyes][1], side, i, a;
    c.save(); c.translate(x, y); c.scale(u, u); c.rotate(f.tilt || 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = P.coat[f.coat];
    c.beginPath(); c.moveTo(-46, 76); c.bezierCurveTo(-46, 44, -30, 34, 0, 34); c.bezierCurveTo(30, 34, 46, 44, 46, 76); c.closePath(); c.fill();
    c.fillStyle = skinD; c.fillRect(-8, ry - 12, 16, 48 - ry);
    c.beginPath(); c.moveTo(-8, 34); c.lineTo(0, 43); c.lineTo(8, 34); c.fill();
    // back layers: headscarf, long hair, bob, curls, bun
    if (sc) {
      c.fillStyle = hatC; c.beginPath(); c.ellipse(0, -2, rx + 5.5, ry + 5, 0, Math.PI, TAU);
      c.lineTo(rx + 5.5, ry * 0.7); c.quadraticCurveTo(rx * 0.6, ry + 9, 0, ry + 9); c.quadraticCurveTo(-rx * 0.6, ry + 9, -rx - 5.5, ry * 0.7);
      c.closePath(); c.fill();
    } else {
      c.fillStyle = hair;
      if (f.hairStyle === 2) {
        c.beginPath(); c.ellipse(0, -3, rx + 5, ry + 4, 0, Math.PI, TAU); c.lineTo(rx + 6, ry + 14);
        c.quadraticCurveTo(0, ry + 20, -rx - 6, ry + 14); c.closePath(); c.fill();
      } else if (f.hairStyle === 6) {
        c.beginPath(); c.ellipse(0, -3, rx + 5, ry + 3.5, 0, Math.PI, TAU); c.lineTo(rx + 5, ry * 0.55);
        c.quadraticCurveTo(rx + 5, ry * 0.78, rx + 1, ry * 0.78); c.lineTo(-rx - 1, ry * 0.78);
        c.quadraticCurveTo(-rx - 5, ry * 0.78, -rx - 5, ry * 0.55); c.closePath(); c.fill();
      } else if (f.hairStyle === 3) {
        c.beginPath(); c.ellipse(0, -5, rx + 4, ry + 2, 0, 0, TAU); c.fill();
        for (i = 0; i < 15; i++) {
          a = Math.PI * (0.88 + i * 1.24 / 14);
          if (f.hat && Math.sin(a) < -0.5) continue;
          c.beginPath(); c.arc(Math.cos(a) * (rx + 5), -5 + Math.sin(a) * (ry + 3), 7, 0, TAU); c.fill();
        }
      } else if (f.hairStyle === 4 && !f.hat) {
        c.beginPath(); c.arc(0, -ry - 5, 8.5, 0, TAU); c.fill();
      }
      for (side = -1; side <= 1; side += 2) {
        c.fillStyle = skin; c.strokeStyle = mix(skin, P.deep, 0.3); c.lineWidth = 0.8;
        c.beginPath(); c.ellipse(side * rx, 1, 4, 6.5, 0, 0, TAU); c.fill(); c.stroke();
        if (f.earring) { c.fillStyle = P.warm; c.beginPath(); c.arc(side * rx, 8.6, 1.7, 0, TAU); c.fill(); }
      }
    }
    headPath(c, rx, ry, jaw); c.fillStyle = skin; c.fill(); c.strokeStyle = mix(skin, P.deep, 0.3); c.lineWidth = 1; c.stroke();
    // beard
    c.fillStyle = hair;
    if (f.beard === 2) {
      c.beginPath(); c.moveTo(-rx + 0.5, -3);
      c.bezierCurveTo(-rx + 0.5, ry * 0.7, -rx * jaw - 2, ry + 3, 0, ry + 3); c.bezierCurveTo(rx * jaw + 2, ry + 3, rx - 0.5, ry * 0.7, rx - 0.5, -3);
      c.lineTo(rx - 4, -3); c.quadraticCurveTo(rx - 3, 10, tx + 7, 11); c.quadraticCurveTo(tx, 9.5, tx - 7, 11);
      c.quadraticCurveTo(-rx + 3, 10, -rx + 4, -3); c.closePath(); c.fill();
    } else if (f.beard === 3) { c.beginPath(); c.ellipse(tx, ry - 5, 6, 6.5, 0, 0, TAU); c.fill(); }
    // eyes
    for (side = -1; side <= 1; side += 2) {
      c.fillStyle = mix(P.deep, '#000000', 0.3); c.beginPath(); c.ellipse(tx + side * sp, -1, er * 0.9, er * 1.15, 0, 0, TAU); c.fill();
      c.fillStyle = mix(skin, '#ffffff', 0.8); c.beginPath(); c.arc(tx + side * sp + er * 0.3, -1 - er * 0.4, er * 0.3, 0, TAU); c.fill();
    }
    // nose
    c.strokeStyle = mix(skin, P.deep, 0.34); c.lineWidth = 1.4; c.beginPath();
    if (f.nose === 0) { c.moveTo(tx + 0.5, 1); c.quadraticCurveTo(tx + 3.6, 7.5, tx + 0.2, 8.6); }
    else if (f.nose === 1) { c.arc(tx, 6.4, 3.4, 0.15 * Math.PI, 0.85 * Math.PI); }
    else { c.moveTo(tx - 0.5, -4); c.lineTo(tx + 3.2, 9); c.lineTo(tx - 1.6, 9.6); }
    c.stroke();
    // mouth
    c.strokeStyle = line; c.lineWidth = 1.6;
    if (f.beard === 2) { c.fillStyle = mix(skin, P.accent, 0.25); c.beginPath(); c.ellipse(tx, 16.5, 5, 2.2, 0, 0, TAU); c.fill(); }
    c.beginPath();
    if (f.mouth === 0) { c.arc(tx, 11.5, 6.5, 0.22 * Math.PI, 0.78 * Math.PI); c.stroke(); }
    else if (f.mouth === 1) { c.moveTo(tx - 6, 16.4); c.quadraticCurveTo(tx, 18.6, tx + 6, 16.4); c.stroke(); }
    else { c.moveTo(tx - 6.5, 15); c.quadraticCurveTo(tx, 23, tx + 6.5, 15); c.closePath(); c.fillStyle = mix(skinD, P.deep, 0.45); c.fill(); }
    if (f.beard) {
      c.fillStyle = hair; c.beginPath(); c.moveTo(tx - 8, 12.6); c.quadraticCurveTo(tx - 4, 8.4, tx, 10.2);
      c.quadraticCurveTo(tx + 4, 8.4, tx + 8, 12.6); c.quadraticCurveTo(tx, 11.6, tx - 8, 12.6); c.fill();
    }
    // glasses
    if (f.glasses) {
      var lr = f.glasses === 1 ? 5.8 : 6.5;
      c.strokeStyle = P.frame; c.lineWidth = 1.5;
      for (side = -1; side <= 1; side += 2) {
        if (f.glasses === 1) { c.beginPath(); c.arc(tx + side * sp, -1, lr, 0, TAU); c.stroke(); }
        else { rrect(c, tx + side * sp - lr, -5.6, lr * 2, 9.4, 2.4); c.stroke(); }
        c.beginPath(); c.moveTo(tx + side * (sp + lr), -2); c.lineTo(side * (rx - 0.5), -3); c.stroke();
      }
      c.beginPath(); c.moveTo(tx - sp + lr, -2); c.quadraticCurveTo(tx, -4.5, tx + sp - lr, -2); c.stroke();
    }
    // hair front
    if (!sc) {
      c.fillStyle = hair;
      if (f.hairStyle === 5) {
        for (side = -1; side <= 1; side += 2) { c.beginPath(); c.ellipse(side * (rx - 0.5), -5, 3.6, 9, side * 0.15, 0, TAU); c.fill(); }
      } else { hairFront(c, f.hairStyle, rx, ry); c.fill(); }
    }
    // brows
    c.strokeStyle = f.hairColor >= 4 ? mix(hair, P.deep, 0.35) : hair;
    for (side = -1; side <= 1; side += 2) {
      var bx = tx + side * sp; c.beginPath();
      if (f.brows === 0) { c.lineWidth = 1.6; c.moveTo(bx - side * 4.5, -8.6); c.quadraticCurveTo(bx, -12.6, bx + side * 4.5, -9.2); }
      else if (f.brows === 1) { c.lineWidth = 3; c.moveTo(bx - side * 5, -10); c.lineTo(bx + side * 4.6, -10.4); }
      else { c.lineWidth = 2.2; c.moveTo(bx - side * 4.5, -11.6); c.quadraticCurveTo(bx, -11, bx + side * 4.6, -8.8); }
      c.stroke();
    }
    // hats
    c.fillStyle = hatC;
    if (sc) {
      c.beginPath(); c.moveTo(-rx - 5.5, 2); c.bezierCurveTo(-rx - 5.5, -(ry + 5) * 1.33, rx + 5.5, -(ry + 5) * 1.33, rx + 5.5, 2);
      c.lineTo(rx - 1, 2); c.quadraticCurveTo(rx * 0.85, -ry * 0.5, 0, -ry * 0.5); c.quadraticCurveTo(-rx * 0.85, -ry * 0.5, -rx + 1, 2);
      c.closePath(); c.fill();
      c.fillStyle = hatD; c.beginPath(); c.moveTo(-4, ry + 6); c.lineTo(4, ry + 6); c.lineTo(0, ry + 13); c.closePath(); c.fill();
    } else if (f.hat === 1) {
      var yc = -ry * 0.5;
      c.beginPath(); c.moveTo(-rx - 2.5, yc); c.bezierCurveTo(-rx - 3, -ry * 1.35, rx + 3, -ry * 1.35, rx + 2.5, yc);
      c.quadraticCurveTo(0, yc - 3, -rx - 2.5, yc); c.fill();
      c.fillStyle = hatD; c.beginPath(); c.ellipse(tx * 0.5, yc - 1, rx * 0.78, 3, 0, 0, Math.PI); c.fill();
    } else if (f.hat === 2) {
      var yb = -ry * 0.78;
      rrect(c, -rx * 0.8, -ry - 15, rx * 1.6, yb + ry + 16, 6); c.fill();
      c.fillStyle = P.hatBand; c.fillRect(-rx * 0.8, yb - 4.5, rx * 1.6, 4);
      c.fillStyle = hatD; c.beginPath(); c.ellipse(0, yb, rx + 13, 4.8, 0, 0, TAU); c.fill();
    } else if (f.hat === 3) {
      var yk = -ry * 0.45;
      c.beginPath(); c.moveTo(-rx - 2.5, yk); c.bezierCurveTo(-rx - 3, -ry * 1.58, rx + 3, -ry * 1.58, rx + 2.5, yk); c.closePath(); c.fill();
      c.fillStyle = hatD; rrect(c, -rx - 3, yk - 7.5, rx * 2 + 6, 8, 3); c.fill();
    }
    c.restore();
  }
  // Hooded crow, unit length about 4, facing +x when dir is 1: grey mantle, black hood, wings and tail.
  function drawCrow(c, x, y, s, dir, P, fly, flap, caw) {
    c.save(); c.translate(x, y); c.scale(dir * s, s);
    c.fillStyle = P.crowBlack; c.strokeStyle = P.crowBlack; c.lineWidth = 0.14;
    var bx, by;
    if (fly) {
      c.beginPath(); c.moveTo(0.4, -0.1); c.quadraticCurveTo(0, -1.2 * flap, -0.9, -1.9 * flap); c.lineTo(-0.5, 0); c.fill();
      c.beginPath(); c.moveTo(-1, 0); c.lineTo(-2, -0.35); c.lineTo(-2, 0.4); c.closePath(); c.fill();
      c.fillStyle = P.crowGrey; c.beginPath(); c.ellipse(0, 0, 1.2, 0.48, 0, 0, TAU); c.fill();
      c.fillStyle = P.crowBlack; c.beginPath(); c.arc(1.1, -0.1, 0.45, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(1.45, -0.25); c.lineTo(2.05, -0.02); c.lineTo(1.45, 0.1); c.fill();
      c.beginPath(); c.moveTo(0.6, -0.1); c.quadraticCurveTo(0.2, -1.4 * flap, -0.5, -2.2 * flap); c.lineTo(-0.3, 0); c.fill();
      bx = 2.05; by = -0.02;
    } else {
      c.beginPath(); c.moveTo(-0.9, 0.1); c.lineTo(-2.1, 0.75); c.lineTo(-1.9, 0.98); c.lineTo(-0.7, 0.45); c.fill();
      c.fillStyle = P.crowGrey; c.beginPath(); c.ellipse(0, 0, 1.15, 0.72, -0.25, 0, TAU); c.fill();
      c.fillStyle = P.crowBlack; c.beginPath(); c.ellipse(-0.3, 0.05, 0.95, 0.48, -0.2, 0, TAU); c.fill();
      c.beginPath(); c.arc(0.95, -0.55, 0.48, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(1.3, -0.7); c.lineTo(1.88, -0.5); c.lineTo(1.3, -0.38); c.fill();
      c.beginPath(); c.moveTo(0.1, 0.6); c.lineTo(0.1, 1.05); c.stroke();
      bx = 1.88; by = -0.5;
    }
    if (caw) {
      c.strokeStyle = P.accent; c.lineWidth = 0.2;
      for (var k = -1; k <= 1; k++) {
        var a = k * 0.55 - (fly ? 0 : 0.3);
        c.beginPath(); c.moveTo(bx + Math.cos(a) * 0.45, by + Math.sin(a) * 0.45); c.lineTo(bx + Math.cos(a) * 1.3, by + Math.sin(a) * 1.3); c.stroke();
      }
    }
    c.restore();
  }
  function cawMarks(c, x, y, ang, len, color) {
    c.strokeStyle = color; c.lineWidth = Math.max(1.6, len * 0.16); c.lineCap = 'round';
    for (var k = -1; k <= 1; k++) {
      var a = ang + k * 0.5;
      c.beginPath(); c.moveTo(x + Math.cos(a) * len * 0.3, y + Math.sin(a) * len * 0.3); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
    }
  }
  window.MINDS.crows = {
    mount: function (stage, ctx) {
      var reduced = !!ctx.reducedMotion;
      var style = document.createElement('style');
      style.textContent = CSS;
      stage.appendChild(style);
      function el(tag, cls, html, parent) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        (parent || stage).appendChild(e);
        return e;
      }
      var lede = el('p', 'lede');
      var wrap = el('div', 'canvas-wrap');
      var cv = el('canvas', null, null, wrap);
      cv.setAttribute('aria-hidden', 'true');
      var hits = el('div', 'crow-hits', null, wrap);
      hits.setAttribute('role', 'group'); hits.setAttribute('aria-label', 'Faces in the street');
      var controls = el('div', 'controls');
      var primary = el('button', 'btn primary', 'Next', controls); primary.type = 'button';
      var again = el('button', 'btn', 'Start again', controls); again.type = 'button';
      var readout = el('output', 'readout', null, controls);
      var result = el('p', 'result'); result.setAttribute('aria-live', 'polite');
      el('div', 'known', '<h4>What is known</h4>' +
        '<p>At the University of Washington, researchers wearing one particular rubber mask trapped and ringed seven wild American crows, then let them go. Afterwards, crows scolded and mobbed anyone wearing that mask, and mostly ignored a neutral one (Marzluff and colleagues, 2010).</p>' +
        '<p>The memory lasted. Five years on, crows were still scolding the dangerous mask, and more of them were doing it than at the start.</p>' +
        '<p>It spread by watching. Crows that had never been trapped, including young birds hatched later, learned to scold the mask by seeing others do it, and the scolding reached birds about 1.2 km away (Cornell and colleagues, 2012).</p>' +
        '<p>Brain scans of crows looking at the dangerous face showed activity in regions linked to fear and learning (Marzluff and colleagues, 2012).</p>' +
        '<p>Crows that gather and shout around a dead crow seem to be learning about danger, not mourning: afterwards they were wary of the place, and scolded a person they had seen holding the dead bird (Swift and Marzluff, 2015).</p>' +
        '<p>Those studies used American crows. Hooded crows, the grey-and-black village crows of central Italy, are close relatives. The three verdicts are the novel’s shorthand, not the birds’ own words.</p>');
      el('div', 'unknown', '<h4>What isn’t known</h4>' +
        '<p>What exactly a crow keeps from a face: a few features, such as brows and mouth, or the whole face at once. Here the danger face changes its hat; the real tests used the same mask each time, worn by different people.</p>' +
        '<p>How long the memory lasts. It had not faded when the studies were published, and nobody yet knows whether a roost can carry a face for decades.</p>');
      el('ul', 'sources',
        '<li>Marzluff, Walls, Cornell, Withey &amp; Craig (2010). Lasting recognition of threatening people by wild American crows. <i>Animal Behaviour</i>.</li>' +
        '<li>Cornell, Marzluff &amp; Pecoraro (2012). Social learning spreads knowledge about dangerous humans among American crows. <i>Proceedings of the Royal Society B</i>.</li>' +
        '<li>Marzluff, Miyaoka, Minoshima &amp; Cross (2012). Brain imaging reveals neuronal circuitry underlying the crow’s perception of human faces. <i>PNAS</i>.</li>' +
        '<li>Swift &amp; Marzluff (2015). Wild American crows gather around their dead to learn about danger. <i>Animal Behaviour</i>.</li>');
      var c = cv.getContext('2d');
      var W = 0, H = 0, dpr = 1, P = null, visible = true, raf = 0, last = 0;
      var st = {};
      function palette() {
        var p = {};
        ['paper', 'ink', 'muted', 'rule', 'accent', 'warm', 'panel'].forEach(function (n) { p[n] = ctx.color(n) || '#888888'; });
        var dark = lum(p.ink) > lum(p.paper);
        p.deep = dark ? p.paper : p.ink;
        p.sky0 = mix(p.panel, p.warm, 0.03); p.sky1 = mix(p.panel, p.warm, dark ? 0.2 : 0.3);
        p.roof = mix(p.panel, p.deep, dark ? 0.35 : 0.22); p.cypress = mix(p.panel, p.deep, dark ? 0.6 : 0.5);
        p.street = mix(p.panel, p.muted, 0.08); p.door = mix(p.panel, p.warm, dark ? 0.24 : 0.2); p.doorEdge = mix(p.door, p.deep, 0.18);
        p.crowGrey = dark ? mix(p.muted, p.ink, 0.2) : mix(p.muted, p.panel, 0.3); p.crowBlack = dark ? mix(p.deep, p.muted, 0.42) : mix(p.deep, p.muted, 0.1);
        p.coat = [mix(p.accent, p.panel, 0.15), mix(p.warm, p.deep, 0.15), mix(p.muted, p.panel, 0.1), mix(p.deep, p.muted, 0.35)];
        p.hat = [mix(p.deep, p.warm, 0.3), mix(p.muted, p.deep, 0.35), mix(p.accent, p.deep, 0.2), mix(p.warm, p.panel, 0.1)];
        p.hatBand = mix(p.accent, p.deep, 0.45); p.frame = mix(p.deep, p.accent, 0.2);
        return p;
      }
      function font(px) { return '500 ' + px + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace'; }
      function topH() { return clamp(H * 0.12, 44, 64); }
      function area() { var t = topH(), pad = 8; return { x: pad, y: t + pad, w: W - pad * 2, h: H - t - pad * 2 }; }
      function layout() {
        var a = area(), n = st.crowd ? st.crowd.length : 0, best = null;
        if (!n) { st.lay = null; return; }
        for (var cols = 2; cols <= 6; cols++) {
          var rows = Math.ceil(n / cols), cw = a.w / cols, ch = a.h / rows, u = Math.min(cw / 84, ch / 100);
          if (!best || u > best.u + 0.01) best = { cols: cols, rows: rows, cw: cw, ch: ch, u: u };
        }
        best.cells = [];
        for (var i = 0; i < n; i++) {
          var r = Math.floor(i / best.cols), k = i % best.cols, inRow = Math.min(best.cols, n - r * best.cols);
          var x0 = a.x + (a.w - inRow * best.cw) / 2;
          var cell = { x: x0 + k * best.cw, y: a.y + r * best.ch + (a.h - best.rows * best.ch) / 2, w: best.cw, h: best.ch };
          cell.hx = cell.x + cell.w / 2; cell.hy = cell.y + cell.h - 46 * best.u;
          best.cells.push(cell);
        }
        st.lay = best;
      }
      function perches() {
        var t = topH(), n = clamp(Math.round(W / 62), 5, 12), out = [];
        for (var i = 0; i < n; i++) {
          var x = W * (i + 0.5) / n + st.jit[i] * (W / n) * 0.25, q = (x - W / 2) / (W / 2);
          out.push({ x: x, y: t * 0.5 + t * 0.14 * (1 - q * q), dir: st.dirs[i] });
        }
        return out;
      }
      function scolderIdx(n) { var r = []; for (var k = 0; k < 5; k++) r.push(Math.min(n - 1, Math.floor((k + 0.5) * n / 5))); return r; }
      function drawBand() {
        var t = topH(), g = c.createLinearGradient(0, 0, 0, t);
        g.addColorStop(0, P.sky0); g.addColorStop(1, P.sky1); c.fillStyle = g; c.fillRect(0, 0, W, t);
        c.fillStyle = P.roof; c.beginPath(); c.moveTo(0, t);
        for (var x = 0, i = 0; x < W; i++) { var w = 46 + (i * 37 % 30), h = t * (0.16 + (i * 13 % 7) / 60); c.lineTo(x, t - h * 0.7); c.lineTo(x + w / 2, t - h); c.lineTo(x + w, t - h * 0.7); x += w; }
        c.lineTo(W, t); c.closePath(); c.fill();
        c.fillStyle = P.cypress;
        [0.07, 0.84, 0.91].forEach(function (fx, j) {
          var cx = W * fx, w = t * (j === 2 ? 0.1 : 0.13), top = t * (j === 2 ? 0.22 : 0.06);
          c.beginPath(); c.moveTo(cx - w, t); c.quadraticCurveTo(cx - w * 1.2, t * 0.45, cx, top); c.quadraticCurveTo(cx + w * 1.2, t * 0.45, cx + w, t); c.fill();
        });
        c.strokeStyle = mix(P.deep, P.muted, 0.35); c.lineWidth = 1; c.beginPath();
        for (var k = 0; k <= 24; k++) { var px = W * k / 24, q = (px - W / 2) / (W / 2), py = t * 0.5 + t * 0.14 * (1 - q * q); if (k) c.lineTo(px, py); else c.moveTo(px, py); }
        c.stroke();
      }
      function drawPerched(skip, caw) {
        var ps = perches(), s = clamp(topH() * 0.18, 7, 11);
        ps.forEach(function (p, i) { if (skip.indexOf(i) < 0) drawCrow(c, p.x, p.y - s * 1.05, s, p.dir, P, false, 0, caw); });
      }
      function pill(text, cx, cy, bg, fg, fs) {
        c.font = font(fs); var w = c.measureText(text).width + fs * 1.3, h = fs * 1.75;
        c.fillStyle = bg; rrect(c, cx - w / 2, cy - h / 2, w, h, h / 2); c.fill();
        c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cx, cy + 0.5);
        return w;
      }
      function verdictPill(role, cx, cy, fs) {
        if (role === 'danger') return pill('danger', cx, cy, P.accent, P.paper, fs);
        if (role === 'gives') return pill('gives', cx, cy, P.warm, P.deep, fs);
        return pill(role === 'new' ? 'new face' : 'neither', cx, cy, P.muted, P.paper, fs);
      }
      function drawDoor(x, y, w, h) {
        arch(c, x, y, w, h); c.fillStyle = P.door; c.fill(); c.strokeStyle = P.doorEdge; c.lineWidth = 1; c.stroke();
      }
      function drawLearn() {
        var a = area(), item = LEARN[st.step], f = st.trio[item.role];
        var fs = clamp(W / 38, 12, 15), u = Math.min(a.w / 120, (a.h - fs * 3) / 104, 3.2);
        var dw = 96 * u, dh = 104 * u, dx = a.x + (a.w - dw) / 2, dy = a.y + (a.h - fs * 3 - dh) / 2;
        drawDoor(dx, dy, dw, dh);
        c.save(); arch(c, dx, dy, dw, dh); c.clip(); drawFace(c, f, dx + dw / 2, dy + dh - 46 * u, u, P); c.restore();
        if (item.role === 'danger') { arch(c, dx, dy, dw, dh); c.strokeStyle = P.accent; c.lineWidth = 3; c.stroke(); }
        var py = dy + dh + fs * 1.4, pw = verdictPill(item.role, a.x + a.w / 2, py, fs);
        if (!reduced && st.step < 2) {
          c.fillStyle = P.rule; c.fillRect(a.x + (a.w - pw) / 2, py + fs * 1.15, pw, 2);
          c.fillStyle = P.accent; c.fillRect(a.x + (a.w - pw) / 2, py + fs * 1.15, pw * clamp(st.stepT / STEP, 0, 1), 2);
        }
        for (var i = 0; i < 3; i++) {
          c.fillStyle = i === st.step ? P.accent : P.rule;
          c.beginPath(); c.arc(W - 16 - (2 - i) * 13, H - 14, 4, 0, TAU); c.fill();
        }
      }
      function drawCrowd() {
        var L = st.lay; if (!L) return;
        var fs = clamp(L.u * 9, 10, 13);
        st.crowd.forEach(function (it, i) {
          var cl = L.cells[i], x = cl.x + 3, y = cl.y + 3, w = cl.w - 6, h = cl.h - 6;
          drawDoor(x, y, w, h);
          c.save(); arch(c, x, y, w, h); c.clip(); drawFace(c, it.f, cl.hx, cl.hy, L.u, P); c.restore();
          var m = it.mark;
          if (!m) return;
          if (m === 'miss') { c.save(); c.globalAlpha = 0.45; arch(c, x, y, w, h); c.fillStyle = P.panel; c.fill(); c.restore(); }
          if (m === 'danger' || m === 'reveal' || m === 'gives') {
            arch(c, x, y, w, h); c.strokeStyle = m === 'gives' ? P.warm : P.accent; c.lineWidth = 3; c.stroke();
          }
          if (m === 'danger' || m === 'reveal') {
            var len = clamp(L.u * 11, 8, 16);
            cawMarks(c, cl.hx - 31 * L.u, cl.hy - 30 * L.u, -2.4, len, P.accent);
            cawMarks(c, cl.hx + 31 * L.u, cl.hy - 30 * L.u, -0.74, len, P.accent);
          }
          verdictPill(m === 'reveal' ? 'danger' : m === 'miss' ? 'new' : m, cl.x + cl.w / 2, cl.y + cl.h - fs * 1.4, fs);
        });
      }
      function drawScolders() {
        var L = st.lay, cl = L.cells[st.targetIdx], ps = perches(), idx = scolderIdx(ps.length);
        var s = clamp(L.u * 8, 8, 14), rxo = Math.min(cl.w * 0.55, 54 * L.u), ryo = 50 * L.u;
        arch(c, cl.x + 3, cl.y + 3, cl.w - 6, cl.h - 6); c.strokeStyle = P.accent; c.lineWidth = 3; c.stroke();
        idx.forEach(function (pi, k) {
          var ang = -Math.PI + (k + 0.5) / 5 * Math.PI;
          var ex = clamp(cl.hx + Math.cos(ang) * rxo, s * 2.5, W - s * 2.5), ey = Math.max(s * 2, cl.hy - 12 * L.u + Math.sin(ang) * ryo);
          var dir = Math.cos(ang) < 0 ? 1 : -1, p = ps[pi], sx = p.x, sy = p.y - s;
          var tt = reduced ? 1 : clamp((st.flyT - k * 0.08) / 0.9, 0, 1), e = tt * tt * (3 - 2 * tt);
          var cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 30, im = 1 - e;
          var x = im * im * sx + 2 * im * e * cx + e * e * ex, y = im * im * sy + 2 * im * e * cy + e * e * ey;
          var hover = reduced ? 0 : Math.sin(st.flyT * 5 + k) * 2;
          var flap = reduced ? 0.6 : Math.sin(st.flyT * 16 + k * 1.3);
          var caw = tt >= 1 && (reduced || Math.sin(st.flyT * 7 + k * 1.9) > -0.3);
          drawCrow(c, x, y + hover, s, tt < 1 ? (ex >= sx ? 1 : -1) : dir, P, true, flap, caw);
        });
      }
      function draw() {
        if (!W) return;
        if (!P) P = palette();
        c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
        var t = topH();
        c.fillStyle = P.street; c.fillRect(0, t, W, H - t);
        drawBand();
        if (st.phase === 'learn') drawLearn(); else drawCrowd();
        var watching = st.phase === 'watch' && st.lay;
        drawPerched(watching ? scolderIdx(perches().length) : [], st.phase === 'learn' && st.step === 0);
        if (watching) drawScolders();
      }
      // ---- loop: runs only while something moves and the stage is on screen ----
      function animating() { return !reduced && visible && ((st.phase === 'learn' && st.step < 2) || st.phase === 'watch'); }
      function tick(ts) {
        raf = 0;
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        if (st.phase === 'learn' && st.step < 2) { st.stepT += dt; if (st.stepT >= STEP) { nextLearn(); return; } }
        if (st.phase === 'watch') st.flyT += dt;
        draw();
        kick();
      }
      function kick() { if (!raf && animating()) raf = requestAnimationFrame(tick); if (!animating()) last = 0; }
      // ---- UI ----
      function say(text, cls, sr) {
        result.className = 'result' + (cls ? ' ' + cls : '');
        result.innerHTML = text + (sr ? '<span class="crow-sr"> (' + sr + ')</span>' : '');
      }
      function step(label) { return '<span class="crow-step">' + label + '</span>'; }
      function buildHits() {
        var hadFocus = hits.contains(document.activeElement);
        hits.innerHTML = '';
        var L = st.lay, live = st.phase === 'roost' || st.phase === 'season';
        hits.hidden = !live || !L;
        if (!live || !L) return;
        st.crowd.forEach(function (it, i) {
          var cl = L.cells[i], b = el('button', 'crow-hit', null, hits);
          b.type = 'button';
          b.style.left = (cl.x / W * 100) + '%'; b.style.top = (cl.y / H * 100) + '%';
          b.style.width = (cl.w / W * 100) + '%'; b.style.height = (cl.h / H * 100) + '%';
          b.style.borderRadius = Math.round(Math.min(cl.w, cl.h) * 0.42) + 'px ' + Math.round(Math.min(cl.w, cl.h) * 0.42) + 'px 4px 4px';
          b.setAttribute('aria-label', 'Face ' + (i + 1) + ': ' + describe(it.f) + (it.mark ? ' (' + (it.mark === 'reveal' ? 'danger' : it.mark === 'miss' ? 'not this one' : it.mark) + ')' : ''));
          b.addEventListener('click', function () { choose(i); });
        });
        if (hadFocus && st.focusIdx != null && hits.children[st.focusIdx]) hits.children[st.focusIdx].focus();
      }
      function setPrimary(label) {
        var had = document.activeElement === primary;
        primary.hidden = !label;
        if (label) primary.textContent = label;
        else if (had && hits.firstChild) hits.firstChild.focus();
      }
      function refresh() { layout(); buildHits(); draw(); kick(); }
      function reset() {
        st = { jit: [], dirs: [], remembered: 0, season: 0 };
        for (var i = 0; i < 12; i++) { st.jit.push(Math.random() * 2 - 1); st.dirs.push(Math.random() < 0.5 ? -1 : 1); }
        var d = stranger(null, [], 0, 2), g = stranger(d, [], 5), n = stranger(d, [g], 5, 3);
        while (visDiff(n, g) < 5) n = stranger(d, [g], 5, 3);
        var blue = stranger(d, [g, n], 5, 2);
        st.trio = { danger: d, gives: g, neither: n }; st.blue = blue;
        st.phase = 'learn'; st.step = 0; st.stepT = 0; st.crowd = null;
        readout.hidden = true; showLearn();
      }
      function showLearn() {
        var item = LEARN[st.step];
        lede.innerHTML = step('1 · One crow learns') + 'Every face a crow meets gets one of three verdicts: <em>gives</em>, <em>danger</em> or <em>neither</em>. Learn these three faces. You will need them.';
        say(item.text, '', 'face ' + (st.step + 1) + ' of 3: ' + describe(st.trio[item.role]));
        setPrimary(st.step < 2 ? 'Next' : 'To the street'); refresh();
      }
      function nextLearn() { if (st.step < 2) { st.step++; st.stepT = 0; showLearn(); } else startRoost(); }
      function makeCrowd(n, specials, lookN, lookK, minD) {
        var items = specials.slice(), faces = specials.map(function (s) { return s.f; }), t = specials[0].f;
        for (var i = 0; i < lookN; i++) { var lf = lookalike(st.blue, lookK); faces.push(lf); items.push({ f: lf, role: 'stranger' }); }
        while (items.length < n) { var sf = stranger(t, faces, minD); faces.push(sf); items.push({ f: sf, role: 'stranger' }); }
        shuffle(items).forEach(function (it, k) { it.mark = null; if (it.role === 'danger') st.targetIdx = k; });
        st.misses = 0; st.done = false; st.focusIdx = null; return items;
      }
      function startRoost() {
        var dv = clone(st.trio.danger);
        dv.hat = dv.hat ? 0 : 1 + ri(2); dv.hatTone = ri(4); dv.coat = (dv.coat + 1 + ri(3)) % 4;
        st.dangerHat = dv.hat; st.crowd = makeCrowd(9, [{ f: dv, role: 'danger' }, { f: st.trio.gives, role: 'gives' }, { f: st.trio.neither, role: 'neither' }], 0, 0, 4);
        st.phase = 'roost';
        lede.innerHTML = step('2 · The roost tells it') + 'Dusk, and the street is full. Tap the face that is <em>danger</em>. Its hat may have changed.';
        say('', ''); refresh(); setPrimary(null);
      }
      function startWatch() {
        st.crowd = makeCrowd(9, [{ f: clone(st.blue), role: 'danger' }], 0, 0, 4);
        st.phase = 'watch'; st.flyT = 0;
        lede.innerHTML = step('3 · Generations') + 'Years later, you are a young crow. You never met the face from the blue gate: that was before you hatched. Watch which face the old crows scold.';
        say('The old crows scold one face: <em>that one, that one</em>. Remember it.', '', 'they are scolding the face with ' + describe(st.blue));
        setPrimary('I’m ready'); refresh();
      }
      function startSeason() {
        var s = ++st.season, v = s === 1 ? clone(st.blue) : variant(st.blue, s);
        var n = s === 1 ? 9 : s === 2 ? 10 : 12, look = s === 1 ? 0 : Math.min(4, s - 1), lookK = s <= 3 ? 3 : 2;
        st.crowd = makeCrowd(n, [{ f: v, role: 'danger' }], look, lookK, s <= 2 ? 4 : 3);
        st.phase = 'season'; st.hatChanged = v.hat !== st.blue.hat;
        lede.innerHTML = s === 1
          ? step('3 · Generations') + 'A new evening, new faces. Find the face the old crows scolded.'
          : step('Season ' + s) + 'A year has gone round. The street is full of strangers. Is the face from the blue gate among them?';
        readout.hidden = false; readout.textContent = 'Seasons remembered: ' + st.remembered;
        say('', ''); refresh(); setPrimary(null);
      }
      function choose(i) {
        var it = st.crowd && st.crowd[i], target = it && st.crowd[st.targetIdx];
        if (!it) return;
        st.focusIdx = i;
        if (st.phase === 'roost') {
          if (it.role === 'danger' && !st.done) {
            it.mark = 'danger'; st.done = true;
            say('That one. Danger, ' + (st.dangerHat ? 'even in a hat.' : 'even without the hat.'), 'good');
            lede.innerHTML = step('2 · The roost tells it') + 'Found. Is there a face here that <em>gives</em>, too? Tap it, or go on.';
          } else if (it.role === 'gives') {
            it.mark = 'gives';
            say(st.done ? 'Gives: crusts on the wall. You kept both faces.' : 'That face gives: crusts on the wall. Good to know. Now find danger.', st.done ? 'good' : '');
          } else if (it.role === 'neither') {
            it.mark = 'neither'; say('That one walks past every morning. Neither.', '');
          } else if (it.role === 'stranger' && st.done) {
            it.mark = 'neither'; say('A new face. Neither, for now.', '');
          } else if (it.role === 'stranger' && it.mark !== 'miss') {
            it.mark = 'miss'; st.misses++;
            if (st.misses >= 2) {
              target.mark = 'reveal'; st.done = true;
              say('There it is, ' + (st.dangerHat ? 'under a hat' : 'without its hat') + '. Same brows, same eyes, same nose.', 'miss');
            } else say('Not that one. That face is new to you. Look past the hat, at the brows, eyes and nose.', 'miss');
          }
          if (st.done) setPrimary('Go on');
        } else if (st.phase === 'season' && !st.done) {
          if (it.role === 'danger') {
            it.mark = 'danger'; st.done = true; st.remembered++;
            var msg = st.season === 1 ? 'That one. You never saw it do anything. You learned it by watching the others.'
              : st.hatChanged ? 'Remembered. It changed its hat; the roost did not forget.' : 'Remembered. The face is still known.';
            if (st.remembered === 5) msg += ' Five seasons: in the real study, crows were still scolding the mask after five years.';
            say(msg, 'good');
          } else if (it.mark !== 'miss') {
            it.mark = 'miss'; st.misses++;
            if (st.misses >= 2) { target.mark = 'reveal'; st.done = true; say('The roost scolds this one. Look closely, and keep it for next season.', 'miss'); }
            else say('Not that one. Look again: brows, eyes, nose, glasses. Hats change; faces don’t.', 'miss');
          }
          readout.textContent = 'Seasons remembered: ' + st.remembered;
          if (st.done) setPrimary('Next season');
        }
        buildHits(); draw();
      }
      primary.addEventListener('click', function () { if (st.phase === 'learn') nextLearn(); else if (st.phase === 'roost') startWatch(); else startSeason(); });
      again.addEventListener('click', reset);
      hits.addEventListener('keydown', function (e) {
        var bs = Array.prototype.slice.call(hits.children), i = bs.indexOf(document.activeElement), cols = st.lay ? st.lay.cols : 3, j;
        if (i < 0) return;
        if (e.key === 'ArrowRight') j = i + 1; else if (e.key === 'ArrowLeft') j = i - 1;
        else if (e.key === 'ArrowDown') j = i + cols; else if (e.key === 'ArrowUp') j = i - cols; else return;
        e.preventDefault(); if (j >= 0 && j < bs.length) bs[j].focus();
      });
      function resize() {
        var w = wrap.clientWidth, h = wrap.clientHeight;
        if (!w || !h) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2); W = w; H = h;
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        refresh();
      }
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
      else window.addEventListener('resize', resize);
      ctx.onThemeChange(function () { P = null; draw(); });
      ctx.visible(function (v) { visible = v; kick(); });
      reset();
      resize();
    }
  };
})();
