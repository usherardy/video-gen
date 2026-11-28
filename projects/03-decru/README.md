# DECRU — 30 s launch film

**Prompts, tools & skills:** [`PROMPTS.md`](PROMPTS.md)

`index.html` is the whole film: one self-contained file (fonts, app screens and brand photos inlined; GSAP 3.12.5 from cdnjs).
Look: white and minimal, in the decru.co brand system. The wordmark is "DECRU" in Montserrat SemiBold, -0.055em, ink #1A1614 on #FFFFFF,
with the site's 22–24 px halftone dot texture and its outlined "Download the app" pill.
Message: ad-driven feeds are noise ("Too many ads. Too little taste."), DECRU is taste ("Ranked by your taste. Never by ad spend."),
landing on "Fashion, found. Not fed."

Keep the audio files in the same folder:

| File | What | Plays at |
|---|---|---|
| `music.mp3` | ElevenLabs Music v2.5, trimmed 1.0 s so the sub drop lands at **12.0 s** | 0:00 |
| `vo.mp3` | ElevenLabs v4, voice "Victor – Documentary"; phrases pre-placed on the cuts | starts at 0:03, volume 0.8 |
| `sfx_boom.mp3` | sub-bass boom | 0:12, plus a soft one on the final beat at 0:29.5 |
| `sfx_whoosh.mp3` | digital whoosh | 0:04, 0:13, 0:15.5, 0:18 (peak lands on the cut) |
| `sfx_shimmer.mp3` | glitch shimmer | 0:24 |
| `sfx_tick.mp3` | UI tick | every type-on letter and every text pop |

Music ducks to 60% under each VO phrase. Every cue time lives in `timeline.json`, which both the film and `audio/mix.py` read.

## Watch it
Open `index.html` in Chrome and press **▶ Play** (browsers block autoplay with sound). Make the window landscape for
1920×1080, or portrait (or a phone) for the 1080×1920 Reels layout; it switches automatically.
If any audio file is missing, the film still plays, silently, with no script errors.

## Export to MP4

**Option A, exact (recommended).** Renders every frame deterministically, with no dropped frames, and muxes the mastered mix:
```bash
python3 audio/mix.py        # builds the audio files + out/mix.wav (-14 LUFS)
```
```bash
node render.mjs --fmt 16x9 --fps 60
```
```bash
node render.mjs --fmt 9x16 --fps 60
```
This writes `out/decru-16x9.mp4` and `out/decru-9x16.mp4` (H.264 yuv420p, CRF 16, AAC). It needs Node with Playwright and ffmpeg.
`index.html?render=1` exposes `window.seek(t)`, which is what the renderer drives frame by frame.

**Option B, screen recording at 1080p60.**
1. In Chrome, open `index.html` and enter full screen (F11). For Reels, use DevTools device mode at 1080×1920.
2. In OBS: Settings → Video → Base and Output **1920×1080** (or 1080×1920), FPS **60**.
   Add a *Window Capture* of Chrome and a *Desktop Audio* source.
3. Start recording, click **▶ Play**, and stop after the cut to black at 0:30. Trim the head in any editor.
On a Mac, QuickTime can do the picture, but it can't capture system audio without a loopback driver. OBS is simpler.

## Files
- `index.src.html` + `build.mjs`: the source; `node build.mjs` rebuilds `index.html`.
- `prep_assets.py`: frosts the photo areas of the app screens (no recognizable faces) and keeps the UI crisp.
- `render.mjs`: `--contact`, `--frames a,b`, `--check` (text inside the 80% safe zone), `--silent-test`.
- `audio/raw/`: every ElevenLabs take, kept so you can swap one.
