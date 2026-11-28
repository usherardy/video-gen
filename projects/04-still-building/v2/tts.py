"""Voiceover without ElevenLabs: Kokoro (open-source, Apache-2.0, runs on CPU) reads script.txt line by line.
Writes vo/take.flac (the lines with a short pause between them) and vo/lines.json (each line's start/end in the take),
then faster-whisper (open-source) finds every word's time for the captions: vo/words.json.

usage (from v2/): python3 tts.py [voice] [speed]      default voice am_michael, speed 1.0
Model files: ~/.cache/kokoro/kokoro-v1.0.onnx + voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases)."""
import json, os, sys, subprocess
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

VOICE = sys.argv[1] if len(sys.argv) > 1 else 'am_michael'
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
M = os.path.expanduser('~/.cache/kokoro')
k = Kokoro(f'{M}/kokoro-v1.0.onnx', f'{M}/voices-v1.0.bin')
lines = [l.strip() for l in open('script.txt') if l.strip()]
os.makedirs('vo', exist_ok=True)

GAP = 0.35  # silence between lines in the take; the beat placement decides the real gaps
chunks, meta, t, sr0 = [], [], 0.0, None
for i, line in enumerate(lines):
    a, sr = k.create(line, voice=VOICE, speed=SPEED, lang='en-us'); sr0 = sr
    a = np.asarray(a, dtype=np.float32)
    nz = np.nonzero(np.abs(a) > 0.01)[0]                      # trim Kokoro's own leading/trailing silence
    a = a[max(0, nz[0] - int(0.03 * sr)):min(len(a), nz[-1] + int(0.08 * sr))]
    meta.append({'i': i, 'text': line, 'start': round(t, 3), 'end': round(t + len(a) / sr, 3)})
    chunks += [a, np.zeros(int(GAP * sr), np.float32)]; t += len(a) / sr + GAP
    print(f'{i:2d} {len(a) / sr:5.2f}s  {line}')
take = np.concatenate(chunks)
sf.write('vo/take.flac', take, sr0)
json.dump({'voice': f'Kokoro {VOICE}, speed {SPEED}', 'sr': sr0, 'lines': meta}, open('vo/lines.json', 'w'), indent=1)
print(f'take: {len(take) / sr0:.1f}s, speech {sum(m["end"] - m["start"] for m in meta):.1f}s')

# word timings with faster-whisper, matched back to the script's own words
from faster_whisper import WhisperModel
wm = WhisperModel('small.en', device='cpu', compute_type='int8')
from scipy.signal import resample_poly
a16 = resample_poly(take, 16000, sr0).astype(np.float32)  # pass samples directly (no container decoding)
segs, _ = wm.transcribe(a16, word_timestamps=True, language='en', beam_size=5)
heard = [w for s in segs for w in s.words]
norm = lambda s: ''.join(c for c in s.lower() if c.isalnum())
words, h = [], 0
for m in meta:
    for tok in m['text'].split():
        # take the next heard word inside this line's window (whisper can merge or split; fall back to an even spread)
        cand = [j for j in range(h, min(h + 4, len(heard))) if m['start'] - 0.3 <= heard[j].start <= m['end'] + 0.1 and norm(heard[j].word) == norm(tok)]
        if cand: j = cand[0]; words.append({'line': m['i'], 'text': tok, 'start': round(heard[j].start, 3)}); h = j + 1
        else: words.append({'line': m['i'], 'text': tok, 'start': None})
miss_before = sum(1 for w in words if w['start'] is None)
for m in meta:  # fill words whisper did not match by spreading them between their matched neighbours
    ws = [w for w in words if w['line'] == m['i']]
    known = [(k_, w['start']) for k_, w in enumerate(ws) if w['start'] is not None]
    anchors = [(-1, m['start'] - 0.05)] + known + [(len(ws), m['end'])]
    for (a_, ta), (b_, tb) in zip(anchors, anchors[1:]):
        for k_ in range(a_ + 1, b_): ws[k_]['start'] = round(ta + (tb - ta) * (k_ - a_) / (b_ - a_), 3)
json.dump(words, open('vo/words.json', 'w'), indent=1)
print(f'words: {len(words)}, timed by whisper: {len(words) - miss_before} , spread between neighbours: {miss_before}, heard {len(heard)}')
