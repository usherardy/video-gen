"""Place each voiceover line on a quarter beat (90 BPM) and write vo/config.json (for shared/vo_mix.py),
timeline.json (scenes + cues, in beats) and captions.json (every word's time in the film).
usage (from v2/): python3 plan.py   (after tts.py)"""
import json, math

BPM = 90; SPB = 60 / BPM; Q = 0.25; PAD = 0.04
L = json.load(open('vo/lines.json'))['lines']; Wd = json.load(open('vo/words.json'))
# silence before each line (s): longer at scene changes and turns
GAP = [0.0, 0.2, 0.55, 0.15, 0.25, 0.15, 0.2, 0.65, 0.15, 0.2, 0.15, 0.45, 0.1, 0.25, 0.55, 0.15, 0.65, 0.25, 0.4]
assert len(GAP) == len(L)
phrases, end_s, starts = [], 0.0, []
for m, g in zip(L, GAP):
    b = math.ceil(((end_s + g) / SPB) / Q - 1e-6) * Q
    phrases.append([m['start'], m['end'], b, m['text']]); starts.append(b)
    end_s = b * SPB + (m['end'] - m['start']) + 2 * PAD
dur = math.ceil((end_s + 1.6) * 30) / 30
json.dump({'take': 'vo/take.flac', 'music': 'audio/score_raw.wav', 'beats': 'beats.json', 'out': 'still_v2_vo',
           'voice': json.load(open('vo/lines.json'))['voice'], 'phrases': phrases}, open('vo/config.json', 'w'), indent=1)
# words: offset inside the placed phrase (seconds after the phrase's beat)
caps = [{'line': w['line'], 'text': w['text'], 'b': starts[w['line']], 'dt': round(w['start'] - L[w['line']]['start'] + PAD, 3)} for w in Wd]
json.dump({'bpm': BPM, 'duration': dur, 'lines': [[b, round(m['end'] - m['start'] + 2 * PAD, 3)] for b, m in zip(starts, L)], 'words': caps},
          open('captions.json', 'w'), indent=1)
wb = lambda li, wi: starts[li] + [c for c in caps if c['line'] == li][wi]['dt'] / SPB   # beat of word wi in line li
# scenes (beats) and the cues the score hits
tl = {'fps': 30, 'bpm': BPM, 'duration': dur,
      'scenes': {'dream': 0, 'abroad': starts[2], 'struggle': starts[4], 'turn': starts[7], 'escape': starts[8], 'obsession': starts[11],
                 'meaning': starts[14], 'ending': starts[16], 'title': starts[18], 'end': dur / SPB},
      'cues': {'lithuania': wb(2, 5), 'nightmare': wb(6, 12), 'freedom': wb(8, 11), 'out': [wb(10, 0), wb(10, 3), wb(10, 6)],
               'list': [wb(12, 0), wb(12, 3), wb(12, 4), wb(12, 5)], 'worked': wb(12, 6), 'didnt': wb(12, 8), 'cant_stop': wb(13, 0),
               'possible': wb(15, 11), 'keep_going': wb(17, 13), 'follow': wb(18, 0)}}
json.dump(tl, open('timeline.json', 'w'), indent=1)
for (s0, s1, b, t) in phrases: print(f'b{b:6.2f} {b * SPB:6.2f}s  {t[:64]}')
print(f'film {dur:.2f}s = {dur / SPB:.1f} beats'); print(json.dumps(tl['cues']))
