# video-gen

Code-driven motion graphics, made with Claude Code. Every film is an HTML page whose frames are a pure function of
time (`window.seek(t)`), rendered deterministically to MP4 with Playwright + ffmpeg, then scored and voiced on a
measured beat grid. The house rules for every project are in [`CLAUDE.md`](CLAUDE.md).

## Projects

| # | Project | Length | Formats | Watch | Prompts |
|---|---|---|---|---|---|
| 01 | [**Showreel**](projects/01-showreel): "I make pixels move", a motion-design résumé reel | 15 s | 16:9 | [showreel.mp4](projects/01-showreel/videos/showreel.mp4) | [prompts](projects/01-showreel/PROMPTS.md) |
| 02 | [**PromptItIn v1**](projects/02-promptitin/v1): "Vague prompts get vague answers" | 20 s | 9:16 · 1:1 · 16:9 | [9:16](projects/02-promptitin/v1/videos/promptitin-v1-9x16.mp4) · [1:1](projects/02-promptitin/v1/videos/promptitin-v1-1x1.mp4) · [16:9](projects/02-promptitin/v1/videos/promptitin-v1-16x9.mp4) | [prompts](projects/02-promptitin/PROMPTS.md#the-brief-v1-and-v2) |
| 02 | [**PromptItIn v2**](projects/02-promptitin/v2): "Your prompt is 40% there" | 20 s | 9:16 · 1:1 · 16:9 | [9:16](projects/02-promptitin/v2/videos/promptitin-v2-9x16.mp4) · [1:1](projects/02-promptitin/v2/videos/promptitin-v2-1x1.mp4) · [16:9](projects/02-promptitin/v2/videos/promptitin-v2-16x9.mp4) | [prompts](projects/02-promptitin/PROMPTS.md#v2-rebuilt-from-scratch) |
| 03 | [**DECRU launch film**](projects/03-decru): white, minimal, "Fashion, found. Not fed." | 30 s | 16:9 · 9:16 | [16:9](projects/03-decru/videos/decru-16x9.mp4) · [9:16](projects/03-decru/videos/decru-9x16.mp4) | [prompts](projects/03-decru/PROMPTS.md) |
| 04 | [**Still Building**](projects/04-still-building): a personal story reel, "The boy who couldn't stop building" | 68 s | 9:16 | [v2](projects/04-still-building/videos/still-building-v2-9x16.mp4) · [animated](projects/04-still-building/videos/still-building-animated-9x16.mp4) · [illustrated](projects/04-still-building/videos/still-building-9x16.mp4) | [prompts](projects/04-still-building/PROMPTS.md) |

The `videos/` copies are light H.264 encodes, with voiceover, for watching and sharing. Full-quality CRF 16 masters
are regenerated into each project's `out/`, which is git-ignored.

## How each film was made

**01 Showreel.** Prompt: *"make a dynamic 15-second motion graphics video that shows what an incredible motion designer
you are, like it's your showreel for a résumé. go all out."*
Six shots, each a different technique (masked kinetic type, a dot grid through a text mask, a hand-projected 3D torus,
type physics, a live bezier editor, a self-counting ring) on a 120 bpm grid. The score is synthesized in Python;
the voiceover is ElevenLabs ("Victor").

**02 PromptItIn v1.** Prompt: a 20 s brief for promptitin.com: *"Use real screenshots… Never redraw the product UI from
imagination"*, a 5-beat story, 120 BPM music synthesized in code, and 9:16 / 1:1 / 16:9 from one timeline. Every UI frame
is cropped from the site's real screenshots; the UI assembles from tiles, three features get cursor clicks, then a
1,000-credit counter and the CTA. The voiceover is ElevenLabs ("Erik").

**02 PromptItIn v2.** Prompt: the same brief as v1, rebuilt from scratch with Claude Opus 5.5. New concept: "YOUR PROMPT IS 40% THERE"
match-cuts into the real score meter, the enhanced prompt streams in line by line, then real sidebar navigation, a
zoom-through on Continue, and an odometer. A new score with every UI event on the beat; ElevenLabs voiceover.

**03 DECRU.** Prompt: a full 30 s GSAP launch-film brief (shot list, motion rules, ElevenLabs music, SFX and VO, audio
wiring, single `index.html`). Checking decru.co showed it's a fashion-discovery app, so the film uses the real product.
A revision asked for *"clean… give a message… background white and minimal… the logo is incorrect."* The result: the
real Montserrat SemiBold wordmark, the site's halftone texture and hero lockup, and the message
"Too many ads. Too little taste." → MEET DECRU → "Ranked by your taste. Never by ad spend." → "Fashion, found. Not fed."

Every prompt, verbatim, is in each project's `PROMPTS.md`. The studio setup prompts and four prompt patterns not yet
produced are in the root [`PROMPTS.md`](PROMPTS.md).

## Tools & skills

| Tool | Used for | Films |
|---|---|---|
| Claude Code (cloud session) | writing, rendering and reviewing everything | all |
| HTML Canvas 2D | the films' graphics, drawn as a pure function of t | 01, 02, 03 |
| GSAP 3.12.5 (cdnjs) | the master timeline and DOM animation | 03 |
| Playwright + headless Chromium | frame-exact capture via `window.seek(t)`; site screenshots | all |
| ffmpeg / ffprobe | H.264 encode, two-pass loudnorm to -14 LUFS, `ebur128` checks, `silencedetect` | all |
| Python: numpy, scipy, soundfile | synthesized scores and the mixes | 01, 02, 03 |
| librosa | measuring each score's beat grid and the music drop | all |
| Pillow | screenshot crop checks; frosting app-screen photos and cropping brand photos so no faces show | 02, 03 |
| ElevenLabs connector | voiceovers (TTS v4); music (v2.5) and sound effects (v3) | all; music + SFX for 03 |
| [`shared/vo_mix.py`](shared/vo_mix.py) | places a voiceover on the beat grid, ducks the score, masters to -14 LUFS | 01, 02 |
| Brand sources | promptitin.com and decru.co (real assets, colors, fonts); `usherardy/DeCru-web` (read-only) | 02, 03 |
| Fonts | Anton + JetBrains Mono (01); Geist + Geist Mono + Gelasio (02); Montserrat (03) | |

**Models:** Claude Sonnet 5.5 built the Showreel and PromptItIn v1. Claude Opus 5.5 built PromptItIn v2, every
voiceover, and DECRU.
**Skills:** the `remotion-motion-graphics` skill was installed but not used; the studio rules chose a plain-HTML
`seek(t)` pipeline instead. No other skills or plugins were used.

## Repo layout

```
video-gen/
├── README.md            this overview
├── PROMPTS.md           studio setup prompts, unproduced prompt patterns, tools & skills
├── CLAUDE.md            studio rules (render contract, look, sound, review loop, pipeline)
├── package.json         shared Node deps: Playwright + webfonts
├── shared/
│   └── vo_mix.py        voiceover placement + ducking + mastering
└── projects/
    ├── 01-showreel/
    ├── 02-promptitin/
    │   ├── assets/      real screenshots, logo and fonts from promptitin.com (shared by v1 and v2)
    │   ├── v1/
    │   └── v2/
    └── 03-decru/
```

Each film folder has the same shape:

| Path | What |
|---|---|
| `index.html` (+ `film.js`) | the film; `window.seek(t)` paints frame t (DECRU: `index.src.html` → `build.mjs` → `index.html`) |
| `timeline.json` | scene cuts and events, read by both picture and sound |
| `audio/` | the score: `synth.py` (01, 02) or `mix.py` with the ElevenLabs takes in `raw/` (03) |
| `vo/` | voiceover takes + `config.json` for `shared/vo_mix.py` (01, 02) |
| `render.mjs` | contact sheet, spot frames, or the full MP4 into `out/` |
| `videos/` | the finished, watchable MP4s (the only MP4s in git) |
| `README.md` | what the film is and how to rebuild it |
| `PROMPTS.md` | every prompt behind the film, the generation prompts, and the tools and skills used |

## Setup

```bash
npm install
```
```bash
pip install numpy scipy soundfile librosa pillow
```
ffmpeg and a Playwright Chromium are also required.

## Rebuild a film

Run from the film's folder (e.g. `projects/01-showreel`):
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
PromptItIn takes `--fmt 9x16|1x1|16x9` and its mixer path is `../../../shared/vo_mix.py`. DECRU has its own steps
in [its README](projects/03-decru/README.md).
