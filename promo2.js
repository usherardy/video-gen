// "40% there" — PromptItIn promo. Pure function of time; every UI pixel is cropped from the site's real screenshots.
const FM = DATA.fmt, W = FM.w, H = FM.h, portrait = H > W, FPS = DATA.tl.fps;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
const C = { ink: '#0B0B14', paper: '#FAFAFA', acc: '#7C3AED', accT: '#A78BFA', red: '#EF4444', track: '#F3F4F6' };
const TL = DATA.tl, SPB = DATA.beats.spb, OFF = DATA.beats.offset, BEAT = b => OFF + b * SPB;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), prog = (t, t0, d) => cl((t - t0) / d), lerp = (a, b, x) => a + (b - a) * x;
const bp = (t, b0, db) => prog(t, BEAT(b0), db * SPB);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const E = {
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x), outCubic: x => 1 - Math.pow(1 - x, 3), inCubic: x => x * x * x,
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10), inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  inOutQuint: x => x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2,
  outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const GF = (s, w = 800) => `${w} ${s}px GeistP`, MF = (s, w = 700) => `${w} ${s}px GeistMonoP`, SF = (s, w = 700) => `italic ${w} ${s}px GelasioP`;
const IM = {}; let capK = 0.71;
const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => r(); i.onerror = () => { console.error('img fail', src); r(); }; i.src = src; IM[k] = i; });
window.ready = Promise.all([
  document.fonts.load('800 100px GeistP'), document.fonts.load('700 100px GeistMonoP'), document.fonts.load('italic 700 100px GelasioP'),
  load('O', 'assets/PromptEnhancer.png'), load('G', 'assets/generatePrompt.png'), load('bg', 'assets/hero-bg-opt.jpg'),
  load('logo', 'assets/logo-white.png'), load('hero', 'assets/shot-hero.png'),
]).then(() => { ctx.font = GF(100); capK = ctx.measureText('H').actualBoundingBoxAscent / 100; return true; });

// ---------- layout ----------
const zoneH = Math.round((portrait ? 0.19 : 0.18) * H);
const V = portrait ? { x: 0, y: zoneH, w: W, h: H - zoneH } : { x: 0, y: 0, w: W, h: H - zoneH };
const zone = portrait ? { y: 0, h: zoneH } : { y: H - zoneH, h: zoneH };
const U = Math.min(W, H) / 1080, wide = V.w / V.h > 1;

// ---------- helpers ----------
function T(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
function tw(s, font) { ctx.font = font; return ctx.measureText(s).width; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
const fit = (s, ff, maxW, maxS) => Math.min(maxS, 100 * maxW / tw(s, ff(100)));
function bgImage(t, tint = 0, sc = 1.2) {
  const im = IM.bg, k = Math.max(W / im.width, H / im.height) * sc;
  ctx.drawImage(im, (W - im.width * k) / 2 + Math.sin(t * 0.35) * 40 * U, (H - im.height * k) / 2 + Math.cos(t * 0.27) * 30 * U, im.width * k, im.height * k);
  if (tint) { ctx.fillStyle = `rgba(11,11,20,${tint})`; ctx.fillRect(0, 0, W, H); }
}
const crop = (img, r, dx = r[0], dy = r[1], s = 1) => ctx.drawImage(img, r[0], r[1], r[2], r[3], dx, dy, r[2] * s, r[3] * s);
function pieceIn(img, r, t, b, dur = 0.7, from = [0, 40], scale0 = 0.9) { // drop a real crop into its native slot
  const p = bp(t, b, dur); if (p <= 0) return false; const e = E.outBack(p), q = 1 - E.outExpo(p);
  ctx.save(); ctx.translate(r[0] + r[2] / 2 + from[0] * q, r[1] + r[3] / 2 + from[1] * q); const s = lerp(scale0, 1, e); ctx.scale(s, s);
  ctx.drawImage(img, r[0], r[1], r[2], r[3], -r[2] / 2, -r[3] / 2, r[2], r[3]); ctx.restore(); return true;
}
const fillR = (r, col) => { ctx.fillStyle = col; ctx.fillRect(r[0], r[1], r[2], r[3]); };

// ---------- the product world (design coords = PromptEnhancer.png) ----------
const OW = [160, 25, 1600, 1030];
const R = {
  content: [620, 140, 1020, 905], title: [636, 148, 500, 72], card: [636, 248, 992, 250],
  chipsCover: [655, 352, 545, 40], chips: [[660, 358, 64, 27], [737, 358, 115, 27], [864, 358, 82, 27], [958, 358, 135, 27], [1105, 358, 88, 27]],
  label: [1548, 358, 60, 30], bar: [655, 393, 950, 18], enhance: [1439, 425, 164, 53], enhanceCover: [1434, 420, 174, 63],
  rows: [[636, 527, 992, 50], [636, 586, 992, 50], [636, 645, 992, 50]], header: [636, 724, 992, 62], body: [637, 787, 990, 253],
  lines: [0, 1, 2, 3, 4, 5].map(i => [655, 843 + i * 33.6, 940, 34]), copy: [1525, 740, 82, 30], navGen: [192, 228, 186, 44], navSaved: [192, 400, 186, 44],
};
// Generate.png placed in the same world: match its window to Optimize's window
const gS = 1600 / 1672, gX = 160 - 125 * gS, gY = 25 - 22 * gS;
const g2o = r => [gX + r[0] * gS, gY + r[1] * gS, r[2] * gS, r[3] * gS], gp = (x, y) => ({ x: gX + x * gS, y: gY + y * gS });
const GW = [125, 22, 1672, 1034];

function camFrom(r) { const [x, y, w, h] = r; return { cx: x + w / 2, cy: y + h / 2, w: Math.max(w * 1.06, h * 1.06 * V.w / V.h) }; }
function camKeys(keys, t) {
  const pick = k => (wide && k.l) ? k.l : k.r;
  if (t <= BEAT(keys[0].b)) return camFrom(pick(keys[0]));
  for (let i = 0; i < keys.length - 1; i++) if (t < BEAT(keys[i + 1].b)) {
    const p = (keys[i + 1].ease || E.inOutCubic)(prog(t, BEAT(keys[i].b), BEAT(keys[i + 1].b) - BEAT(keys[i].b))), a = camFrom(pick(keys[i])), c = camFrom(pick(keys[i + 1]));
    return { cx: lerp(a.cx, c.cx, p), cy: lerp(a.cy, c.cy, p), w: Math.exp(lerp(Math.log(a.w), Math.log(c.w), p)) };
  }
  return camFrom(pick(keys[keys.length - 1]));
}
const CAM = [
  { b: 6, r: [1468, 340, 214, 64], l: [1380, 320, 420, 120] },
  { b: 6.15, r: [1468, 340, 214, 64], l: [1380, 320, 420, 120] },
  { b: 8.4, r: [300, 25, 1460, 1030], l: [160, 25, 1600, 1030], ease: E.inOutQuint },
  { b: 9.4, r: [636, 240, 600, 260], l: [600, 140, 1060, 380] },
  { b: 10.6, r: [636, 240, 600, 260], l: [600, 140, 1060, 380] },
  { b: 11.6, r: [1040, 330, 600, 160], l: [636, 230, 1000, 280] },
  { b: 12.3, r: [1040, 330, 600, 160], l: [636, 230, 1000, 280] },
  { b: 13.3, r: [636, 500, 700, 220], l: [636, 230, 1000, 480] },
  { b: 13.9, r: [636, 724, 740, 320], l: [636, 520, 1000, 530] },
  { b: 16, r: [636, 724, 740, 320], l: [636, 680, 1000, 370] },
  { b: 16.8, r: [1150, 700, 480, 140], l: [900, 640, 760, 260] },
  { b: 17.4, r: [1150, 700, 480, 140], l: [900, 640, 760, 260] },
  { b: 18.2, r: [170, 200, 460, 270], l: [160, 160, 700, 340] },
  { b: 20.2, r: [170, 200, 460, 270], l: [160, 160, 700, 340] },
  { b: 20.9, r: g2o([615, 430, 640, 130]), l: g2o([560, 290, 1000, 560]) },
  { b: 22.3, r: g2o([615, 430, 640, 130]), l: g2o([560, 290, 1000, 560]) },
  { b: 22.9, r: g2o([1040, 640, 500, 120]), l: g2o([820, 560, 760, 300]) },
  { b: 23.15, r: g2o([1040, 640, 500, 120]), l: g2o([820, 560, 760, 300]) },
  { b: 24, r: g2o([1452, 703, 6, 4]), l: g2o([1452, 703, 9, 4]), ease: E.inExpo },
];
const CURSOR = [
  { b: 9.8, x: 1760, y: 720 }, { b: 11.6, x: 1521, y: 451 }, { b: 12.6, x: 1360, y: 600 }, { b: 15.2, x: 1300, y: 960 },
  { b: 16.8, x: 1566, y: 755 }, { b: 18.3, x: 285, y: 421 }, { b: 19.7, x: 285, y: 249 },
  { b: 20.6, ...gp(1180, 590) }, { b: 22.4, ...gp(1120, 600) }, { b: 22.9, ...gp(1426, 707) }, { b: 24, ...gp(1426, 707) },
];
function pathPos(pts, t) {
  if (t < BEAT(pts[0].b)) return null;
  for (let i = 0; i < pts.length - 1; i++) if (t < BEAT(pts[i + 1].b)) { const p = E.inOutCubic(prog(t, BEAT(pts[i].b), BEAT(pts[i + 1].b) - BEAT(pts[i].b))); return { x: lerp(pts[i].x, pts[i + 1].x, p), y: lerp(pts[i].y, pts[i + 1].y, p) }; }
  const l = pts[pts.length - 1]; return { x: l.x, y: l.y };
}
function arrow(x, y, k) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(5.5, 17.2); ctx.lineTo(9, 26); ctx.lineTo(13, 24.3); ctx.lineTo(9.6, 15.8); ctx.lineTo(16.5, 15.8); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.stroke(); ctx.fill(); ctx.restore(); }
function ripple(x, y, t, b, s) { const p = bp(t, b, 0.9); if (p <= 0 || p >= 1) return; const e = E.outExpo(p); ctx.strokeStyle = C.acc; ctx.lineWidth = (8 * (1 - p) + 1.5) / Math.max(s, .5); ctx.beginPath(); ctx.arc(x, y, (12 + 60 * e) / Math.max(s, .5) * 1.2, 0, 7); ctx.stroke(); }
function press(img, r, t, b) { const p = bp(t, b, 0.45); if (p <= 0 || p >= 1) return; const k = 1 - 0.07 * Math.sin(p * Math.PI); ctx.save(); ctx.translate(r[0] + r[2] / 2, r[1] + r[3] / 2); ctx.scale(k, k); ctx.drawImage(img, r[0], r[1], r[2], r[3], -r[2] / 2, -r[3] / 2, r[2], r[3]); ctx.restore(); }
function outline(r, t, b, d, s, pad = 8, rad = 14) { const p = E.outCubic(bp(t, b, d)); if (p <= 0) return; const per = 2 * (r[2] + r[3] + 4 * pad); ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 5 / Math.max(.6, Math.min(s, 2.2)) * 1.3; ctx.setLineDash([per * p, per]); rr(r[0] - pad, r[1] - pad, r[2] + 2 * pad, r[3] + 2 * pad, rad); ctx.stroke(); ctx.restore(); }

function world(t) {
  bgImage(t, 0.22);
  const cam = camKeys(CAM, t), s = V.w / cam.w;
  ctx.save(); ctx.translate(V.x + V.w / 2, V.y + V.h / 2); ctx.scale(s, s); ctx.translate(-cam.cx, -cam.cy);
  const D = TL.drops;
  if (t < BEAT(20)) {
    // window shell drops in: the real window with its content area emptied to the panel's own white
    const sp = bp(t, D.shell, 0.8);
    if (sp > 0) {
      const e = E.outExpo(sp), sc = lerp(0.94, 1, e), oy = (1 - e) * 120;
      ctx.save(); ctx.translate(OW[0] + OW[2] / 2, OW[1] + OW[3] / 2 + oy); ctx.scale(sc, sc); ctx.translate(-(OW[0] + OW[2] / 2), -(OW[1] + OW[3] / 2));
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30; ctx.fillStyle = '#000'; rr(...OW, 22); ctx.fill(); ctx.restore();
      ctx.save(); rr(...OW, 22); ctx.clip(); crop(IM.O, OW); fillR(R.content, '#fff'); ctx.restore(); ctx.restore();
    }
    pieceIn(IM.O, R.title, t, D.title, 0.7, [-60, 0]);
    if (pieceIn(IM.O, R.card, t, D.card, 0.8, [0, 90], 0.92)) {
      const cp = E.outExpo(bp(t, D.card, 0.8)), oy = (1 - cp) * 90;
      ctx.save(); ctx.translate(0, oy);
      fillR(R.chipsCover, '#fff'); fillR(R.enhanceCover, '#fff'); ctx.restore();
    }
    R.chips.forEach((c, i) => pieceIn(IM.O, c, t, D.chips[i], 0.5, [0, 0], 0.4));
    pieceIn(IM.O, R.enhance, t, D.enhance, 0.6, [0, 0], 0.5);
    // the score: real label and bar, present from the match cut on
    crop(IM.O, R.bar); crop(IM.O, R.label);
    R.rows.forEach((r, i) => { const p = bp(t, TL.rows[i], 0.6); if (p <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(r[0] - 4, r[1] - 4, r[2] + 8, r[3] + 8); ctx.clip(); crop(IM.O, r, r[0] - (1 - E.outExpo(p)) * (r[2] + 20), r[1]); ctx.restore(); });
    if (pieceIn(IM.O, R.header, t, TL.header, 0.6, [0, 30], 0.96)) {
      // enhanced prompt streams in, line by line, from the real pixels
      R.lines.forEach((ln, i) => { const p = bp(t, TL.lines[i], 0.34); if (p <= 0) return; const w = ln[2] * E.outCubic(p); ctx.save(); ctx.beginPath(); ctx.rect(ln[0], ln[1], w, ln[3]); ctx.clip(); crop(IM.O, ln); ctx.restore(); if (p < 1) { ctx.fillStyle = C.acc; ctx.fillRect(ln[0] + w + 2, ln[1] + 5, 3, ln[3] - 8); } });
    }
    press(IM.O, R.enhance, t, 12); press(IM.O, R.copy, t, 17); press(IM.O, R.navSaved, t, 18.5); press(IM.O, R.navGen, t, 20);
    outline(R.bar.slice(0, 2).concat([R.bar[2], R.bar[3]]), t, 9.3, 0.9, s, 10, 10);
    outline(R.header.slice(0, 2).concat([R.header[2], 316]), t, 14, 1.6, s, 6, 14);
    outline(R.copy, t, 17, 0.6, s, 6, 10); outline(R.navSaved, t, 18.5, 0.6, s, 4, 12);
    ripple(1521, 451, t, 12, s); ripple(1566, 755, t, 17, s); ripple(285, 421, t, 18.5, s); ripple(285, 249, t, 20, s);
  } else {
    // navigation: clicking "Generate" lands on the real Generate screen
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30; ctx.fillStyle = '#000'; rr(...g2o(GW), 22); ctx.fill(); ctx.restore();
    ctx.save(); rr(...g2o(GW), 22); ctx.clip(); ctx.drawImage(IM.G, GW[0], GW[1], GW[2], GW[3], ...g2o(GW));
    const [t0, t1, n] = TL.typing, pc = Math.floor(prog(t, BEAT(t0), BEAT(t1) - BEAT(t0)) * n) / n, tr = [630, 462, 540, 46], tx = 637 + pc * 412;
    const d = g2o(tr); ctx.fillStyle = '#fff'; ctx.fillRect(...d);
    ctx.save(); ctx.beginPath(); ctx.rect(d[0], d[1], (tx - 630) * gS + 2, d[3]); ctx.clip(); ctx.drawImage(IM.G, ...tr, ...d); ctx.restore();
    if (pc < 1 || Math.floor(t * 2.5) % 2 === 0) { const c = gp(tx + 3, 468); ctx.fillStyle = '#111827'; ctx.fillRect(c.x, c.y, 3 * gS, 32 * gS); }
    const cont = g2o([1346, 682, 160, 50]); const pr = bp(t, 23, 0.45); if (pr > 0 && pr < 1) { const k = 1 - 0.07 * Math.sin(pr * Math.PI); ctx.save(); ctx.translate(cont[0] + cont[2] / 2, cont[1] + cont[3] / 2); ctx.scale(k, k); ctx.drawImage(IM.G, 1346, 682, 160, 50, -cont[2] / 2, -cont[3] / 2, cont[2], cont[3]); ctx.restore(); }
    ctx.restore();
    const c2 = gp(1426, 707); ripple(c2.x, c2.y, t, 23, s);
  }
  const cp = pathPos(CURSOR, t); if (cp && t < BEAT(23.6)) arrow(cp.x, cp.y, 1.9 / Math.max(.75, Math.min(s, 2.4)) * 1.15);
  ctx.restore();
}

// ---------- captions ----------
function captions(t) {
  const segs = []; for (let i = 0; i < TL.captions.length; i += 2) segs.push([TL.captions[i], TL.captions[i + 1]]);
  let seg = segs[0]; for (const sg of segs) if (t >= BEAT(sg[0].b) - 1e-6) seg = sg;
  ctx.fillStyle = C.ink; ctx.fillRect(0, zone.y, W, zone.h);
  const padX = 0.07 * W, maxW = W - 2 * padX, ff = it => it.it ? SF : GF;
  const reveal = (it, x, base, size, clipW) => { const p = E.outExpo(bp(t, it.b - 0.06, 0.7)); if (p <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(x - 6, base - size * 1.0, clipW + 12, size * 1.28); ctx.clip(); T(it.s, x, base + (1 - p) * size * 1.25, ff(it)(size), it.it ? C.accT : C.paper); ctx.restore(); };
  if (portrait) {
    let size = Math.min(122 * U, zone.h * 0.32); seg.forEach(it => size = Math.min(size, fit(it.s, ff(it), maxW, 999)));
    const lh = size * 1.12, base0 = zone.y + zone.h / 2 - lh / 2 + size * 0.36;
    seg.forEach((it, i) => reveal(it, padX, base0 + i * lh, size, tw(it.s, ff(it)(size))));
  } else {
    const gap = s => s * 0.32, wAt = s => seg.reduce((a, it, i) => a + tw(it.s, ff(it)(s)) + (i ? gap(s) : 0), 0);
    const size = Math.min(zone.h * 0.44, 100 * maxW / wAt(100)); let x = padX + (maxW - wAt(size)) / 2; const base = zone.y + zone.h / 2 + size * 0.34;
    seg.forEach(it => { const w = tw(it.s, ff(it)(size)); reveal(it, x, base, size, w); x += w + gap(size); });
  }
}

// ---------- hook: YOUR PROMPT IS 40% THERE. ----------
function hookLayout() {
  const words = ['YOUR', 'PROMPT', 'IS', '40%', 'THERE.'], maxW = W * 0.88, maxCap = H * (portrait ? 0.2 : 0.3);
  const sz = words.map(w => Math.min(fit(w, GF, maxW, 9999), maxCap / capK)), gap = 0.16 * capK * Math.min(...sz);
  const tot = sz.reduce((a, z) => a + z * capK, 0) + gap * 4, k = Math.min(1, 0.86 * H / tot);
  let y = (H - tot * k) / 2; return words.map((w, i) => { const size = sz[i] * k, cap = size * capK, base = y + cap; y += cap + gap * k; return { w, size, cap, base, x: (W - tw(w, GF(size))) / 2 }; });
}
function camAt6() { const c = camKeys(CAM, BEAT(6)); return { s: V.w / c.w, c }; }
function sHook(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const L = hookLayout(), [m0, m1] = TL.morph;
  L.forEach((o, i) => {
    const p = E.outExpo(bp(t, i - 0.1, 0.62)); if (p <= 0) return;
    if (i === 3) return; // drawn below
    const ex = E.inCubic(bp(t, m0 - 0.15 + i * 0.03, 0.4));
    ctx.save(); ctx.beginPath(); ctx.rect(0, o.base - o.cap - 10, W, o.cap + 24); ctx.clip();
    T(o.w, o.x, o.base + (1 - p) * (o.cap + 30) + ex * (o.cap + 40), GF(o.size), C.paper); ctx.restore();
  });
  // "40%": slams in, then flies into the real meter label (match cut)
  const o = L[3], p = E.outExpo(bp(t, 3 - 0.1, 0.62)); if (p <= 0) return;
  const m = E.inOutCubic(bp(t, m0, m1 - m0));
  const { s, c } = camAt6(), lab = R.label, tgt = { x: V.x + V.w / 2 + (lab[0] + 6 - c.cx) * s, base: V.y + V.h / 2 + (lab[1] + 24 - c.cy) * s, size: 24 * s / capK * 0.72 };
  const size = Math.exp(lerp(Math.log(o.size), Math.log(tgt.size), m)), x = lerp(o.x, tgt.x, m), base = lerp(o.base, tgt.base, m);
  const col = m < 0.5 ? C.accT : C.red;
  if (m <= 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, o.base - o.cap - 10, W, o.cap + 24); ctx.clip(); T(o.w, o.x, o.base + (1 - p) * (o.cap + 30), GF(o.size), C.accT); ctx.restore(); }
  else T('40%', x, base, GF(size), col);
}

// ---------- number: rolling odometer to 1,000 ----------
function sNumber(t) {
  ctx.fillStyle = '#0F1424'; ctx.fillRect(0, 0, W, H); // the Continue button's own ink, so the zoom-through lands seamlessly
  const [o0, o1] = TL.odo, str = '1,000', size = fit('1,000', MF, W * 0.84, H * 0.3), cy = H * (portrait ? 0.42 : 0.44), cap = size * capK;
  ctx.font = MF(size, 800); const cw = ctx.measureText('0').width, total = ctx.measureText(str).width; let x = (W - total) / 2;
  const target = [1, null, 0, 0, 0], turns = [1, 0, 2, 3, 4];
  [...str].forEach((ch, i) => {
    const w = ctx.measureText(ch).width;
    if (ch === ',') { const cp = E.outBack(bp(t, o1 - 0.2, 0.5)); if (cp > 0) { ctx.save(); ctx.translate(x + w / 2, cy); ctx.scale(cp, cp); T(',', -w / 2, cap / 2, MF(size, 800), C.paper); ctx.restore(); } x += w; return; }
    const p = E.outExpo(prog(t, BEAT(o0) + i * 0.08, BEAT(o1) - BEAT(o0) - i * 0.08)), v = (target[i] + 10 * turns[i]) * p, d0 = Math.floor(v), fr = v - d0;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, cy - cap * 0.62, w + 8, cap * 1.24); ctx.clip();
    const lh = cap * 1.6;
    for (let k = -1; k <= 1; k++) { const d = ((d0 + k) % 10 + 10) % 10; T(String(d), x, cy + cap / 2 + (k - fr) * lh, MF(size, 800), C.paper); }
    ctx.restore(); x += w;
  });
  const land = t >= BEAT(o1) ? Math.exp(-(t - BEAT(o1)) * 8) : 0;
  const bw = W * 0.7, bx = (W - bw) / 2, by = cy + cap * 0.95 + 26 * U, fp = E.outExpo(prog(t, BEAT(o0), BEAT(o1) - BEAT(o0)));
  ctx.fillStyle = 'rgba(250,250,250,.14)'; rr(bx, by, bw, 16 * U, 8 * U); ctx.fill(); ctx.fillStyle = C.acc; rr(bx, by - land * 6 * U, Math.max(3, bw * fp), 16 * U + land * 12 * U, 8 * U); ctx.fill();
  const l1 = fit('CREDITS EVERY MONTH', GF, W * 0.84, 76 * U), lp = E.outExpo(bp(t, 25, 0.8)), y1 = by + 40 * U + l1;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y1 - l1, W, l1 * 1.25); ctx.clip(); T('CREDITS EVERY MONTH', W / 2, y1 + (1 - lp) * l1 * 1.3, GF(l1), C.paper, 'center'); ctx.restore();
  const s2 = "Start free. Upgrade when you're ready.", l2 = fit(s2, SF, W * 0.84, 56 * U), sp = E.outExpo(bp(t, 27, 0.8)), y2 = y1 + l2 * 1.45;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y2 - l2 * 1.05, W, l2 * 1.4); ctx.clip(); T(s2, W / 2, y2 + (1 - sp) * l2 * 1.4, SF(l2), C.accT, 'center'); ctx.restore();
  const s3 = '180+ PEOPLE USING IT  ·  5.0★ CHROME WEB STORE', l3 = fit(s3, MF, W * 0.86, 30 * U), pp = E.outExpo(bp(t, 28, 0.8)), y3 = H * (portrait ? 0.86 : 0.9);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y3 - l3 * 1.2, W, l3 * 1.6); ctx.clip(); T(s3, W / 2, y3 + (1 - pp) * l3 * 1.5, MF(l3, 700), 'rgba(250,250,250,.72)', 'center'); ctx.restore();
}

// ---------- CTA ----------
function ctaLayout() { return portrait ? { logoY: 0.25, logo: 0.30, wordY: 0.395, tagY: 0.52, btnY: 0.72, urlY: 0.86, ws: 150, ts: 120 } : { logoY: 0.15, logo: 0.15, wordY: 0.36, tagY: 0.53, btnY: 0.83, urlY: 0.955, ws: 118, ts: 92 }; }
function sCta(t) {
  bgImage(t, 0, 1.3); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(11,11,20,.1)'); g.addColorStop(1, 'rgba(11,11,20,.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const L = ctaLayout(), ls = L.logo * Math.min(W, H) * E.outBack(bp(t, 30.15, 0.9));
  if (ls > 0) { ctx.save(); ctx.translate(W / 2, H * L.logoY); ctx.rotate((1 - E.outExpo(bp(t, 30.15, 1.3))) * -1.2); ctx.drawImage(IM.logo, -ls / 2, -ls / 2, ls, ls); ctx.restore(); }
  const ws = fit('PromptItIn', SF, W * 0.8, L.ws * U), wp = E.outExpo(bp(t, 31, 0.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * L.wordY - ws, W, ws * 1.4); ctx.clip(); T('PromptItIn', W / 2, H * L.wordY + (1 - wp) * ws * 1.4, SF(ws), C.paper, 'center'); ctx.restore();
  const t1 = 'Log in to get', t2 = 'better prompts.', ts = Math.min(fit(t1, GF, W * 0.9, L.ts * U), fit(t2, SF, W * 0.9, L.ts * 1.08 * U));
  const p1 = E.outExpo(bp(t, 32, 0.8)), p2 = E.outExpo(bp(t, 33, 0.8));
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * L.tagY - ts, W, ts * 1.3); ctx.clip(); T(t1, W / 2, H * L.tagY + (1 - p1) * ts * 1.3, GF(ts), C.paper, 'center'); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * L.tagY + ts * 0.15, W, ts * 1.35); ctx.clip(); T(t2, W / 2, H * L.tagY + ts * 1.17 + (1 - p2) * ts * 1.3, SF(ts * 1.05), C.accT, 'center'); ctx.restore();
  const src = [1014, 800, 382, 104], bw = Math.min(W * 0.6, 540 * U), bh = bw * src[3] / src[2], bpp = E.outBack(bp(t, 34, 0.8)), by = H * L.btnY, pr = bp(t, 36, 0.45), k = pr > 0 && pr < 1 ? 1 - 0.07 * Math.sin(pr * Math.PI) : 1;
  if (bpp > 0) { ctx.save(); ctx.translate(W / 2, by); ctx.scale(bpp * k, bpp * k); rr(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip(); ctx.drawImage(IM.hero, src[0] + 2, src[1] + 2, src[2] - 4, src[3] - 4, -bw / 2, -bh / 2, bw, bh); ctx.restore(); }
  ripple(W / 2, by, t, 36, 1 / U);
  const cp = pathPos([{ b: 34.6, x: W * 0.86, y: by + 240 * U }, { b: 35.9, x: W / 2 + 22 * U, y: by + 6 * U }, { b: 40, x: W / 2 + 26 * U, y: by + 10 * U }], t); if (cp) arrow(cp.x, cp.y, 2.0 * U);
  const up = E.outExpo(bp(t, 36.5, 0.9)); ctx.save(); ctx.beginPath(); const us = Math.min(52 * U, W * 0.058); ctx.rect(0, H * L.urlY - us, W, us * 1.5); ctx.clip(); T('promptitin.com', W / 2, H * L.urlY + (1 - up) * us * 1.4, MF(us, 700), C.paper, 'center'); ctx.restore();
}

// ---------- grain / seek ----------
const grain = []; for (let g = 0; g < 6; g++) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), r = mulberry32(900 + g); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); grain.push(c); }
window.seek = function (t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); ctx.filter = 'none'; ctx.shadowColor = 'transparent';
  const b = (t - OFF) / SPB, bi = Math.floor(b + 1e-9), dt = t - BEAT(bi);
  const hits = { 0: 16, 1: 16, 2: 16, 3: 22, 4: 16, 6: 8, 12: 6, 20: 6, 24: 12, 30: 14 }, amp = (hits[bi] || 0) * U * Math.exp(-dt * 14), r = mulberry32(bi * 31 + 5);
  ctx.save(); ctx.translate((r() - .5) * 2 * amp, (r() - .5) * 2 * amp);
  if (b < 6) sHook(t);
  else if (b < 24) { world(t); captions(t); }
  else if (b < 30) sNumber(t);
  else sCta(t);
  // iris into the CTA, opening from where the logo lands
  const ip = bp(t, 29.75, 0.5);
  if (ip > 0 && ip < 1) { const L = ctaLayout(), R0 = Math.hypot(W, H), e = E.inOutCubic(ip); ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H * L.logoY, R0 * e, 0, 7); ctx.clip(); sCta(t); ctx.restore(); ctx.strokeStyle = C.acc; ctx.lineWidth = 14 * U; ctx.beginPath(); ctx.arc(W / 2, H * L.logoY, R0 * e, 0, 7); ctx.stroke(); }
  ctx.restore();
  const gi = Math.floor(t * 24) % 6, rr2 = mulberry32(Math.floor(t * 24) + 3);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.16; const ox = Math.floor(rr2() * 256), oy = Math.floor(rr2() * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) ctx.drawImage(grain[gi], x, y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
};
