// node render.mjs [--contact] [--frames t1,t2,...]   (9:16, 1080x1920)
// --contact: one frame per beat, in sheets of 24 (out/contact-1.png ...). --frames: chosen times in seconds (out/frames.png).
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const [w, h] = [1080, 1920];
const TL = JSON.parse(fs.readFileSync(path.join(root, 'timeline.json')));
const BEATS = JSON.parse(fs.readFileSync(path.join(root, 'beats.json')));
const CAPS = JSON.parse(fs.readFileSync(path.join(root, 'captions.json')));
fs.writeFileSync(path.join(root, 'data.js'), `window.DATA=${JSON.stringify({ tl: TL, beats: BEATS, caps: CAPS })};`);
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
  const nb = Math.floor(TL.scenes.end);
  const times = fi > 0 ? arg('--frames').split(',').map(Number) : Array.from({ length: nb }, (_, i) => BEATS.offset + (i + 0.4) * BEATS.spb);
  const dir = path.join(root, 'out', 'cs'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), await shot(times[i]));
  const per = fi > 0 ? times.length : 24, cols = fi > 0 ? Math.min(times.length, 5) : 6;
  for (let s = 0; s * per < times.length; s++) {
    const n = Math.min(per, times.length - s * per), rows = Math.ceil(n / cols);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-start_number', String(s * per), '-t', String(n), '-i', path.join(dir, 'f%03d.png'), '-frames:v', '1',
      '-vf', `scale=${fi > 0 ? 360 : 270}:-2,tile=${cols}x${rows}:padding=6:color=#555555`, '-update', '1', path.join(root, 'out', fi > 0 ? 'frames.png' : `contact-${s + 1}.png`)]);
  }
  await browser.close(); console.log('sheets written'); process.exit(0);
}

const N = Math.round(TL.duration * TL.fps), out = path.join(root, 'out', 'still-building-9x16.mp4');
const audio = path.join(root, 'audio', fs.existsSync(path.join(root, 'audio', 'still_vo.wav')) ? 'still_vo.wav' : 'score_raw.wav');
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(TL.fps), '-i', '-', '-i', audio,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(TL.fps), '-c:a', 'aac', '-b:a', '256k',
  '-t', String(TL.duration), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { const buf = await shot(f / TL.fps); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 150 === 0) console.log('frame', f, '/', N); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('wrote', out);
