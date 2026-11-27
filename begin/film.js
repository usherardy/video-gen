// BEGIN — 15s launch film. Pure function of time: window.seek(t) paints frame t. Every UI pixel is the app's own
// (App Store screenshots); the only drawn UI states are taps, done-ticks and selection rings on real elements.
const FM = DATA.fmt, W = FM.w, H = FM.h, TL = DATA.tl;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
const SPB = DATA.beats.spb, OFF = DATA.beats.offset, BEAT = b => OFF + b * SPB;
// brand (begin/src/features/home/homeTheme.ts)
const C = { ink: '#050506', text: '#FFF9F4', soft: '#E7DEE0', muted: '#929399', y: '#FFD60A', yHi: '#FFE98A', onY: '#0A0A0B' };
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, x) => a + (b - a) * x;
const prog = (t, t0, d) => cl((t - t0) / d), bp = (t, b0, db) => prog(t, BEAT(b0), db * SPB);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const E = {
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x), outCubic: x => 1 - Math.pow(1 - x, 3), inCubic: x => x * x * x,
  inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, inOutQuint: x => x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2,
  outBack: x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const AF = s => `${s}px AntonB`, GF = (s, w = 600) => `${w} ${s}px GeistB`;
const U = Math.min(W, H) / 1080;
const IM = {}; let capA = 0.73;
const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => r(); i.onerror = () => { console.error('img fail', src); r(); }; i.src = src; IM[k] = i; });
window.ready = Promise.all([
  document.fonts.load('400 100px AntonB'), document.fonts.load('800 100px GeistB'), document.fonts.load('500 100px GeistB'),
  load('A', 'assets/shot1.png'), load('S', 'assets/shot2.png'), load('P', 'assets/shot3.png'), load('F', 'assets/shot7.png'), load('icon', 'assets/icon.png'),
]).then(() => { ctx.font = AF(100); capA = ctx.measureText('H').actualBoundingBoxAscent / 100; return true; });

// ---------- real-UI sources: crop rects inside the App Store screenshots (1206x2622) ----------
const SRC = {
  A: { r: [110, 1080, 990, 1542], pill: [152, 1985, 898, 215] },                        // alarm: Gym 3:18, Start mission
  S: { r: [125, 760, 955, 1540], person: [600, 1550] },                                 // squat mission 1 / 3
  P: { r: [95, 960, 1010, 1662], tiles: [[145, 1335, 445, 395], [617, 1335, 445, 395], [145, 1760, 445, 385], [617, 1760, 445, 385], [145, 2175, 445, 375]] },
  F: { r: [135, 820, 950, 1700], dots: [[220, 1565], [220, 1777], [220, 2002], [220, 2225]], rows: [null, [262, 1720, 758, 170], [262, 1945, 758, 170], [262, 2168, 758, 170]] },
};

// ---------- layout ----------
const portrait = H > W, zoneH = Math.round((portrait ? 0.19 : 0.2) * H);
const CARD = portrait ? { x: 0.05 * W, y: zoneH + 22 * U, w: 0.9 * W, h: H - zoneH - 58 * U } : { x: 0.5 * W, y: 0.08 * H, w: 0.42 * W, h: 0.84 * H };
const RAD = 46 * U;

// ---------- helpers ----------
function T(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
function tw(s, font) { ctx.font = font; return ctx.measureText(s).width; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
const fitA = (s, maxW) => 100 * maxW / tw(s, AF(100));
// cover-fit a source crop into a rect, with zoom z around focus (fx, fy) in source px. Returns the src->screen mapper.
function card(key, R, z = 1, fx, fy, radius = RAD) {
  const s = SRC[key].r, k0 = Math.max(R.w / s[2], R.h / s[3]) * z, sw = R.w / k0, sh = R.h / k0;
  const cx = cl(fx ?? s[0] + s[2] / 2, s[0] + sw / 2, s[0] + s[2] - sw / 2), cy = cl(fy ?? s[1] + s[3] / 2, s[1] + sh / 2, s[1] + s[3] - sh / 2);
  const sx = cx - sw / 2, sy = cy - sh / 2;
  ctx.save(); rr(R.x, R.y, R.w, R.h, radius); ctx.clip(); ctx.fillStyle = '#0A0A0B'; ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.drawImage(IM[key], sx, sy, sw, sh, R.x, R.y, R.w, R.h); ctx.restore();
  ctx.save(); rr(R.x, R.y, R.w, R.h, radius); ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 2 * U; ctx.stroke(); ctx.restore();
  const k = R.w / sw; return { k, p: (px, py) => [R.x + (px - sx) * k, R.y + (py - sy) * k], R };
}
function stage(fn) { if (!portrait) return fn(); ctx.save(); ctx.beginPath(); ctx.rect(0, zoneH, W, H - zoneH); ctx.clip(); const r = fn(); ctx.restore(); return r; }
const cardAt = (dx = 0, dy = 0, sc = 1) => ({ x: CARD.x + dx + CARD.w * (1 - sc) / 2, y: CARD.y + dy + CARD.h * (1 - sc) / 2, w: CARD.w * sc, h: CARD.h * sc });

// ---------- hook: SNOOZE. / 5 MORE MIN. / TOMORROW. / MONDAY. ----------
const STAMPS = ['6:30', '6:39', '6:48', '6:57'];
function wordLines(i) { const w = TL.words[i]; return w === '5 MORE MIN.' ? ['5 MORE', 'MIN.'] : [w]; }
function wordLayout(i) {
  const lines = wordLines(i), bleed = portrait ? 1.08 : 0.9;
  const size = Math.min(...lines.map(l => fitA(l, W * bleed))), cap = size * capA, gap = cap * 0.14;
  const tot = lines.length * cap + (lines.length - 1) * gap, top = H * 0.47 - tot / 2;
  return { lines, size, cap, rows: lines.map((l, j) => ({ l, base: top + cap + j * (cap + gap) })), bottom: top + tot };
}
function drawWord(i, t, dy, sc, col = C.text) {
  const L = wordLayout(i), cx = W / 2, cy = H * 0.47;
  ctx.save(); ctx.translate(cx, cy + dy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  L.rows.forEach(r => T(r.l, W / 2, r.base, AF(L.size), col, 'center'));
  ctx.restore(); return L;
}
function sHook(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const b = (t - OFF) / SPB, frozen = b >= TL.silence, i = Math.min(3, Math.max(0, Math.floor(b)));
  const inP = E.outExpo(prog(t, BEAT(i), 0.2)), held = frozen ? BEAT(TL.silence) - BEAT(3) : t - BEAT(i);
  // the new excuse shoves the previous one up and out: one rigid push
  if (i > 0 && inP < 1) drawWord(i - 1, t, -inP * H * 0.62, 1.06, C.muted);
  const L = drawWord(i, t, (1 - inP) * H * 0.62, (1.14 - 0.14 * inP) * (1 + 0.03 * held));
  // the alarm keeps getting pushed: 9-minute snoozes, under the word
  const sy = L.bottom + 150 * U + (1 - inP) * H * 0.62;
  ctx.globalAlpha = cl(inP * 1.4); T(STAMPS[i], W / 2, sy, GF(64 * U, 600), C.muted, 'center');
  const bw = tw(STAMPS[i], GF(64 * U, 600)); ctx.fillStyle = C.muted; ctx.fillRect(W / 2 - bw / 2 - 52 * U, sy - 22 * U, 30 * U, 4 * U); ctx.fillRect(W / 2 + bw / 2 + 22 * U, sy - 22 * U, 30 * U, 4 * U);
  ctx.globalAlpha = 1;
  // dead stop, then a yellow strike drags through MONDAY
  const sp = E.outCubic(bp(t, TL.strike[0], TL.strike[1] - TL.strike[0]));
  if (sp > 0) strikeBar(t, sp, L);
}
function strikeGeom(L) { const r = L.rows[0]; return { cy: r.base - L.cap * 0.47, th: L.cap * 0.13, ang: -0.055 }; }
function strikeBar(t, sp, L) {
  const g = strikeGeom(L); ctx.save(); ctx.translate(W / 2, g.cy); ctx.rotate(g.ang);
  ctx.fillStyle = C.y; ctx.fillRect(-W * 0.62, -g.th / 2, W * 1.24 * sp, g.th); ctx.restore();
}

// ---------- BEGIN: the strike floods the frame, BEGIN slams, a thumb taps, the yellow becomes the real button ----------
function alarmCam(t) { // camera on the alarm screen: starts tight on the Start mission pill, pulls out to the whole screen
  const e = E.inOutQuint(bp(t, TL.morph[0], TL.morph[1] - TL.morph[0])), P = SRC.A.pill, drift = bp(t, TL.morph[1], 3) * 0.04;
  return { z: lerp(2.6, 1, e) + drift, fx: lerp(P[0] + P[2] / 2, SRC.A.r[0] + SRC.A.r[2] / 2, e), fy: lerp(P[1] + P[3] / 2, SRC.A.r[1] + SRC.A.r[3] / 2, e) };
}
function pillScreen(M) { const P = SRC.A.pill, a = M.p(P[0], P[1]), b2 = M.p(P[0] + P[2], P[1] + P[3]); return { x: a[0], y: a[1], w: b2[0] - a[0], h: b2[1] - a[1] }; }
function beginWord(R, alpha = 1) { // giant cropped BEGIN inside rect R
  const size = fitA('BEGIN', R.w * (portrait ? 1.12 : 0.9)), cap = size * capA;
  ctx.save(); rr(R.x, R.y, R.w, R.h, Math.min(R.h / 2, R.r || 0)); ctx.clip(); ctx.globalAlpha = alpha;
  T('BEGIN', R.x + R.w / 2, R.y + R.h / 2 + cap / 2, AF(size), C.onY, 'center'); ctx.restore();
}
function sFlood(t) {
  const fl = E.inOutCubic(bp(t, TL.flood, 0.36)), L = wordLayout(3), g = strikeGeom(L);
  if (fl < 1) { sHook(Math.min(t, BEAT(TL.flood) - 1e-3)); ctx.save(); ctx.translate(W / 2, g.cy); ctx.rotate(g.ang * (1 - fl)); const h = lerp(g.th, H * 2.2, fl); ctx.fillStyle = C.y; ctx.fillRect(-W, -h / 2, W * 2, h); ctx.restore(); }
  else { ctx.fillStyle = C.y; ctx.fillRect(0, 0, W, H); }
  const sl = E.outExpo(bp(t, TL.flood + 0.12, 0.4));
  if (sl > 0) { ctx.save(); const s = lerp(1.5, 1, sl); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); beginWord({ x: 0, y: 0, w: W, h: H }, cl(sl * 3)); ctx.restore(); }
  // where the button will be once the screen pulls out
  const M = cardProbe(t), Pf = pillScreen(M), tx = Pf.x + Pf.w / 2, ty = Pf.y + Pf.h / 2;
  tapMark(t, TL.tap, tx, ty, C.onY);
}
function cardProbe(t) { // the alarm card's mapper at the end of the morph, without drawing it
  const s = SRC.A.r, R = cardAt(), k0 = Math.max(R.w / s[2], R.h / s[3]), sw = R.w / k0, sh = R.h / k0, sx = s[0] + s[2] / 2 - sw / 2, sy = s[1] + s[3] / 2 - sh / 2, k = R.w / sw;
  return { p: (px, py) => [R.x + (px - sx) * k, R.y + (py - sy) * k] };
}
function tapMark(t, b0, x, y, col) { // fingertip press + one ripple
  const p = bp(t, b0 - 0.25, 0.25), r = bp(t, b0, 1.1);
  if (p > 0 && r < 1) { const press = b0 * SPB + OFF > t ? E.outCubic(p) : 1 - E.outCubic(bp(t, b0, 0.35)); ctx.save(); ctx.globalAlpha = 0.28 * press; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, (62 - 10 * press) * U, 0, 7); ctx.fill(); ctx.restore(); }
  if (r > 0 && r < 1) { const e = E.outCubic(r); ctx.save(); ctx.globalAlpha = 1 - r; ctx.strokeStyle = col; ctx.lineWidth = 7 * U * (1 - r) + 1; ctx.beginPath(); ctx.arc(x, y, lerp(50, 300, e) * U, 0, 7); ctx.stroke(); ctx.restore(); }
}
function sAlarm(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const cam = alarmCam(t), tapB = TL.startTap, press = 1 - 0.035 * Math.sin(Math.PI * bp(t, tapB - 0.05, 0.5));
  const M = stage(() => card('A', cardAt(0, 0, press), cam.z, cam.fx, cam.fy));
  captions(t);
  const mp = bp(t, TL.morph[0], TL.morph[1] - TL.morph[0]);
  if (mp < 1) { // the yellow field closes down onto the real Start mission pill
    // the field lands exactly on the pill a little before the camera settles, then hands over to the real button
    const e = E.inOutCubic(cl(mp / 0.84)), Pc = pillScreen(M), R = { x: lerp(0, Pc.x, e), y: lerp(0, Pc.y, e), w: lerp(W, Pc.w, e), h: lerp(H, Pc.h, e) }, r = lerp(0, Pc.h / 2, e);
    ctx.save(); ctx.globalAlpha = 1 - cl((mp - 0.84) / 0.16); ctx.fillStyle = C.y; rr(R.x, R.y, R.w, R.h, r); ctx.fill();
    beginWord({ ...R, r }, 1 - cl(e * 2.2)); ctx.restore();
  }
  const Pc = pillScreen(M); tapMark(t, tapB, Pc.x + Pc.w * 0.5, Pc.y + Pc.h / 2, C.onY);
}

// ---------- squats ----------
function sSquat(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const b0 = TL.squat[0], inP = E.outExpo(bp(t, b0 - 0.1, 0.8)), S = SRC.S;
  let bump = 0; TL.reps.forEach(rb => { const q = bp(t, rb, 0.6); if (q > 0 && q < 1) bump += Math.sin(Math.PI * q) * (1 - q) * 0.025; });
  // push-in lands on the rep-2 beat, so the screen's own static '1 / 3' counter leaves frame before the tally passes it
  const pi = E.inOutCubic(bp(t, TL.reps[0] + 0.5, TL.reps[1] - TL.reps[0] - 0.6)), z = lerp(1, 1.28, pi) + 0.04 * bp(t, TL.reps[1], 3);
  stage(() => {
    if (inP < 1) { const cam = alarmCam(t); card('A', cardAt(0, -inP * H * 0.9), cam.z, cam.fx, cam.fy); }
    card('S', cardAt(0, (1 - inP) * H * 0.9, 1 + bump), z, S.person[0], lerp(S.r[1], 1620, pi));
  });
  captions(t);
}

// ---------- Focus Mode: the first thing you got up for ----------
function sFocus(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const b0 = TL.focus[0], F = SRC.F, wp = E.inOutCubic(bp(t, b0 - 0.2, 0.75));
  const pan = E.inOutCubic(bp(t, b0, 6)), z = 1 + 0.12 * pan, fy = lerp(F.r[1] + 700, F.r[1] + 1150, pan);
  if (wp < 1) { const S = SRC.S; stage(() => card('S', cardAt(), 1.32, S.person[0], 1620)); }
  // wipe: a yellow edge sweeps left to right, the Focus screen is behind it
  ctx.save(); ctx.beginPath(); ctx.rect(0, portrait ? zoneH : 0, W * wp * 1.15, H); ctx.clip();
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const M = card('F', cardAt(), z, F.r[0] + F.r[2] / 2, fy);
  TL.checks.forEach((cb, i) => {
    const q = bp(t, cb, 0.5); if (q <= 0) return;
    if (F.rows[i]) { const r = F.rows[i], a = M.p(r[0], r[1]), k = M.k; ctx.save(); ctx.globalAlpha = cl(q * 2); rr(a[0], a[1], r[2] * k, r[3] * k, 26 * k); ctx.fillStyle = 'rgba(255,214,10,0.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,214,10,0.42)'; ctx.lineWidth = 3 * U; ctx.stroke(); ctx.restore(); }
    const [x, y] = M.p(...F.dots[i]), s = E.outBack(q), r = 30 * M.k * s;
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, C.yHi); g.addColorStop(1, C.y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = C.onY; ctx.lineWidth = 6 * M.k * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    ctx.moveTo(x - r * 0.42, y + r * 0.02); ctx.lineTo(x - r * 0.1, y + r * 0.34); ctx.lineTo(x + r * 0.45, y - r * 0.3); ctx.stroke();
  });
  ctx.restore();
  if (wp > 0 && wp < 1) { ctx.fillStyle = C.y; ctx.fillRect(W * wp * 1.15 - 26 * U, 0, 26 * U, H); }
  captions(t);
}

// ---------- missions: squats, push-ups, math, shake, QR ----------
function sPicker(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const b0 = TL.tiles[0], P = SRC.P, inP = E.outExpo(bp(t, b0, 0.6)), punch = 0.035 * Math.exp(-Math.max(0, t - BEAT(24)) * 9) * (t >= BEAT(24) ? 1 : 0);
  const M = stage(() => card('P', cardAt(), lerp(1.18, 1.0, inP) + punch, P.r[0] + P.r[2] / 2, P.r[1]));
  TL.tiles.forEach((tb, i) => {
    const q = bp(t, tb, 0.5); if (q <= 0) return;
    const last = i === TL.tiles.length - 1 || t < BEAT(TL.tiles[i + 1]);
    const r = P.tiles[i], a = M.p(r[0], r[1]), k = M.k, pad = (8 + 10 * (1 - E.outCubic(q))) * U;
    ctx.save(); ctx.globalAlpha = last ? 1 : 0.35; rr(a[0] - pad, a[1] - pad, r[2] * k + 2 * pad, r[3] * k + 2 * pad, 52 * k); ctx.strokeStyle = C.text; ctx.lineWidth = (last ? 6 : 3) * U; ctx.stroke(); ctx.restore();
  });
  captions(t);
}

// ---------- captions: one fixed band above the screen ----------
function captions(t) {
  if (!portrait) return;
  const b = (t - OFF) / SPB; let c = null; for (const it of TL.captions) if (b >= it.b - 0.02) c = it; if (!c) return;
  const padX = 0.07 * W, bigS = Math.min(150 * U, fitA(c.big, W - 2 * padX - 230 * U)), cap = bigS * capA, base = zoneH * 0.5 + cap * 0.28;
  const rev = (b0, fn) => { const p = E.outExpo(bp(t, b0, 0.6)); if (p <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, zoneH); ctx.clip(); ctx.translate(0, (1 - p) * zoneH * 0.6); fn(); ctx.restore(); };
  rev(c.b, () => T(c.big, padX, base, AF(bigS), C.text));
  rev(c.b + 0.25, () => T(c.small, padX, base + 70 * U, GF(48 * U, 500), C.soft));
  if (c.big === '3 SQUATS.') { // rep tally fills on the beat
    TL.reps.forEach((rb, i) => {
      const q = E.outBack(bp(t, rb, 0.45)), x = W - padX - (2 - i) * 74 * U - 26 * U, y = base - cap / 2, r0 = 26 * U;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(x, y, r0, 0, 7); ctx.stroke();
      if (q > 0) { ctx.fillStyle = C.y; ctx.beginPath(); ctx.arc(x, y, r0 * q, 0, 7); ctx.fill(); T(String(i + 1), x, y + 11 * U * q, GF(30 * U * q, 800), C.onY, 'center'); }
    });
  }
}

// ---------- CTA ----------
function sCta(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const b0 = TL.cta, padX = 0.09 * W, icS = 250 * U, icY = H * 0.27, ip = E.outBack(bp(t, b0, 0.7));
  // ripples from the icon on the CTA beat and again on the ripple beat
  [b0, TL.ripple].forEach(rb => { const r = bp(t, rb, 1.6); if (r > 0 && r < 1) { ctx.save(); ctx.globalAlpha = (1 - r) * 0.9; ctx.strokeStyle = C.y; ctx.lineWidth = 5 * U * (1 - r) + 1; rr(padX + icS / 2 - (icS / 2 + 260 * U * E.outCubic(r)), icY + icS / 2 - (icS / 2 + 260 * U * E.outCubic(r)), icS + 520 * U * E.outCubic(r), icS + 520 * U * E.outCubic(r), icS * 0.225 + 120 * U * r); ctx.stroke(); ctx.restore(); } });
  if (ip > 0) { ctx.save(); ctx.translate(padX + icS / 2, icY + icS / 2); ctx.scale(ip, ip); rr(-icS / 2, -icS / 2, icS, icS, icS * 0.225); ctx.clip(); ctx.drawImage(IM.icon, -icS / 2, -icS / 2, icS, icS); ctx.restore(); }
  // BEGIN, letters landing one after another
  const size = fitA('BEGIN', W - 2 * padX), cap = size * capA, base = icY + icS + 90 * U + cap;
  let x = padX; 'BEGIN'.split('').forEach((ch, i) => {
    const q = E.outExpo(bp(t, b0 + 0.15 + i * 0.12, 0.5)), w = tw(ch, AF(size));
    if (q > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - 4, base - cap - 10 * U, w + 8, cap + 20 * U); ctx.clip(); T(ch, x, base + (1 - q) * cap * 1.1, AF(size), C.text); ctx.restore(); }
    x += w;
  });
  const tag = 'Wake to action.', tp = E.outExpo(bp(t, 27.3, 0.6)), ty = base + 110 * U;
  if (tp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, ty - 90 * U, W, 120 * U); ctx.clip(); T(tag, padX, ty + (1 - tp) * 90 * U, GF(78 * U, 700), C.y); ctx.restore(); }
  const sp = E.outExpo(bp(t, TL.ripple, 0.6)), sy = ty + 250 * U;
  if (sp > 0) {
    ctx.save(); ctx.globalAlpha = sp; ctx.fillStyle = C.y; ctx.fillRect(padX, sy - 70 * U, 120 * U * sp, 6 * U);
    T('Free on the App Store', padX, sy, GF(50 * U, 700), C.text); T('BEGIN: Wake to Action · iPhone', padX, sy + 62 * U, GF(36 * U, 500), C.muted); ctx.restore();
  }
}

// ---------- grain / seek ----------
const grain = []; for (let g = 0; g < 6; g++) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), r = mulberry32(700 + g); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); grain.push(c); }
window.seek = function (t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
  const b = (t - OFF) / SPB, bi = Math.floor(b + 1e-9), dt = t - BEAT(bi);
  const hits = { 0: 14, 1: 16, 2: 16, 3: 22, 4: 6, 6: 18, 12: 5, 17: 5, 23: 7, 24: 10, 26: 12 }, amp = (hits[bi] || 0) * U * Math.exp(-dt * 16), r = mulberry32(bi * 31 + 5);
  ctx.save(); ctx.translate((r() - .5) * 2 * amp, (r() - .5) * 2 * amp);
  if (b < TL.flood) sHook(t);
  else if (b < TL.morph[0]) sFlood(t);
  else if (b < TL.squat[0] - 0.1) sAlarm(t);
  else if (b < TL.focus[0] - 0.2) sSquat(t);
  else if (b < TL.tiles[0]) sFocus(t);
  else if (b < TL.cta) sPicker(t);
  else sCta(t);
  ctx.restore();
  const gi = Math.floor(t * 24) % 6, rr2 = mulberry32(Math.floor(t * 24) + 3);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.14; const ox = Math.floor(rr2() * 256), oy = Math.floor(rr2() * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) ctx.drawImage(grain[gi], x, y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
};
