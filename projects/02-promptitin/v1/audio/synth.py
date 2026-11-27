"""Original 120 BPM score for the PromptItIn promo: piano + drums + UI sound design. Writes audio/promo_raw.wav and beats.json."""
import json
import numpy as np, soundfile as sf, librosa
from scipy import signal

TL = json.load(open('timeline.json'))
SR = 44100; BPM = TL['bpm']; SPB = 60 / BPM; DUR = TL['duration']; N = int(SR * DUR)
rng = np.random.default_rng(11)
def bus(): return np.zeros((2, N))
drums, music, fx = bus(), bus(), bus()
kick_env = np.zeros(N)

def add(b, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0: return
    x = x[:N - i]
    b[0, i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4)
    b[1, i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4)
def tt(d): return np.arange(int(SR * d)) / SR
def sos(kind, f, x, order=4): return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x)

def kick(g=1.0):
    t = tt(0.45); f = 42 + 110 * np.exp(-t * 38)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) + rng.standard_normal(len(t)) * np.exp(-t * 500) * 0.35
    return np.tanh(s * 1.8) * g
def clap(g=1.0):
    t = tt(0.3); env = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, .011, .022)) * 0.5 + np.exp(-t * 18) * 0.6
    return sos('bandpass', [1000, 4200], rng.standard_normal(len(t))) * env * g * 2.2
def hat(open_=False, g=1.0):
    t = tt(0.3 if open_ else 0.07); return sos('highpass', 7500, rng.standard_normal(len(t))) * np.exp(-t * (14 if open_ else 70)) * g
def piano(freq, dur=1.4, g=1.0, bright=1.0, detune=1.0012):
    t = tt(dur); s = np.zeros_like(t)
    for k in range(1, 15):
        fk = freq * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 11000: break
        amp = (1 / k ** 1.15) * (bright if k > 3 else 1); dec = 2.2 + 1.1 * k + 0.0016 * freq
        s += amp * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * dec / 1.6) + 0.6 * amp * np.sin(2 * np.pi * fk * detune * t) * np.exp(-t * dec / 1.6)
    thump = sos('lowpass', 900, rng.standard_normal(len(t))) * np.exp(-t * 90) * 0.35
    return (s * np.minimum(1, t / 0.003) + thump) * g * 0.35
def bass(freq, dur=0.28, g=1.0):
    t = tt(dur); s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 14)
    return np.tanh(s * 1.5) * np.exp(-t * 7) * np.minimum(1, t / 0.004) * g
def impact(g=1.0, dur=2.2):
    t = tt(dur); boom = np.sin(2 * np.pi * np.cumsum(34 + 90 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.9)
    return np.tanh((boom * 1.4 + sos('highpass', 1800, rng.standard_normal(len(t))) * np.exp(-t * 3.2) * 0.35) * 1.2) * g
def whoosh(dur=0.45, g=1.0):
    t = tt(dur); n = rng.standard_normal(len(t)); out = np.zeros_like(n)
    for lo, seg in zip(np.linspace(400, 6000, 6), np.array_split(np.arange(len(t)), 6)): out[seg] = sos('bandpass', [lo, lo * 1.8], n)[seg]
    return out * (t / dur) ** 2.2 * np.minimum(1, (dur - t) / 0.03) * g * 7
def riser(dur, g=1.0):
    t = tt(dur); x = t / dur
    return (np.sin(2 * np.pi * np.cumsum(300 + 3200 * x ** 2) / SR) * 0.25 + sos('highpass', 2500, rng.standard_normal(len(t))) * 0.6) * x ** 2.4 * g
def mclick(g=1.0):
    """Mouse click: down + up transients."""
    def one(f, d):
        t = tt(0.05); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + sos('bandpass', [2500, 7000], rng.standard_normal(len(t))) * np.exp(-t * 260) * 0.8)
    x = np.zeros(int(SR * 0.16)); a = one(1900, 0); x[:len(a)] += a; b = one(1300, 0) * 0.55; x[int(SR * .075):int(SR * .075) + len(b)] += b[:len(x) - int(SR * .075)]
    return x * g
def key(f=1100, g=1.0):
    t = tt(0.04); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 200) * 0.5 + sos('bandpass', [1800, 6000], rng.standard_normal(len(t))) * np.exp(-t * 330)) * g
def pop(f=620, g=1.0):
    t = tt(0.09); return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-t * 60))) / SR) * np.exp(-t * 55) * g
def reverb(x, wet_t=1.5):
    t = tt(wet_t); ir = sos('lowpass', 7000, sos('highpass', 250, rng.standard_normal(len(t))) * np.exp(-t * 3.4))
    return np.stack([signal.fftconvolve(x[c], ir)[:N] for c in (0, 1)]) * 0.05

B = lambda b: b * SPB
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
kk = lambda b, g=1.0: (add(drums, kick(g), B(b)), kick_env.__setitem__(int(B(b) * SR), 1))

# hook: five word slams (the last two are detuned = "vague")
for i, (m, det) in enumerate(((45, 1.0012), (48, 1.0012), (52, 1.0012), (57, 1.012), (60, 1.02))):
    kk(i, 1.0); add(fx, impact(0.55, 1.1), B(i)); add(music, piano(midi(m), 1.2, 1.0, 1.0, det), B(i)); add(music, piano(midi(m + 12), 1.0, 0.6, 1.0, det), B(i))
add(fx, riser(B(1), 0.9), B(5))
# product + features
for b in range(6, 30): kk(b, 1.0)
for b in range(7, 30, 2): add(drums, clap(0.8), B(b), pan=0.1)
for h in np.arange(6, 29.9, 0.5): add(drums, hat(g=0.22 if h % 1 == 0 else 0.3), B(h), pan=0.25)
for h in np.arange(12.25, 24, 0.5): add(drums, hat(g=0.12), B(h), pan=-0.25)
for h in np.arange(6, 29.9, 1.0): add(drums, hat(True, 0.2), B(h + 0.5), pan=-0.2)
roots = [45, 45, 41, 43]; pat = [1, 0, 1, 1, 0, 1, 1, 0]
for h in range(12, 60):
    if pat[h % 8]: add(music, bass(midi(roots[(h // 8) % 4]), g=0.8), B(h / 2))
arp = {0: [57, 60, 64, 69], 1: [57, 60, 64, 69], 2: [53, 57, 60, 65], 3: [55, 59, 62, 67]}
for s in range(24, 24 * 4 + 0):
    if s >= 120: break
    bar = (s // 16) % 4; note = arp[bar][[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 12
    add(music, piano(midi(note), 0.7, 0.42 * (0.7 + 0.3 * ((s % 4) == 0))), B(s / 4), pan=-0.35 + 0.7 * (s % 2))
for b in (6, 8, 10, 12, 16, 20):
    root = roots[(b // 4) % 4] + 12
    for m in (root, root + 7, root + 15): add(music, piano(midi(m), 1.8, 0.5), B(b))
# UI sound design on the real events
for i, b in enumerate(TL['tileBeats']): add(fx, pop(500 + 70 * i, 0.5), B(b) + 0.12, pan=-0.6 + 0.12 * i)
t0, t1, n = TL['typing']
for k in range(int(n)): add(fx, key(1000 + 400 * rng.random(), 0.55), B(t0) + (B(t1) - B(t0)) * k / n, pan=0.3)
for b in TL['clicks']: add(fx, mclick(0.9), B(b))
for c in TL['cuts'][1:6]: add(fx, whoosh(0.42, 0.7), B(c) - 0.36); add(fx, impact(0.5, 1.2), B(c))
# counter ticks + landing chime
c0, c1 = TL['counter']; k = 0
for tm in np.arange(B(c0), B(c1), 0.07): add(fx, key(900 + 1900 * ((tm - B(c0)) / (B(c1) - B(c0))) ** 0.7, 0.5), tm, pan=-0.3); k += 1
add(music, piano(midi(93), 2.0, 0.8), B(c1)); add(music, piano(midi(81), 2.0, 0.8), B(c1)); add(fx, impact(0.6, 1.4), B(c1))
add(fx, riser(B(1), 0.8), B(29))
# CTA: big chord, then a soft motif
add(fx, impact(1.1, 2.4), B(30))
for m in (45, 57, 64, 67, 71, 76): add(music, piano(midi(m), 3.5, 0.9), B(30), pan=(m % 7 - 3) / 6)
for b, m in ((32, 81), (33, 84), (34, 88), (36.5, 93)): add(music, piano(midi(m), 2.2, 0.5), B(b), pan=0.2)
for b in (30, 32, 34, 36, 38): kk(b, 0.7)
for h in np.arange(31, 40, 2): add(drums, clap(0.4), B(h))

# mix
duck = np.ones(N)
for k_ in np.where(kick_env > 0)[0]:
    seg = np.arange(k_, min(N, k_ + int(0.28 * SR))); duck[seg] = np.minimum(duck[seg], 1 - 0.5 * np.exp(-(seg - k_) / SR * 9))
mix = drums * 0.9 + music * duck * 0.85 + fx * 0.8
mix += reverb(music * 0.85 + fx * 0.8)
mix = np.tanh(mix * 1.1)
mix[:, -int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
mix /= max(1e-9, np.abs(mix).max()) / 0.95
sf.write('audio/promo_raw.wav', mix.T, SR)

mono = drums.sum(0)
oenv = librosa.onset.onset_strength(y=mono.astype(np.float32), sr=SR, hop_length=256)
tempo, frames = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=256, start_bpm=BPM, tightness=200, trim=False)
meas = librosa.frames_to_time(frames, sr=SR, hop_length=256); idx = np.round(meas / SPB).astype(int); ok = (idx >= 0) & (idx < 40)
slope, off = np.polyfit(idx[ok], meas[ok], 1)
print(f'measured: {float(np.atleast_1d(tempo)[0]):.2f} bpm, spb={slope:.5f}, offset={off * 1000:.1f} ms, n={ok.sum()}')
if abs(off) > 0.04 or abs(slope - SPB) > 0.004: off, slope = 0.0, SPB; print('fit rejected -> design grid')
json.dump({'spb': slope, 'offset': off, 'bpm': 60 / slope}, open('beats.json', 'w'))
