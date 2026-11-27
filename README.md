# video-gen

Code-driven motion graphics. Every film is an HTML page whose frames are a pure function of time
(`window.seek(t)`), rendered deterministically to MP4 with Playwright + ffmpeg. House rules for every
project are in [`CLAUDE.md`](CLAUDE.md).

## Projects

| # | Project | Length | Formats | Watch |
|---|---|---|---|---|
| 01 | [**Showreel**](projects/01-showreel): "I make pixels move", a motion-design résumé reel | 15 s | 16:9 | [showreel.mp4](projects/01-showreel/videos/showreel.mp4) |
| 02 | [**PromptItIn v1**](projects/02-promptitin/v1): "Vague prompts get vague answers" | 20 s | 9:16 · 1:1 · 16:9 | [9:16](projects/02-promptitin/v1/videos/promptitin-v1-9x16.mp4) · [1:1](projects/02-promptitin/v1/videos/promptitin-v1-1x1.mp4) · [16:9](projects/02-promptitin/v1/videos/promptitin-v1-16x9.mp4) |
| 02 | [**PromptItIn v2**](projects/02-promptitin/v2): "Your prompt is 40% there" | 20 s | 9:16 · 1:1 · 16:9 | [9:16](projects/02-promptitin/v2/videos/promptitin-v2-9x16.mp4) · [1:1](projects/02-promptitin/v2/videos/promptitin-v2-1x1.mp4) · [16:9](projects/02-promptitin/v2/videos/promptitin-v2-16x9.mp4) |
| 03 | [**DECRU launch film**](projects/03-decru): white, minimal, "Fashion, found. Not fed." | 30 s | 16:9 · 9:16 | [16:9](projects/03-decru/videos/decru-16x9.mp4) · [9:16](projects/03-decru/videos/decru-9x16.mp4) |

The `videos/` copies are light H.264 encodes, with voiceover, for watching and sharing. Full-quality CRF 16 masters
are regenerated into each project's `out/`, which is git-ignored.

## Layout

```
video-gen/
├── CLAUDE.md            studio rules (render contract, look, sound, review loop)
├── package.json         shared Node deps: Playwright + webfonts
├── shared/
│   └── vo_mix.py        places an ElevenLabs voiceover on a film's beat grid, ducks the score, masters to -14 LUFS
└── projects/
    ├── 01-showreel/
    ├── 02-promptitin/
    │   ├── assets/      real screenshots, logo and fonts from promptitin.com (shared by v1 and v2)
    │   ├── v1/
    │   └── v2/
    └── 03-decru/
```

Each film folder follows the same shape:

| Path | What |
|---|---|
| `index.html` (+ `film.js`) | the film; `window.seek(t)` paints frame t |
| `timeline.json` | scene cuts and events, read by both picture and sound |
| `audio/synth.py` | synthesizes the score and measures its beat grid into `beats.json` (01, 02) |
| `vo/` | ElevenLabs voiceover takes + `config.json` for `shared/vo_mix.py` |
| `render.mjs` | contact sheet, spot frames, or the full MP4 into `out/` |
| `videos/` | the finished, watchable MP4s |
| `README.md` | what the film is and how to rebuild it |

## Setup

```bash
npm install
```
```bash
pip install numpy scipy soundfile librosa
```
ffmpeg and a Playwright Chromium are also required.
