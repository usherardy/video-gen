// The animated cut: 25 Kling clips + the real shawgames.com recording, cut on the voiceover's words,
// with one-word captions, the 15,000 count-up and the end title on top, and ../audio/still_vo.wav underneath.
// node compose.mjs [--frames t1,t2,...]   (run from pixar/; clips in clips/vNN.mp4, real footage in real/)
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname), film = path.join(root, '..');
const J = f => JSON.parse(fs.readFileSync(f));
const CAPS = J(path.join(film, 'captions.json')), BEATS = J(path.join(film, 'beats.json')), TL = J(path.join(film, 'timeline.json'));
const FPS = 30, DUR = TL.duration, W = 1080, H = 1920;
const T = b => BEATS.offset + b * BEATS.spb;
const chunkT = i => T(CAPS.captions[i].b) + CAPS.captions[i].words[0][1];

// shots: [clip, caption chunk the cut lands on]; 'real' is the shawgames.com screen recording
const SHOTS = [['01', null], ['02', 2], ['03', 5], ['04', 8], ['05', 11], ['06', 13], ['07', 16], ['08', 19], ['09', 22], ['10', 25],
  ['11', 26], ['12', 31], ['13', 33], ['14', 35], ['15', 40], ['16', 43], ['17', 45], ['18', 47], ['real', 50], ['20', 52], ['21', 54],
  ['22', 57], ['23', 59], ['24', 65], ['25', 69], ['26', 74]];
const cuts = SHOTS.map(([c, i]) => ({ clip: c, t: i === null ? 0 : chunkT(i) }));
cuts.forEach((s, k) => { s.end = k + 1 < cuts.length ? cuts[k + 1].t : DUR; s.dur = s.end - s.t; });

// words for the captions: each shows until the next word starts (or 0.45 s after it starts, at a pause)
const words = [];
CAPS.captions.forEach(c => c.words.forEach(([text, dt, acc]) => words.push({ text, t: T(c.b) + dt, accent: 0 })));
words.forEach((w, i) => { const nx = words[i + 1]; w.end = nx ? Math.min(nx.t, w.t + Math.max(0.45, Math.min(0.9, nx.t - w.t))) : w.t + 0.8; });
const real = cuts.find(s => s.clip === 'real');
const OVL = { words, captionY: 1310, counter: { t0: real.t, t1: T(TL.shaw.count[1]), t2: real.end, value: 15000 }, title: { t0: cuts.at(-1).t, type0: cuts.at(-1).t + 1.0, type1: cuts.at(-1).t + 2.4 } };
fs.writeFileSync(path.join(root, 'overlay-data.js'), `window.OVL=${JSON.stringify(OVL)};`);
fs.mkdirSync(path.join(root, 'out'), { recursive: true });

// 1. the picture: trim, scale and join the shots
const src = s => s.clip === 'real' ? path.join(root, 'real', 'shaw-scroll.mp4') : path.join(root, 'clips', `v${s.clip}.mp4`);
for (const s of cuts) if (!fs.existsSync(src(s))) { console.error('missing', src(s)); process.exit(1); }
const base = path.join(root, 'out', 'base.mp4');
const fc = cuts.map((s, i) => `[${i}:v]trim=0:${s.dur.toFixed(4)},setpts=PTS-STARTPTS,fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[v${i}]`).join(';')
  + ';' + cuts.map((_, i) => `[v${i}]`).join('') + `concat=n=${cuts.length}:v=1:a=0,trim=0:${DUR}[out]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', ...cuts.flatMap(s => ['-i', src(s)]), '-filter_complex', fc, '-map', '[out]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', base]);
console.log('base cut:', cuts.map(s => `${s.clip}@${s.t.toFixed(2)}`).join(' '));

// 2. the overlay, composited frame by frame over the cut, with the mix
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
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'f%02d.png'), '-vf', `scale=300:-2,tile=${Math.min(6, times.length)}x${Math.ceil(times.length / 6)}:padding=6:color=#444444`, '-frames:v', '1', path.join(root, 'out', 'frames.png')]);
  await browser.close(); console.log('frames written'); process.exit(0);
}

const out = path.join(root, 'out', 'still-building-animated-9x16.mp4'), N = Math.round(DUR * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', base, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', path.join(film, 'audio', 'still_vo.wav'),
  '-filter_complex', '[0:v][1:v]overlay=format=auto,format=yuv420p[v]', '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
  '-c:a', 'aac', '-b:a', '256k', '-t', String(DUR), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { const buf = await shot(f / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 300 === 0) console.log('frame', f, '/', N); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('wrote', out);
