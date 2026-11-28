"""v2 score: A minor, 90 BPM. Piano, snow footsteps, a heartbeat pulse and designed hits, placed on v2/timeline.json.
Dream (soft) -> abroad (minor) -> struggle (pulse, dissonance) -> turn (silence, single notes) -> escape (drums enter on
"freedom") -> obsession (groove, a break on "couldn't stop") -> meaning (lift) -> ending (the held-back chord on "keep going").
Writes audio/score_raw.wav and beats.json (measured grid). usage (from v2/): python3 audio/score.py"""
import json
import numpy as np, soundfile as sf, librosa
from scipy import signal

TL = json.load(open('timeline.json')); S, C = TL['scenes'], TL['cues']
SR = 44100; SPB = 60 / TL['bpm']; DUR = TL['duration']; N = int(SR * DUR)
rng = np.random.default_rng(42)
drums, music, fx, grid = np.zeros((2, N)), np.zeros((2, N)), np.zeros((2, N)), np.zeros(N)
kick_env = np.zeros(N)
def add(b, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0: return
    x = x[:N - i]; b[0, i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4); b[1, i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4)
tt = lambda d: np.arange(int(SR * d)) / SR
sos = lambda kind, f, x, o=4: signal.sosfilt(signal.butter(o, f, kind, fs=SR, output='sos'), x)
noise = lambda n: rng.standard_normal(n)
B = lambda b: b * SPB
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)

def piano(freq, dur=1.6, g=1.0, stacc=False, soft=False, det=1.0011):
    t = tt(dur); s = np.zeros_like(t)
    for k in range(1, 14):
        fk = freq * k * np.sqrt(1 + 0.0003 * k * k)
        if fk > 11000: break
        s += (1 / k ** (1.5 if soft else 1.1)) * (np.sin(2 * np.pi * fk * t + k) + 0.5 * np.sin(2 * np.pi * fk * det * t)) * np.exp(-t * (1.6 + 1.1 * k + 0.0016 * freq) / 1.7)
    s += sos('lowpass', 900, noise(len(t))) * np.exp(-t * 90) * (0.12 if soft else 0.28)
    s *= np.minimum(1, t / (0.006 if soft else 0.0025))
    if stacc: s *= np.exp(-np.clip(t - 0.12, 0, None) * 30)
    s[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR)); return s * g * 0.3
def kick(g=1.0):
    t = tt(0.45); return np.tanh((np.sin(2 * np.pi * np.cumsum(42 + 110 * np.exp(-t * 38)) / SR) * np.exp(-t * 7) + noise(len(t)) * np.exp(-t * 500) * 0.25) * 2) * g
def heart(g=1.0):  # soft low double pulse
    t = tt(0.5); one = lambda d: np.sin(2 * np.pi * 52 * t) * np.exp(-np.clip(t - d, 0, None) * 18) * (t >= d)
    return np.tanh((one(0) + 0.7 * one(0.16)) * 1.6) * g
def snare(g=1.0):
    t = tt(0.26); return (np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.5 + sos('bandpass', [1400, 6000], noise(len(t))) * np.exp(-t * 18)) * g
def shaker(g=1.0):
    t = tt(0.06); return sos('bandpass', [6000, 11000], noise(len(t))) * np.sin(np.pi * t / 0.06) ** 2 * g
def step(g=1.0):
    t = tt(0.22); n = sos('bandpass', [500, 3200], noise(len(t))); gr = sos('highpass', 1500, (rng.random(len(t)) < 0.02) * rng.random(len(t)))
    return (n * 0.35 + gr * 3) * np.sin(np.pi * np.clip(t / 0.18, 0, 1)) ** 0.7 * g
def impact(g=1.0, dur=2.0):
    t = tt(dur); boom = np.sin(2 * np.pi * np.cumsum(34 + 90 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    return np.tanh((boom * 1.4 + sos('highpass', 2500, noise(len(t))) * np.exp(-t * 4) * 0.25) * 1.2) * g
def thud(g=1.0):
    t = tt(0.6); return np.tanh(np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 9) * 2.5) * g
def whoosh(dur=0.5, g=1.0, up=True):
    t = tt(dur); n = noise(len(t)); out = np.zeros_like(n)
    for lo, seg in zip(np.linspace(300, 6500, 8) if up else np.linspace(6500, 250, 8), np.array_split(np.arange(len(t)), 8)): out[seg] = sos('bandpass', [lo, lo * 1.7], n)[seg]
    return out * ((t / dur) ** 2 * np.minimum(1, (dur - t) / 0.03) if up else np.sin(np.pi * t / dur) ** 1.5) * g * 5
def riser(dur, g=1.0):
    t = tt(dur); x = t / dur; return (np.sin(2 * np.pi * np.cumsum(220 + 2400 * x ** 2) / SR) * 0.2 + sos('highpass', 2500, noise(len(t))) * 0.6) * x ** 2.6 * g
def pop(f=700, g=1.0):
    t = tt(0.1); return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.9 * np.exp(-t * 55))) / SR) * np.exp(-t * 50) * g
def reverb(x, wet_t=2.6):
    t = tt(wet_t); ir = sos('lowpass', 6000, sos('highpass', 200, noise(len(t))) * np.exp(-t * 2.2))
    return np.stack([signal.fftconvolve(x[c], ir)[:N] for c in (0, 1)]) * 0.05
def K(b, g=1.0): add(drums, kick(g), B(b)); kick_env[int(B(b) * SR)] = 1; grid[int(B(b) * SR)] += g
def G(b, g=0.3): grid[int(B(b) * SR)] += g

CH = {'Am': (45, [57, 60, 64]), 'F': (41, [57, 60, 65]), 'C': (48, [55, 60, 64]), 'G': (43, [55, 59, 62]),
      'Em': (40, [55, 59, 64]), 'Dm': (38, [57, 62, 65])}
def arp(b0, b1, prog, g=0.2, step_b=0.5, stacc=False, octave=0):
    for h in np.arange(b0, b1, step_b):
        name = prog[int((h - b0) // 4) % len(prog)]; root, tri = CH[name]; i = int(round((h - b0) / step_b))
        if abs((h - b0) % 4) < 1e-6: add(music, piano(m2f(root), 2.8, g * 1.6, soft=True), B(h), pan=-0.1)
        add(music, piano(m2f(tri[[0, 1, 2, 1][i % 4]] + octave), 1.4, g, stacc=stacc, soft=True), B(h), pan=0.2 if i % 2 else -0.2)
MOTIF = [(0, 76), (0.5, 79), (1, 81), (2, 79), (2.5, 76), (3, 74), (4, 72), (4.5, 74), (5, 76), (6, 74), (7, 72)]
def motif(b0, g=0.28):
    for db, m in MOTIF: add(music, piano(m2f(m + 12), 1.6, g, det=1.003), B(b0 + db), pan=0.3)
def groove(b0, b1, g=1.0, snares=True):
    for b in np.arange(np.ceil(b0), b1, 1): K(b, 0.85 * g)
    if snares:
        for b in np.arange(np.ceil(b0) + 1, b1, 2): add(drums, snare(0.65 * g), B(b), pan=0.05)
    for h in np.arange(np.ceil(b0 * 4) / 4, b1, 0.25): add(drums, shaker((0.28 if (h * 4) % 2 else 0.16) * g), B(h), pan=0.3)

# dream: soft broken chords, the boy's motif
add(music, piano(m2f(45), 3.2, 0.7, soft=True), 0); add(fx, impact(0.3, 2.4), 0)
arp(0, S['abroad'], ['Am', 'F', 'C', 'G'], 0.19); motif(4, 0.24)
for b in range(0, int(S['abroad'])): G(b, 0.2)
# abroad: a whoosh into Lithuania, minor colours, footsteps in snow
add(fx, whoosh(0.7, 0.6), B(S['abroad']) - 0.65); add(fx, impact(0.4, 1.8), B(C['lithuania']))
arp(S['abroad'], S['struggle'], ['Am', 'Em', 'F', 'Dm'], 0.17)
for b in np.arange(np.ceil(S['abroad']), S['struggle'], 1): add(drums, step(0.5), B(b), pan=0.15 * (1 if int(b) % 2 else -1)); G(b, 0.3)
# struggle: a heartbeat under low, sparse piano; dissonance on "nightmare"; near silence before the turn
for b in np.arange(np.ceil(S['struggle']), S['turn'] - 1, 1): add(drums, heart(0.75), B(b)); G(b, 0.5)
for i, b in enumerate(np.arange(S['struggle'], S['turn'] - 2, 4)):
    for m in ((33, 45, 52) if i % 2 == 0 else (29, 41, 48)): add(music, piano(m2f(m), 3.6, 0.45, soft=True), B(b))
nm = C['nightmare']; add(fx, impact(0.75, 2.2), B(nm)); [add(music, piano(m2f(m), 2.6, 0.5), B(nm)) for m in (33, 45, 46, 52)]
add(fx, whoosh(0.9, 0.4, up=False), B(nm) + 0.6)
# turn: single high notes, like a thought arriving
for i, b in enumerate(np.arange(S['turn'], S['escape'], 1)): add(music, piano(m2f([76, 79, 81, 84, 86, 88][i % 6]), 1.8, 0.32), B(b), pan=0.3); G(b, 0.2)
add(fx, riser(B(S['escape'] - S['turn']) * 0.6, 0.6), B(S['escape']) - B(S['escape'] - S['turn']) * 0.6)
# escape: chords lift, the drums land on "freedom"
arp(S['escape'], S['obsession'], ['F', 'C', 'G', 'Am'], 0.2)
fr = C['freedom']; add(fx, impact(0.85, 2.0), B(fr)); K(fr, 1.0); [add(music, piano(m2f(m), 2.6, 0.6), B(fr)) for m in (41, 53, 60, 65, 69)]
groove(fr + 1, S['obsession'], 0.8, snares=False)
for b in C['out']: add(fx, thud(0.7), B(b)); add(fx, pop(420, 0.35), B(b))
# obsession: the full groove, hits on the list, a stop on "couldn't stop"
cs = C['cant_stop']
groove(S['obsession'], cs, 1.0); groove(cs + 1.5, S['meaning'], 1.0)
for h in np.arange(S['obsession'], S['meaning'], 0.5):
    if cs <= h < cs + 1.5: continue
    root, tri = CH[['Am', 'F', 'C', 'G'][int((h - S['obsession']) // 4) % 4]]
    add(music, piano(m2f(tri[int(h * 2) % 3] + 12), 0.5, 0.34, stacc=True), B(h), pan=0.25 if (h * 2) % 2 else -0.25)
    if abs(h % 1) < 1e-6: add(music, piano(m2f(root), 0.9, 0.48, stacc=True), B(h))
for i, b in enumerate(C['list']): add(fx, impact(0.35, 0.9), B(b)); add(fx, pop(520 + 160 * i, 0.55), B(b), pan=[-.4, .4, -.4, .4][i])
add(fx, pop(1250, 0.6), B(C['worked'])); add(fx, thud(0.5), B(C['worked']))
add(fx, thud(0.8), B(C['didnt'])); add(fx, pop(300, 0.5), B(C['didnt']))
add(fx, impact(0.6, 1.4), B(cs + 1.5)); K(cs + 1.5, 1.05)
# meaning: thinner drums, bigger chords, a riser into the ending
groove(S['meaning'], S['ending'] - 1, 0.55, snares=False)
for i, b in enumerate(np.arange(S['meaning'], S['ending'], 2)):
    root, tri = CH[['F', 'G', 'Am', 'C', 'F', 'G'][i % 6]]
    for m in [root, root + 12] + [x + 12 for x in tri]: add(music, piano(m2f(m), 2.6, 0.32, soft=True), B(b))
add(fx, pop(980, 0.4), B(C['possible'])); add(fx, riser(B(S['ending'] - C['possible']) * 0.9, 0.7), B(C['possible']))
# ending: quiet, then the chord that was held back all film, then the motif answers under the title
arp(S['ending'], C['keep_going'], ['Am', 'F'], 0.17, step_b=1)
kg = C['keep_going']; add(fx, impact(1.0, 3.2), B(kg)); K(kg, 1.1)
for m in (33, 45, 52, 57, 60, 64, 69, 72, 76): add(music, piano(m2f(m), 6.0, 0.6), B(kg), pan=(m % 7 - 3) / 7)
motif(C['follow'] + 0.5, 0.3)
for b in np.arange(np.ceil(kg) + 1, S['end'] - 1, 1): G(b, 0.15)

duck = np.ones(N)
for k_ in np.where(kick_env > 0)[0]:
    seg = np.arange(k_, min(N, k_ + int(0.24 * SR))); duck[seg] = np.minimum(duck[seg], 1 - 0.35 * np.exp(-(seg - k_) / SR * 10))
mix = drums * 0.8 + music * duck * 0.95 + fx * 0.8
mix += reverb(music * 0.9 + fx * 0.5)
mix = np.tanh(mix * 1.05); mix[:, -int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR)) ** 1.5
mix /= max(1e-9, np.abs(mix).max()) / 0.95
sf.write('audio/score_raw.wav', mix.T, SR)

oenv = librosa.onset.onset_strength(y=(grid + 0.002 * rng.standard_normal(N)).astype(np.float32), sr=SR, hop_length=256)
pk = librosa.util.peak_pick(oenv, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
meas = librosa.frames_to_time(pk, sr=SR, hop_length=256); idx = np.round(meas / SPB).astype(int); ok = np.abs(meas - idx * SPB) < 0.06
slope, off = np.polyfit(idx[ok], meas[ok], 1)
print(f'measured {ok.sum()} grid onsets: spb={slope:.5f} (design {SPB:.5f}), offset={off * 1000:.1f} ms')
if abs(off) > 0.04 or abs(slope - SPB) > 0.004: off, slope = 0.0, SPB; print('fit rejected -> design grid')
json.dump({'spb': slope, 'offset': off, 'bpm': 60 / slope}, open('beats.json', 'w'))
