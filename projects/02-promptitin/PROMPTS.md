# 02 PromptItIn: prompts, tools & skills

User prompts are quoted verbatim (typos included). An arrow notes what each one led to.

## v1: the brief

```text
Make a dynamic 20-second motion graphics video for [promptitin] (promptitin.com), with the energy
of a motion designer's showreel. Go all out.

Assets
- Visit the site. Use real screenshots (Playwright), the real logo, real colors and fonts.
  Save everything to ./assets and list what you found before you animate.
- Never redraw the product UI from imagination. Crop and animate the real thing.

Story (one beat each, 2 to 4 seconds)
1. Hook: the problem in 5 words of huge kinetic type.
2. The product appears, the UI assembles itself piece by piece.
3. Three features, each as a UI moment with a cursor doing a real action.
4. One number that proves it works: [1000].
5. Logo lockup + [login to get better proimpts].

Sound
- Original music, 120 BPM, synthesized in code. UI clicks and whooshes on the beat.

Format: 1080x1920 (9:16) first, then 1:1 and 16:9 from the same timeline.
Before the full render, show me a contact sheet of one frame per beat.
```
→ promptitin.com was blocked by the network policy, so a `video-gen` cloud environment was created to allow it. Real assets were
captured and listed in `assets/ASSETS.md`. The app pages crashed in headless Chromium, so every UI frame is cropped from the
site's own marketing screenshots. `[1000]` = "1,000 credits / month" (Starter plan); the CTA was written as
"Log in to get better prompts." The 9:16 contact sheet was shown before the full render.
Hook: "VAGUE PROMPTS GET VAGUE ANSWERS."

## v2: rebuilt from scratch

```text
lets rey again with  opus from scratch
```
→ Same brief and real assets, new concept: **"YOUR PROMPT IS 40% THERE."** The giant "40%" match-cuts into the real score
meter; the enhanced prompt streams in line by line; real sidebar navigation into Generate; a zoom-through on Continue into a
1,000 odometer; a new D-minor score with every UI event on the beat grid.

## Audio (voiceover)

```text
how can we add audio layer to this, should i connect eleven labs
```
```text
the eleven labs should be connected right?
```
```text
it should be connected now
```
→ Added an ElevenLabs voiceover to v2, placed phrase by phrase on the beats where each caption appears.

```text
lets add audio to ut]
```
→ The answer to "what audio?" was **"Voiceover on v1 / showreel"**, so v1 got its own voiceover the same way.

## Generation prompts

**Scores:** synthesized in code, no prompt: `v1/audio/synth.py` (A minor piano, drums, UI pops and clicks) and
`v2/audio/synth.py` (D minor staccato piano ostinato; every UI event from `timeline.json`).

**Voiceover:** ElevenLabs TTS, model `eleven_v4`, voice **Erik – Confident Commercial Narration** (`zQHE5F85wua2ysECgQ4l`), 2 takes each, take A used.

v1:
```text
[confident, punchy commercial read] Vague prompts get vague answers.

Meet Prompt It In.

Rough idea in. Structured prompt out.

Paste any prompt. Get it polished.

Save once. Reuse anywhere.

A thousand credits, every month.

Prompt It In.

Log in, and get better prompts.
```
v2:
```text
[confident, punchy commercial read] Your prompt is forty percent there.

Paste it in. See your score.

One click. Polished.

Save it once. Reuse it anywhere.

Or start from a rough idea.

A thousand credits, every month.

Prompt It In. Log in, and get better prompts.
```
Phrase placement is in `v1/vo/config.json` and `v2/vo/config.json`.

## Tools & skills used

- curl + Playwright to capture promptitin.com: screenshots (launch modal removed), logo, CSS colors, Geist fonts → `assets/`
- Pillow: crop-coordinate check sheets, cover colors sampled from the real screenshots
- HTML Canvas 2D with `window.seek(t)`, one timeline rendered at 9:16, 1:1 and 16:9 (`render.mjs --fmt`)
- Fonts: Geist + Geist Mono (the site's own); Gelasio (@fontsource) as a stand-in for the site's Georgia italic
- Python score synthesis + librosa beat grid; ffmpeg two-pass loudnorm (-14 LUFS)
- ElevenLabs connector (TTS v4) + `shared/vo_mix.py`
- Cloud environment `video-gen` (allows promptitin.com)
- Models: Claude Sonnet 5.5 built v1; Opus 5.5 built v2 and both voiceovers
- Skills: none (the installed `remotion-motion-graphics` skill was not used)
