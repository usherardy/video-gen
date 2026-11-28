"""'Still building' score: A minor / C major, 90 BPM. Piano, a 2 AM clock, snow footsteps and designed hits, placed
on the same event list the picture uses (timeline.json). The big chord is held back for the title.
Writes audio/score_raw.wav and beats.json (measured grid)."""
import json
import numpy as np, soundfile as sf, librosa
from scipy import signal

TL = json.load(open('timeline.json'))
SR = 44100; BPM = TL['bpm']; SPB = 60 / BPM; DUR = TL['duration']; N = int(SR * DUR)
rng = np.random.default_rng(24)
def bus(): return np.zeros((2, N))
drums, music, fx, grid = bus(), bus(), bus(), np.zeros(N)
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
B = lambda b: b * SPB
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
S, C = TL['scenes'], TL

# ---------- instruments ----------
def piano(freq, dur=1.6, g=1.0, stacc=False, det=1.0011, soft=False):
    t = tt(dur); s = np.zeros_like(t)
    for k in range(1, 14):
        fk = freq * k * np.sqrt(1 + 0.0003 * k * k)
        if fk > 11000: break
        amp = 1 / k ** (1.5 if soft else 1.1); dec = 1.6 + 1.1 * k + 0.0016 * freq
        s += amp * (np.sin(2 * np.pi * fk * t + k) + 0.5 * np.sin(2 * np.pi * fk * det * t)) * np.exp(-t * dec / 1.7)
    s += sos('lowpass', 900, noise(len(t))) * np.exp(-t * 90) * (0.12 if soft else 0.28)
    s *= np.minimum(1, t / (0.006 if soft else 0.0025))
    if stacc: s *= np.exp(-np.clip(t - 0.12, 0, None) * 30)
    s[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
    return s * g * 0.3
def kick(g=1.0):
    t = tt(0.45); f = 42 + 110 * np.exp(-t * 38)
    return np.tanh((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + noise(len(t)) * np.exp(-t * 500) * 0.25) * 2) * g
def snare(g=1.0):
    t = tt(0.26); return (np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.5 + sos('bandpass', [1400, 6000], noise(len(t))) * np.exp(-t * 18)) * g
def shaker(g=1.0):
    t = tt(0.06); return sos('bandpass', [6000, 11000], noise(len(t))) * np.sin(np.pi * t / 0.06) ** 2 * g
def tick(f=2600, g=1.0):  # clock: wooden tick
    t = tt(0.05); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 220) + sos('bandpass', [1800, 5000], noise(len(t))) * np.exp(-t * 400) * 0.5) * g
def step(g=1.0):  # a boot in fresh snow: soft crunch
    t = tt(0.22); n = sos('bandpass', [500, 3200], noise(len(t)))
    grains = (rng.random(len(t)) < 0.02).astype(float) * rng.random(len(t)); grains = sos('highpass', 1500, grains)
    return (n * 0.35 + grains * 3) * np.sin(np.pi * np.clip(t / 0.18, 0, 1)) ** 0.7 * g
def impact(g=1.0, dur=2.0):
    t = tt(dur); boom = np.sin(2 * np.pi * np.cumsum(34 + 90 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    return np.tanh((boom * 1.4 + sos('highpass', 2500, noise(len(t))) * np.exp(-t * 4) * 0.25) * 1.2) * g
def thud(g=1.0):
    t = tt(0.6); return np.tanh(np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 9) * 2.5) * g
def whoosh(dur=0.5, g=1.0, up=True):
    t = tt(dur); n = noise(len(t)); out = np.zeros_like(n)
    bands = np.linspace(300, 6500, 8) if up else np.linspace(6500, 250, 8)
    for lo, seg in zip(bands, np.array_split(np.arange(len(t)), 8)): out[seg] = sos('bandpass', [lo, lo * 1.7], n)[seg]
    env = (t / dur) ** 2 * np.minimum(1, (dur - t) / 0.03) if up else np.sin(np.pi * t / dur) ** 1.5
    return out * env * g * 5
def pop(f=700, g=1.0):
    t = tt(0.1); return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.9 * np.exp(-t * 55))) / SR) * np.exp(-t * 50) * g
def key(g=1.0):
    t = tt(0.04); return (np.sin(2 * np.pi * (900 + 400 * rng.random()) * t) * np.exp(-t * 200) * 0.5 + sos('bandpass', [1800, 6000], noise(len(t))) * np.exp(-t * 330)) * g
def crt_on(g=1.0):  # degauss thump + a short high whine
    t = tt(0.9); thump = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 6) * np.minimum(1, t / 0.01)
    whine = np.sin(2 * np.pi * 15600 * t) * 0.05 * np.exp(-t * 3) + np.sin(2 * np.pi * 7800 * t) * 0.03 * np.exp(-t * 4)
    return (np.tanh(thump * 2) * 0.8 + whine + sos('bandpass', [200, 900], noise(len(t))) * np.exp(-t * 8) * 0.2) * g
def pencil(dur, g=1.0):  # graphite on paper
    t = tt(dur); n = sos('bandpass', [2500, 8000], noise(len(t)))
    return n * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t) ** 2) * np.sin(np.pi * t / dur) ** 0.5 * g * 0.5
def switch(g=1.0, heavy=True):  # a big rocker switch: two-part clack
    def part(f, d):
        t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + sos('bandpass', [1200, 5000], noise(len(t))) * np.exp(-t * 260)
    x = np.zeros(int(SR * 0.2)); a = part(1700, 0.06); x[:len(a)] += a; b = part(900 if heavy else 1300, 0.08) * 0.8; o = int(SR * 0.03); x[o:o + len(b)] += b
    t = tt(0.2); x += np.sin(2 * np.pi * 80 * t) * np.exp(-t * 30) * 0.6
    return x * g
def reverb(x, wet_t=2.4):
    t = tt(wet_t); ir = sos('lowpass', 6000, sos('highpass', 200, noise(len(t))) * np.exp(-t * 2.4))
    return np.stack([signal.fftconvolve(x[c], ir)[:N] for c in (0, 1)]) * 0.05

def K(b, g=1.0): add(drums, kick(g), B(b)); kick_env[int(B(b) * SR)] = 1; grid[int(B(b) * SR)] += g
def TICK(b, g=0.3): add(fx, tick(2600 if int(round(b)) % 2 == 0 else 2050, g), B(b), pan=0.35); grid[int(B(b) * SR)] += g
CH = {'Am': (45, [57, 60, 64]), 'F': (41, [57, 60, 65]), 'C': (48, [55, 60, 64]), 'G': (43, [55, 59, 62]), 'Em': (40, [55, 59, 64])}
PROG = ['Am', 'F', 'C', 'G']
def chord_at(b): return PROG[int(b // 4) % 4]
def arp(b0, b1, g=0.22, step_b=0.5, octave=0, stacc=False):  # broken chords, one note per half beat
    for h in np.arange(b0, b1, step_b):
        root, tri = CH[chord_at(h)]
        i = int(round(h / step_b))
        if abs(h % 4) < 1e-6: add(music, piano(m2f(root), 2.6, g * 1.6, soft=True), B(h), pan=-0.1)
        add(music, piano(m2f(tri[[0, 1, 2, 1][i % 4]] + octave), 1.4, g, stacc=stacc, soft=True), B(h), pan=0.2 if i % 2 else -0.2)
# the boy's motif (music-box register): comes back at the end as the callback
MOTIF = [(0, 76), (0.5, 79), (1, 81), (2, 79), (2.5, 76), (3, 74), (4, 72), (4.5, 74), (5, 76), (6, 74), (7, 72)]
def motif(b0, g=0.3):
    for db, m in MOTIF: add(music, piano(m2f(m + 12), 1.6, g, det=1.003), B(b0 + db), pan=0.3)

# ---------- 1. night, 2 AM: clock + sparse piano ----------
add(music, piano(m2f(45), 3.0, 0.8, soft=True), B(0)); add(music, piano(m2f(57), 3.0, 0.5, soft=True), B(0))
add(fx, impact(0.35, 2.4), B(0))
for b in range(0, 14): TICK(b, 0.32)
arp(4, 14, 0.18)
for i, b in enumerate(C['night']['notes']): add(fx, pop(600 + 90 * i, 0.35), B(b), pan=-0.4 + 0.2 * i)
add(fx, whoosh(0.3, 0.35, up=False), B(C['night']['calendar']) - 0.05)
# ---------- 2. eighth grade: CRT, typing, the motif ----------
g8 = C['grade8']
add(fx, whoosh(0.6, 0.45), B(S['grade8']) - 0.55); add(fx, crt_on(0.7), B(g8['crt']))
arp(14, 23.5, 0.2); motif(16, 0.26)
for k in range(14): add(fx, key(0.45), B(g8['type'][0]) + (B(g8['type'][1]) - B(g8['type'][0])) * k / 14, pan=0.2)
add(fx, key(0.9), B(g8['enter'])); add(fx, pop(980, 0.4), B(g8['enter']) + 0.05)
for b in g8['doodles']: add(fx, pencil(0.55, 0.35), B(b), pan=-0.3)
for b in range(14, 23): TICK(b, 0.14)
# ---------- 3. Pexel: the jump, the window, then nothing ----------
px = C['pexel']
add(fx, impact(0.7, 1.8), B(px['jump'])); K(px['jump'], 0.9); add(fx, whoosh(0.45, 0.6), B(px['jump']) - 0.42)
add(music, piano(m2f(45), 2.5, 0.6), B(px['jump'])); add(music, piano(m2f(64), 2.5, 0.45), B(px['jump']))
for i, k in enumerate(['window', 'logo', 'chat', 'input']): add(fx, pop(520 + 110 * i, 0.55), B(px[k]), pan=-0.2 + 0.15 * i)
arp(25.5, 31.5, 0.16, step_b=1)
for b in range(26, 32): TICK(b, 0.14)
# lowest point: the music stops; one low dissonant note per bar, the clock keeps going
for b, ms in ((32, (33, 45, 46)), (36, (33, 45, 46))): [add(music, piano(m2f(m), 3.2, 0.42, soft=True), B(b)) for m in ms]
for b in np.arange(32, 39.5, 1): TICK(b, 0.24)
add(fx, whoosh(0.7, 0.55, up=False), B(px['fall'])); add(fx, thud(0.9), B(px['fall']) + 0.55)
# ---------- 4. Lithuania: snow, footsteps, the idea becomes real ----------
lt = C['lithuania']
for b in np.arange(40, 50.5, 1): add(drums, step(0.55), B(b) + 0.02 * rng.standard_normal(), pan=0.15 * (1 if int(b) % 2 else -1)); grid[int(B(b) * SR)] += 0.3
arp(40, 50, 0.2)
add(fx, impact(0.3, 1.6), B(lt['word']))
add(fx, pencil(B(lt['sketch'][1]) - B(lt['sketch'][0]), 0.45), B(lt['sketch'][0]), pan=0.2)
add(fx, pop(880, 0.6), B(lt['real'])); [add(music, piano(m2f(m), 2.2, 0.55), B(lt['real'])) for m in (60, 64, 67, 72)]
add(fx, whoosh(0.5, 0.5), B(S['build']) - 0.45)
# ---------- 5. building: the groove arrives ----------
bd = C['build']
for b in np.arange(50.5, 59, 1): K(b, 0.95)
for b in np.arange(51.5, 59, 2): add(drums, snare(0.7), B(b), pan=0.05)
for h in np.arange(52.5, 59, 0.25): add(drums, shaker(0.3 if (h * 4) % 2 else 0.18), B(h), pan=0.3)
for h in np.arange(50.5, 59, 0.5):
    root, tri = CH[chord_at(h + 1.5)]
    add(music, piano(m2f(tri[int(h * 2) % 3] + 12), 0.5, 0.36, stacc=True), B(h), pan=0.25 if (h * 2) % 2 else -0.25)
    if abs(h % 1) < 1e-6: add(music, piano(m2f(root), 0.9, 0.5, stacc=True), B(h))
for i, b in enumerate(bd['tiles']): add(fx, impact(0.35, 0.9), B(b)); add(fx, pop(500 + 150 * i, 0.6), B(b), pan=[-.4, .4, -.4, .4][i])
for b in bd['yes']: add(fx, thud(0.6), B(b)); add(fx, pop(1250, 0.55), B(b) + 0.02)
for b in bd['no']: add(fx, thud(0.7), B(b)); add(fx, pop(330, 0.5), B(b) + 0.02)
# ---------- 6. Shaw Games: the payoff in the middle ----------
sh = C['shaw']
add(fx, whoosh(0.55, 0.8), B(sh['zoom']) - 0.5); add(fx, impact(0.6, 1.6), B(sh['zoom'])); K(sh['zoom'], 1.0)
for b in np.arange(59, 69, 1): K(b, 0.85 if b < 62 else 0.95)
for b in np.arange(60, 69, 2): add(drums, snare(0.7), B(b), pan=0.05)
for h in np.arange(59, 69, 0.25): add(drums, shaker(0.3 if (h * 4) % 2 else 0.18), B(h), pan=0.3)
for h in np.arange(59, 69, 0.5):
    root, tri = CH[chord_at(h)]
    add(music, piano(m2f(tri[int(h * 2) % 3] + 12), 0.5, 0.34, stacc=True), B(h), pan=0.25 if (h * 2) % 2 else -0.25)
    if abs(h % 1) < 1e-6: add(music, piano(m2f(root), 0.9, 0.5, stacc=True), B(h))
add(fx, pop(700, 0.6), B(sh['logo']))
c0, c1 = sh['count']
for tm in np.arange(B(c0), B(c1), 0.05): add(fx, tick(900 + 2300 * ((tm - B(c0)) / (B(c1) - B(c0))) ** 0.8, 0.4), tm, pan=-0.2)
add(fx, impact(0.95, 2.0), B(c1)); K(c1, 1.1); [add(music, piano(m2f(m), 2.4, 0.7), B(c1)) for m in (48, 60, 64, 67, 72, 76)]
add(fx, impact(0.45, 1.2), B(sh['compare'])); add(fx, pop(1100, 0.5), B(sh['compare']))
for k in range(40): add(fx, tick(2000 + 1500 * rng.random(), 0.12), B(sh['crowd']) + k * 0.03 + 0.01 * rng.random(), pan=rng.uniform(-.7, .7))
# ---------- 7. another idea, then the off switch ----------
ia = C['ideas']
for b in np.arange(69, 74.5, 1): K(b, 0.55)
arp(69, 74.5, 0.18, stacc=True)
add(fx, pop(1250, 0.6), B(ia['check'])); add(fx, thud(0.4), B(ia['check']))
for i, b in enumerate(ia['spawn']): add(fx, pop(560 + 70 * i, 0.45), B(b), pan=0.3 - 0.1 * i)
add(fx, whoosh(0.4, 0.4), B(ia['switch']) - 0.35)
for h in np.arange(74.5, ia['off'], 0.5): add(music, piano(m2f(CH['G'][1][int(h * 2) % 3] + 12), 0.5, 0.25, stacc=True), B(h))
add(fx, switch(1.0), B(ia['off'])); add(fx, switch(0.85, heavy=False), B(ia['on']))
# ---------- 8. doubt: back at the window ----------
dt = C['doubt']
for b in range(79, 85): TICK(b, 0.26)
for b, m in ((78.5, 45), (80.5, 41), (82.5, 48), (84.5, 43)): add(music, piano(m2f(m), 2.6, 0.5, soft=True), B(b)); add(music, piano(m2f(m + 19), 2.2, 0.25, soft=True), B(b))
add(music, piano(m2f(79), 1.8, 0.35), B(dt['light']))
for i, b in enumerate(dt['next']): add(music, piano(m2f([83, 86][i]), 1.6, 0.3), B(b), pan=0.4)
# ---------- 9. the boy: the motif comes back, then the walk ----------
by = C['boy']
add(fx, crt_on(0.45), B(by['crt'])); arp(85.25, 90.25, 0.2); motif(86, 0.28)
for b in by['doodles']: add(fx, pencil(0.45, 0.3), B(b), pan=-0.3)
add(fx, whoosh(0.8, 0.5), B(S['horizon']) - 0.75)
for b in np.arange(90.25, 96.75, 1): add(drums, step(0.4), B(b), pan=0.1)
for b in np.arange(90.25, 96.75, 2): K(b, 0.6)
for h in np.arange(90.25, 96.5, 0.5):
    root, tri = CH[chord_at(h - 90.25)]
    add(music, piano(m2f(tri[int(round(h * 2)) % 3]), 1.2, 0.26, soft=True), B(h), pan=0.2 if int(h * 2) % 2 else -0.2)
    if abs((h - 90.25) % 2) < 1e-6: add(music, piano(m2f(root - 12), 2.4, 0.55, soft=True), B(h)); add(music, piano(m2f(root), 2.4, 0.4, soft=True), B(h))
add(fx, whoosh(1.4, 0.55), B(S['title']) - 1.35)
# ---------- 10. title: the held-back chord, then the motif answers ----------
add(fx, impact(1.0, 3.2), B(S['title'])); K(S['title'], 1.1)
for m in (36, 48, 55, 60, 62, 64, 67, 72): add(music, piano(m2f(m), 5.5, 0.62), B(S['title']), pan=(m % 7 - 3) / 7)
for db, m in [(1.5, 76), (2, 79), (2.5, 81), (3.5, 79)]: add(music, piano(m2f(m + 12), 2.4, 0.32, det=1.003), B(S['title'] + db), pan=0.3)
t0, t1 = C['title']['type']
for k in range(30): add(fx, key(0.32), B(t0) + (B(t1) - B(t0)) * k / 30, pan=0.15)

duck = np.ones(N)
for k_ in np.where(kick_env > 0)[0]:
    seg = np.arange(k_, min(N, k_ + int(0.24 * SR))); duck[seg] = np.minimum(duck[seg], 1 - 0.35 * np.exp(-(seg - k_) / SR * 10))
mix = drums * 0.8 + music * duck * 0.95 + fx * 0.8
mix += reverb(music * 0.9 + fx * 0.5)
off_i, on_i = int(B(C['ideas']['off']) * SR) + int(0.05 * SR), int(B(C['ideas']['on']) * SR)
mix[:, off_i:on_i] *= np.linspace(0.04, 0.04, on_i - off_i)  # the off switch really switches the score off
mix = np.tanh(mix * 1.05)
mix[:, -int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
mix /= max(1e-9, np.abs(mix).max()) / 0.95
sf.write('audio/score_raw.wav', mix.T, SR)

oenv = librosa.onset.onset_strength(y=(grid + 0.002 * rng.standard_normal(N)).astype(np.float32), sr=SR, hop_length=256)
gb = np.array([round(i / SR / SPB, 2) for i in np.nonzero(grid)[0]])
pk = librosa.util.peak_pick(oenv, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
meas = librosa.frames_to_time(pk, sr=SR, hop_length=256)
idx = np.round(meas / SPB).astype(int); ok = np.abs(meas - idx * SPB) < 0.06
slope, off = np.polyfit(idx[ok], meas[ok], 1)
print(f'measured {ok.sum()} grid onsets: spb={slope:.5f} (design {SPB:.5f}), offset={off * 1000:.1f} ms')
if abs(off) > 0.04 or abs(slope - SPB) > 0.004: off, slope = 0.0, SPB; print('fit rejected -> design grid')
json.dump({'spb': slope, 'offset': off, 'bpm': 60 / slope}, open('beats.json', 'w'))
