# 01 Showreel: prompts, tools & skills

User prompts are quoted verbatim (typos included). An arrow notes what each one led to.

## The brief

```text
ok lets do it: make a dynamic 15-second motion graphics video that shows what an 
incredible motion designer you are, like it's your showreel for a résumé. 
go all out.
```
→ Six shots, each a different technique: kinetic type with masked reveals, a dot grid through a text mask, a hand-projected
3D torus, three kinds of type physics, a live bezier curve editor, and a ring counting the film's own 15 s. The cuts sit on a
120 bpm grid. Two contact-sheet passes fixed a text-mask bug, a layout overlap and the hook.

## Follow-ups

```text
what is the idea for this
```
→ Explained the concept: a résumé reel where every shot proves one skill, and "every frame is a function of time" is literally true.

```text
lets add audio toit then ?
lets add audio to ut]
```
→ Asked what audio; the answer was **"Voiceover on v1 / showreel"**. Added an ElevenLabs voiceover, placed on the beat grid.

## Generation prompts

**Score:** synthesized in code, no prompt: `audio/synth.py` (piano-like tones, drums, designed hits; 120 bpm; -14 LUFS).

**Voiceover:** ElevenLabs TTS, model `eleven_v4`, voice **Victor – Documentary Voice** (`Nqq3Kr2AiGtk9G8OYzDp`), 2 takes, take A used:
```text
[calm, assured, a little wry] I make pixels move.

Timing.

Depth, from pure math.

Ease.

Weight.

Sound.

Every curve, chosen.

Motion design. By Claude.
```
Phrase placement is in `vo/config.json`. "Ease. / Weight. / Sound." each land on their own type shot.

## Tools & skills used

- HTML Canvas 2D, driven by `window.seek(t)` (`index.html` + `film.js`)
- Fonts: Anton (display) + JetBrains Mono (UI), via @fontsource
- Python (numpy, scipy, soundfile) score synthesis; librosa beat-grid measurement (`beats.json`)
- Playwright headless Chromium → ffmpeg (H.264 yuv420p, CRF 16), `render.mjs`
- ElevenLabs connector (TTS v4) + `shared/vo_mix.py` (ducking, voice +8 dB, -14 LUFS)
- Model: Claude Sonnet 5.5 built the film; Opus 5.5 added the voiceover
- Skills: none (the installed `remotion-motion-graphics` skill was not used)
