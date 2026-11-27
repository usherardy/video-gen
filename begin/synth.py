"""BEGIN 15s score: C major, 120 BPM. Descending piano slams for the excuses, a dead stop, then BEGIN resolves upward.
Every hit comes from begin/timeline.json, the same event list the picture reads.
Run from the repo root: python3 begin/synth.py -> audio/begin_score.wav + begin/beats.json (measured grid)."""
import json
import numpy as np, soundfile as sf, librosa
from scipy import signal

TL = json.load(open('begin/timeline.json'))
SR = 44100; BPM = TL['bpm']; SPB = 60 / BPM; DUR = TL['duration']; N = int(SR * DUR)
rng = np.random.default_rng(41)
def bus(): return np.zeros((2, N))
drums, music, fx, hits = bus(), bus(), bus(), bus()  # hits: hook slams, kept out of the VO duck
kick_env = np.zeros(N)
def add(b, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0: return
    x = x[:N - i]
    b[0, i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4)
    b[1, i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4)
def tt(d): return np.arange(int(SR * d)) / SR
def sos(kind, f, x, order=4): return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x)
noise = lambda n: rng.standard_normal(n)

def kick(g=1.0, tight=1.0):
    t = tt(0.45); f = 40 + 120 * np.exp(-t * 40 * tight)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7 * tight) + noise(len(t)) * np.exp(-t * 520) * 0.3
    return np.tanh(s * 2.0) * g
def snare(g=1.0):
    t = tt(0.24); body = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 30) * 0.5
    return (body + sos('bandpass', [1800, 7000], noise(len(t))) * np.exp(-t * 20)) * g
def rim(g=1.0):
    t = tt(0.05); return (np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 120) + sos('bandpass', [2500, 6000], noise(len(t))) * np.exp(-t * 300) * 0.6) * g
def shaker(g=1.0):
    t = tt(0.06); return sos('bandpass', [6000, 11000], noise(len(t))) * np.sin(np.pi * t / 0.06) ** 2 * g
def piano(freq, dur=1.4, g=1.0, stacc=False, det=1.0012):
    t = tt(dur); s = np.zeros_like(t)
    for k in range(1, 16):
        fk = freq * k * np.sqrt(1 + 0.00035 * k * k)
        if fk > 12000: break
        amp = 1 / k ** 1.1; dec = 2.0 + 1.2 * k + 0.0018 * freq
        s += amp * (np.sin(2 * np.pi * fk * t + k) + 0.55 * np.sin(2 * np.pi * fk * det * t)) * np.exp(-t * dec / 1.6)
    s += sos('lowpass', 1000, noise(len(t))) * np.exp(-t * 95) * 0.3
    s *= np.minimum(1, t / 0.0025)
    if stacc: s *= np.exp(-np.clip(t - 0.11, 0, None) * 40)
    return s * g * 0.33
def sub(freq, dur=0.45, g=1.0):
    t = tt(dur); s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    return np.tanh(s * 1.4) * np.exp(-t * 5) * np.minimum(1, t / 0.005) * g
def impact(g=1.0, dur=2.0):
    t = tt(dur); boom = np.sin(2 * np.pi * np.cumsum(32 + 95 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.0)
    return np.tanh((boom * 1.4 + sos('highpass', 2000, noise(len(t))) * np.exp(-t * 3.5) * 0.3) * 1.2) * g
def slam(g=1.0):  # dry type slam: short low thud + paper snap
    t = tt(0.35)
    th = np.sin(2 * np.pi * np.cumsum(55 + 140 * np.exp(-t * 30)) / SR) * np.exp(-t * 14)
    sn = sos('bandpass', [900, 5000], noise(len(t))) * np.exp(-t * 60) * 0.7
    return np.tanh((th + sn) * 1.6) * g
def whoosh(dur=0.5, g=1.0, up=True):
    t = tt(dur); n = noise(len(t)); out = np.zeros_like(n)
    bands = np.linspace(300, 7000, 8) if up else np.linspace(7000, 300, 8)
    for lo, seg in zip(bands, np.array_split(np.arange(len(t)), 8)): out[seg] = sos('bandpass', [lo, lo * 1.7], n)[seg]
    env = np.sin(np.pi * t / dur) ** 1.5 if not up else (t / dur) ** 2 * np.minimum(1, (dur - t) / 0.03)
    return out * env * g * 6
def scratch(dur=0.5, g=1.0):  # marker dragged across paper: the strike-through
    t = tt(dur); n = noise(len(t)); fc = 1200 + 2600 * (t / dur)
    out = np.zeros_like(n)
    for seg in np.array_split(np.arange(len(t)), 16): f = fc[seg[0]]; out[seg] = sos('bandpass', [f, f * 1.5], n, 2)[seg]
    grain = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t))
    return out * grain * np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.05) * g * 2.2
def riser(dur, g=1.0):
    t = tt(dur); x = t / dur
    return (np.sin(2 * np.pi * np.cumsum(220 + 2600 * x ** 2) / SR) * 0.22 + sos('highpass', 2500, noise(len(t))) * 0.6) * x ** 2.6 * g
def click(g=1.0):
    def one(f):
        t = tt(0.05); return np.sin(2 * np.pi * f * t) * np.exp(-t * 170) + sos('bandpass', [2500, 7500], noise(len(t))) * np.exp(-t * 280) * 0.8
    x = np.zeros(int(SR * 0.16)); a = one(2000); x[:len(a)] += a; b = one(1350) * 0.5; o = int(SR * 0.07); x[o:o + len(b)] += b
    return x * g
def pop(f=700, g=1.0):
    t = tt(0.1); return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.9 * np.exp(-t * 55))) / SR) * np.exp(-t * 50) * g
def reverb(x, wet_t=1.8):
    t = tt(wet_t); ir = sos('lowpass', 6500, sos('highpass', 250, noise(len(t)) * np.exp(-t * 3.0)))
    return np.stack([signal.fftconvolve(x[c], ir)[:N] for c in (0, 1)]) * 0.045

B = lambda b: b * SPB
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
def K(b, g=1.0, dst=None): add(drums if dst is None else dst, kick(g), B(b)); kick_env[min(N - 1, int(B(b) * SR))] = 1

# ---- hook: four excuse slams, piano steps DOWN E-D-C-B (B = unresolved on MONDAY)
for b, m in zip(TL['hook'], (52, 50, 48, 47)):
    K(b, 1.0, hits); add(hits, slam(0.9), B(b))
    for mm in (m, m + 12): add(music, piano(m2f(mm), 1.2, 0.95, det=1.0012 if m != 47 else 1.012), B(b))
# ---- dead stop at b4: one sub, then the marker strike, then a breath in
add(fx, sub(m2f(28), 1.1, 1.2), B(TL['silence'])); add(fx, impact(0.45, 1.0), B(TL['silence']))
s0, s1 = TL['strike']; add(fx, scratch(B(s1 - s0), 0.8), B(s0))
add(fx, whoosh(0.32, 0.55, up=True), B(TL['flood']) - 0.32)
# ---- BEGIN: C major lands, then climbs C-E-G-C into the tap
fb = TL['flood']; K(fb, 1.1); add(fx, impact(0.9, 1.6), B(fb))
for m in (36, 48, 55, 60, 64, 67): add(music, piano(m2f(m), 2.4, 0.8), B(fb), pan=(m % 5 - 2) / 5)
for i, m in enumerate((72, 76, 79)): add(music, piano(m2f(m), 0.9, 0.5), B(fb + 0.5 + 0.5 * i), pan=0.2)
add(fx, click(1.0), B(TL['tap'])); add(music, piano(m2f(84), 1.2, 0.5), B(TL['tap']))
m0, m1 = TL['morph']; add(fx, whoosh(0.45, 0.7, up=False), B(m0) + 0.05)
# ---- groove b9..b26: kick every beat, snare on the back beat, shaker 16ths; C - Am - F - G
for b in range(9, 26): K(b, 0.9)
for b in range(10, 26, 2): add(drums, snare(0.7), B(b), pan=0.05)
for h in np.arange(10, 26, 0.25): add(drums, shaker(0.32 if (h * 4) % 2 else 0.18), B(h), pan=0.3)
chords = [(48, [64, 67, 72]), (45, [64, 69, 72]), (41, [65, 69, 72]), (43, [62, 67, 71])]
for h in np.arange(9, 26, 0.5):
    root, tri = chords[int((h - 9) // 4) % 4]
    add(music, sub(m2f(root), 0.4, 0.7 if (h % 1) == 0 else 0.4), B(h))
    add(music, piano(m2f(tri[int(h * 2) % 3]), 0.5, 0.38, stacc=True), B(h), pan=0.25 if (h * 2) % 2 else -0.25)
# ---- UI events
add(fx, click(0.95), B(TL['startTap']))
add(fx, whoosh(0.4, 0.6, up=False), B(TL['squat'][0]) - 0.3)
for i, b in enumerate(TL['reps']):
    add(fx, pop(620 + 180 * i, 0.6), B(b)); add(drums, rim(0.6), B(b), pan=-0.3)
    add(music, piano(m2f((72, 76, 79)[i]), 1.0, 0.55), B(b), pan=0.15)
add(fx, whoosh(0.4, 0.6, up=False), B(TL['focus'][0]) - 0.3)
for i, b in enumerate(TL['checks']):  # the arpeggio climbs one note per checkpoint
    add(fx, pop(900 + 120 * i, 0.5), B(b)); add(drums, rim(0.55), B(b), pan=0.3)
    add(music, piano(m2f((72, 76, 79, 84)[i]), 1.2, 0.6), B(b), pan=-0.1)
add(fx, riser(B(1.5), 0.8), B(TL['tiles'][0]) - B(1.5))
for i, b in enumerate(TL['tiles']): add(fx, pop(700 + 90 * i, 0.5), B(b), pan=-0.4 + 0.2 * i)
add(fx, impact(0.7, 1.2), B(24)); K(24, 1.1)
add(fx, riser(B(1), 0.7), B(TL['cta']) - B(1))
# ---- CTA: C major add9 with a long tail, a short answer phrase, clean stop at 15.0
cb = TL['cta']; K(cb, 1.1); add(fx, impact(1.0, 2.6), B(cb))
for m in (36, 48, 55, 60, 64, 67, 74, 76): add(music, piano(m2f(m), 4.0, 0.8), B(cb), pan=(m % 7 - 3) / 6)
for b, m in ((27, 79), (27.5, 76), (28, 74), (28.5, 72)): add(music, piano(m2f(m), 1.6, 0.4), B(b), pan=0.2)
add(fx, pop(1100, 0.45), B(TL['ripple']))
for b in (27, 28, 29): K(b, 0.55)

duck = np.ones(N)
for k_ in np.where(kick_env > 0)[0]:
    seg = np.arange(k_, min(N, k_ + int(0.26 * SR))); duck[seg] = np.minimum(duck[seg], 1 - 0.45 * np.exp(-(seg - k_) / SR * 10))
# the dead stop: the music (and its room) is gated shut from b4 until the BEGIN flood; only the sub, strike and breath sound
g0, g1, f = int(B(TL['silence']) * SR), int(B(TL['flood']) * SR) - 64, int(0.05 * SR)
gate = np.ones(N); gate[g0:g1] = 0; gate[g0:g0 + f] = np.linspace(1, 0, f)
mus = music * duck * gate
pre = drums * 0.85 + mus * 0.9 + fx * 0.8 + reverb(mus * 0.9 + fx * 0.5) * np.maximum(gate, 0.35)
full = np.tanh((pre + hits * 0.85) * 1.1)
bed = np.tanh(pre * 1.1); hit = full - bed        # bed + hit == full exactly, so the stems sum back to the score
tail = np.linspace(1, 0, int(0.3 * SR)); full[:, -len(tail):] *= tail; bed[:, -len(tail):] *= tail; hit[:, -len(tail):] *= tail
k = max(1e-9, np.abs(full).max()) / 0.95
sf.write('audio/begin_score.wav', bed.T / k, SR)    # what vo_mix ducks
sf.write('audio/begin_hits.wav', hit.T / k, SR)     # added after the duck

mono = drums.sum(0) + hits.sum(0)
oenv = librosa.onset.onset_strength(y=mono.astype(np.float32), sr=SR, hop_length=256)
tempo, frames = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=256, start_bpm=BPM, tightness=200, trim=False)
meas = librosa.frames_to_time(frames, sr=SR, hop_length=256); idx = np.round(meas / SPB).astype(int); ok = (idx >= 0) & (idx < TL['nbeats'])
slope, off = np.polyfit(idx[ok], meas[ok], 1)
print(f'measured: {float(np.atleast_1d(tempo)[0]):.2f} bpm, spb={slope:.5f}, offset={off * 1000:.1f} ms, n={ok.sum()}')
if abs(off) > 0.04 or abs(slope - SPB) > 0.004: off, slope = 0.0, SPB; print('fit rejected -> design grid')
json.dump({'spb': slope, 'offset': off, 'bpm': 60 / slope}, open('begin/beats.json', 'w'))
