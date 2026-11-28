// "Still Building" — a personal story reel. Pure function of time: window.seek(t) paints frame t.
// One accent (the lit window's amber), one display face (Gelasio), one UI face (JetBrains Mono).
const W = 1080, H = 1920;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
const C = { ink: '#06080E', night: '#0B1120', night2: '#111A2E', bldA: '#0E1527', bldB: '#131C33', win: '#1A2438',
  paper: '#F1EADC', dim: '#8A90A0', mute: '#3A4357', acc: '#FFB23E', accD: '#B9761C', snow: '#D5DBE6' };
const TL = DATA.tl, SPB = DATA.beats.spb, OFF = DATA.beats.offset, BEAT = b => OFF + b * SPB, SC = TL.scenes;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), prog = (t, t0, d) => cl((t - t0) / d), lerp = (a, b, x) => a + (b - a) * x;
const bp = (t, b0, db) => prog(t, BEAT(b0), db * SPB);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const E = {
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x), outCubic: x => 1 - Math.pow(1 - x, 3), inCubic: x => x * x * x,
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10), inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const SF = (s, w = 600) => `${w} ${s}px SerifD`, SI = s => `italic 600 ${s}px SerifD`, MF = (s, w = 400) => `${w} ${s}px MonoU`;
const IM = {};
const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => r(); i.onerror = () => { console.error('img fail', src); r(); }; i.src = src; IM[k] = i; });
window.ready = Promise.all([
  document.fonts.load(SF(100)), document.fonts.load(SF(100, 700)), document.fonts.load(SI(100)), document.fonts.load(MF(100)), document.fonts.load(MF(100, 700)),
  load('shaw', 'assets/shawgames-mobile.jpg'),
]).then(() => true);

// ---------- helpers ----------
function T(s, x, y, font, col, align = 'left', base = 'alphabetic') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y); }
function tw(s, font) { ctx.font = font; return ctx.measureText(s).width; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, col) { rr(x, y, w, h, r); ctx.fillStyle = col; ctx.fill(); }
function strokeRR(x, y, w, h, r, col, lw = 3, dash = null) { rr(x, y, w, h, r); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
function bg(col) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
function line(pts, col, lw, p = 1, cap = 'round') { // draw a polyline up to fraction p of its length
  let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * cl(p); if (left <= 0) return; ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / seg[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= seg[i - 1]; }
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.stroke();
}
const rise = (t, b, d = 0.6) => E.outExpo(bp(t, b, d));              // 0..1, used for masked slide-ups
function slam(t, b, d = 0.55) { const p = bp(t, b, d); return p <= 0 ? 0 : lerp(1.18, 1, E.outExpo(p)); }

// ---------- the city (scene 1 and the doubt scene) ----------
const CITY = (() => {
  const r = mulberry32(7), far = [], near = [];
  for (let x = -40; x < W + 40;) { const w = 70 + r() * 120; far.push({ x, w, h: 380 + r() * 420 }); x += w + 6; }
  for (let x = -60; x < W + 60;) { const w = 150 + r() * 130; near.push({ x, w, h: 520 + r() * 520 }); x += w + 14; }
  const hero = near.reduce((a, b) => Math.abs(b.x + b.w / 2 - 560) < Math.abs(a.x + a.w / 2 - 560) ? b : a); hero.h = Math.max(hero.h, 900);
  const stars = Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * 900, s: 1 + r() * 2.2, ph: r() * 6.28 }));
  return { far, near, hero, stars, r };
})();
const GROUND = 1500;
function heroWindow() { const h = CITY.hero; return { x: h.x + h.w / 2 - 34, y: GROUND - h.h + 150, w: 68, h: 92 }; }
function drawCity(t, glow = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#070B16'); g.addColorStop(1, '#0F1730'); ctx.fillStyle = g; ctx.fillRect(-2000, -2000, W + 4000, GROUND + 2000);
  for (const s of CITY.stars) { ctx.fillStyle = `rgba(241,234,220,${0.25 + 0.25 * Math.sin(t * 1.3 + s.ph)})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
  for (const b of CITY.far) { ctx.fillStyle = C.bldA; ctx.fillRect(b.x, GROUND - b.h, b.w, b.h + 2000); }
  const hw = heroWindow();
  for (const b of CITY.near) {
    ctx.fillStyle = C.bldB; ctx.fillRect(b.x, GROUND - b.h, b.w, b.h + 2000);
    const big = b === CITY.hero, cw = big ? 68 : 26, ch = big ? 92 : 36, gx = big ? 30 : 18, gy = big ? 40 : 22;
    const cols = Math.floor((b.w - gx) / (cw + gx)), x0 = b.x + (b.w - cols * (cw + gx) + gx) / 2;
    for (let yy = GROUND - b.h + (big ? 150 - (ch + gy) : 60); yy < GROUND + 900; yy += ch + gy)
      for (let i = 0; i < cols; i++) { const x = x0 + i * (cw + gx); if (big && Math.abs(x - hw.x) < 2 && Math.abs(yy - hw.y) < 2) continue; ctx.fillStyle = C.win; ctx.fillRect(x, yy, cw, ch); }
  }
  // the one window still lit at 2 AM
  ctx.fillStyle = C.acc; ctx.fillRect(hw.x, hw.y, hw.w, hw.h);
  ctx.fillStyle = C.accD; ctx.fillRect(hw.x + hw.w / 2 - 2, hw.y, 4, hw.h); ctx.fillRect(hw.x, hw.y + hw.h * 0.45, hw.w, 4);
  // silhouette at the desk, inside the window
  ctx.fillStyle = '#5A3A10'; ctx.beginPath(); ctx.arc(hw.x + 20, hw.y + hw.h - 34, 9, 0, 7); ctx.fill(); ctx.fillRect(hw.x + 6, hw.y + hw.h - 26, 28, 26);
}
function clock(t, x, y, size, h0, m0, beat0) { // seconds advance on every beat, in step with the ticks in the score
  const s = Math.max(0, Math.floor((t - BEAT(beat0)) / SPB)), mm = m0 + Math.floor(s / 60), ss = s % 60;
  const str = `${String(h0).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, sec = `:${String(ss).padStart(2, '0')}`;
  T(str, x, y, MF(size, 700), C.paper); T(sec, x + tw(str, MF(size, 700)) + 8, y, MF(size * 0.42, 700), C.acc);
}

function sceneNight(t) {
  const hw = heroWindow(), cx = hw.x + hw.w / 2, cy = hw.y + hw.h / 2;
  const p = E.inOutCubic(bp(t, 3.5, 4.75)), s0 = 1.0 + 0.012 * t, s = Math.exp(lerp(Math.log(s0), Math.log(12), p));
  const ax = lerp(W / 2 + (cx - W / 2) * s0, W / 2, p), ay = lerp(H * 0.5 + (cy - H * 0.5) * s0, H * 0.37, p);
  ctx.save(); ctx.translate(ax, ay); ctx.scale(s, s); ctx.translate(-cx, -cy); drawCity(t); ctx.restore();
  // the clock: 02:00, a second per beat, there from the first frame
  ctx.save(); ctx.translate(0, -E.inCubic(p) * 420); clock(t, 90, 360, 200, 2, 0, 0); ctx.restore();
}
const NOTES = [['a game?', 120, 400, -6], ['an app?', 800, 430, 5], ['a robot?', 90, 760, 4], ['a startup?', 820, 790, -4], ['something new?', 380, 250, -2]];
function sceneRoom(t) {
  // inside the window: a desk, a glowing screen, ideas on the wall
  bg('#0D1222'); const drift = (t - BEAT(8.25)) * 6;
  ctx.save(); ctx.translate(0, -drift);
  ctx.fillStyle = '#101830'; ctx.fillRect(0, 1060, W, 900);                         // desk
  const rg = ctx.createRadialGradient(540, 770, 60, 540, 770, 620); rg.addColorStop(0, 'rgba(255,178,62,.30)'); rg.addColorStop(1, 'rgba(255,178,62,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  fillRR(300, 600, 480, 330, 18, '#1D2438'); fillRR(318, 618, 444, 294, 8, C.acc);   // monitor
  ctx.fillStyle = C.accD; for (let i = 0; i < 6; i++) ctx.fillRect(350, 660 + i * 34, [300, 220, 340, 180, 260, 120][i], 12);
  ctx.fillStyle = '#1D2438'; ctx.fillRect(520, 930, 40, 80); ctx.fillRect(450, 1005, 180, 18);
  ctx.fillStyle = '#05070D'; ctx.beginPath(); ctx.arc(540, 1200, 78, 0, 7); ctx.fill();  // the person, from behind
  ctx.beginPath(); ctx.ellipse(540, 1440, 220, 180, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(320, 1435, 440, 600);
  // ideas, one per beat
  TL.night.notes.forEach((b, i) => {
    const q = bp(t, b, 0.5); if (q <= 0) return; const [s, x, y, rot] = NOTES[i], k = E.outBack(q);
    ctx.save(); ctx.translate(x + 80, y + 70); ctx.rotate(rot * Math.PI / 180); ctx.scale(k, k);
    fillRR(-130, -84, 260, 168, 6, C.paper); T(s, 0, 14, MF(s.length > 10 ? 30 : 40, 700), '#141824', 'center'); ctx.restore();
  });
  // calendar: 2026 -> 2027?
  const cx0 = 690, cy0 = 120, cp = bp(t, TL.night.calendar, 0.7);
  if (t > BEAT(11.2)) {
    const k = E.outBack(bp(t, 11.2, 0.5)); ctx.save(); ctx.translate(cx0 + 150, cy0 + 120); ctx.scale(k, k); ctx.translate(-(cx0 + 150), -(cy0 + 120));
    fillRR(cx0, cy0, 300, 240, 10, C.paper); ctx.fillStyle = '#141824'; ctx.fillRect(cx0, cy0, 300, 56);
    T('NEXT YEAR', cx0 + 150, cy0 + 38, MF(24, 700), C.paper, 'center');
    T('2027', cx0 + 128, cy0 + 190, MF(92, 700), '#141824', 'center'); T('?', cx0 + 262, cy0 + 190, MF(92, 700), C.accD, 'center');
    if (cp < 1) { // the 2026 page tears up and away
      ctx.save(); ctx.translate(cx0 + 150, cy0 + 56); ctx.rotate(-0.5 * E.inCubic(cp)); ctx.translate(0, -700 * E.inCubic(cp));
      fillRR(-150, 0, 300, 184, 8, C.paper); T('2026', 0, 134, MF(92, 700), '#141824', 'center'); ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ---------- eighth grade: the bedroom, the CRT ----------
function bedroom(t, crtB, labelB, doodleBs, typing) {
  bg('#0E1424');
  // window to the world outside
  const wx = 90, wy = 150, ww = 400, wh = 380;
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#20345E'); g.addColorStop(1, '#5A4E6E'); ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(wx + 300, wy + 90, 30, 0, 7); ctx.fill();
  ctx.fillStyle = '#0E1424'; ctx.beginPath(); ctx.arc(wx + 314, wy + 82, 28, 0, 7); ctx.fill();
  const r = mulberry32(3); ctx.fillStyle = '#141B30';
  for (let x = wx; x < wx + ww; x += 70) { const h = 60 + r() * 90; ctx.fillRect(x, wy + wh - h, 62, h); ctx.beginPath(); ctx.moveTo(x - 6, wy + wh - h); ctx.lineTo(x + 31, wy + wh - h - 34); ctx.lineTo(x + 68, wy + wh - h); ctx.fill(); }
  for (let i = 0; i < 5; i++) { const lit = (i * 37 + Math.floor(t / SPB)) % 4 === 0; ctx.fillStyle = lit ? C.accD : '#222B44'; ctx.fillRect(wx + 20 + i * 72, wy + wh - 50, 12, 16); }
  ctx.strokeStyle = '#1C2440'; ctx.lineWidth = 18; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  // poster
  fillRR(640, 170, 300, 380, 6, '#1A2442'); ctx.strokeStyle = C.mute; ctx.lineWidth = 3;
  line([[760, 470], [760, 330], [790, 260], [820, 330], [820, 470], [760, 470]], C.dim, 7); line([[760, 430], [730, 480], [760, 470]], C.dim, 7); line([[820, 430], [850, 480], [820, 470]], C.dim, 7); line([[778, 500], [790, 530], [802, 500]], C.acc, 7);
  // desk
  ctx.fillStyle = '#18203A'; ctx.fillRect(0, 1130, W, 400); ctx.fillStyle = '#222C4A'; ctx.fillRect(0, 1120, W, 16);
  // CRT
  const bx = 110, by = 560, bw = 680, bh = 560;
  fillRR(bx, by, bw, bh, 34, '#BDB3A0'); fillRR(bx + 18, by + bh - 40, bw - 36, 20, 6, '#A39983');
  fillRR(bx + 50, by + 50, bw - 100, bh - 140, 40, '#2A2418');
  const sx = bx + 66, sy = by + 66, sw = bw - 132, sh = bh - 172;
  const on = bp(t, crtB, 0.6);
  ctx.save(); rr(sx, sy, sw, sh, 30); ctx.clip(); ctx.fillStyle = '#140E05'; ctx.fillRect(sx, sy, sw, sh);
  if (on > 0) {
    const hgt = on < 0.5 ? 6 : lerp(6, sh, E.outExpo((on - 0.5) * 2)), wid = on < 0.5 ? lerp(10, sw, E.outExpo(on * 2)) : sw;
    ctx.save(); ctx.beginPath(); ctx.rect(sx + (sw - wid) / 2, sy + (sh - hgt) / 2, wid, hgt); ctx.clip();
    ctx.fillStyle = '#2A1A06'; ctx.fillRect(sx, sy, sw, sh);
    for (let y = sy; y < sy + sh; y += 6) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(sx, y, sw, 2); }
    typing(t, sx + 30, sy + 64);
    ctx.restore();
  }
  ctx.restore();
  // keyboard
  fillRR(150, 1145, 480, 80, 10, '#A39983'); for (let i = 0; i < 13; i++) for (let j = 0; j < 2; j++) fillRR(168 + i * 35, 1156 + j * 32, 28, 24, 3, '#8A806C');
  // notebook: GRADE 8 + doodles
  ctx.save(); ctx.translate(650, 1150); ctx.rotate(-0.06); ctx.scale(1.25, 1.25);
  fillRR(0, 0, 300, 220, 8, C.paper); ctx.fillStyle = '#C9C1B0'; for (let y = 40; y < 220; y += 30) ctx.fillRect(14, y, 272, 2);
  const lp = E.outCubic(bp(t, labelB, 0.9)); if (lp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 30 + 260 * lp, 60); ctx.clip(); T('Grade 8', 22, 46, SI(44), '#1C2233'); ctx.restore(); }
  const ink = '#2B3550';
  if (doodleBs) {
    const [d1, d2, d3] = doodleBs.map(b => E.inOutSine(bp(t, b, 0.9)));
    line([[60, 200], [60, 130], [80, 92], [100, 130], [100, 200], [60, 200]], ink, 5, d1); line([[60, 180], [44, 205], [60, 200]], ink, 5, d1); line([[100, 180], [116, 205], [100, 200]], ink, 5, d1); // rocket
    line([[150, 120], [210, 120], [210, 175], [150, 175], [150, 120]], ink, 5, d2); line([[165, 140], [168, 143]], ink, 9, d2); line([[192, 140], [195, 143]], ink, 9, d2); line([[180, 120], [180, 98]], ink, 5, d2); // robot
    if (d3 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(220, 90, 70, 120 * d3); ctx.clip(); T('?', 254, 190, SF(96, 700), ink, 'center'); ctx.restore(); }
  }
  ctx.restore();
}
function typeG8(t, x, y) {
  const g8 = TL.grade8, cmd = 'new company', n = Math.floor(cmd.length * prog(t, BEAT(g8.type[0]), BEAT(g8.type[1]) - BEAT(g8.type[0])));
  const blink = Math.floor(t / (SPB / 2)) % 2 === 0;
  T('C:\\> ' + cmd.slice(0, n) + (t < BEAT(g8.enter) && blink ? '_' : ''), x, y, MF(42, 700), C.acc);
  if (t >= BEAT(g8.enter)) {
    T('name:  ______', x, y + 70, MF(42, 700), C.acc); T('does:  ???', x, y + 132, MF(42, 700), C.acc);
    if (t > BEAT(19.8)) T('start: someday' + (blink ? '_' : ''), x, y + 194, MF(42, 700), C.acc);
  }
}
function typeBoy(t, x, y) {
  const blink = Math.floor(t / (SPB / 2)) % 2 === 0;
  T('C:\\> still here' + (blink ? '_' : ''), x, y, MF(42, 700), C.acc);
  if (t > BEAT(88.7)) T('curious:  yes', x, y + 70, MF(42, 700), C.acc);
  if (t > BEAT(90.0)) T('building: yes', x, y + 132, MF(42, 700), C.acc);
}

// ---------- Pexel ----------
function sceneJump(t) {
  bg(C.ink); const p = bp(t, TL.pexel.jump, 1.2), y = 1060;
  T('GRADE', 96, 640, MF(84, 700), C.dim);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - 340, W, 400); ctx.clip();
  const e = E.outExpo(p); T('8', 80, y - 400 * e, MF(420, 700), C.paper); T('10', 80, y + 400 * (1 - e), MF(420, 700), C.acc); ctx.restore();
  ctx.fillStyle = C.mute; ctx.fillRect(96, y + 70, 888 * E.outCubic(p), 6);
  T('two years later', 96, y + 190, SI(72), C.paper);
}
function scenePexel(t) {
  const px = TL.pexel; bg(C.ink);
  const fallP = bp(t, px.fall, 1.45), fall = E.inExpo(fallP);
  const inP = E.outExpo(bp(t, px.window, 0.9));
  const X = 80, Y = 210, Wd = 920, Hd = 1170;
  ctx.save(); ctx.translate(540, Y + Hd / 2 + (1 - inP) * 1400 + fall * 1700); ctx.rotate(fall * 0.35); ctx.translate(-540, -(Y + Hd / 2));
  fillRR(X, Y, Wd, Hd, 24, '#E9E4DA'); fillRR(X, Y, Wd, 76, 24, '#D3CCBF'); ctx.fillStyle = '#D3CCBF'; ctx.fillRect(X, Y + 40, Wd, 36);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = '#A9A194'; ctx.beginPath(); ctx.arc(X + 40 + i * 32, Y + 38, 10, 0, 7); ctx.fill(); }
  fillRR(X + 160, Y + 16, 260, 50, 10, '#E9E4DA'); T('Pexel', X + 186, Y + 51, MF(28, 700), '#30384C');
  const lg = bp(t, px.logo, 0.5);
  if (lg <= 0) [[X + 70, Y + 130, 380, 90], [X + 70, Y + 250, 600, 30], [X + 50, Y + 330, Wd - 100, 560], [X + 50, Y + 930, Wd - 100, 96]].forEach((r, i) => {
    const q = E.outBack(bp(t, px.window + 0.5 + 0.5 * i, 0.4)); if (q <= 0) return; ctx.save(); ctx.translate(r[0] + r[2] / 2, r[1] + r[3] / 2); ctx.scale(q, q); fillRR(-r[2] / 2, -r[3] / 2, r[2], r[3], 14, '#D9D3C7'); ctx.restore();
  });
  if (lg > 0) { const k = E.outBack(lg); ctx.save(); ctx.translate(X + 70, Y + 210); ctx.scale(k, k); T('Pexel', 0, 0, SF(118, 700), '#121726'); ctx.restore(); T('anonymous feedback chat', X + 74, Y + 272, MF(34), '#5C6476'); }
  // online status
  const zp = bp(t, px.zero, 0.5), z = zp > 0 ? lerp(1.6, 1, E.outExpo(zp)) : 1;
  if (lg > 0) { ctx.save(); ctx.translate(X + Wd - 70, Y + 180); ctx.scale(z, z); T('0 online', 0, 0, MF(40, 700), '#121726', 'right'); ctx.fillStyle = '#9AA0AE'; ctx.beginPath(); ctx.arc(-tw('0 online', MF(40, 700)) - 26, -13, 12, 0, 7); ctx.fill(); ctx.restore(); }
  // the chat: empty bubbles waiting for someone
  const ch = bp(t, px.chat, 0.6);
  if (ch > 0) {
    const cy = Y + 330;
    fillRR(X + 50, cy, Wd - 100, 560, 18, '#F4F0E8');
    [[X + 90, cy + 50, 430], [X + 330, cy + 160, 460], [X + 90, cy + 270, 360]].forEach(([bx, by, bw], i) => {
      const q = E.outBack(cl(ch * 3 - i)); if (q <= 0) return; ctx.save(); ctx.translate(bx, by); ctx.scale(q, q); strokeRR(0, 0, bw, 84, 22, '#B9B2A4', 4, [14, 12]); ctx.restore();
    });
    if (t > BEAT(px.zero)) T('no messages yet', X + Wd / 2, cy + 470, MF(38), '#7B8293', 'center');
  }
  const ip = bp(t, px.input, 0.5);
  if (ip > 0) {
    const iy = Y + 930 + (1 - E.outExpo(ip)) * 60;
    strokeRR(X + 50, iy, Wd - 270, 96, 20, '#9C9586', 4); T('say something…', X + 84, iy + 62, MF(34), '#8D8677');
    fillRR(X + Wd - 200, iy, 150, 96, 20, C.acc); T('Send', X + Wd - 125, iy + 60, MF(32, 700), '#121726', 'center');
  }
  ctx.restore();
  // visitors: a flat line, day after day
  const cp = bp(t, px.chart[0], px.chart[1] - px.chart[0]);
  if (cp > 0 && fallP < 1) {
    const k = E.outExpo(bp(t, px.chart[0], 0.6)), cy = 800 + fall * 1700;
    ctx.save(); ctx.translate(540, cy); ctx.scale(k, k); ctx.rotate(fall * -0.2); ctx.translate(-540, -cy);
    fillRR(130, cy - 170, 820, 400, 22, '#121726'); T('visitors this week', 175, cy - 100, MF(40, 700), C.paper);
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], gx = 190, gw = 700, gy = cy + 120;
    days.forEach((d, i) => T(d, gx + i * gw / 6, gy + 70, MF(36), C.dim, 'center'));
    ctx.fillStyle = C.mute; ctx.fillRect(gx, gy, gw, 3);
    const pts = days.map((_, i) => [gx + i * gw / 6, gy]); line(pts, C.acc, 8, cp);
    const n = Math.min(6, Math.floor(cp * 6.999)); for (let i = 0; i <= n; i++) { ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(pts[i][0], gy, 11, 0, 7); ctx.fill(); }
    T('0', pts[n][0], gy - 36, MF(56, 700), C.acc, 'center');
    ctx.restore();
  }
}

// ---------- Lithuania ----------
const SNOW = (() => { const r = mulberry32(11); return Array.from({ length: 260 }, () => ({ x: r() * W, y: r() * H, v: 60 + r() * 120, s: 2 + r() * 5, ph: r() * 6.28 })); })();
const STREET = (() => { const r = mulberry32(5), b = []; for (let x = -30; x < W + 300;) { const w = 120 + r() * 140; b.push({ x, w, h: 190 + r() * 170, roof: r() < 0.5 }); x += w + 4; } return b; })();
function snow(t, a = 1) { for (const f of SNOW) { const y = (f.y + f.v * t) % (H + 20) - 10, x = (f.x + Math.sin(t * 0.9 + f.ph) * 24 + W) % W; ctx.fillStyle = `rgba(241,234,220,${0.8 * a})`; ctx.beginPath(); ctx.arc(x, y, f.s, 0, 7); ctx.fill(); } }
function walker(x, y, k, t, col = '#05070D') {
  const ph = t * 2 * Math.PI / (2 * SPB), sw = Math.sin(ph) * 0.42;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(Math.sin(sw) * 70, -80 + Math.cos(sw) * 80); ctx.moveTo(0, -80); ctx.lineTo(-Math.sin(sw) * 70, -80 + Math.cos(sw) * 80); ctx.stroke();
  ctx.fillStyle = col; rr(-30, -200, 60, 130, 24); ctx.fill(); ctx.beginPath(); ctx.arc(0, -230, 26, 0, 7); ctx.fill();
  fillRR(-36, -205, 72, 74, 16, col); ctx.restore();
}
function sceneLithuania(t) {
  const lt = TL.lithuania; bg('#0A1022');
  const g = ctx.createLinearGradient(0, 0, 0, 1200); g.addColorStop(0, '#0A1022'); g.addColorStop(1, '#1A2443'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1200);
  // the word, rising from behind the roofs
  const wp = rise(t, lt.word, 1.1); const fs = 220;
  if (wp > 0) { ctx.save(); ctx.font = SF(fs, 700); const s = Math.min(1, 980 / ctx.measureText('LITHUANIA').width); T('LITHUANIA', 540, 780 + (1 - wp) * 420, SF(fs * s, 700), C.paper, 'center'); ctx.restore(); }
  const drift = (t - BEAT(SC.lithuania)) * 10;
  for (const b of STREET) {
    const x = b.x - drift * 0.6; ctx.fillStyle = '#121A31'; ctx.fillRect(x, 1240 - b.h, b.w, b.h);
    if (b.roof) { ctx.beginPath(); ctx.moveTo(x - 8, 1240 - b.h); ctx.lineTo(x + b.w / 2, 1240 - b.h - 70); ctx.lineTo(x + b.w + 8, 1240 - b.h); ctx.fill(); }
    ctx.fillStyle = '#1C2644'; for (let yy = 1240 - b.h + 50; yy < 1200; yy += 70) for (let xx = x + 24; xx < x + b.w - 30; xx += 52) ctx.fillRect(xx, yy, 22, 32);
    ctx.fillStyle = C.snow; ctx.fillRect(x - 4, 1240 - b.h - 6, b.w + 8, 10);
  }
  // snowy pavement, then the dark road the captions sit on
  ctx.fillStyle = C.snow; ctx.fillRect(0, 1240, W, 170); ctx.fillStyle = '#B9C1D0'; ctx.fillRect(0, 1240, W, 14);
  ctx.fillStyle = '#0A0F1D'; ctx.fillRect(0, 1410, W, H - 1410); ctx.fillStyle = '#E8ECF3'; ctx.fillRect(0, 1404, W, 8);
  // lamps
  for (let i = 0; i < 3; i++) {
    const lx = 150 + i * 390 - (drift * 0.6) % 390;
    ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = C.acc; ctx.beginPath(); ctx.moveTo(lx - 10, 1000); ctx.lineTo(lx - 150, 1400); ctx.lineTo(lx + 150, 1400); ctx.lineTo(lx + 10, 1000); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#0B0F1C'; ctx.fillRect(lx - 5, 990, 10, 360); fillRR(lx - 22, 970, 44, 30, 8, '#0B0F1C'); ctx.fillStyle = C.acc; ctx.fillRect(lx - 16, 994, 32, 8);
  }
  // the student: footprints behind
  const wx = lerp(180, 900, prog(t, BEAT(SC.lithuania), BEAT(lt.sketch[0] - 2) - BEAT(SC.lithuania)));
  ctx.fillStyle = '#9DA7BB'; for (let x = wx - 60; x > -20; x -= 44) { ctx.beginPath(); ctx.ellipse(x, 1352 + ((x / 44 | 0) % 2) * 16, 13, 6, 0, 0, 7); ctx.fill(); }
  walker(wx, 1350, 0.9, t);
  snow(t);
}
function sceneSketch(t) {
  const lt = TL.lithuania; bg('#0D1324');
  ctx.strokeStyle = '#172038'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const cx = 540, cy = 760, s = 230, real = bp(t, lt.real, 0.7), sk = E.inOutSine(bp(t, lt.sketch[0], lt.sketch[1] - lt.sketch[0]));
  const k = real > 0 ? lerp(1.15, 1, E.outExpo(real)) : 1, by = real > 0 ? 0 : 0;
  const top = [[cx, cy - s], [cx + s * 0.95, cy - s * 0.48], [cx, cy + 0.04 * s], [cx - s * 0.95, cy - s * 0.48]];
  const L = [[cx - s * 0.95, cy - s * 0.48], [cx, cy + 0.04 * s], [cx, cy + s * 1.1], [cx - s * 0.95, cy + s * 0.58]];
  const R = [[cx, cy + 0.04 * s], [cx + s * 0.95, cy - s * 0.48], [cx + s * 0.95, cy + s * 0.58], [cx, cy + s * 1.1]];
  ctx.save(); ctx.translate(cx, cy + by); ctx.scale(k, k); ctx.translate(-cx, -cy);
  if (real > 0) {
    const poly = (pts, col) => { ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(cx, cy + s * 1.2, s * 1.1, s * 0.22, 0, 0, 7); ctx.fill(); ctx.restore();
    poly(top, C.acc); poly(L, C.accD); poly(R, '#D8922C');
  } else {
    ctx.setLineDash([22, 16]); const e = [...top, top[0]]; line(e, C.paper, 7, sk * 1.6); line([L[0], L[3], L[2], R[2], R[1]], C.paper, 7, sk * 1.6 - 0.6); line([L[1], L[2]], C.paper, 7, sk * 1.6 - 0.6); ctx.setLineDash([]);
  }
  ctx.restore();
  const lab = real > 0 ? 'real' : 'idea';
  T(lab, cx, cy + s * 1.62, MF(52, 700), real > 0 ? C.acc : C.dim, 'center');
  if (real <= 0) { ctx.save(); ctx.setLineDash([10, 10]); ctx.strokeStyle = C.dim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 70, cy + s * 1.68); ctx.lineTo(cx + 70, cy + s * 1.68); ctx.stroke(); ctx.restore(); }
}

// ---------- building: four tiles ----------
const TILE = (i) => ({ x: 80 + (i % 2) * 470, y: 230 + Math.floor(i / 2) * 560, w: 450, h: 540 });
function tileGame(t, x, y, w, h) {
  fillRR(x, y, w, h, 20, '#14203A'); const gy = y + h - 120; ctx.fillStyle = '#2B3A63'; for (let i = 0; i < 9; i++) ctx.fillRect(x + 10 + i * 48, gy, 44, 44);
  ctx.fillStyle = C.paper; const px = x + 60 + ((t * 120) % (w - 140)), jump = Math.abs(Math.sin(t * Math.PI / SPB)) * 90;
  ctx.fillRect(px, gy - 64 - jump, 48, 64); ctx.fillStyle = '#14203A'; ctx.fillRect(px + 30, gy - 52 - jump, 8, 8);
  ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(x + w - 110, gy - 180, 20, 0, 7); ctx.fill(); ctx.fillRect(x + 180, gy - 44, 44, 44);
  T('GAMES', x + 30, y + 64, MF(36, 700), C.paper);
}
function tileWeb(t, x, y, w, h, b0) {
  fillRR(x, y, w, h, 20, '#14203A'); T('WEBSITES', x + 30, y + 64, MF(36, 700), C.paper);
  const parts = [[x + 30, y + 100, w - 60, 40], [x + 30, y + 160, w - 60, 140], [x + 30, y + 320, 120, 170], [x + 165, y + 320, 120, 170], [x + 300, y + 320, 120, 170]];
  parts.forEach((p, i) => { const q = E.outBack(bp(t, b0 + 0.15 * i, 0.4)); if (q <= 0) return; ctx.save(); ctx.translate(p[0] + p[2] / 2, p[1] + p[3] / 2); ctx.scale(q, q); fillRR(-p[2] / 2, -p[3] / 2, p[2], p[3], 8, i === 1 ? '#2B3A63' : '#22304F'); ctx.restore(); });
}
function tileRobot(t, x, y, w, h) {
  fillRR(x, y, w, h, 20, '#14203A'); T('ROBOTS', x + 30, y + 64, MF(36, 700), C.paper);
  const rx = x + w / 2 + Math.sin(t * 1.6) * 60, ry = y + 330;
  fillRR(rx - 90, ry - 40, 180, 130, 18, C.paper); fillRR(rx - 64, ry - 150, 128, 96, 16, C.paper);
  ctx.fillStyle = '#14203A'; ctx.fillRect(rx - 36, ry - 118, 18, 18); ctx.fillRect(rx + 18, ry - 118, 18, 18);
  ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(rx, ry - 150); ctx.lineTo(rx, ry - 190); ctx.stroke();
  ctx.fillStyle = Math.floor(t / (SPB / 2)) % 2 ? C.acc : C.accD; ctx.beginPath(); ctx.arc(rx, ry - 198, 12, 0, 7); ctx.fill();
  for (const dx of [-55, 55]) { ctx.save(); ctx.translate(rx + dx, ry + 110); ctx.rotate(t * 3); ctx.fillStyle = '#0B1120'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill(); ctx.fillStyle = C.dim; ctx.fillRect(-4, -30, 8, 60); ctx.restore(); }
}
function tileApp(t, x, y, w, h, b0) {
  fillRR(x, y, w, h, 20, '#14203A'); T('APPS', x + 30, y + 64, MF(36, 700), C.paper);
  fillRR(x + w / 2 - 100, y + 100, 200, 400, 30, '#0B1120'); strokeRR(x + w / 2 - 100, y + 100, 200, 400, 30, C.dim, 5);
  for (let i = 0; i < 9; i++) { const q = E.outBack(bp(t, b0 + 0.1 * i, 0.35)); if (q <= 0) continue; const ix = x + w / 2 - 66 + (i % 3) * 66, iy = y + 160 + Math.floor(i / 3) * 70; ctx.save(); ctx.translate(ix, iy); ctx.scale(q, q); fillRR(-22, -22, 44, 44, 12, i === 4 ? C.acc : '#2B3A63'); ctx.restore(); }
}
function stampMark(t, b, x, y, yes) {
  const p = bp(t, b, 0.45); if (p <= 0) return; const k = lerp(1.6, 1, E.outExpo(p));
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(yes ? -0.12 : 0.1);
  ctx.lineWidth = 16; ctx.strokeStyle = yes ? C.acc : C.dim; ctx.beginPath(); ctx.arc(0, 0, 96, 0, 7); ctx.stroke();
  ctx.lineCap = 'round'; ctx.beginPath(); if (yes) { ctx.moveTo(-44, 4); ctx.lineTo(-10, 38); ctx.lineTo(48, -34); } else { ctx.moveTo(-36, -36); ctx.lineTo(36, 36); ctx.moveTo(36, -36); ctx.lineTo(-36, 36); } ctx.stroke(); ctx.restore();
}
function sceneBuild(t) {
  const bd = TL.build; bg(C.ink);
  const dr = [tileGame, tileWeb, tileRobot, tileApp];
  for (let i = 0; i < 4; i++) {
    const r = TILE(i), fp = E.outCubic(bp(t, SC.build + 0.2 * i, 1));
    ctx.save(); ctx.setLineDash([16, 14]); ctx.strokeStyle = C.mute; ctx.lineWidth = 4; ctx.globalAlpha = 1; rr(r.x, r.y, r.w * fp, r.h, 20); ctx.stroke(); ctx.restore();
    const k = slam(t, bd.tiles[i]); if (k <= 0) continue;
    ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(k, k); ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    dr[i](t, r.x, r.y, r.w, r.h, bd.tiles[i]);
    const no = i === 1 ? bd.no[0] : i === 3 ? bd.no[1] : null;
    if (no !== null && t > BEAT(no)) { ctx.fillStyle = 'rgba(6,8,14,.62)'; rr(r.x, r.y, r.w, r.h, 20); ctx.fill(); }
    ctx.restore();
  }
  stampMark(t, bd.yes[0], TILE(0).x + 330, TILE(0).y + 400, true); stampMark(t, bd.yes[1], TILE(2).x + 330, TILE(2).y + 400, true);
  stampMark(t, bd.no[0], TILE(1).x + 330, TILE(1).y + 400, false); stampMark(t, bd.no[1], TILE(3).x + 330, TILE(3).y + 400, false);
}

// ---------- Shaw Games ----------
function phone(t, cx, cy, k, scroll) {
  const pw = 560, ph = 1100; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  fillRR(-pw / 2, -ph / 2, pw, ph, 64, '#0B0F1A'); strokeRR(-pw / 2, -ph / 2, pw, ph, 64, '#2A3350', 6);
  const sx = -pw / 2 + 18, sy = -ph / 2 + 18, sw = pw - 36, sh = ph - 36, im = IM.shaw, sc = sw / im.width;
  ctx.save(); rr(sx, sy, sw, sh, 48); ctx.clip(); ctx.fillStyle = '#EDEEF2'; ctx.fillRect(sx, sy, sw, sh);
  const maxS = im.height * sc - sh, oy = Math.min(maxS, scroll);
  ctx.drawImage(im, 0, oy / sc, im.width, sh / sc, sx, sy, sw, sh); ctx.restore();
  fillRR(-70, -ph / 2 + 26, 140, 30, 15, '#0B0F1A'); ctx.restore();
}
function sceneShaw(t) {
  const sh = TL.shaw; bg(C.ink);
  // the GAMES tile grows into the phone
  const zp = E.inOutCubic(bp(t, sh.zoom, 0.9));
  if (zp < 1) {
    const r = TILE(0), x = lerp(r.x, 260, zp), y = lerp(r.y, 260, zp), w = lerp(r.w, 560, zp), h = lerp(r.h, 1100, zp);
    ctx.save(); ctx.translate(x, y); ctx.scale(w / r.w, h / r.h); tileGame(t, 0, 0, r.w, r.h); ctx.restore(); return;
  }
  const cnt = TL.shaw.count, shrink = E.inOutCubic(bp(t, cnt[0] - 0.6, 0.9)), cmp = bp(t, sh.compare, 0.8);
  const scroll = Math.max(0, (t - BEAT(sh.zoom + 1)) * 260);
  if (cmp <= 0) {
    const k = lerp(1, 0.46, shrink), cx = 540, cy = lerp(830, 470, shrink);
    phone(t, cx, cy, k, scroll);
    const up = rise(t, sh.logo, 0.6);
    if (up > 0 && shrink <= 0) { const y = 200 + (1 - up) * -160; fillRR(270, y - 62, 540, 92, 46, '#141B2E'); T('shawgames.com', 540, y - 2, MF(44, 700), C.paper, 'center'); }
  }
  // the number
  const cp = prog(t, BEAT(cnt[0]), BEAT(cnt[1]) - BEAT(cnt[0]));
  if (t > BEAT(cnt[0]) && cmp <= 0) {
    const v = Math.round(15000 * E.outCubic(cp)), s = v.toLocaleString('en-US'), k = t > BEAT(cnt[1]) ? slam(t, cnt[1], 0.5) : 1, y0 = 1080;
    ctx.save(); ctx.translate(540, y0); ctx.scale(k, k); T(s, 0, 0, MF(200, 700), C.acc, 'center'); ctx.restore();
    const mp = rise(t, sh.month, 0.6); if (mp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, y0 + 30, W, 90); ctx.clip(); T('people every month', 540, y0 + 100 - (1 - mp) * 80, MF(52, 700), C.paper, 'center'); ctx.restore(); }
  }
  // then vs now
  if (cmp > 0) {
    const e = E.outExpo(cmp), y1 = 380, y2 = 620;
    T('Pexel', 90, y1 - 30, SF(64, 700), C.dim); T('0', 990, y1 - 30, MF(56, 700), C.dim, 'right'); fillRR(90, y1, 10, 70, 6, C.dim);
    T('Shaw Games', 90, y2 - 30, SF(64, 700), C.paper); T('15,000', 990, y2 - 30, MF(56, 700), C.acc, 'right'); fillRR(90, y2, 900 * e, 70, 8, C.acc);
    // the people who showed up: one dot per hundred
    const cr = prog(t, BEAT(sh.crowd), 1.1);
    for (let i = 0; i < 150; i++) {
      const q = cl(cr * 150 - i, 0, 1); if (q <= 0) break; const cx0 = 120 + (i % 15) * 60, cy0 = 800 + Math.floor(i / 15) * 56;
      const z = E.outBack(q); ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(cx0, cy0 - 10 * z, 10 * z, 0, 7); ctx.fill(); fillRR(cx0 - 15 * z, cy0 + 4 * z, 30 * z, 22 * z, 11 * z, C.paper);
    }
    if (cr > 0) T('each dot = 100 people', 90, 1400, MF(36), C.dim);
  }
}

// ---------- another idea, and the off switch ----------
const LIST = ['shawgames.com', 'next idea', 'another one', 'wait, what if…', 'and this', 'ok, one more', '…'];
function sceneIdeas(t) {
  const ia = TL.ideas; bg(C.ink);
  const items = 1 + ia.spawn.filter(b => t >= BEAT(b)).length, rowH = 136, scroll = Math.max(0, (items - 7) * rowH);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 160, W, 1220); ctx.clip();
  T('to do', 90, 300, SF(120, 700), C.paper);
  for (let i = 0; i < Math.min(items, LIST.length); i++) {
    const b = i === 0 ? SC.ideas : ia.spawn[i - 1], q = rise(t, b, 0.5), y = 440 + i * rowH - scroll;
    ctx.save(); ctx.translate((1 - q) * 120, 0);
    strokeRR(90, y - 52, 68, 68, 12, i === 0 ? C.acc : C.dim, 6);
    const done = i === 0 && t > BEAT(ia.check);
    if (done) { const c = E.outCubic(bp(t, ia.check, 0.4)); line([[102, y - 16], [118, y + 2], [140, y - 34]], C.acc, 9, c); }
    T(LIST[i], 196, y, MF(58, 700), done ? C.acc : i === 0 ? C.paper : C.dim); ctx.restore();
  }
  ctx.restore();
}
function sceneSwitch(t) {
  const ia = TL.ideas, off = t >= BEAT(ia.off) && t < BEAT(ia.on);
  bg(off ? '#020306' : C.ink);
  const ap = rise(t, ia.switch, 0.7), cx = 500, cy = 800 + (1 - ap) * 400; ctx.save(); ctx.translate(cx, cy); ctx.scale(1.35, 1.35); ctx.translate(-cx, -cy);
  T('BRAIN', cx, cy - 330, MF(52, 700), off ? C.mute : C.paper, 'center');
  fillRR(cx - 190, cy - 270, 380, 540, 50, '#161E33'); fillRR(cx - 150, cy - 230, 300, 460, 34, '#0A0E19');
  // toggle: swings from ON (up) to OFF (down) and back
  let a = -1; if (t >= BEAT(ia.off)) a = lerp(-1, 1, E.outExpo(bp(t, ia.off, 0.25))); if (t >= BEAT(ia.on)) a = lerp(1, -1, E.outBack(bp(t, ia.on, 0.35)));
  const shake = t >= BEAT(ia.on) ? Math.sin((t - BEAT(ia.on)) * 60) * 10 * Math.max(0, 1 - (t - BEAT(ia.on)) * 4) : 0;
  ctx.save(); ctx.translate(cx + shake, cy); fillRR(-120, lerp(-210, 10, (a + 1) / 2), 240, 200, 26, a < 0 ? C.acc : '#3A4357'); ctx.restore();
  T('ON', cx + 240, cy - 150, MF(44, 700), a < 0 ? C.acc : C.mute); T('OFF', cx + 240, cy + 170, MF(44, 700), a > 0 ? C.paper : C.mute); ctx.restore();
}

// ---------- doubt: the window again, a light that keeps moving ----------
function sceneDoubt(t) {
  const dt = TL.doubt;
  if (t < BEAT(dt.light) - 0.4) {
    const hw = heroWindow(), s = lerp(1.5, 1.25, prog(t, BEAT(SC.doubt), 4));
    ctx.save(); ctx.translate(W / 2, H * 0.5); ctx.scale(s, s); ctx.translate(-(hw.x + hw.w / 2), -(hw.y + hw.h / 2 + 80)); drawCity(t); ctx.restore();
    clock(t, 90, 360, 200, 2, 47, SC.doubt);
    return;
  }
  bg('#05070D');
  const g = ctx.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#05070D'); g.addColorStop(1, '#101A33'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1000);
  ctx.fillStyle = '#0B1020'; ctx.fillRect(0, 1000, W, H);
  ctx.strokeStyle = '#1E2740'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(380, H); ctx.lineTo(540, 1000); ctx.lineTo(700, H); ctx.stroke();
  // the light ahead keeps moving further away
  const spots = [[540, 1000], [700, 990], [880, 985]], j = dt.next.filter(b => t >= BEAT(b)).length;
  for (let i = 0; i <= j; i++) {
    const [x, y] = spots[i], cur = i === j, p = cur ? E.outBack(bp(t, i ? dt.next[i - 1] : dt.light, 0.5)) : 1;
    ctx.save(); ctx.globalAlpha = cur ? 1 : 0.25; ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(x, y - 10, 16 * p, 0, 7); ctx.fill();
    if (cur) { ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.arc(x, y - 10, 70 * p, 0, 7); ctx.fill(); } ctx.restore();
  }
  walker(540, 1400 - (t - BEAT(dt.light)) * 24, 0.85, t, '#2C3760');
}

// ---------- the horizon and the title ----------
function sceneHorizon(t) {
  bg('#05070D'); const hz = 1180, p = prog(t, BEAT(SC.horizon), BEAT(SC.end) - BEAT(SC.horizon));
  const g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#05070D'); g.addColorStop(0.6, '#141D3A'); g.addColorStop(1, '#33416E'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz);
  for (const s of CITY.stars) { ctx.fillStyle = `rgba(241,234,220,${0.2 + 0.2 * Math.sin(t + s.ph)})`; ctx.fillRect(s.x, s.y * 1.05, s.s, s.s); }
  ctx.fillStyle = '#0A0F1F'; ctx.fillRect(0, hz, W, H - hz);
  // the structure on the horizon: unfinished, scaffolding, one light at the top
  const k = lerp(1, 1.22, E.inOutSine(p)), sx = 880, sy = hz;
  ctx.save(); ctx.translate(sx, sy); ctx.scale(k, k);
  ctx.fillStyle = '#03050A'; ctx.fillRect(-40, -330, 80, 330); ctx.fillRect(-84, -130, 168, 130);
  ctx.strokeStyle = '#03050A'; ctx.lineWidth = 6;
  for (let y = -330; y < 0; y += 50) { ctx.beginPath(); ctx.moveTo(-64, y); ctx.lineTo(64, y); ctx.moveTo(-64, y); ctx.lineTo(64, y + 50); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-64, -420); ctx.lineTo(-64, 0); ctx.moveTo(64, -420); ctx.lineTo(64, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -330); ctx.lineTo(0, -460); ctx.lineTo(170, -460); ctx.moveTo(130, -460); ctx.lineTo(130, -400); ctx.stroke(); // crane arm: still being built
  ctx.fillStyle = C.acc; ctx.fillRect(-13, -372, 26, 26);
  ctx.restore();
  // the path, and someone walking toward it
  ctx.strokeStyle = '#1F2846'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(200, H); ctx.quadraticCurveTo(620, 1420, 860, hz); ctx.stroke();
  const wp = E.inOutSine(p), wx = lerp(430, 760, wp), wy = lerp(1560, 1250, wp), wk = lerp(1.0, 0.34, wp);
  walker(wx, wy, wk, t, '#2C3760');
}
function sceneTitle(t) {
  sceneHorizon(t);
  const lines = ['The boy who', 'couldn’t stop', 'building.'];
  lines.forEach((s, i) => {
    const q = rise(t, SC.title + 0.25 * i, 0.9), y = 300 + i * 132; if (q <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 125, W, 155); ctx.clip(); T(s, 90, y + (1 - q) * 140, i === 2 ? SI(128) : SF(128, 700), i === 2 ? C.acc : C.paper); ctx.restore();
  });
  const [a, b] = TL.title.type, msg = 'The story is still being written.', n = Math.floor(msg.length * prog(t, BEAT(a), BEAT(b) - BEAT(a)));
  if (t > BEAT(a)) { const blink = Math.floor(t / (SPB / 2)) % 2 === 0; T(msg.slice(0, n), 94, 650, MF(36, 700), C.paper); if (blink) { ctx.fillStyle = C.acc; ctx.fillRect(94 + tw(msg.slice(0, n), MF(36, 700)) + 6, 622, 20, 36); } }
}

// ---------- captions: every spoken word rises in on its own time ----------
const CAPS = DATA.caps.captions, PH = DATA.caps.phrases;
const CAPT = CAPS.map((c, i) => {
  const st = BEAT(c.b) + c.words[0][1], nx = CAPS[i + 1];
  const en = nx && nx.p === c.p ? BEAT(nx.b) + nx.words[0][1] : BEAT(PH[c.p][0]) + PH[c.p][1] + 0.3;
  return { ...c, st, en: nx ? Math.min(en, BEAT(nx.b) + nx.words[0][1]) : en };
});
function captions(t) {
  const c = CAPT.find(c => t >= c.st && t < c.en); if (!c) return;
  const hook = c.p === 0, fs0 = hook ? 112 : 82, y = hook ? 1560 : 1640;
  const num = w => /^\d/.test(w), fnt = (w, acc, s) => num(w) ? MF(s * 0.92, 700) : acc ? SI(s) : SF(s, 600);
  const parts = c.words.map(([w, , acc]) => ({ w, acc: acc || num(w), f: fnt(w, acc, fs0) }));
  const sp = tw(' ', SF(fs0, 600)); let total = parts.reduce((s, p) => s + tw(p.w, p.f), 0) + sp * (parts.length - 1);
  const k = Math.min(1, 960 / total), fs = fs0 * k; parts.forEach((p, j) => p.f = fnt(p.w, c.words[j][2], fs)); total *= k;
  const out = E.inCubic(prog(t, c.en - 0.12, 0.12));
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - fs * 1.05, W, fs * 1.4); ctx.clip();
  let x = 540 - total / 2;
  c.words.forEach(([w, dt, acc], j) => {
    const p = parts[j], ww = tw(p.w, p.f), q = E.outExpo(prog(t, BEAT(c.b) + dt - 0.04, 0.22));
    if (q > 0) T(p.w, x, y + (1 - q) * fs * 1.1 - out * fs * 1.2, p.f, p.acc ? C.acc : C.paper);
    x += ww + sp * k;
  });
  ctx.restore();
}

// ---------- the cut list ----------
function seek(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]);
  const B_ = b => t >= BEAT(b);
  if (!B_(8.25)) sceneNight(t);
  else if (!B_(SC.grade8)) sceneRoom(t);
  else if (!B_(SC.pexel)) bedroom(t, TL.grade8.crt, TL.grade8.label, TL.grade8.doodles, typeG8);
  else if (!B_(TL.pexel.window)) sceneJump(t);
  else if (!B_(SC.lithuania)) scenePexel(t);
  else if (!B_(44.5)) sceneLithuania(t);
  else if (!B_(SC.build)) sceneSketch(t);
  else if (!B_(SC.shaw)) sceneBuild(t);
  else if (!B_(SC.ideas)) sceneShaw(t);
  else if (!B_(TL.ideas.switch)) sceneIdeas(t);
  else if (!B_(SC.doubt)) sceneSwitch(t);
  else if (!B_(SC.boy)) sceneDoubt(t);
  else if (!B_(SC.horizon)) bedroom(t, TL.boy.crt, TL.boy.label, TL.boy.doodles, typeBoy);
  else if (!B_(SC.title)) sceneHorizon(t);
  else sceneTitle(t);
  captions(t);
}
window.seek = seek;
