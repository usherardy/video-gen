"""Place the ElevenLabs voiceover phrases on the beat grid, duck the score under them, write audio/promo2_vo_raw.wav.
Phrase boundaries come from silencedetect on audio/vo/takeA.mp3 (Erik, eleven_v4)."""
import json, subprocess
import numpy as np, soundfile as sf
from scipy import signal

SR = 44100
BE = json.load(open('beats_promo2.json')); TL = json.load(open('timeline_promo2.json'))
BEAT = lambda b: BE['offset'] + b * BE['spb']
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/vo/takeA.mp3', '-ar', str(SR), '-ac', '1', 'audio/vo/takeA.wav'], check=True)
vo, _ = sf.read('audio/vo/takeA.wav')
vo = signal.sosfilt(signal.butter(2, 90, 'highpass', fs=SR, output='sos'), vo)

# (source start, source end, place at beat, text)
PHRASES = [
    (0.00, 2.10, 0.05, 'Your prompt is forty percent there.'),
    (2.48, 3.03, 6.0, 'Paste it in.'),
    (3.34, 4.11, 8.5, 'See your score.'),
    (4.40, 5.14, 12.0, 'One click.'),
    (5.47, 6.07, 13.75, 'Polished.'),
    (6.40, 8.43, 16.0, 'Save it once. Reuse it anywhere.'),
    (8.67, 10.13, 20.5, 'Or start from a rough idea.'),
    (10.46, 12.18, 24.5, 'A thousand credits, every month.'),
    (12.63, 13.30, 31.0, 'Prompt It In.'),
    (13.57, len(vo) / SR, 32.75, 'Log in, and get better prompts.'),
]
music, sr2 = sf.read('audio/promo2_raw.wav'); assert sr2 == SR
N = len(music); pad = int(0.04 * SR)
segs = []
for s0, s1, b, txt in PHRASES:
    a_, z = max(0, int(s0 * SR) - pad), min(len(vo), int(s1 * SR) + pad)
    seg = vo[a_:z].copy(); f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    seg /= max(1e-9, np.sqrt(np.mean(seg ** 2)))
    segs.append((int(BEAT(b) * SR), seg)); print(f'b{b:5.2f}  {BEAT(b):5.2f}s-{BEAT(b) + len(seg) / SR:5.2f}s  {txt}')
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
sf.write('audio/promo2_vo_raw.wav', mix, SR)
music = music  # (unchanged source for the check below)
# voice-over-music check: RMS of the voice vs the ducked score while each phrase plays
for s0, s1, b, txt in PHRASES:
    i, j = int(BEAT(b) * SR), int((BEAT(b) + (s1 - s0)) * SR)
    v = np.sqrt(np.mean(track[i:j] ** 2)); m = np.sqrt(np.mean((music[i:j] * gain[i:j, None]) ** 2))
    print(f'  {txt[:28]:28s} voice/music {20 * np.log10(v / m):+5.1f} dB')
print('peak-normalized mix written')
