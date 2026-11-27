"""Place ElevenLabs voiceover phrases on a film's beat grid, duck the score under them, master to -14 LUFS.

usage: python3 audio/vo_mix.py audio/vo/<film>.json

config: take (mp3), music (raw score wav), beats (json with offset/spb), out (name, no extension),
        phrases: [[source_start_s, source_end_s or null for end of take, beat, text], ...]
Writes audio/<out>_raw.wav and the mastered audio/<out>.wav."""
import json, subprocess, sys, re
import numpy as np, soundfile as sf
from scipy import signal

SR = 44100
cfg = json.load(open(sys.argv[1]))
BE = json.load(open(cfg['beats']))
BEAT = lambda b: BE['offset'] + b * BE['spb']
wav = cfg['take'].rsplit('.', 1)[0] + '.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', cfg['take'], '-ar', str(SR), '-ac', '1', wav], check=True)
vo, _ = sf.read(wav)
vo = signal.sosfilt(signal.butter(2, 90, 'highpass', fs=SR, output='sos'), vo)
PHRASES = [(s0, s1 if s1 is not None else len(vo) / SR, b, txt) for s0, s1, b, txt in cfg['phrases']]

music, sr2 = sf.read(cfg['music']); assert sr2 == SR
N = len(music); pad = int(0.04 * SR)
segs, prev_end = [], -1.0
for s0, s1, b, txt in PHRASES:
    a_, z = max(0, int(s0 * SR) - pad), min(len(vo), int(s1 * SR) + pad)
    seg = vo[a_:z].copy(); f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    seg /= max(1e-9, np.sqrt(np.mean(seg ** 2)))
    st, en = BEAT(b), BEAT(b) + len(seg) / SR
    flag = '  <-- OVERLAPS previous' if st < prev_end else ''
    prev_end = en
    segs.append((int(st * SR), seg)); print(f'b{b:5.2f}  {st:5.2f}s-{en:5.2f}s  {txt}{flag}')

shape = np.zeros(N)
for i, seg in segs: e = min(N, i + len(seg)); shape[i:e] += np.abs(seg[:e - i])
win = int(0.08 * SR); env = np.convolve(shape, np.ones(win) / win, mode='same'); env = np.clip(env / (env.max() + 1e-9) * 2.5, 0, 1)
att = signal.sosfilt(signal.butter(1, 6, 'lowpass', fs=SR, output='sos'), env)
gain = 1 - 0.72 * np.clip(att * 1.6, 0, 1)            # about -11 dB under speech
ducked = music * gain[:, None]
track = np.zeros(N)
for i, seg in segs:                                      # each phrase sits +8 dB over what plays under it
    e = min(N, i + len(seg)); m = np.sqrt(np.mean(ducked[i:e] ** 2)); track[i:e] += seg[:e - i] * m * 10 ** (8 / 20)
mix = ducked + np.stack([track, track], 1)
mix /= max(1e-9, np.abs(mix).max()) / 0.95
raw = f"audio/{cfg['out']}_raw.wav"; sf.write(raw, mix, SR)
for (s0, s1, b, txt), (i, seg) in zip(PHRASES, segs):
    e = min(N, i + len(seg)); v = np.sqrt(np.mean(track[i:e] ** 2)); m = np.sqrt(np.mean(ducked[i:e] ** 2))
    print(f'  {txt[:30]:30s} voice/music {20 * np.log10(v / m):+5.1f} dB')

# two-pass loudnorm to -14 LUFS, true peak -1.5
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
out = f"audio/{cfg['out']}.wav"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), out], check=True)
r2 = subprocess.run(['ffmpeg', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print(out, [l.strip() for l in r2.splitlines() if re.match(r'\s+(I:|Peak:)', l)][-2:])
