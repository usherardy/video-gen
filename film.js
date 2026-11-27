// Showreel: a pure function of time. window.seek(t) paints frame t. No state between frames.
const W = 1920, H = 1080, FPS = DATA.timeline.fps;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const C = { ink: '#0C0C0D', paper: '#F1EEE6', acc: '#FF4B1F', dim: 'rgba(241,238,230,.22)' };
const SPB = DATA.beats.spb, OFF = DATA.beats.offset, CUTS = DATA.timeline.cuts;
const bt = i => OFF + i * SPB;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, t0, d) => cl((t - t0) / d);
const lerp = (a, b, x) => a + (b - a) * x;
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => mulberry32(n * 9973 + 11)();
const E = {
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outElastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI) / 3) + 1,
  outBounce: x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; },
};
const bez = (P, s) => { const u = 1 - s; return [u*u*u*P[0][0] + 3*u*u*s*P[1][0] + 3*u*s*s*P[2][0] + s*s*s*P[3][0], u*u*u*P[0][1] + 3*u*u*s*P[1][1] + 3*u*s*s*P[2][1] + s*s*s*P[3][1]]; };

// ---------- helpers ----------
const DF = s => `${s}px Anton`, MF = (s, w = 500) => `${w} ${s}px JB`;
let capK = 0.86;
function lastBeat(t) { const k = Math.floor((t - OFF) / SPB + 1e-9); return { i: k, dt: t - bt(k) }; }
const bp = (t, k = 10) => { const { dt } = lastBeat(t); return dt < 0 ? 0 : Math.exp(-dt * k); };
function text(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
function letters(s, font, track = 0) { ctx.font = font; let x = 0; const o = []; for (const ch of s) { const w = ctx.measureText(ch).width; o.push({ ch, x, w }); x += w + track; } return { l: o, w: x - track }; }
function fitSize(s, maxW, maxS) { ctx.font = DF(100); return Math.min(maxS, 100 * maxW / ctx.measureText(s).width); }
function bg(col) { ctx.fillStyle = col; ctx.fillRect(-80, -80, W + 160, H + 160); }
function rrect(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// ---------- scene 1 : hook (paper) ----------
function S1(t) {
  bg(C.paper);
  const size = 900 / (3.2 * capK), cap = capK * size, gap = cap * 0.1;
  const y0 = (H - (3 * cap + 2 * gap)) / 2 + cap;
  const words = ['I MAKE', 'PIXELS', 'MOVE'], cols = [C.ink, C.ink, C.acc];
  const glitch = cl((t - 1.55) / 0.08) * (1 - cl((t - 1.86) / 0.1));
  const bands = glitch > 0 ? 6 : 1;
  for (let b = 0; b < bands; b++) {
    ctx.save();
    if (bands > 1) { ctx.beginPath(); ctx.rect(0, b * H / bands, W, H / bands + 1); ctx.clip(); ctx.translate((hash(b + Math.floor(t * 30) * 7) - .5) * 160 * glitch, 0); }
    for (let i = 0; i < 3; i++) {
      const p = E.outExpo(prog(t, i * SPB - 0.2, 0.34));
      const base = y0 + i * (cap + gap);
      ctx.save(); ctx.beginPath(); ctx.rect(0, base - cap - 6, W, cap + 12); ctx.clip();
      text(words[i], 110, base + (1 - p) * (cap + 40), DF(size), cols[i]);
      ctx.restore();
    }
    // bouncing period
    const base = y0 + 2 * (cap + gap); ctx.font = DF(size); const mw = ctx.measureText('MOVE').width;
    const dp = prog(t, 1.15, 0.7), r = cap * 0.1, dy = (1 - E.outBounce(dp)) * -cap * 1.6;
    const sq = dp > 0 && dp < 1 ? 1 + 0.25 * Math.exp(-Math.abs(dp - 0.37) * 30) : 1;
    if (dp > 0) { ctx.fillStyle = C.acc; ctx.beginPath(); ctx.ellipse(110 + mw + r + 12, base - r + dy, r * sq, r / sq, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // pixel field: pixels that move
  const x0 = 1110, y0f = 180, cs = 90;
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    const d = i + j, p = E.outBack(prog(t, -0.2 + d * 0.03, 0.3));
    if (p <= 0) continue;
    const fly = E.inCubic(prog(t, 1.45 + j * 0.035, 0.42));
    const sweep = (t - 1.0) * 24, hot = Math.abs(d - sweep) < 1.6 || Math.abs(d - (t - 0.5) * 24) < 1.0;
    const s = 74 * p, cx = x0 + i * cs + cs / 2 + fly * 1000, cy = y0f + j * cs + cs / 2 + Math.sin(t * 7 + i * .8) * 5 * (1 - fly);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(fly * 1.6 * (j % 2 ? 1 : -1));
    ctx.fillStyle = hot ? C.acc : C.ink; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
  }
}

// ---------- scene 2 : dot grid + text mask (ink) ----------
const off2 = document.createElement('canvas'); off2.width = W; off2.height = H; const o2 = off2.getContext('2d');
const mkc = document.createElement('canvas'); mkc.width = W; mkc.height = H; const mk = mkc.getContext('2d');
function S2(t, lt) {
  bg(C.ink);
  const cols = 32, rows = 18, cs = 60;
  const pulses = []; for (let k = 0; k < 6; k++) { const pt = lt - k * SPB; if (pt >= 0 && pt < 1.0) pulses.push(pt); }
  const drawGrid = (c, accent) => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const dx = i - 15.5, dy = j - 8.5, d = Math.hypot(dx, dy);
      const ent = E.outBack(prog(lt, d * 0.015, 0.4)); if (ent <= 0) continue;
      let w = .5 + .5 * Math.sin(d * 0.35 - lt * 7);
      let r = (accent ? 11 + 19 * w : 4 + 8 * w) * ent, ox = 0, oy = 0, hot = 0;
      for (const pt of pulses) { const R = pt * 2100, dist = d * cs; const near = Math.exp(-Math.pow((dist - R) / 110, 2)); const ang = Math.atan2(dy, dx); ox += Math.cos(ang) * 22 * near; oy += Math.sin(ang) * 22 * near; hot = Math.max(hot, near); r += 8 * near; }
      const m = E.inOutCubic(prog(lt, 2.0 + i * 0.008, 0.34));
      const cx = cs / 2 + i * cs + ox, cy = cs / 2 + j * cs + oy;
      c.save(); c.translate(cx, cy); c.rotate(m * Math.PI / 2);
      const bar = E.inCubic(prog(lt, 2.55 + j * 0.01, 0.3));
      const hw = r * (1 + bar * 3.5), hh = r * (1 - bar * .8);
      c.fillStyle = accent ? (hot > .35 ? C.paper : C.acc) : C.dim;
      const rad = lerp(hh, 2, m); c.beginPath(); c.roundRect(-hw, -hh, hw * 2, hh * 2, Math.max(0, rad)); c.fill(); c.restore();
    }
  };
  drawGrid(ctx, false);
  // accent grid visible only inside the word
  const size = fitSize('TIMING', 1640, 760); const L = letters('TIMING', DF(size), size * 0.012);
  const x0 = (W - L.w) / 2 + lerp(220, -60, E.outCubic(prog(lt, 0, 3))), base = H / 2 + capK * size / 2;
  mk.clearRect(0, 0, W, H); mk.font = DF(size); mk.textBaseline = 'alphabetic'; mk.fillStyle = '#000';
  L.l.forEach((q, n) => {
    const p = E.outBack(prog(lt, 0.02 + n * 0.04, 0.4)), jump = Math.max(0, bp(lt, 11)) * 22 * (n % 2 ? -1 : 1);
    mk.save(); mk.translate(x0 + q.x, base + (1 - p) * 220 + jump); mk.fillText(q.ch, 0, 0); mk.restore();
  });
  o2.globalCompositeOperation = 'source-over'; o2.clearRect(0, 0, W, H); drawGrid(o2, true);
  o2.globalCompositeOperation = 'destination-in'; o2.drawImage(mkc, 0, 0); o2.globalCompositeOperation = 'source-over';
  ctx.drawImage(off2, 0, 0);
}

// ---------- scene 3 : 3D torus on accent ----------
function S3(t, lt) {
  bg(C.acc);
  const size = fitSize('DEPTH', 780, 400), L = letters('DEPTH', DF(size), size * .015), base = 540;
  ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.font = DF(size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  L.l.forEach((q, n) => {
    const p = E.outExpo(prog(lt, 0.05 + n * 0.07, 0.5)); if (p <= 0) return;
    ctx.save(); ctx.translate(120 + q.x + (1 - p) * -300, base); ctx.transform(1, 0, -0.22 * (1 - p), 1, 0, 0); ctx.strokeText(q.ch, 0, 0); ctx.restore();
  });
  // frame counter (a real one)
  const fr = Math.round(t * FPS), cnt = E.outCubic(prog(lt, 0.3, 0.5));
  const lw = 120 + L.w * E.outExpo(prog(lt, 0.5, 0.7));
  ctx.fillStyle = C.ink; ctx.fillRect(120, base + 40, L.w * E.outExpo(prog(lt, 0.4, 0.6)), 6);
  text(`FRAME ${String(fr).padStart(4, '0')} / 0450`, 120, base + 130, MF(54, 800), C.ink);
  text('EVERY ONE COMPUTED FROM t', 120, base + 200, MF(36), C.ink);
  // torus
  const cx = 1400, cy = 540, pulse = bp(t, 9);
  const sc = E.outBack(prog(lt, 0.1, 0.55)) * (1 + 0.14 * pulse);
  const ay = lt * 0.9 + E.outCubic(prog(lt, 0, 1)) * 1.5 + pulse * .25, ax = 0.95 + Math.sin(lt * 1.3) * .25;
  const Rm = 240, r0 = 98, NU = 30, NV = 18, dcam = 1500;
  const pr = (u, v) => {
    let x = (Rm + r0 * Math.cos(v)) * Math.cos(u), y = r0 * Math.sin(v), z = (Rm + r0 * Math.cos(v)) * Math.sin(u);
    let x1 = x * Math.cos(ay) + z * Math.sin(ay), z1 = -x * Math.sin(ay) + z * Math.cos(ay);
    let y1 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
    const f = dcam / (dcam + z2) * sc; return [cx + x1 * f, cy + y1 * f, z2];
  };
  ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  const nRings = Math.floor(NU * E.outCubic(prog(lt, 0.15, 0.6)));
  for (let a = 0; a < nRings; a++) {
    const u = a / NU * Math.PI * 2; ctx.beginPath();
    for (let k = 0; k <= 36; k++) { const [x, y] = pr(u, k / 36 * Math.PI * 2); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.lineWidth = 2.4; ctx.stroke();
  }
  for (let b = 0; b < NV; b++) {
    const v = b / NV * Math.PI * 2; ctx.beginPath();
    for (let k = 0; k <= 80; k++) { const [x, y] = pr(k / 80 * Math.PI * 2 * E.outCubic(prog(lt, 0.2, 0.7)), v); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.lineWidth = 1.2; ctx.stroke();
  }
  // orbiting squares with trails
  for (let o = 0; o < 3; o++) for (let k = 0; k < 9; k++) {
    const a = lt * (2.2 + o * .6) + o * 2.1 - k * 0.07, rx = 410 + o * 36, ry = 140 + o * 60;
    const px = cx + Math.cos(a) * rx * sc, py = cy + Math.sin(a) * ry * sc, s = (k ? 8 - k * .7 : 22) * sc;
    if (s <= 0) continue; ctx.save(); ctx.translate(px, py); ctx.rotate(a * 2); ctx.fillStyle = k ? C.ink : C.paper; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
  }
}

// ---------- scene 4 : kinetic words, 3 techniques ----------
function S4(t, lt) {
  const w = Math.min(2, Math.floor(lt / (2 * SPB))), wl = lt - w * 2 * SPB;
  const bgc = [C.ink, C.paper, C.acc][w], fg = [C.paper, C.ink, C.ink][w];
  bg(bgc);
  const word = ['EASE', 'WEIGHT', 'SOUND'][w], sub = ['every curve is chosen', 'mass, squash, rebound', 'picture follows the beat'][w];
  const size = fitSize(word, 1560, 700), cap = capK * size, base = H / 2 + cap / 2 - 20;
  const L = letters(word, DF(size), size * 0.02), x0 = (W - L.w) / 2;
  if (w === 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, base - cap - 8, W, cap + 16); ctx.clip();
    L.l.forEach((q, n) => { const p = E.outExpo(prog(wl, n * 0.05 - 0.05, 0.42)); text(q.ch, x0 + q.x, base + (1 - p) * (cap + 30), DF(size), n === 3 ? C.acc : fg); });
    ctx.restore();
    const lp = E.outExpo(prog(wl, 0.12, 0.5)); ctx.fillStyle = C.acc; ctx.fillRect(x0, base + 36, L.w * lp, 10);
    const b2 = bp(wl - SPB + OFF, 12) * (wl > SPB ? 1 : 0); ctx.fillStyle = fg; ctx.fillRect(x0 + L.w * lp - 40 - 200 * b2, base + 36, 40 + 200 * b2, 10);
  } else if (w === 1) {
    const floor = base + 24; ctx.fillStyle = C.acc; ctx.fillRect(0, floor, W * E.outExpo(prog(wl, 0, 0.3)), 8);
    L.l.forEach((q, n) => {
      const d = n * 0.045, p = prog(wl, d, 0.55), y = (1 - E.outBounce(p)) * -(cap + 380);
      const land = p > 0 && p < 1 ? Math.exp(-Math.abs(p - 0.36) * 22) : (p >= 1 ? Math.exp(-(wl - d - 0.55) * 14) * 0.2 * (wl > d + .55 ? 1 : 0) : 0);
      const sy = 1 - 0.22 * land, sx = 1 + 0.16 * land;
      ctx.save(); ctx.translate(x0 + q.x + q.w / 2, base + y); ctx.scale(sx, sy); text(q.ch, -q.w / 2, 0, DF(size), fg); ctx.restore();
    });
  } else {
    const nb = 6, bh = (cap + 16) / nb;
    for (let b = 0; b < nb; b++) {
      const p = E.outExpo(prog(wl, b * 0.04, 0.5)), dir = b % 2 ? 1 : -1, hit = bp(wl - SPB + OFF, 14) * (wl > SPB ? 1 : 0);
      ctx.save(); ctx.beginPath(); ctx.rect(0, base - cap - 8 + b * bh, W, bh + 1); ctx.clip();
      text(word, W / 2 + dir * ((1 - p) * 1700 + hit * 18), base, DF(size), fg, 'center'); ctx.restore();
    }
    for (let k = 0; k < 64; k++) {
      const n = 0.5 + 0.5 * Math.sin(k * 1.7 + wl * 18 + hash(k) * 6), e = 0.25 + 0.75 * n * (0.55 + bp(t, 6) * .45);
      const bhh = 120 * e * E.outExpo(prog(wl, 0.2 + k * 0.004, 0.3)); ctx.fillStyle = C.ink; ctx.fillRect(100 + k * 27.5, 980 - bhh, 14, bhh);
    }
  }
  const sp = E.outExpo(prog(wl, 0.2, 0.4)); ctx.save(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  if (w !== 2) text(sub.toUpperCase(), x0, base + 118 + (1 - sp) * 40, MF(48, 800), w === 0 ? C.paper : C.ink); ctx.restore();
}

// ---------- scene 5 : the craft (curve editor + easings) ----------
function S5(t, lt) {
  bg(C.paper);
  const gx = 150, gy = 210, gs = 640;
  const pulse = bp(t, 8);
  const P1y = 1 + 0.55 * Math.sin(Math.max(0, lt - 1.1) * 3.2) * E.outCubic(prog(lt, 1.1, .4)), P2y = 1 - 0.55 * Math.sin(Math.max(0, lt - 1.1) * 2.3) * E.outCubic(prog(lt, 1.1, .4));
  const P = [[0, 0], [0.16 + 0.1 * Math.sin(Math.max(0, lt - 1.1) * 2.1), P1y], [0.3, P2y], [1, 1]];
  const X = x => gx + x * gs, Y = y => gy + gs - y * gs * 0.62 - gs * 0.19;
  ctx.strokeStyle = 'rgba(12,12,13,.16)'; ctx.lineWidth = 2;
  for (let k = 0; k <= 8; k++) { const f = E.outExpo(prog(lt, k * 0.02, 0.4)); ctx.beginPath(); ctx.moveTo(gx, gy + k * gs / 8); ctx.lineTo(gx + gs * f, gy + k * gs / 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(gx + k * gs / 8, gy); ctx.lineTo(gx + k * gs / 8, gy + gs * f); ctx.stroke(); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.strokeRect(gx, gy, gs * E.outExpo(prog(lt, 0, 0.3)), gs * E.outExpo(prog(lt, 0, 0.3)));
  const draw = prog(lt, 0.15, 0.7), hs = E.outCubic(prog(lt, 0.7, 0.4));
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
  for (const [a, b] of [[0, 1], [3, 2]]) { ctx.beginPath(); ctx.moveTo(X(P[a][0]), Y(P[a][1])); ctx.lineTo(lerp(X(P[a][0]), X(P[b][0]), hs), lerp(Y(P[a][1]), Y(P[b][1]), hs)); ctx.stroke(); }
  ctx.strokeStyle = C.acc; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath();
  for (let k = 0; k <= 80; k++) { const s = k / 80 * E.outCubic(draw), [x, y] = bez(P, s); k ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke();
  for (const i of [1, 2]) { const q = hs * (1 + .3 * pulse); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(X(P[i][0]), Y(P[i][1]), 15 * q, 0, 7); ctx.fill(); }
  if (lt > 0.9) { const s = ((lt - 0.9) / (2 * SPB)) % 1, [x, y] = bez(P, E.inOutCubic(s)); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.beginPath(); ctx.moveTo(X(x), Y(0) + 0); ctx.lineTo(X(x), Y(y)); ctx.lineTo(gx, Y(y)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(X(x), Y(y), 24, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); }
  const str = `cubic-bezier(${P[1][0].toFixed(2)}, ${P[1][1].toFixed(2)}, ${P[2][0].toFixed(2)}, ${P[2][1].toFixed(2)})`;
  text(str.slice(0, Math.floor(str.length * prog(lt, 0.1, 0.5))), gx, 160, MF(40, 800), C.ink);
  // tracks
  const eases = [['outExpo', E.outExpo], ['inOutCubic', E.inOutCubic], ['outBack', E.outBack], ['outElastic', E.outElastic], ['outBounce', E.outBounce]];
  const tx0 = 990, tx1 = 1790, ty0 = 250, step = 150;
  eases.forEach(([name, fn], n) => {
    const ey = ty0 + n * step, ent = E.outExpo(prog(lt, 0.2 + n * 0.08, 0.4));
    ctx.fillStyle = C.ink; ctx.fillRect(tx0, ey + 82, (tx1 - tx0) * ent, 5);
    text(name, tx0, ey - 12, MF(34, 800), C.ink);
    const ph = ((lt + n * 0.12) / (2 * SPB)) % 1, tri = ph < .5 ? ph * 2 : 2 - ph * 2, pos = fn(cl(tri));
    const sz = 64 * E.outBack(prog(lt, 0.3 + n * 0.08, 0.3)); ctx.save(); ctx.translate(tx0 + sz / 2 + pos * (tx1 - tx0 - sz), ey + 36); ctx.rotate(pos * 1.5); ctx.fillStyle = n === 3 ? C.acc : C.ink; ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.restore();
  });
}

// ---------- scene 6 : close (ink) ----------
function S6(t, lt) {
  const flashT = lt - 0.5 - (OFF - 0); const flash = Math.exp(-Math.max(0, lt - 0.5) * 22) * (lt >= 0.5 ? 1 : 0);
  bg(C.ink);
  const size = fitSize('MOTION', 1000, 480), cap = capK * size, gap = 28, y0 = 540 - (2 * cap + gap) / 2 + cap;
  const words = ['MOTION', 'DESIGN'];
  words.forEach((wd, i) => {
    const base = y0 + i * (cap + gap), L = letters(wd, DF(size), size * 0.01);
    ctx.save(); ctx.beginPath(); ctx.rect(0, base - cap - 8, W, cap + 16); ctx.clip();
    L.l.forEach((q, n) => { const p = E.outExpo(prog(lt, i * 0.2 + n * 0.035, 0.36)); text(q.ch, 130 + q.x, base + (1 - p) * (cap + 30), DF(size), C.paper); });
    ctx.restore();
    if (i === 1) { const dp = E.outBack(prog(lt, 0.5, 0.35)); ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(130 + L.w + 40, base - 26, 24 * dp, 0, 7); ctx.fill(); }
  });
  const sy = y0 + cap + gap + cap + 62, tp = prog(lt, 0.55, 0.7);
  const line = 'BY CLAUDE. EVERY FRAME IS A FUNCTION OF TIME.'; text(line.slice(0, Math.floor(line.length * tp)), 134, sy, MF(34, 800), C.paper);
  // ring: the film's own clock
  const rcx = 1490, rcy = 540, R = 250, rp = E.inOutCubic(prog(lt, 0.0, 1.0)) , fin = rp;
  ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(241,238,230,.18)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(rcx, rcy, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = C.acc; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(rcx, rcy, R, -Math.PI / 2, -Math.PI / 2 + fin * Math.PI * 2); ctx.stroke();
  const hx = rcx + Math.cos(-Math.PI / 2 + fin * Math.PI * 2) * R, hy = rcy + Math.sin(-Math.PI / 2 + fin * Math.PI * 2) * R;
  ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(hx, hy, 22, 0, 7); ctx.fill();
  const secs = (15 * fin).toFixed(1); text(secs, rcx - 6, rcy + 38, MF(130, 800), C.paper, 'center'); text('SECONDS', rcx, rcy + 98, MF(32, 800), C.acc, 'center');
  // inner ticks that breathe
  for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2 - Math.PI / 2, br = 1 + 0.25 * Math.sin(t * 2.4 + k * .5), r1 = R - 52, r2 = r1 - 18 * br * E.outExpo(prog(lt, 0.2 + k * .004, .4)); ctx.strokeStyle = 'rgba(241,238,230,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rcx + Math.cos(a) * r1, rcy + Math.sin(a) * r1); ctx.lineTo(rcx + Math.cos(a) * r2, rcy + Math.sin(a) * r2); ctx.stroke(); }
  if (flash > 0.01) { ctx.fillStyle = `rgba(241,238,230,${flash * .9})`; ctx.fillRect(-80, -80, W + 160, H + 160); }
}

// ---------- wipes between scenes ----------
const polyF = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
const WIPES = [
  (p) => { const c = p < .5; const e = E.inOutCubic(c ? p * 2 : (p - .5) * 2); ctx.fillStyle = C.acc; c ? ctx.fillRect(0, 0, W * e, H) : ctx.fillRect(W * e, 0, W - W * e, H); },
  (p) => { const c = p < .5, n = 6; for (let i = 0; i < n; i++) { const q = cl(((c ? p * 2 : (p - .5) * 2) - .1 * i) / .5), e = E.inOutCubic(q); ctx.fillStyle = C.paper; c ? ctx.fillRect(W - W * e, i * H / n, W * e + 1, H / n + 1) : ctx.fillRect(0, i * H / n, W - W * e, H / n + 1); } },
  (p) => { const c = p < .5, R = Math.hypot(W, H) / 2 * 1.05, e = c ? E.outCubic(p * 2) : E.inCubic((p - .5) * 2); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * (c ? e : 1), 0, 7); if (!c) { ctx.moveTo(W / 2 + R * e, H / 2); ctx.arc(W / 2, H / 2, R * e, 0, 7, true); } ctx.fill('evenodd'); },
  (p) => { const c = p < .5, e = E.inOutCubic(c ? p * 2 : (p - .5) * 2), ed = -300 + (W + 600) * e; c ? polyF([[0, 0], [ed + 300, 0], [ed, H], [0, H]], C.acc) : polyF([[ed + 300, 0], [W, 0], [W, H], [ed, H]], C.acc); },
  (p) => { const c = p < .5, n = 8; for (let i = 0; i < n; i++) { const q = cl(((c ? p * 2 : (p - .5) * 2) - .1 * i) / .5), e = E.inOutCubic(q); ctx.fillStyle = C.acc; c ? ctx.fillRect(i * W / n, 0, W / n + 1, H * e) : ctx.fillRect(i * W / n, H * e, W / n + 1, H - H * e); } },
];
const WD = 0.17;

// ---------- grain ----------
const grain = []; for (let g = 0; g < 6; g++) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), r = mulberry32(900 + g); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); grain.push(c); }

// ---------- seek ----------
const SC = [S1, S2, S3, S4, S5, S6];
window.ready = document.fonts.load('100px Anton').then(() => document.fonts.load('500 40px JB')).then(() => document.fonts.load('800 40px JB')).then(() => { ctx.font = DF(100); const m = ctx.measureText('H'); capK = m.actualBoundingBoxAscent / 100; return true; });
window.seek = function (t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]);
  let si = 0; for (let i = 0; i < 6; i++) if (t >= bt(CUTS[i]) - 1e-6) si = i;
  const lt = t - bt(CUTS[si]);
  const { i: bi, dt } = lastBeat(t);
  const hitBeats = si === 3 ? [16, 18, 20] : si === 0 ? [0, 1, 2] : si === 5 ? [28] : null;
  const isHit = hitBeats ? hitBeats.includes(bi) : (si !== 0 && bi >= 0);
  const amp = (si === 5 ? 20 : 11) * (isHit ? Math.exp(-dt * 13) : 0), r = mulberry32(bi * 31 + 5);
  ctx.save(); ctx.translate((r() - .5) * 2 * amp, (r() - .5) * 2 * amp);
  SC[si](t, lt, bi);
  ctx.restore();
  for (let k = 0; k < WIPES.length; k++) { const tc = bt(CUTS[k + 1]), p = (t - (tc - WD)) / (2 * WD); if (p > 0 && p < 1) WIPES[k](p); }
  // grain
  const gi = Math.floor(t * 24) % 6, rr = mulberry32(Math.floor(t * 24) + 3);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.22;
  const ox = Math.floor(rr() * 256), oy = Math.floor(rr() * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) ctx.drawImage(grain[gi], x, y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
};
