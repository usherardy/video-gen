// node render_promo.mjs --fmt 9x16|1x1|16x9 [--contact] [--frames a,b,c]
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const FMTS = { '9x16': [1080, 1920], '1x1': [1080, 1080], '16x9': [1920, 1080] };
const fmtName = arg('--fmt') || '9x16', [w, h] = FMTS[fmtName];
const TL = JSON.parse(fs.readFileSync(path.join(root, 'timeline.json')));
const BEATS = JSON.parse(fs.readFileSync(path.join(root, 'beats.json')));
fs.writeFileSync(path.join(root, 'data.js'), `window.DATA=${JSON.stringify({ tl: TL, beats: BEATS, fmt: { w, h } })};`);
fs.mkdirSync(path.join(root, 'out'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto('file://' + path.join(root, 'index.html'));
await page.evaluate(() => window.ready);
const shot = async t => { await page.evaluate(t => window.seek(t), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: w, height: h } }); };

const fi = process.argv.indexOf('--frames');
if (process.argv.includes('--contact') || fi > 0) {
  const times = fi > 0 ? arg('--frames').split(',').map(Number) : Array.from({ length: 40 }, (_, i) => BEATS.offset + i * BEATS.spb + 0.15);
  const dir = path.join(root, 'out', 'cs'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(dir, `f${String(i).padStart(2, '0')}.png`), await shot(times[i]));
  const cols = fi > 0 ? (h > w ? 5 : 3) : (h > w ? 8 : (w === h ? 8 : 6)), rows = Math.ceil(times.length / cols), tw = h > w ? 270 : (w === h ? 270 : 400);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'f%02d.png'), '-vf', `scale=${tw}:-2,tile=${cols}x${rows}:padding=6:color=#444444`, '-frames:v', '1', path.join(root, 'out', `${fi > 0 ? 'frames' : 'contact-' + fmtName}.png`)]);
  await browser.close(); console.log('sheet written'); process.exit(0);
}

const N = Math.round(TL.duration * TL.fps), out = path.join(root, 'out', `promptitin-v2-${fmtName}.mp4`);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(TL.fps), '-i', '-', '-i', fs.existsSync(path.join(root, 'audio', 'promo2_vo.wav')) ? path.join(root, 'audio', 'promo2_vo.wav') : path.join(root, 'audio', 'promo2.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(TL.fps), '-c:a', 'aac', '-b:a', '256k', '-t', String(TL.duration), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { const buf = await shot(f / TL.fps); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 100 === 0) console.log(fmtName, 'frame', f, '/', N); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('wrote', out);
