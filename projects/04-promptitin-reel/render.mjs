// node render.mjs              -> out/promptitin-reel-9x16.mp4 (captioned talk + PromptItIn v1 film), CRF 16
// node render.mjs --contact    -> out/contact.png, one frame per caption chunk + the outro, from the render
// Run python3 build.py first (writes out/talk.mp4, out/talk.wav, data.js).
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
process.chdir(root);
const E = JSON.parse(fs.readFileSync('edit.json'));
const D = JSON.parse(fs.readFileSync('data.js', 'utf8').replace(/^window\.DATA=/, '').replace(/;\s*$/, ''));
const [w, h] = E.size, FPS = E.fps, out = path.join('out', 'promptitin-reel-9x16.mp4');

if (process.argv.includes('--contact')) {
  const times = [...D.chunks.map(c => Math.min(c.end - 0.05, c.t + 0.3)), ...[0.4, 3, 7, 12, 17, 19.7].map(t => D.total + t)];
  const sel = times.map(t => `lt(prev_t\\,${t.toFixed(3)})*gte(t\\,${t.toFixed(3)})`).join('+');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', `select='${sel}',scale=270:-2,tile=10x${Math.ceil(times.length / 10)}:padding=6:color=#444444`,
    '-frames:v', '1', '-fps_mode', 'vfr', path.join('out', 'contact.png')]);
  console.log('wrote out/contact.png'); process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto('file://' + path.join(root, 'captions.html'));
await page.evaluate(() => window.ready);

const N = Math.round(D.total * FPS);
const fc = [
  '[0:v][1:v]overlay=0:0:format=auto,format=yuv420p,setsar=1[talk]',
  `[3:v]fps=${FPS},scale=${w}:${h},format=yuv420p,setsar=1[film]`,
  '[2:a]aresample=48000[ta]', '[3:a]aresample=48000[fa]',
  '[talk][ta][film][fa]concat=n=2:v=1:a=1[v][a]',
];
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', 'out/talk.mp4', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-i', 'out/talk.wav', '-i', E.outro, '-filter_complex', fc.join(';'), '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) {
  await page.evaluate(t => window.seek(t), f / FPS);
  const buf = await page.screenshot({ type: 'png', omitBackground: true });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log('captions frame', f, '/', N);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
console.log('wrote', out);
