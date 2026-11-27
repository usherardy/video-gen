"""Cut the talking-head clip and write caption timing.

usage (from this folder): python3 build.py [--data]   (--data: rewrite data.js only, keep the cut)
  reads  edit.json, src/IMG_9459.MOV, src/words.json
  writes out/talk.mp4 (cut, HDR->SDR, punch-ins, 30 fps, no audio)
         out/talk.wav (cut voice, cleaned, -14 LUFS)
         data.js      (caption chunks in output time, for captions.html)
"""
import json, os, re, subprocess

E = json.load(open('edit.json'))
W = json.load(open('src/words.json'))
FPS, (OW, OH) = E['fps'], E['size']
LEAD = 0.06  # captions land a hair before the sound
os.makedirs('out', exist_ok=True)

# shots -> whole frames, output offsets
shots, t = [], 0.0
for s in E['shots']:
    n = round((s['out'] - s['in']) * FPS)
    shots.append({**s, 'n': n, 'dur': n / FPS, 'at': t})
    t += n / FPS
TOTAL = t

def to_out(src):
    """Map a source time to output time. Times inside a removed gap snap to the next shot's start."""
    for s in shots:
        if src < s['in']:
            return s['at']
        if src < s['in'] + s['dur']:
            return s['at'] + (src - s['in'])
    return TOTAL

# caption chunks
chunks, accent = [], False
for ch in E['captions']:
    words = []
    for item in ch:
        text, wi = item[0], item[1]
        opens, closes = text.startswith('*'), text.endswith('*')
        if opens: accent = True
        words.append({'text': text.strip('*'), 'accent': accent, 't': round(max(0.0, to_out(W[wi]['s']) - LEAD), 3)})
        if closes: accent = False
    chunks.append({'t': words[0]['t'], 'words': words})
chunks[0]['t'] = 0.0
chunks[0]['words'][0]['t'] = 0.0
for i, c in enumerate(chunks):
    c['end'] = chunks[i + 1]['t'] if i + 1 < len(chunks) else round(TOTAL, 3)
with open('data.js', 'w') as f:
    f.write('window.DATA=' + json.dumps({'fps': FPS, 'w': OW, 'h': OH, 'total': TOTAL, 'chunks': chunks,
                                        'cuts': [round(s['at'], 3) for s in shots]}) + ';')
if '--data' in __import__('sys').argv:
    raise SystemExit(f'data.js only: {len(chunks)} caption chunks, {TOTAL:.2f} s')

# picture: HLG -> SDR (hable), 30 fps, per-shot trim + punch-in anchored just above the head
ay = E['zoom_anchor_y']
tone = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p'
fc = [f'[0:v]{tone},fps={FPS},split={len(shots)}' + ''.join(f'[v{i}]' for i in range(len(shots)))]
for i, s in enumerate(shots):
    z = s['zoom']
    sw, sh = round(OW * z / 2) * 2, round(OH * z / 2) * 2
    cx, cy = (sw - OW) // 2, round(ay * OH * (z - 1))
    fc.append(f'[v{i}]trim=start={s["in"]}:duration={s["dur"]},setpts=PTS-STARTPTS,'
              f'scale={sw}:{sh}:flags=lanczos,crop={OW}:{OH}:{cx}:{cy},setsar=1[c{i}]')
# voice: per-shot trim with short fades so jump cuts don't click
for i, s in enumerate(shots):
    fc.append(f'[0:a]atrim=start={s["in"]}:duration={s["dur"]},asetpts=PTS-STARTPTS,'
              f'afade=t=in:d=0.008,afade=t=out:st={s["dur"] - 0.012:.3f}:d=0.012[a{i}]')
fc.append(''.join(f'[c{i}][a{i}]' for i in range(len(shots))) + f'concat=n={len(shots)}:v=1:a=1[v][araw]')
voice = 'highpass=f=85,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=4500:t=q:w=1.5:g=2.5,' \
        'acompressor=threshold=-26dB:ratio=3:attack=6:release=90:makeup=4dB'
fc.append(f'[araw]{voice},aresample=48000[a]')

src = E['source']
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', ';'.join(fc),
                '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-pix_fmt', 'yuv420p',
                '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-an', 'out/talk.mp4',
                '-map', '[a]', '-c:a', 'pcm_s24le', 'out/talk_pre.wav'], check=True)

# master the voice to -14 LUFS (two-pass loudnorm)
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'out/talk_pre.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json',
                    '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', m, re.S).group(0))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'out/talk_pre.wav', '-af',
                f'loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j["input_i"]}:measured_TP={j["input_tp"]}:'
                f'measured_LRA={j["input_lra"]}:measured_thresh={j["input_thresh"]}:offset={j["target_offset"]}:linear=true,aresample=48000',
                '-c:a', 'pcm_s24le', 'out/talk.wav'], check=True)
print(f'talk: {len(shots)} shots, {TOTAL:.2f} s, {len(chunks)} caption chunks; voice in {j["input_i"]} LUFS -> -14')
