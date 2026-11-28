# 04 Still Building: "The boy who couldn't stop building"

**Watch:** [`videos/still-building-9x16.mp4`](videos/still-building-9x16.mp4) (67.7 s, 9:16)
**Prompts, tools & skills:** [`PROMPTS.md`](PROMPTS.md)
Run every command below from this folder.

A personal story reel. It opens at 2 AM on the one lit window in a sleeping city, goes back to an eighth-grade CRT
("C:\> new company"), jumps to grade 10 and Pexel (an anonymous feedback chat that nobody used), then to Lithuania in the snow,
where a dashed idea becomes a real object. Then comes a montage of games, websites, robots and apps (some worked, others didn't), and
Shaw Games, with the real shawgames.com mobile page and its 15,000 monthly users. After that the to-do list that never ends,
the off switch that turns itself back on, the 2:47 AM doubt, the same CRT ("still here"), and a walk toward
an unfinished tower on the horizon. The title is "The boy who couldn't stop building."

Look: night navy, one accent (the window's amber), Gelasio for words, JetBrains Mono for every number and UI.
Every spoken word rises in on its own Scribe timestamp, so the film works on mute.

## Files

| Path | What |
|---|---|
| `script.txt` | the final script (viral-video-writing skill, `score.py` 100/100) |
| `vo/takeA.mp3`, `vo/takeB.mp3` | ElevenLabs takes of the whole script; take B is used |
| `vo/takeB.words.json` | ElevenLabs Scribe word timings for take B |
| `vo/plan.py` | cuts take B at its measured pauses, places each phrase on a quarter beat, writes `vo/config.json` + `captions.json` |
| `timeline.json` | scene cuts and every picture/sound event, in beats (90 BPM) |
| `audio/synth.py` | the score: piano, a 2 AM clock, snow footsteps, designed hits; writes `audio/score_raw.wav` + `beats.json` |
| `film.js`, `index.html` | the film; `window.seek(t)` paints frame t |
| `render.mjs` | `--contact` (one frame per beat, sheets of 24), `--frames t1,t2,…`, or the full MP4 |
| `assets/shawgames-mobile.jpg` | the top of shawgames.com at 390 px wide (Playwright screenshot) |

## Rebuild

```bash
python3 vo/plan.py
```
```bash
python3 audio/synth.py
```
```bash
python3 ../../shared/vo_mix.py vo/config.json
```
```bash
node render.mjs --contact
```
```bash
node render.mjs
```
The master lands in `out/still-building-9x16.mp4` (CRF 16). The copy in `videos/` is re-encoded at CRF 22.
