"""Plan the voiceover on the beat grid: cut take B at its measured pauses, place every phrase on a quarter beat,
and write vo/config.json (for shared/vo_mix.py) plus captions.json (word timings for the picture).

usage (from the film folder): python3 vo/plan.py
Source cuts come from ffmpeg silencedetect on vo/takeB.mp3 (noise -38 dB, 0.25 s); word starts from ElevenLabs Scribe.
Caption text: " / " splits a phrase into on-screen chunks, "*" marks a word drawn in the accent colour,
"15,000" stands for the two spoken words "fifteen thousand"."""
import json, math

BPM = 90; SPB = 60 / BPM; Q = 0.25  # placement grid: quarter beats
PAD = 0.04                           # vo_mix pads each cut by 40 ms
# [source_start, source_end, silence before it (s), on-screen text]
P = [
    [0.12, 5.32, 0.00, "I'm *24, / it's *2 *AM, / and I'm awake / thinking about something / that doesn't exist yet."],
    [6.21, 7.88, 0.12, "I don't know / which *idea / will change my life."],
    [8.45, 9.77, 0.10, "I don't know / where I'll be / next year."],
    [10.42, 13.95, 0.30, "But it all started / in *eighth *grade, / when I decided / I was going to / build a *company."],
    [14.70, 17.02, 0.12, "I just wanted / to make something / that didn't exist before."],
    [17.56, 22.49, 0.25, "Two years later, / I built my first / real website, / *Pexel, / an anonymous chat / for giving feedback."],
    [23.03, 27.70, 0.30, "*Nobody used it. / I had no idea / how to get it / in front of people, / and I failed / miserably."],
    [28.35, 31.18, 0.50, "But then life / took me to *Lithuania, / and I studied / technology."],
    [31.87, 35.49, 0.12, "The first thing / I learned there / was that an idea / doesn't have to / stay an idea."],
    [35.91, 36.84, 0.15, "So I kept *building."],
    [37.19, 39.69, 0.05, "Games, / websites, / robots, / apps."],
    [39.99, 41.35, 0.10, "Some worked. / Others didn't."],
    [41.78, 45.98, 0.15, "And one of them, / *Shaw *Games, / now has / *15,000 people / using it every month."],
    [46.50, 48.32, 0.12, "This time, / people actually *showed *up."],
    [48.76, 51.77, 0.25, "But every time / I finish something, / another *idea appears."],
    [52.11, 54.41, 0.12, "I wish my brain / had an *off *switch."],
    [54.68, 58.67, 0.50, "So some nights / I wonder / if I'm getting closer / to my *dream, / or just chasing / a new one."],
    [59.16, 64.61, 0.35, "But the *boy / from eighth grade / is still in there, / still curious, / still believing / something he builds / will matter."],
    [65.09, 66.40, 0.15, "I owe it to him / to *find *out."],
    [66.84, 68.89, 0.25, "Follow along / and watch me find out."],
]

words = [w for w in json.load(open('vo/takeB.words.json'))['words'] if w['type'] == 'word']
inbr, spoken = False, []
for w in words:  # drop the bracketed direction tags, which were not spoken
    if w['text'].startswith('['): inbr = True
    if not inbr: spoken.append(w)
    if w['text'].endswith(']'): inbr = False

phrases, caps, end_s = [], [], 0.0
for i, (s0, s1, gap, text) in enumerate(P):
    b = math.ceil(((end_s + gap) / SPB) / Q - 1e-6) * Q
    st = b * SPB; dur = s1 - s0 + 2 * PAD; end_s = st + dur
    plain = text.replace('*', '').replace(' / ', ' ')
    phrases.append([s0, s1, b, plain])
    nxt = P[i + 1][0] if i + 1 < len(P) else 1e9          # a word belongs to the source window it starts in
    ws = [w for w in spoken if s0 - 0.08 <= w['start'] < nxt - 0.02]
    k = 0
    for chunk in text.split(' / '):
        out = []
        for tok in chunk.split(' '):
            acc = tok.startswith('*'); tok = tok.lstrip('*')
            n = 2 if tok == '15,000' else 1
            dt = min(ws[k]['start'] - s0 + PAD, dur - 0.12); k += n
            out.append([tok, round(max(0, dt), 3), int(acc)])
        caps.append({'b': b, 'p': i, 'words': out})
    assert k == len(ws), f'phrase {i}: {k} caption words vs {len(ws)} spoken: {[w["text"] for w in ws]}'
    print(f'{i:2d} b{b:6.2f}  {st:6.2f}-{end_s:6.2f}s  {plain[:62]}')

dur = math.ceil((end_s + 1.2) * 30) / 30
print(f'voice ends {end_s:.2f}s, film {dur:.2f}s = {dur / SPB:.1f} beats, {len(caps)} caption chunks')
json.dump({'take': 'vo/takeB.mp3', 'music': 'audio/score_raw.wav', 'beats': 'beats.json', 'out': 'still_vo',
           'voice': 'Justin - Trusting Calm (NyBVtlh1XAem9yCxNuWk), eleven_v4, take B', 'phrases': phrases},
          open('vo/config.json', 'w'), indent=1)
json.dump({'bpm': BPM, 'duration': dur, 'phrases': [[p[2], round(p[1] - p[0] + 2 * PAD, 3)] for p in phrases], 'captions': caps},
          open('captions.json', 'w'))
