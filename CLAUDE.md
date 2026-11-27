# Motion studio rules

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t.
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode,
  no state carried between frames. Seeded noise only (mulberry32), never Math.random.
- Render with `node render.mjs`, encode H.264 yuv420p, CRF 16.

## Look
- Banned defaults: centered title on gradient, everything fading in,
  corner labels and frame borders, glow on UI chrome, generic particle bursts.
- One display face, one UI face. One accent color unless the brief says otherwise.
- Every 2 to 4 seconds something new must happen on screen.

## Sound
- Score and SFX are synthesized in code unless a track is supplied.
- No generic synth pads: prefer piano-like tones, percussion and designed hits.
- Place hits on the measured beat grid (beats.json). Loudness -14 LUFS.
- Voiceover: ElevenLabs (connector), one take of the whole script, split at pauses and placed on beats
  with `shared/vo_mix.py vo/config.json` (score ducks ~-11 dB, voice sits +8 dB, masters to -14 LUFS).

## Loop before you show me anything
1. Render one frame per beat as a contact sheet and LOOK at it.
2. Score it 1-10 on: hook in first 2s, readability at phone size,
   motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+.
4. Only then do the full render.

## Pipeline
- One folder per film under `projects/` (see the root `README.md`). Run every command from that film's folder.
- `timeline.json`: scene cuts in beats (shared by audio and picture).
- `python3 audio/synth.py`: writes the score into `audio/` and `beats.json` (measured grid).
- `python3 <path-to>/shared/vo_mix.py vo/config.json`: places the voiceover on the beat grid.
- `node render.mjs --contact` / `node render.mjs`: contact sheet / full mp4 into `out/` (git-ignored).
- Finished, watchable encodes go in the film's `videos/` (the only MP4s tracked in git).
