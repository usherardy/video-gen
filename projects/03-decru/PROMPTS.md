# 03 DECRU: prompts, tools & skills

The main prompt and the revision prompt are quoted verbatim. An arrow notes what each led to.

## The brief

```text
You are a senior motion designer. Build a 30-second launch video for DECRU (decru.co, Instagram @decru.ai) as a single self-contained HTML file using GSAP animations, rendered at 1920x1080 (also make it work at 1080x1920 for Instagram Reels by switching layout when the viewport is portrait). It should feel like a premium tech launch film, like Apple, Linear or Vercel.

FIRST: If you can browse, check decru.co and instagram.com/decru.ai and replace my assumed copy, colors and logo below with the real ones. If you can't, use mine.

BRAND (assumed):
- Product: Decru is an AI crew: a team of AI agents that runs your business workflows for you, around the clock.
- Tagline: "Your AI crew. Always on."
- Pain points: "Too many tools." / "Too little time."
- Features: "Agents that work 24/7" / "Plugs into your stack" / "Ship 10x faster"
- Colors: background #07070B (near-black), primary #7C5CFF (electric violet), accent #22D3EE (cyan), text #FFFFFF, muted #8A8FA3
- Font: "Inter Tight" or "Space Grotesk" from Google Fonts, bold, tight letter-spacing, big kinetic type
- Logo: wordmark "DECRU" in heavy geometric sans with a small glowing violet dot after it

SHOT LIST (cut exactly on these timestamps):
0:00–0:03: Black. A single violet point of light pulses twice, then spreads into a fine particle grid. Text types in letter by letter: "Something new is coming."
0:03–0:07: Fast push forward through layered glowing glass panels and thin data lines (violet/cyan). Hard text cuts on the beat: "Too many tools." → "Too little time."
0:07–0:12: Everything gets sucked into one glowing orb, which compresses and flashes white. At 0:12 exactly, a bass hit and huge type slams in: "Meet Decru."
0:12–0:20: Product reveal: 3 frosted-glass UI cards (mock agent dashboards with avatars, progress bars and "Task complete ✓" chips) float and rotate in 3D perspective with soft glow and depth. Feature callouts slide in one per ~2.5s with line icons: "Agents that work 24/7", "Plugs into your stack", "Ship 10x faster".
0:20–0:26: Energy builds: cards, lines and particles fly together and lock into the DECRU wordmark, with a light sweep across it and a subtle glitch-shimmer at 0:24.
0:26–0:30: Logo holds center. Tagline fades in below: "Your AI crew. Always on." Then "decru.co" in cyan. Final beat at 0:29.5, cut to black at 0:30.

MOTION RULES: power3/expo easing, motion blur feel on fast moves (scale + opacity + blur filter), parallax depth layers, subtle film grain overlay, volumetric glow (CSS radial gradients + blur). Slow and moody before 0:12, punchy and fast after. Keep all text inside the center 80% safe zone. No stock photos, no faces.

AUDIO (made with ElevenLabs, to be dropped in as music.mp3, sfx_*.mp3 and vo.mp3 in the same folder):
1. Music (ElevenLabs Music, 30s): "30-second cinematic tech product launch track. 0–7s dark ambient synth pad with low heartbeat pulse and rising tension; riser into a massive sub-bass drop at 12s; 12–26s driving modern electronic beat at 120 BPM, punchy drums, bright arpeggiated synths, confident and futuristic; 26–30s final big impact then short reverb tail to silence. No vocals."
2. SFX (ElevenLabs Sound Effects):
   - sfx_boom.mp3 at 0:12: "deep cinematic sub-bass boom impact with long tail"
   - sfx_whoosh.mp3 at 0:04, 0:13, 0:15.5, 0:18: "fast futuristic digital whoosh swipe"
   - sfx_shimmer.mp3 at 0:24: "soft glitchy digital shimmer, logo reveal sparkle"
   - sfx_tick.mp3 on every text pop: "subtle clean minimal UI click tick"
3. Voiceover (ElevenLabs TTS, deep, calm, confident male or female voice, slow pace, vo.mp3):
   "Too many tools. Too little time. ... Meet Decru. Your AI crew — working around the clock, plugged into your stack, so you ship ten times faster. Decru. Always on. Now live at decru.co."

AUDIO WIRING: Add a "▶ Play" start overlay (browsers block autoplay with sound). On click, start the GSAP master timeline and music.mp3 together. Fire the SFX at the timestamps above from the same timeline, start vo.mp3 at 0:03 at about 80% volume, and duck the music to 60% while the VO plays. If audio files are missing, the animation must still play silently with no errors.

DELIVERABLE: One index.html (inline CSS/JS, GSAP from cdnjs), plus a short note on how to screen-record or export it to MP4 at 1080p/60fps.
```
→ Checking decru.co showed the brief's premise was wrong: DECRU is an **AI-powered independent-fashion discovery app**
("Fashion, found. Not fed."), not an AI crew. Instagram was login-walled.

## Choices made

Asked which film to build, and where the brand assets should come from. The answers:
- **"Real DECRU (fashion)"**: keep the shot list, timings, motion and audio plan; use the real product, copy, colors and logo.
- **"Yes, DeCru-web"**: attach `usherardy/DeCru-web` read-only for logos and screens.

→ First cut: a dark film using the site's burgundy and The Seasons serif, with the real app screens frosted so no faces show.

## Revision prompt

```text
can we make the video a bit clean and it should give a message, and make the background white and minimal.  And the logo is incorrect. This is how the logo is.
```
(with a screenshot of the decru.co hero: a big black "DECRU" in a geometric sans, a halftone dot patch, a terracotta photo card behind the "U", and a "DOWNLOAD THE APP" pill)

→ Rebuilt white and minimal in the real brand system, read from the site's CSS:
- **Logo:** "DECRU" in Montserrat SemiBold, -0.055em tracking, ink `#1A1614` on `#FFFFFF`.
- **Texture:** the site's halftone dot grid.
- **Lockup:** the site hero rebuilt, with the wordmark over independent-brand photos cropped so no faces show.
- **Message:** "Too many ads. / Too little taste." → MEET DECRU → three app features → "Ranked by your taste. Never by ad spend."
  → "Fashion, found. Not fed." · Download the app · decru.co.

The first version's ornate wordmark came from the wrong file in the repo, which the screenshot corrected.

## Generation prompts (ElevenLabs connector, one flow)

**Music:** Music v2.5 (`eleven_music_v2_5`), `duration_seconds: 30`, `instrumental: true`. 4 takes; **take 2** used,
trimmed 1.0 s so its drop lands at exactly 12.0 s.
```text
Instrumental cinematic launch score, elegant and fashion-forward. 0 to 7 seconds: dark ambient synth pad with a low heartbeat pulse and slowly rising tension. 7 to 12 seconds: a building riser into a massive sub-bass drop exactly at 12 seconds. 12 to 26 seconds: driving modern electronic beat at 120 BPM, punchy drums, bright arpeggiated synths and warm plucked keys, confident and stylish. 26 to 30 seconds: one final big impact, then a short reverb tail to silence. No vocals.
```

**Sound effects:** Sound Effects v3 (`eleven_text_to_sound_v3`), 4 takes each:

| File | Prompt | Duration | Influence | Take used |
|---|---|---|---|---|
| `sfx_boom.mp3` | deep cinematic sub-bass boom impact with long tail | 4 s | 0.5 | 2 |
| `sfx_whoosh.mp3` | fast futuristic digital whoosh swipe | 1 s | 0.5 | 3 |
| `sfx_shimmer.mp3` | soft glitchy digital shimmer, logo reveal sparkle | 2 s | 0.5 | 3 |
| `sfx_tick.mp3` | subtle clean minimal UI click tick | 0.5 s | 0.6 | 2 |

**Voiceover:** TTS `eleven_v4`, voice **Victor – Documentary Voice** (`Nqq3Kr2AiGtk9G8OYzDp`). 2 takes; take A used, split
at its pauses and placed on the cuts (`timeline.json` → `vo.phrases`).
```text
[deep, calm, confident, slow pace] Too many ads.

Too little taste.

Meet Decru.

Brands from every city.

Seen it? Search it.

Your private mall.

Fashion intelligence, built around you.

Decru.

Fashion, found. Not fed.

Now at decru dot co.
```
All raw takes are kept in `audio/raw/`.

## Tools & skills used

- **GSAP 3.12.5** (cdnjs): one paused master timeline; `?render=1` exposes `window.seek(t)` for frame-exact export
- HTML Canvas 2D: halftone dots, the "Sponsored" feed, grain (seeded, pure function of t)
- Brand sources: decru.co (copy, CSS colors, fonts, app mockups, hero photos via curl) and `usherardy/DeCru-web` (read-only)
- Pillow: `prep_assets.py` frosts the photo areas of the app screens and keeps the UI crisp; hero photos cropped so no faces show
- Font: Montserrat (the site's own). The first cut also used The Seasons, which was later dropped.
- ElevenLabs connector: Music v2.5, Sound Effects v3, TTS v4, all priced with `estimate_only` before generating
- librosa: found each music take's drop and beat grid; ffmpeg `silencedetect` split the VO takes
- `audio/mix.py`: builds the browser audio files and an offline mix that mirrors the in-browser wiring (VO 0.8, music ducked to 0.6), mastered to -14 LUFS
- `render.mjs`: Playwright 60 fps export, `--contact`, `--check` (text inside the 80% safe zone), `--silent-test` (plays with no audio files and no errors)
- Model: Claude Opus 5.5
- Skills: none (the installed `remotion-motion-graphics` skill was not used)
