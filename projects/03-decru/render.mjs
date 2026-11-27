// node render.mjs --fmt 16x9|9x16 [--fps 60] [--contact] [--frames a,b,c] [--check] [--silent-test]
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const has = k => process.argv.includes(k);
const fmt = arg('--fmt') || '16x9', [w, h] = fmt === '9x16' ? [1080, 1920] : [1920, 1080];
const fps = +(arg('--fps') || 60), TL = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json')));
fs.mkdirSync(path.join(dir, 'out'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push('PAGE ERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

if (has('--silent-test')) {   // live mode, audio files hidden: must play with no JS errors
  await page.route(/\.mp3$/, r => r.abort());
  await page.goto('file://' + path.join(dir, 'index.html'));
  await page.evaluate(() => window.ready); await page.click('#play'); await page.waitForTimeout(4000);
  const t = await page.evaluate(() => document.getElementById('play').style.display);
  console.log('live play with audio blocked: overlay hidden =', t === 'none', '| JS errors:', errors.filter(e => e.startsWith('PAGE')).length, '| resource messages:', errors.length);
  errors.forEach(e => console.log('  ', e.slice(0, 160))); await browser.close(); process.exit(0);
}

await page.goto('file://' + path.join(dir, 'index.html') + '?render=1');
await page.evaluate(() => window.ready);
const shot = async t => { await page.evaluate(t => window.seek(t), t); return page.screenshot({ type: 'png' }); };

if (has('--check')) {        // safe-zone check on every visible text element, every 0.25 s
  const bad = [];
  for (let t = 0; t < TL.duration; t += .25) {
    await page.evaluate(t => window.seek(t), t);
    const v = await page.evaluate(() => { const s = window.SAFE(); return [...document.querySelectorAll('[data-safe]')].filter(e => +getComputedStyle(e).opacity > .05)
      .map(e => { const r = e.getBoundingClientRect(); return { txt: e.textContent.trim().slice(0, 24), r: [r.left, r.top, r.right, r.bottom].map(Math.round), ok: r.left >= s[0] - 1 && r.top >= s[1] - 1 && r.right <= s[2] + 1 && r.bottom <= s[3] + 1 }; }).filter(x => !x.ok); }, null);
    v.forEach(x => bad.push(`${t.toFixed(2)}s "${x.txt}" ${x.r}`));
  }
  console.log(fmt, 'safe-zone violations:', bad.length); bad.slice(0, 20).forEach(b => console.log('  ', b));
  console.log('errors:', errors.length); errors.forEach(e => console.log('  ', e)); await browser.close(); process.exit(0);
}

if (has('--contact') || arg('--frames')) {
  const times = arg('--frames') ? arg('--frames').split(',').map(Number) : Array.from({ length: 60 }, (_, i) => i * .5 + .25);
  const cs = path.join(dir, 'out', 'cs'); fs.rmSync(cs, { recursive: true, force: true }); fs.mkdirSync(cs, { recursive: true });
  for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(cs, `f${String(i).padStart(2, '0')}.png`), await shot(times[i]));
  const cols = arg('--frames') ? (h > w ? 5 : 3) : (h > w ? 12 : 8), rows = Math.ceil(times.length / cols), tw = h > w ? 216 : 384;
  const name = arg('--frames') ? `frames-${fmt}.png` : `contact-${fmt}.png`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(cs, 'f%02d.png'), '-vf', `scale=${tw}:-2,tile=${cols}x${rows}:padding=4:color=#333333`, '-frames:v', '1', path.join(dir, 'out', name)]);
  console.log('wrote out/' + name, '| errors:', errors.length); errors.forEach(e => console.log('  ', e)); await browser.close(); process.exit(0);
}

const N = Math.round(TL.duration * fps), out = path.join(dir, 'out', `decru-${fmt}.mp4`);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', path.join(dir, 'out', 'mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps),
  '-af', 'volume=-0.4dB', '-c:a', 'aac', '-b:a', '256k', '-t', String(TL.duration), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { const b = await shot(f / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 300 === 0) console.log(fmt, 'frame', f, '/', N); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
console.log('wrote', out, '| errors:', errors.length); errors.forEach(e => console.log('  ', e));
