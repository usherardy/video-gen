"""DECRU audio build, driven by decru/timeline.json (shared with the film).

1. Writes the browser files next to index.html: music.mp3 (take trimmed so the drop lands at 12.0 s),
   vo.mp3 (phrases pre-placed; the film starts it at vo.start), sfx_*.mp3 (peak-normalized).
2. Writes out/mix.wav: an offline mix that mirrors the browser wiring (vo at vo.gain, music ducked to
   vo.duck under each phrase, every cue at its gain), mastered to -14 LUFS / -1.5 dBTP, for the MP4.
Cue times are where the *peak* of each sound lands; the browser fires each file `peak` seconds early too."""
import json, os, re, subprocess
import numpy as np, soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SR = 44100
TL = json.load(open('timeline.json'))
DUR = TL['duration']; N = int(DUR * SR)

def load(path, tempo=None, af=None):
    af = ['-af', af] if af else (['-af', f'atempo={tempo}'] if tempo else [])
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, *af, '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
def save_mp3(x, path, br='192k'):
    tmp = path + '.wav'; sf.write(tmp, x, SR)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', br, path], check=True); os.remove(tmp)
def place(dst, x, t):
    i = int(round(t * SR)); x = x[:max(0, N - i)]; dst[i:i + len(x)] += x
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
db = lambda v: 20 * np.log10(v + 1e-12)

# --- music: trim so the drop lands at 12.0, pad to the film length, gentle fade at the very end
m = load(TL['music']['source'])[int(TL['music']['trim'] * SR):]
music = np.zeros((N, 2)); music[:min(N, len(m))] = m[:N]
music[-int(0.25 * SR):] *= np.linspace(1, 0, int(0.25 * SR))[:, None]
music /= np.abs(music).max() / 0.33  # baked ~-9.6 dBFS peak: with the brief's 0.6 duck the VO (at 0.8) clears the dense groove by 6+ dB
save_mp3(music, TL['music']['file'], '256k')

# --- vo: phrases cut from the take, placed on film time; the file itself starts at vo.start
V = TL['vo']; take = load(V['source'], af='acompressor=threshold=-26dB:ratio=4:attack=4:release=90:makeup=10dB,alimiter=limit=0.95:level=false'); pad = int(0.04 * SR)
vo_film = np.zeros((N, 2)); windows = []
for p in V['phrases']:
    s0, s1 = p['src']; s1 = s1 if s1 is not None else len(take) / SR
    seg = take[max(0, int(s0 * SR) - pad): int(s1 * SR) + pad].copy()
    if p.get('tempo'):
        tmp = 'audio/_seg.wav'; sf.write(tmp, seg, SR); seg = load(tmp, p['tempo']); os.remove(tmp)
    f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
    place(vo_film, seg, p['t']); windows.append((p['t'], p['t'] + len(seg) / SR, p['text']))
for a, b in zip(windows, windows[1:]):
    assert b[0] >= a[1] - 0.005, f'overlap: {a[2]} / {b[2]}'
vo_file = vo_film[int(V['start'] * SR):].copy()
vo_file /= np.abs(vo_file).max() / 0.94
save_mp3(vo_file, V['file'])
vo_film[:] = 0; vo_film[int(V['start'] * SR):] = vo_file

# --- sfx: peak-normalize, keep in a dict for the offline mix
sfx = {}
for name, s in TL['sfx'].items():
    x = load(s['source']); x /= np.abs(x).max() / 0.5; sfx[name] = (x, s['peak']); save_mp3(x, name)  # -6 dBFS, sits with the music bed

# --- offline mix that mirrors the browser wiring
duck = np.ones(N)
for a, b, _ in windows:                                  # music.volume ramps to vo.duck under each phrase
    i0, i1 = int((a - 0.1) * SR), int((b + 0.05) * SR); ramp = int(0.15 * SR)
    seg = np.ones(i1 - i0) * V['duck']; seg[:ramp] = np.linspace(1, V['duck'], ramp); seg[-ramp:] = np.linspace(V['duck'], 1, ramp)
    duck[i0:i1] = np.minimum(duck[i0:i1], seg)
mix = music * TL['music']['gain'] * duck[:, None] + vo_film * V['gain']
cues = list(TL['cues'])
T = TL['typeOn']
for k, ch in enumerate(T['text']):
    if ch != ' ': cues.append({'f': 'sfx_tick.mp3', 'at': T['start'] + k * T['step'], 'gain': T['tickGain']})
for c in cues:
    x, peak = sfx[c['f']]; place(mix, x * c['gain'], c['at'] - peak)

for a, b, txt in windows:
    i, j = int(a * SR), int(b * SR)
    print(f'  {a:5.2f}-{b:5.2f}s  {txt[:34]:34s} voice/music {db(rms(vo_film[i:j] * V["gain"])) - db(rms(music[i:j] * duck[i:j, None])):+5.1f} dB')

os.makedirs('out', exist_ok=True); raw = 'out/mix_raw.wav'
mix /= np.abs(mix).max() / 0.95; sf.write(raw, mix, SR)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
mm = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={mm['input_i']}:measured_TP={mm['input_tp']}:measured_LRA={mm['input_lra']}"
      f":measured_thresh={mm['input_thresh']}:offset={mm['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), 'out/mix.wav'], check=True)
r2 = subprocess.run(['ffmpeg', '-nostats', '-i', 'out/mix.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print('out/mix.wav', [l.strip() for l in r2.splitlines() if re.match(r'\s+(I:|Peak:)', l)][-2:])
