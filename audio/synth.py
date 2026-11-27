"""Synthesize the score (piano-like tones + drums + designed hits), then measure the beat grid."""
import json, sys
import numpy as np, soundfile as sf, librosa
from scipy import signal

TL = json.load(open('timeline.json'))
SR = 44100
BPM = TL['bpm']; SPB = 60 / BPM; DUR = TL['duration']; N = int(SR * DUR)
CUTS = TL['cuts']
rng = np.random.default_rng(7)

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
def sos(kind, f, x, order=4):
    return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x)

def kick(g=1.0):
    t = tt(0.45)
    f = 42 + 110 * np.exp(-t * 38)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    s += rng.standard_normal(len(t)) * np.exp(-t * 500) * 0.35
    return np.tanh(s * 1.8) * g

def clap(g=1.0):
    t = tt(0.3)
    env = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, .011, .022)) * 0.5 + np.exp(-t * 18) * 0.6
    return sos('bandpass', [1000, 4200], rng.standard_normal(len(t))) * env * g * 2.2

def rim(g=1.0):
    t = tt(0.12)
    s = np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90) + sos('bandpass', [2500, 7000], rng.standard_normal(len(t))) * np.exp(-t * 120)
    return s * g

def hat(open_=False, g=1.0):
    t = tt(0.3 if open_ else 0.07)
    return sos('highpass', 7500, rng.standard_normal(len(t))) * np.exp(-t * (14 if open_ else 70)) * g

def piano(freq, dur=1.4, g=1.0, bright=1.0):
    """Additive piano-like tone: inharmonic partials, hammer thump, per-partial decay."""
    t = tt(dur); s = np.zeros_like(t)
    B = 0.0004
    for k in range(1, 15):
        fk = freq * k * np.sqrt(1 + B * k * k)
        if fk > 11000: break
        amp = (1 / k ** 1.15) * (bright if k > 3 else 1)
        dec = 2.2 + 1.1 * k + 0.0016 * freq
        s += amp * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * dec / 1.6)
        s += 0.6 * amp * np.sin(2 * np.pi * fk * 1.0012 * t) * np.exp(-t * dec / 1.6)  # chorus string
    thump = sos('lowpass', 900, rng.standard_normal(len(t))) * np.exp(-t * 90) * 0.35
    env = np.minimum(1, t / 0.003)
    return (s * env + thump) * g * 0.35

def bass(freq, dur=0.28, g=1.0):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 14)
    return np.tanh(s * 1.5) * np.exp(-t * 7) * np.minimum(1, t / 0.004) * g

def impact(g=1.0, dur=2.2):
    t = tt(dur)
    boom = np.sin(2 * np.pi * np.cumsum(34 + 90 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.9)
    crash = sos('highpass', 1800, rng.standard_normal(len(t))) * np.exp(-t * 3.2) * 0.35
    return np.tanh((boom * 1.4 + crash) * 1.2) * g

def whoosh(dur=0.45, g=1.0):
    t = tt(dur)
    n = rng.standard_normal(len(t)); out = np.zeros_like(n)
    for lo, seg in zip(np.linspace(400, 6000, 6), np.array_split(np.arange(len(t)), 6)):
        out[seg] = sos('bandpass', [lo, lo * 1.8], n)[seg]
    env = (t / dur) ** 2.2 * np.exp(-((t - dur) / dur) * 0.0)
    env *= np.minimum(1, (dur - t) / 0.03 + 0.0)
    return out * env * g * 7

def riser(dur, g=1.0):
    t = tt(dur); x = t / dur
    tone = np.sin(2 * np.pi * np.cumsum(300 + 3200 * x ** 2) / SR)
    noise = sos('highpass', 2500, rng.standard_normal(len(t)))
    return (tone * 0.25 + noise * 0.6) * x ** 2.4 * g

def reverb(x, wet_t=1.4):
    t = tt(wet_t)
    ir = sos('highpass', 250, rng.standard_normal(len(t))) * np.exp(-t * 3.6)
    ir = sos('lowpass', 7000, ir)
    return np.stack([signal.fftconvolve(x[c], ir)[:N] for c in (0, 1)]) * 0.05

B = lambda b: b * SPB
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# --- drums ---------------------------------------------------------------
for b in range(0, 4): add(drums, kick(0.85), B(b)); kick_env[int(B(b) * SR)] = 1
for b in range(4, 16): add(drums, kick(1.0), B(b)); kick_env[int(B(b) * SR)] = 1
for b in (16, 18, 20): add(drums, kick(1.15), B(b)); kick_env[int(B(b) * SR)] = 1
for b in range(22, 28): add(drums, kick(1.0), B(b)); kick_env[int(B(b) * SR)] = 1
for b in list(range(5, 16, 2)) + [23, 25]: add(drums, clap(0.8), B(b), pan=0.1)
for b in (1, 2): add(drums, rim(0.7), B(b) + 0.0)
for b in (17, 19, 21): add(drums, rim(0.9), B(b))
for h in np.arange(4, 16, 0.5): add(drums, hat(g=0.22 if (h % 1) == 0 else 0.30), B(h), pan=0.25)
for h in np.arange(10.25, 16, 0.5): add(drums, hat(g=0.12), B(h), pan=-0.25)
for h in np.arange(22, 27.5, 0.5): add(drums, hat(g=0.22 if (h % 1) == 0 else 0.30), B(h), pan=0.25)
for h in np.arange(4, 15.9, 1.0): add(drums, hat(True, 0.22), B(h + 0.5), pan=-0.2)
for i, h in enumerate(np.linspace(3, 3.97, 12)): add(drums, clap(0.15 + 0.5 * i / 11), B(h))  # snare roll into cut 1
# --- bass ----------------------------------------------------------------
roots = [45, 45, 41, 43]  # A, A, F, G (midi)
pat = [1, 0, 1, 1, 0, 1, 1, 0]
for rng_b in ((4, 16), (22, 27)):
    for h in range(int(rng_b[0] * 2), int(rng_b[1] * 2)):
        if pat[h % 8]:
            add(music, bass(midi(roots[(h // 8) % 4]), g=0.8), B(h / 2))
# --- piano: word-hit motif, arps, stabs, finale chord ---------------------
for i, m in enumerate((69, 72, 76)): add(music, piano(midi(m), 1.6, 1.0), B(i), pan=0.0)  # A C E on the three words
arp = {0: [57, 60, 64, 69], 1: [57, 60, 64, 69], 2: [53, 57, 60, 65], 3: [55, 59, 62, 67]}
for rng_b, g0 in (((8, 16), 0.45), ((22, 27), 0.55)):
    for s in range(int(rng_b[0] * 4), int(rng_b[1] * 4)):
        bar = (s // 16) % 4; note = arp[bar][[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 12
        add(music, piano(midi(note), 0.7, g0 * (0.7 + 0.3 * ((s % 4) == 0))), B(s / 4), pan=-0.35 + 0.7 * ((s % 2)))
for b in (4, 6, 8, 12):  # left-hand chords underneath
    root = roots[(b // 4) % 4] + 12
    for m in (root, root + 7, root + 12 + 3): add(music, piano(midi(m), 1.8, 0.5), B(b))
for b in (16, 18, 20):  # stripped section stabs, one per word
    for m in (57, 60, 64, 67, 72): add(music, piano(midi(m + (b - 16) // 2), 1.2, 0.7, 1.3), B(b))
for m in (45, 57, 64, 67, 71, 76): add(music, piano(midi(m), 3.0, 0.9), B(28), pan=(m % 7 - 3) / 6)  # Am9 finale
# --- designed hits ---------------------------------------------------------
add(fx, impact(0.9), 0.0)
for c in CUTS[1:6]:
    add(fx, whoosh(0.42, 0.7), B(c) - 0.36)
    add(fx, impact(0.5, 1.2), B(c))
add(fx, riser(B(1), 0.8), B(3))
add(fx, riser(B(1), 0.9), B(26))
add(fx, impact(1.1, 2.0), B(28))
for b in (16, 18, 20): add(fx, impact(0.55, 1.2), B(b))

# --- mix -------------------------------------------------------------------
t_ax = np.arange(N) / SR
duck = np.ones(N)
last = -10
ev = np.where(kick_env > 0)[0]
for k in ev:
    seg = np.arange(k, min(N, k + int(0.28 * SR)))
    duck[seg] = np.minimum(duck[seg], 1 - 0.5 * np.exp(-(seg - k) / SR * 9))
mix = drums * 0.9 + music * duck * 0.8 + fx * 0.8
mix += reverb(music * 0.8 + fx * 0.8)
mix = np.tanh(mix * 1.1)
mix[:, -int(0.12 * SR):] *= np.linspace(1, 0, int(0.12 * SR))
mix /= max(1e-9, np.abs(mix).max()) / 0.95
sf.write('audio/score_raw.wav', mix.T, SR)

# --- measure the beat grid from the drum bus ------------------------------
mono = (drums.sum(0) + 0.0)
oenv = librosa.onset.onset_strength(y=mono.astype(np.float32), sr=SR, hop_length=256)
tempo, frames = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=256, start_bpm=BPM, tightness=200, trim=False)
meas = librosa.frames_to_time(frames, sr=SR, hop_length=256)
idx = np.round(meas / SPB).astype(int)
ok = (idx >= 0) & (idx < 30)
slope, off = np.polyfit(idx[ok], meas[ok], 1)
print(f'measured: tempo={float(np.atleast_1d(tempo)[0]):.2f} bpm, fit spb={slope:.5f} (design {SPB}), offset={off * 1000:.1f} ms, n={ok.sum()}')
if abs(off) > 0.04 or abs(slope - SPB) > 0.004: off, slope = 0.0, SPB; print('fit rejected, using design grid')
json.dump({'bpm': 60 / slope, 'spb': slope, 'offset': off, 'beats': [off + i * slope for i in range(31)], 'measured': meas.tolist()}, open('beats.json', 'w'))
