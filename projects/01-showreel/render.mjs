// node render.mjs [--contact] [--frames a,b,c]   -> out/contact.png | out/showreel.mp4
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const TL = JSON.parse(fs.readFileSync(path.join(root, 'timeline.json')));
const BEATS = JSON.parse(fs.readFileSync(path.join(root, 'beats.json')));
fs.writeFileSync(path.join(root, 'data.js'), `window.DATA=${JSON.stringify({ timeline: TL, beats: BEATS })};`);
fs.mkdirSync(path.join(root, 'out'), { recursive: true });
const contact = process.argv.includes('--contact');
const fi = process.argv.indexOf('--frames');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto('file://' + path.join(root, 'index.html'));
await page.evaluate(() => window.ready);
const shot = async t => { await page.evaluate(t => window.seek(t), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }); };

if (contact || fi > 0) {
  const times = fi > 0 ? process.argv[fi + 1].split(',').map(Number)
    : Array.from({ length: 30 }, (_, i) => BEATS.offset + i * BEATS.spb + 0.12); // one frame per beat, just after the hit
  const dir = path.join(root, 'out', 'cs'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(dir, `f${String(i).padStart(2, '0')}.png`), await shot(times[i]));
  const cols = fi > 0 ? 3 : 5, rows = Math.ceil(times.length / cols);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'f%02d.png'), '-vf', `scale=640:360,tile=${cols}x${rows}:padding=6:color=#444444`, '-frames:v', '1', path.join(root, 'out', fi > 0 ? 'frames.png' : 'contact.png')]);
  await browser.close(); console.log('contact sheet written'); process.exit(0);
}

const N = Math.round(TL.duration * TL.fps), out = path.join(root, 'out', 'showreel.mp4');
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(TL.fps), '-i', '-', '-i', fs.existsSync(path.join(root, 'audio', 'score_vo.wav')) ? path.join(root, 'audio', 'score_vo.wav') : path.join(root, 'audio', 'score.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(TL.fps), '-c:a', 'aac', '-b:a', '256k', '-t', String(TL.duration), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { const buf = await shot(f / TL.fps); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 60 === 0) console.log('frame', f, '/', N); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('wrote', out);
