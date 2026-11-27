// PromptItIn promo: a pure function of time. Real product pixels are cropped and animated; UI is never redrawn.
const FM = DATA.fmt, W = FM.w, H = FM.h, portrait = H > W, FPS = DATA.tl.fps;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
const C = { ink: '#0B0B14', paper: '#FAFAFA', acc: '#7C3AED', accT: '#A78BFA', txt: '#111827' };
const TL = DATA.tl, SPB = DATA.beats.spb, OFF = DATA.beats.offset, BEAT = b => OFF + b * SPB;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), prog = (t, t0, d) => cl((t - t0) / d), lerp = (a, b, x) => a + (b - a) * x;
const bprog = (t, b0, db) => prog(t, BEAT(b0), db * SPB);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const E = {
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x), outCubic: x => 1 - Math.pow(1 - x, 3), inCubic: x => x * x * x,
  inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const GF = (s, w = 800) => `${w} ${s}px GeistP`, MF = (s, w = 700) => `${w} ${s}px GeistMonoP`, SF = (s, w = 400) => `italic ${w} ${s}px GelasioP`;
const IM = {}; let capK = 0.71;
const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => r(); i.onerror = () => { console.error('img fail', src); r(); }; i.src = src; IM[k] = i; });
window.ready = Promise.all([
  document.fonts.load('800 100px GeistP'), document.fonts.load('400 100px GeistP'), document.fonts.load('700 100px GeistMonoP'),
  document.fonts.load('italic 400 100px GelasioP'), document.fonts.load('italic 700 100px GelasioP'),
  load('G', '../assets/generatePrompt.png'), load('O', '../assets/PromptEnhancer.png'), load('L', '../assets/PromptLibrary.png'),
  load('bg', '../assets/hero-bg-opt.jpg'), load('logo', '../assets/logo-white.png'), load('hero', '../assets/shot-hero.png'),
]).then(() => { ctx.font = GF(100); capK = ctx.measureText('H').actualBoundingBoxAscent / 100; return true; });

// ---------- layout ----------
const zoneH = Math.round((portrait ? 0.20 : 0.19) * H);
const V = portrait ? { x: 0, y: zoneH, w: W, h: H - zoneH - Math.round(0.04 * H) } : { x: 0, y: 0, w: W, h: H - zoneH };
const capZone = portrait ? { y: 0, h: zoneH } : { y: H - zoneH, h: zoneH };
const U = Math.min(W, H) / 1080;

// ---------- helpers ----------
function T(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
function tw(s, font) { ctx.font = font; return ctx.measureText(s).width; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fitFont(s, fontFn, maxW, maxS) { const w100 = tw(s, fontFn(100)); return Math.min(maxS, 100 * maxW / w100); }
function bgImage(t, tint = 0.0, sc = 1.15) {
  const im = IM.bg, k = Math.max(W / im.width, H / im.height) * sc, dx = Math.sin(t * 0.35) * 40 * U, dy = Math.cos(t * 0.27) * 30 * U;
  ctx.drawImage(im, (W - im.width * k) / 2 + dx, (H - im.height * k) / 2 + dy, im.width * k, im.height * k);
  if (tint > 0) { ctx.fillStyle = `rgba(11,11,20,${tint})`; ctx.fillRect(0, 0, W, H); }
}
function camFrom(r) { const [x, y, w, h] = r; return { cx: x + w / 2, cy: y + h / 2, w: Math.max(w * 1.06, h * 1.06 * V.w / V.h) }; }
function camKeys(keys, t) {
  if (t <= BEAT(keys[0].b)) return camFrom(keys[0].r);
  for (let i = 0; i < keys.length - 1; i++) if (t < BEAT(keys[i + 1].b)) {
    const p = E.inOutCubic(prog(t, BEAT(keys[i].b), BEAT(keys[i + 1].b) - BEAT(keys[i].b))), a = camFrom(keys[i].r), b = camFrom(keys[i + 1].r);
    return { cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), w: Math.exp(lerp(Math.log(a.w), Math.log(b.w), p)) };
  }
  return camFrom(keys[keys.length - 1].r);
}
function withCam(c, fn) { ctx.save(); ctx.translate(V.x + V.w / 2, V.y + V.h / 2); const s = V.w / c.w; ctx.scale(s, s); ctx.translate(-c.cx, -c.cy); fn(s); ctx.restore(); }
function pathPos(pts, t) { // pts: [{b,x,y}] eased between; null before first
  if (t < BEAT(pts[0].b)) return null;
  for (let i = 0; i < pts.length - 1; i++) if (t < BEAT(pts[i + 1].b)) { const p = E.inOutCubic(prog(t, BEAT(pts[i].b), BEAT(pts[i + 1].b) - BEAT(pts[i].b))); return { x: lerp(pts[i].x, pts[i + 1].x, p), y: lerp(pts[i].y, pts[i + 1].y, p) }; }
  const l = pts[pts.length - 1]; return { x: l.x, y: l.y };
}
function cursor(p, s) { if (!p) return; ctx.save(); ctx.translate(p.x, p.y); const k = 1.7 / s * Math.max(s, 0.9) * 1.0; ctx.scale(k, k); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(5.5, 17.2); ctx.lineTo(9, 26); ctx.lineTo(13, 24.3); ctx.lineTo(9.6, 15.8); ctx.lineTo(16.5, 15.8); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.6; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.stroke(); ctx.fill(); ctx.restore(); }
function ripple(x, y, t, b, s) { const p = bprog(t, b, 0.8); if (p <= 0 || p >= 1) return; const e = E.outExpo(p); ctx.strokeStyle = C.acc; ctx.lineWidth = 7 * (1 - p) + 1; ctx.beginPath(); ctx.arc(x, y, 14 + 70 * e, 0, 7); ctx.stroke(); }
function press(img, r, t, b) { const p = bprog(t, b, 0.45); if (p <= 0 || p >= 1) return; const k = 1 - 0.06 * Math.sin(p * Math.PI); const [x, y, w, h] = r; ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.drawImage(img, x, y, w, h, -w / 2, -h / 2, w, h); ctx.restore(); }
function outline(r, t, b, d, pad = 8, rad = 18) { const p = E.outCubic(bprog(t, b, d)); if (p <= 0) return; const [x, y, w, h] = r; const per = 2 * (w + h); ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.setLineDash([per * p, per]); rr(x - pad, y - pad, w + 2 * pad, h + 2 * pad, rad); ctx.stroke(); ctx.restore(); }
function winCard(img, w, r = 24) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26; ctx.fillStyle = '#000'; rr(w[0], w[1], w[2], w[3], r); ctx.fill(); ctx.restore();
  ctx.save(); rr(w[0], w[1], w[2], w[3], r); ctx.clip(); ctx.drawImage(img, w[0], w[1], w[2], w[3], w[0], w[1], w[2], w[3]); ctx.restore();
}

// ---------- captions (zone) ----------
function caption(items, t) { // items: [{s, b, it}]
  ctx.fillStyle = C.ink; ctx.fillRect(0, capZone.y, W, capZone.h);
  const padX = 0.07 * W, maxW = W - 2 * padX;
  if (portrait) {
    const lines = items.filter(it => t >= BEAT(it.b) - 0.3); const n = Math.max(lines.length, 1);
    let size = Math.min(150 * U, capZone.h * 0.30);
    for (const it of items) size = Math.min(size, fitFont(it.s, it.it ? (s => SF(s, 700)) : GF, maxW, 999));
    const lh = size * 1.06, y0 = capZone.y + capZone.h / 2 + (items.length * lh) / 2 - lh * 0.16 - (items.length - 1) * lh * 0.0;
    items.forEach((it, i) => { const p = E.outExpo(bprog(t, it.b - 0.08, 0.7)), base = y0 - (items.length - 1 - i) * lh; ctx.save(); ctx.beginPath(); ctx.rect(0, base - lh * 0.95, W, lh * 1.05); ctx.clip(); T(it.s, padX, base + (1 - p) * lh, it.it ? SF(size, 700) : GF(size), it.it ? C.accT : C.paper); ctx.restore(); });
  } else {
    const full = items.map(i => i.s).join(' '); const fontOf = it => it.it ? (s => SF(s, 700)) : GF;
    let size = 100; const wAt = sz => items.reduce((a, it, i) => a + tw(it.s, fontOf(it)(sz)) + (i ? sz * 0.3 : 0), 0); size = Math.min(capZone.h * 0.46, 100 * maxW / wAt(100));
    let x = padX + (maxW - wAt(size)) / 2; const base = capZone.y + capZone.h / 2 + size * 0.3;
    items.forEach((it, i) => { const f = fontOf(it)(size), w = tw(it.s, f), p = E.outExpo(bprog(t, it.b - 0.08, 0.7)); ctx.save(); ctx.beginPath(); ctx.rect(x - 4, base - size * 0.95, w + 8, size * 1.2); ctx.clip(); T(it.s, x, base + (1 - p) * size, f, it.it ? C.accT : C.paper); ctx.restore(); x += w + size * 0.3; });
  }
}

// ---------- scene 1 : hook (5 words, huge) ----------
function sHook(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const words = ['VAGUE', 'PROMPTS', 'GET', 'VAGUE', 'ANSWERS.'], blur = [0, 0, 0, 22, 30], maxW = W * 0.9;
  const sz0 = words.map(w => fitFont(w, GF, maxW, 9999)), gap0 = 0.14 * sz0[0] * capK;
  const total = sz0.reduce((a, z) => a + z * capK, 0) + gap0 * 4, k = Math.min(1, 0.88 * H / total);
  let y = (H - total * k) / 2;
  words.forEach((w, i) => {
    const size = sz0[i] * k, cap = size * capK, base = y + cap; y += cap + gap0 * k;
    const p = E.outExpo(bprog(t, i - 0.1, 0.62)); if (p <= 0) return;
    const x = (W - tw(w, GF(size))) / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, base - cap - 10, W, cap + 24); ctx.clip();
    const bl = blur[i] * (0.6 + 0.4 * Math.sin(t * 5 + i)) * U * k; if (bl > 0.5) ctx.filter = `blur(${bl.toFixed(1)}px)`;
    T(w, x, base + (1 - p) * (cap + 30), GF(size), i === 4 ? C.accT : C.paper); ctx.filter = 'none'; ctx.restore();
  });
}

// ---------- scene 2/3 : Generate UI (real pixels) ----------
const GW = [125, 22, 1672, 1034];
const XS = [358, 615, 1528, 1797], YS = [86, 440, 760, 1056];
const GT = [[125, 22, 1672, 64], [125, 86, 233, 970]];
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) GT.push([XS[c], YS[r], XS[c + 1] - XS[c], YS[r + 1] - YS[r]]);
const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 1], [-1, 0], [1, 0]];
function drawG(t) {
  bgImage(t, 0.18);
  const G_ALL = [125, 22, 1672, 1034], G_IN = [615, 300, 914, 520], G_PUSH = [880, 520, 650, 320];
  const cam = camKeys([{ b: 6, r: G_ALL }, { b: 9, r: G_ALL }, { b: 9.9, r: G_IN }, { b: 13, r: G_IN }, { b: 13.9, r: G_PUSH }, { b: 16, r: G_PUSH }], t);
  withCam(cam, s => {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26; ctx.fillStyle = 'rgba(0,0,0,.0)'; ctx.restore();
    GT.forEach((tile, k) => {
      const p = E.outExpo(bprog(t, TL.tileBeats[k], 0.95)); if (p <= 0) return;
      const d = DIRS[k], q = 1 - p; ctx.save(); ctx.translate(tile[0] + tile[2] / 2 + d[0] * 900 * q, tile[1] + tile[3] / 2 + d[1] * 700 * q); ctx.rotate(d[0] * 0.18 * q); const sc = 1 - 0.25 * q; ctx.scale(sc, sc);
      ctx.drawImage(IM.G, tile[0], tile[1], tile[2], tile[3], -tile[2] / 2, -tile[3] / 2, tile[2], tile[3]); ctx.restore();
    });
    if (t >= BEAT(8.9)) { // typed text: real pixels revealed left to right
      const [t0, t1, n] = TL.typing, pc = Math.floor(prog(t, BEAT(t0), BEAT(t1) - BEAT(t0)) * n) / n, tx = 637 + pc * 412;
      ctx.fillStyle = '#fff'; ctx.fillRect(630, 462, 540, 46);
      ctx.save(); ctx.beginPath(); ctx.rect(630, 462, tx - 630 + 2, 46); ctx.clip(); ctx.drawImage(IM.G, 630, 462, 540, 46, 630, 462, 540, 46); ctx.restore();
      if (pc < 1 || Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = C.txt; ctx.fillRect(tx + 3, 468, 3, 32); }
    }
    press(IM.G, [1346, 682, 160, 50], t, 14);
    ripple(900, 560, t, 9.5, s); ripple(1426, 707, t, 14, s);
    const cp = pathPos([{ b: 8.7, x: 1700, y: 900 }, { b: 9.5, x: 900, y: 560 }, { b: 11.6, x: 960, y: 575 }, { b: 13.9, x: 1426, y: 707 }, { b: 16, x: 1440, y: 716 }], t); cursor(cp, s);
  });
}
function capG(t) {
  if (t < BEAT(12)) caption([{ s: 'MEET', b: 6 }, { s: 'PromptItIn.', b: 7, it: 1 }], t);
  else caption([{ s: 'ROUGH IDEA →', b: 12 }, { s: 'structured prompt.', b: 14, it: 1 }], t);
}

// ---------- scene 4 : Optimize (real) ----------
const OW = [160, 25, 1600, 1030];
function drawO(t, key, c0, keys, curs, clicks, fx2) {
  bgImage(t, 0.18);
  const sl = E.outExpo(bprog(t, c0, 0.8)), cam = camKeys(keys, t); cam.w *= 1 + 0.06 * (1 - sl);
  withCam(cam, s => { winCard(IM[key], OW); fx2(t, s); clicks.forEach(([x, y, b]) => ripple(x, y, t, b, s)); cursor(pathPos(curs, t), s); });
}
const O_IN = [636, 148, 992, 350], O_ENH = [636, 500, 992, 540];
function drawF2(t) {
  drawO(t, 'O', 16, [{ b: 16, r: O_IN }, { b: 17.6, r: O_IN }, { b: 18.6, r: O_ENH }, { b: 20, r: O_ENH }],
    [{ b: 16.2, x: 1750, y: 650 }, { b: 17.9, x: 1521, y: 451 }, { b: 19, x: 1300, y: 900 }, { b: 20, x: 1290, y: 905 }], [[1521, 451, 18]],
    (t, s) => { press(IM.O, [1439, 425, 164, 53], t, 18); outline([660, 357, 943, 52], t, 16.3, 0.9, 8, 14); outline([636, 724, 991, 316], t, 18.3, 1.2, 6, 14); });
}
function drawF3(t) {
  drawO(t, 'L', 20, [{ b: 20, r: O_ENH }, { b: 22, r: O_ENH }, { b: 23, r: [150, 330, 520, 340] }, { b: 24, r: [150, 330, 520, 340] }],
    [{ b: 20.2, x: 1250, y: 880 }, { b: 21.4, x: 1566, y: 755 }, { b: 22.9, x: 285, y: 421 }, { b: 24, x: 290, y: 425 }], [[1566, 755, 21.5], [285, 421, 23]],
    (t, s) => { outline([1528, 742, 78, 28], t, 21.5, 0.5, 8, 12); outline([192, 400, 187, 44], t, 23, 0.5, 6, 12); });
}

// ---------- scene 5 : the number ----------
function sNumber(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const [c0, c1] = TL.counter, p = E.outExpo(prog(t, BEAT(c0), BEAT(c1) - BEAT(c0))), v = Math.round(1000 * p);
  const s = v.toLocaleString('en-US'), size = fitFont('1,000', MF, W * 0.86, H * 0.33), cy = H * (portrait ? 0.43 : 0.46);
  const land = Math.exp(-Math.max(0, t - BEAT(c1)) * 9) * (t >= BEAT(c1) ? 1 : 0);
  ctx.save(); ctx.translate(W / 2, cy); ctx.scale(1 + 0.06 * land, 1 + 0.06 * land); T(s, 0, capK * size * 0.5, MF(size, 800), C.paper, 'center'); ctx.restore();
  const bw = W * 0.72, bx = (W - bw) / 2, by = cy + size * 0.62; ctx.fillStyle = 'rgba(250,250,250,.14)'; rr(bx, by, bw, 18 * U, 9 * U); ctx.fill(); ctx.fillStyle = C.acc; rr(bx, by, Math.max(2, bw * p), 18 * U, 9 * U); ctx.fill();
  const lp = E.outExpo(bprog(t, 24.3, 0.8)), l1 = fitFont('CREDITS EVERY MONTH', GF, W * 0.86, 78 * U);
  ctx.save(); ctx.beginPath(); ctx.rect(0, by + 40 * U, W, l1 * 1.3); ctx.clip(); T('CREDITS EVERY MONTH', W / 2, by + 40 * U + l1 + (1 - lp) * l1 * 1.4, GF(l1), C.paper, 'center'); ctx.restore();
  const sp = E.outExpo(bprog(t, 27, 0.8)), l2 = fitFont("Start free. Upgrade when you're ready.", s => SF(s, 400), W * 0.86, 58 * U);
  ctx.save(); ctx.beginPath(); ctx.rect(0, by + 40 * U + l1 * 1.25, W, l2 * 1.5); ctx.clip(); T("Start free. Upgrade when you're ready.", W / 2, by + 40 * U + l1 * 1.25 + l2 * 1.05 + (1 - sp) * l2 * 1.6, SF(l2), C.accT, 'center'); ctx.restore();
  const pp = E.outExpo(bprog(t, 28, 0.8)), l3 = fitFont('180+ PEOPLE USING IT  ·  5.0★ CHROME WEB STORE', MF, W * 0.88, 34 * U);
  ctx.globalAlpha = pp; T('180+ PEOPLE USING IT  ·  5.0★ CHROME WEB STORE', W / 2, H - (portrait ? 0.1 : 0.07) * H, MF(l3, 700), 'rgba(250,250,250,.7)', 'center'); ctx.globalAlpha = 1;
}

// ---------- scene 6 : logo lockup + CTA ----------
function sCta(t) {
  bgImage(t, 0.0, 1.25); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(11,11,20,.15)'); g.addColorStop(1, 'rgba(11,11,20,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const lg = portrait ? { logoY: 0.27, wordY: 0.395, tagY: 0.52, btnY: 0.72, urlY: 0.87 } : { logoY: 0.15, wordY: 0.355, tagY: 0.53, btnY: 0.84, urlY: 0.955 };
  const ls = (portrait ? 0.3 : 0.15) * Math.min(W, H) * E.outBack(bprog(t, 30.3, 0.9)); ctx.save(); ctx.translate(W / 2, H * lg.logoY); ctx.rotate((1 - E.outExpo(bprog(t, 30.3, 1.2))) * -0.8); ctx.drawImage(IM.logo, -ls / 2, -ls / 2, ls, ls * IM.logo.height / IM.logo.width); ctx.restore();
  const ws = fitFont('PromptItIn', s => SF(s, 700), W * 0.8, (portrait ? 150 : 120) * U), wp = E.outExpo(bprog(t, 31, 0.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * lg.wordY - ws, W, ws * 1.4); ctx.clip(); T('PromptItIn', W / 2, H * lg.wordY + (1 - wp) * ws * 1.4, SF(ws, 700), C.paper, 'center'); ctx.restore();
  const t1 = 'Log in to get', t2 = 'better prompts.', ts = Math.min(fitFont(t1, GF, W * 0.9, (portrait ? 120 : 92) * U), fitFont(t2, s => SF(s, 700), W * 0.9, (portrait ? 130 : 98) * U)), p1 = E.outExpo(bprog(t, 32, 0.8)), p2 = E.outExpo(bprog(t, 33, 0.8));
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * lg.tagY - ts, W, ts * 1.3); ctx.clip(); T(t1, W / 2, H * lg.tagY + (1 - p1) * ts * 1.3, GF(ts), C.paper, 'center'); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * lg.tagY + ts * 0.15, W, ts * 1.3); ctx.clip(); T(t2, W / 2, H * lg.tagY + ts * 1.15 + (1 - p2) * ts * 1.3, SF(ts * 1.05, 700), C.accT, 'center'); ctx.restore();
  // real "Start Building →" pill, cropped from the live hero
  const src = [1014, 800, 382, 104], bw = Math.min(W * 0.62, 560 * U), bh = bw * src[3] / src[2], bp = E.outBack(bprog(t, 34, 0.8)), by = H * lg.btnY;
  const press_ = bprog(t, 36, 0.45), k = press_ > 0 && press_ < 1 ? 1 - 0.07 * Math.sin(press_ * Math.PI) : 1;
  ctx.save(); ctx.translate(W / 2, by); ctx.scale(bp * k, bp * k); rr(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip(); ctx.drawImage(IM.hero, src[0] + 2, src[1] + 2, src[2] - 4, src[3] - 4, -bw / 2, -bh / 2, bw, bh); ctx.restore();
  const cx2 = W / 2, cy2 = by; ripple(cx2, cy2, t, 36, 1);
  const cp = pathPos([{ b: 34.6, x: W * 0.85, y: by + 220 * U }, { b: 35.9, x: W / 2 + 20 * U, y: by + 6 * U }, { b: 40, x: W / 2 + 24 * U, y: by + 8 * U }], t); if (cp) { ctx.save(); ctx.translate(cp.x, cp.y); const k2 = 2.0 * U; ctx.scale(k2, k2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(5.5, 17.2); ctx.lineTo(9, 26); ctx.lineTo(13, 24.3); ctx.lineTo(9.6, 15.8); ctx.lineTo(16.5, 15.8); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.6; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.stroke(); ctx.fill(); ctx.restore(); }
  const up = E.outExpo(bprog(t, 36.5, 0.9)); ctx.globalAlpha = up; T('promptitin.com', W / 2, H * lg.urlY + (1 - up) * 30 * U, MF(Math.min(54 * U, W * 0.06), 700), C.paper, 'center'); ctx.globalAlpha = 1;
}

// ---------- wipes ----------
const polyF = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
const WIPES = {
  6: p => { const c = p < .5, e = E.inOutCubic(c ? p * 2 : (p - .5) * 2); ctx.fillStyle = C.acc; c ? ctx.fillRect(0, 0, W * e, H) : ctx.fillRect(W * e, 0, W - W * e, H); },
  16: p => { const c = p < .5, n = 6; for (let i = 0; i < n; i++) { const q = cl(((c ? p * 2 : (p - .5) * 2) - .1 * i) / .5), e = E.inOutCubic(q); ctx.fillStyle = C.paper; c ? ctx.fillRect(W - W * e, i * H / n, W * e + 1, H / n + 1) : ctx.fillRect(0, i * H / n, W - W * e, H / n + 1); } },
  20: p => { const c = p < .5, R = Math.hypot(W, H) / 2 * 1.05, e = c ? E.outCubic(p * 2) : E.inCubic((p - .5) * 2); ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * (c ? e : 1), 0, 7); if (!c) { ctx.moveTo(W / 2 + R * e, H / 2); ctx.arc(W / 2, H / 2, R * e, 0, 7, true); } ctx.fill('evenodd'); },
  24: p => { const c = p < .5, e = E.inOutCubic(c ? p * 2 : (p - .5) * 2), ed = -300 + (W + 600) * e; c ? polyF([[0, 0], [ed + 300, 0], [ed, H], [0, H]], C.ink) : polyF([[ed + 300, 0], [W, 0], [W, H], [ed, H]], C.ink); },
  30: p => { const c = p < .5, n = 8; for (let i = 0; i < n; i++) { const q = cl(((c ? p * 2 : (p - .5) * 2) - .1 * i) / .5), e = E.inOutCubic(q); ctx.fillStyle = C.acc; c ? ctx.fillRect(i * W / n, 0, W / n + 1, H * e) : ctx.fillRect(i * W / n, H * e, W / n + 1, H - H * e); } },
};
const WD = 0.17;
const grain = []; for (let g = 0; g < 6; g++) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), r = mulberry32(900 + g); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); grain.push(c); }

window.seek = function (t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); ctx.filter = 'none'; ctx.shadowColor = 'transparent';
  const b = (t - OFF) / SPB, cuts = TL.cuts; let si = 0; for (let i = 0; i < cuts.length - 1; i++) if (b >= cuts[i] - 1e-6) si = i;
  const bi = Math.floor(b + 1e-9), dt = t - BEAT(bi);
  const r = mulberry32(bi * 31 + 5), hitBeats = [0, 1, 2, 3, 4, 6, 16, 20, 24, 30], amp = (hitBeats.includes(bi) ? (si === 0 ? 16 : 9) : 0) * U * Math.exp(-dt * 14);
  ctx.save(); ctx.translate((r() - .5) * 2 * amp, (r() - .5) * 2 * amp);
  if (si === 0) sHook(t);
  else if (si === 1) { drawG(t); capG(t); }
  else if (si === 2) { drawF2(t); caption([{ s: 'PASTE PRE-MADE PROMPT.', b: 16 }, { s: 'Get polished.', b: 18, it: 1 }], t); }
  else if (si === 3) { drawF3(t); caption([{ s: 'SAVE ONCE.', b: 20 }, { s: 'Reuse anywhere.', b: 22, it: 1 }], t); }
  else if (si === 4) sNumber(t);
  else sCta(t);
  ctx.restore();
  for (const k of Object.keys(WIPES)) { const tc = BEAT(+k), p = (t - (tc - WD)) / (2 * WD); if (p > 0 && p < 1) WIPES[k](p); }
  const gi = Math.floor(t * 24) % 6, rr2 = mulberry32(Math.floor(t * 24) + 3);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.18; const ox = Math.floor(rr2() * 256), oy = Math.floor(rr2() * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) ctx.drawImage(grain[gi], x, y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
};
