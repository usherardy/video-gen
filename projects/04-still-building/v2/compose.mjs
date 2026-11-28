// v2: the new script recut from the 25 Pixar clips already made (../pixar/clips) + the real shawgames.com scroll,
// with the Kokoro voiceover and the v2 score (audio/still_v2_vo.wav). No new AI generation.
// node compose.mjs [--frames t1,t2,...]   (run from v2/)
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname), px = path.join(root, '..', 'pixar');
const J = f => JSON.parse(fs.readFileSync(path.join(root, f)));
const CAPS = J('captions.json'), BEATS = J('beats.json'), TL = J('timeline.json');
const FPS = 30, DUR = TL.duration, W = 1080, H = 1920, T = b => BEATS.offset + b * BEATS.spb;
const words = CAPS.words.map(w => ({ text: w.text, line: w.line, t: T(w.b) + w.dt }));
const wt = (line, i) => words.filter(w => w.line === line)[i].t;

// [clip, line, word the cut lands on, offset into the clip (s)]
const SHOTS = [
  ['05', 0, 0, 0], ['06', 0, 6, 0], ['07', 1, 0, 0], ['06', 1, 9, 1.6],                      // the dream
  ['12', 2, 0, 0], ['13', 3, 0, 0], ['04', 3, 6, 0],                                          // Lithuania
  ['23', 4, 0, 0], ['02', 5, 0, 0], ['01', 5, 4, 0], ['22', 6, 0, 0], ['11', 6, 8, 0],       // the weight
  ['03', 7, 0, 0], ['14', 8, 0, 0], ['20', 8, 8, 0],                                          // the turn
  ['15', 9, 0, 0], ['02', 9, 4, 0.8], ['01', 10, 0, 2.5], ['22', 10, 3, 2.4], ['23', 10, 6, 2.0], // a way out
  ['16', 11, 0, 0], ['real', 12, 0, 0], ['03', 12, 5, 2.4],
  ['18', 12, 6, 0], ['17', 12, 8, 0], ['21', 13, 0, 0],                                       // the obsession
  ['15', 14, 0, 1.7], ['25', 15, 0, 0],                                                       // possible
  ['04', 16, 0, 1.8], ['24', 17, 0, 0], ['26', 18, 0, 0]];                                    // the boy, keep going
const cuts = SHOTS.map(([clip, l, i, off]) => ({ clip, off, t: l === 0 && i === 0 ? 0 : wt(l, i) }));
const NF = Math.round(DUR * FPS);
cuts.forEach((s, k) => { s.f0 = Math.round(s.t * FPS); s.f1 = k + 1 < cuts.length ? Math.round(cuts[k + 1].t * FPS) : NF; s.dur = (s.f1 - s.f0) / FPS; s.end = s.f1 / FPS; });

words.forEach((w, i) => { const nx = words[i + 1]; w.end = nx ? Math.min(nx.t, w.t + Math.max(0.45, Math.min(0.9, nx.t - w.t))) : w.t + 0.8; });
const real = cuts.find(s => s.clip === 'real'), last = cuts.at(-1);
const OVL = { words, captionY: 1310, counter: { t0: real.t, t2: real.end, pillOnly: true }, title: { t0: last.t, type0: last.t + 1.0, type1: last.t + 2.4 } };
fs.writeFileSync(path.join(root, 'overlay-data.js'), `window.OVL=${JSON.stringify(OVL)};`);
fs.mkdirSync(path.join(root, 'out'), { recursive: true });

// 1. the picture: each shot from its offset; a shot longer than what is left of its clip holds the last frame
const src = s => s.clip === 'real' ? path.join(px, 'real', 'shaw-scroll.mp4') : path.join(px, 'clips', `v${s.clip}.mp4`);
for (const s of cuts) if (!fs.existsSync(src(s))) { console.error('missing', src(s)); process.exit(1); }
const base = path.join(root, 'out', 'base.mp4');
const fc = cuts.map((s, i) => `[${i}:v]fps=${FPS},tpad=stop_mode=clone:stop_duration=3,trim=start_frame=${Math.round(s.off * FPS)}:end_frame=${Math.round(s.off * FPS) + s.f1 - s.f0},setpts=PTS-STARTPTS,scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[v${i}]`).join(';')
  + ';' + cuts.map((_, i) => `[v${i}]`).join('') + `concat=n=${cuts.length}:v=1:a=0[out]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', ...cuts.flatMap(s => ['-i', src(s)]), '-filter_complex', fc, '-map', '[out]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', base]);
console.log(cuts.map(s => `${s.clip}@${s.t.toFixed(2)}(${s.dur.toFixed(1)}s${s.off + s.dur > 5.04 ? ' HOLD' : ''})`).join(' '));

// 2. the overlay over the cut, with the mix
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto('file://' + path.join(root, 'overlay.html'));
await page.evaluate(() => window.ready);
const shot = async t => { await page.evaluate(t => window.seek(t), t); return page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } }); };

const fi = process.argv.indexOf('--frames');
if (fi > 0) {
  const times = process.argv[fi + 1].split(',').map(Number), dir = path.join(root, 'out', 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) {
    const o = path.join(dir, `o${i}.png`); fs.writeFileSync(o, await shot(times[i]));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(times[i]), '-i', base, '-i', o, '-filter_complex', '[0:v][1:v]overlay', '-frames:v', '1', path.join(dir, `f${String(i).padStart(2, '0')}.png`)]);
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'f%02d.png'), '-vf', `scale=240:-2,tile=${Math.min(9, times.length)}x${Math.ceil(times.length / 9)}:padding=6:color=#444444`, '-frames:v', '1', path.join(root, 'out', 'frames.png')]);
  await browser.close(); console.log('frames written'); process.exit(0);
}
const out = path.join(root, 'out', 'still-building-v2-9x16.mp4'), N = Math.round(DUR * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', base, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', path.join(root, 'audio', 'still_v2_vo.wav'),
  '-filter_complex', '[0:v][1:v]overlay=format=auto,format=yuv420p[v]', '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
  '-c:a', 'aac', '-b:a', '256k', '-t', String(DUR), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { const buf = await shot(f / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 300 === 0) console.log('frame', f, '/', N); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('wrote', out);
