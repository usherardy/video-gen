# 04 Still Building: "The boy who couldn't stop building"

**Watch:** [`videos/still-building-v2-9x16.mp4`](videos/still-building-v2-9x16.mp4) (v2: new script, free open-source voice, 76.2 s; see [`v2/`](v2/README.md))
· [`videos/still-building-animated-9x16.mp4`](videos/still-building-animated-9x16.mp4) (Pixar-style animated cut, 67.7 s, 9:16)
· [`videos/still-building-9x16.mp4`](videos/still-building-9x16.mp4) (first version: illustrated motion graphics)
**Prompts, tools & skills:** [`PROMPTS.md`](PROMPTS.md)
Run every command below from this folder.

## The animated cut (`pixar/`)

Rebuilt to match the reference the user picked (a Pixar-style animated story reel with one-word captions and real
footage as proof). Same script, voiceover, score and word timings as the first version.

- **Character:** `pixar/character/` — the hero at 24 (`adult-B.png`) and at 13 (`boy-A.png`), Gemini 3 Pro Image, designed
  from a description of the user's photo (the photo itself could not be passed to ElevenLabs from the session).
- **25 shots:** a 9:16 keyframe each (`pixar/keyframes/`, Gemini 3.1 Flash Image with the character sheets as references),
  animated with Kling 2.5 Turbo (5 s image-to-video). All on the ElevenLabs flow "Still Building – Pixar film";
  node and generation ids in `pixar/nodes.json`. The clips (`pixar/clips/vNN.mp4`) are git-ignored; fetch them again
  from the flow by those generation ids.
- **Real footage:** `pixar/real/shaw-scroll.mp4`, a scroll down the live shawgames.com mobile page (`pixar/real/record.cjs`),
  under the 15,000 count-up.
- **Edit:** `pixar/compose.mjs` cuts each shot on the first word of a caption chunk (`captions.json`), then composites
  `pixar/overlay.html` (one-word green Montserrat Black captions, the count-up, the end title; a pure `seek(t)`) and
  `audio/still_vo.wav`.

```bash
cd pixar && node compose.mjs --frames 1,20,42,66
```
```bash
cd pixar && node compose.mjs
```
The master lands in `pixar/out/still-building-animated-9x16.mp4` (CRF 16); the copy in `videos/` is CRF 23.

## The first version (illustrated)

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
