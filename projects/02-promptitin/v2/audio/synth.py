"""'40% there' score: D minor, 120 BPM. Staccato piano ostinato, drums, and UI sound design placed on the
same event list the picture uses (timeline.json). Writes audio/promo2_raw.wav and beats.json."""
import json
import numpy as np, soundfile as sf, librosa
from scipy import signal

TL = json.load(open('timeline.json'))
SR = 44100; BPM = TL['bpm']; SPB = 60 / BPM; DUR = TL['duration']; N = int(SR * DUR)
rng = np.random.default_rng(23)
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
noise = lambda n: rng.standard_normal(n)

def kick(g=1.0, tight=1.0):
    t = tt(0.45); f = 40 + 120 * np.exp(-t * 40 * tight)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7 * tight) + noise(len(t)) * np.exp(-t * 520) * 0.3
    return np.tanh(s * 2.0) * g
def snare(g=1.0):
    t = tt(0.28)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * 0.6
    return (body + sos('bandpass', [1500, 6500], noise(len(t))) * np.exp(-t * 16)) * g
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
    if stacc: s *= np.exp(-np.clip(t - 0.11, 0, None) * 40)  # damper: short, percussive
    return s * g * 0.33
def sub(freq, dur=0.45, g=1.0):
    t = tt(dur); s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    return np.tanh(s * 1.4) * np.exp(-t * 5) * np.minimum(1, t / 0.005) * g
def impact(g=1.0, dur=2.0):
    t = tt(dur); boom = np.sin(2 * np.pi * np.cumsum(32 + 95 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.0)
    return np.tanh((boom * 1.4 + sos('highpass', 2000, noise(len(t))) * np.exp(-t * 3.5) * 0.3) * 1.2) * g
def whoosh(dur=0.5, g=1.0, up=True):
    t = tt(dur); n = noise(len(t)); out = np.zeros_like(n)
    bands = np.linspace(300, 7000, 8) if up else np.linspace(7000, 300, 8)
    for lo, seg in zip(bands, np.array_split(np.arange(len(t)), 8)): out[seg] = sos('bandpass', [lo, lo * 1.7], n)[seg]
    env = np.sin(np.pi * t / dur) ** 1.5 if not up else (t / dur) ** 2 * np.minimum(1, (dur - t) / 0.03)
    return out * env * g * 6
def riser(dur, g=1.0):
    t = tt(dur); x = t / dur
    return (np.sin(2 * np.pi * np.cumsum(220 + 2600 * x ** 2) / SR) * 0.22 + sos('highpass', 2500, noise(len(t))) * 0.6) * x ** 2.6 * g
def click(g=1.0):
    def one(f):
        t = tt(0.05); return np.sin(2 * np.pi * f * t) * np.exp(-t * 170) + sos('bandpass', [2500, 7500], noise(len(t))) * np.exp(-t * 280) * 0.8
    x = np.zeros(int(SR * 0.16)); a = one(2000); x[:len(a)] += a; b = one(1350) * 0.5; o = int(SR * 0.07); x[o:o + len(b)] += b
    return x * g
def key(g=1.0):
    t = tt(0.04); return (np.sin(2 * np.pi * (1000 + 500 * rng.random()) * t) * np.exp(-t * 210) * 0.5 + sos('bandpass', [1800, 6000], noise(len(t))) * np.exp(-t * 340)) * g
def pop(f=700, g=1.0):
    t = tt(0.1); return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.9 * np.exp(-t * 55))) / SR) * np.exp(-t * 50) * g
def tick(f, g=1.0):
    t = tt(0.03); return np.sin(2 * np.pi * f * t) * np.exp(-t * 260) * g
def reverb(x, wet_t=1.8):
    t = tt(wet_t); ir = sos('lowpass', 6500, sos('highpass', 250, noise(len(t))) * np.exp(-t * 3.0))
    return np.stack([signal.fftconvolve(x[c], ir)[:N] for c in (0, 1)]) * 0.045

B = lambda b: b * SPB
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
def K(b, g=1.0): add(drums, kick(g), B(b)); kick_env[int(B(b) * SR)] = 1

# ---- hook: five slams, low octaves walking D - F - A - C#(tension on "40%") - D
for i, (m, g) in enumerate(((38, 1.0), (41, 1.0), (45, 1.0), (49, 1.15), (50, 1.0))):
    K(i, 1.05); add(fx, impact(0.5 if i != 3 else 0.8, 1.2), B(i))
    for mm in (m, m + 12): add(music, piano(m2f(mm), 1.3, 0.9, det=1.0012 if i != 3 else 1.018), B(i))
add(fx, riser(B(1.5), 0.9), B(4.5))
add(fx, whoosh(0.5, 0.8, up=False), B(5.5))  # the 40% flies into the UI
# ---- groove from the drop (b6) to b24
for b in range(6, 24): K(b)
for b in range(7, 24, 2): add(drums, snare(0.75), B(b), pan=0.05)
for h in np.arange(8, 24, 0.25): add(drums, shaker(0.35 if (h * 4) % 2 else 0.2), B(h), pan=0.3)
chords = [(38, [62, 65, 69]), (34, [62, 65, 70]), (41, [60, 65, 69]), (36, [60, 64, 67])]  # Dm, Bb, F, C
for h in np.arange(6, 24, 0.5):
    root, tri = chords[int(h // 4) % 4]
    add(music, sub(m2f(root), 0.4, 0.75 if (h % 1) == 0 else 0.45), B(h))
    add(music, piano(m2f(tri[int(h * 2) % 3] + 12), 0.5, 0.42, stacc=True), B(h), pan=0.25 if (h * 2) % 2 else -0.25)
# ---- UI sound design, from the shared event list
D = TL['drops']
for i, b in enumerate([D['shell'], D['title'], D['card']] + D['chips'] + [D['enhance']]): add(fx, pop(520 + 60 * i, 0.55), B(b), pan=-0.5 + 0.11 * i)
for i, b in enumerate(TL['rows']): add(fx, pop(800 + 150 * i, 0.5), B(b), pan=0.3)
add(fx, whoosh(0.35, 0.5), B(TL['header']) - 0.3)
for i, b in enumerate(TL['lines']): add(music, piano(m2f([74, 77, 81, 84, 86, 89][i]), 1.0, 0.55), B(b), pan=0.15)  # each streamed line rings a note
for b in TL['clicks']: add(fx, click(0.95), B(b))
t0, t1, n = TL['typing']
for k in range(int(n)): add(fx, key(0.5), B(t0) + (B(t1) - B(t0)) * k / n, pan=0.25)
add(fx, whoosh(0.5, 0.6), B(20) - 0.1)                       # navigation cut to Generate
add(fx, riser(B(1), 0.8), B(23)); add(fx, whoosh(0.5, 0.9), B(24) - 0.45)  # zoom through Continue
# ---- number: odometer ticks, then land on a chord
o0, o1 = TL['odo']
for tm in np.arange(B(o0), B(o1), 0.055): add(fx, tick(700 + 2200 * ((tm - B(o0)) / (B(o1) - B(o0))) ** 0.8, 0.5), tm, pan=-0.2)
add(fx, impact(0.9, 1.6), B(24)); K(24, 1.1); K(o1, 1.1)
for m in (50, 62, 65, 69, 74): add(music, piano(m2f(m), 2.2, 0.75), B(o1))
for b in (27, 28, 29): K(b, 0.8)
for h in np.arange(27, 30, 0.5): add(music, piano(m2f([69, 72, 74, 77, 76, 72][int((h - 27) * 2)]), 0.5, 0.4, stacc=True), B(h))
add(fx, riser(B(1), 0.85), B(29))
# ---- CTA: resolve to F major add9, then a gentle answer phrase
add(fx, impact(1.1, 2.4), B(30)); K(30, 1.1)
for m in (41, 53, 60, 65, 67, 69, 72): add(music, piano(m2f(m), 3.8, 0.85), B(30), pan=(m % 7 - 3) / 6)
for b, m in ((32, 77), (32.5, 76), (33, 72), (34, 74), (36.5, 77), (37, 81)): add(music, piano(m2f(m), 2.0, 0.45), B(b), pan=0.2)
for b in (32, 34, 36, 38): K(b, 0.65)

duck = np.ones(N)
for k_ in np.where(kick_env > 0)[0]:
    seg = np.arange(k_, min(N, k_ + int(0.26 * SR))); duck[seg] = np.minimum(duck[seg], 1 - 0.45 * np.exp(-(seg - k_) / SR * 10))
mix = drums * 0.85 + music * duck * 0.9 + fx * 0.8
mix += reverb(music * 0.9 + fx * 0.6)
mix = np.tanh(mix * 1.1)
mix[:, -int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))
mix /= max(1e-9, np.abs(mix).max()) / 0.95
sf.write('audio/promo2_raw.wav', mix.T, SR)

mono = drums.sum(0)
oenv = librosa.onset.onset_strength(y=mono.astype(np.float32), sr=SR, hop_length=256)
tempo, frames = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=256, start_bpm=BPM, tightness=200, trim=False)
meas = librosa.frames_to_time(frames, sr=SR, hop_length=256); idx = np.round(meas / SPB).astype(int); ok = (idx >= 0) & (idx < 40)
slope, off = np.polyfit(idx[ok], meas[ok], 1)
print(f'measured: {float(np.atleast_1d(tempo)[0]):.2f} bpm, spb={slope:.5f}, offset={off * 1000:.1f} ms, n={ok.sum()}')
if abs(off) > 0.04 or abs(slope - SPB) > 0.004: off, slope = 0.0, SPB; print('fit rejected -> design grid')
json.dump({'spb': slope, 'offset': off, 'bpm': 60 / slope}, open('beats.json', 'w'))
