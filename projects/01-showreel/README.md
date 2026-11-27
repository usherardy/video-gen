# 01 — Showreel

A 15 s motion-design "résumé" reel. Each shot is a different technique: kinetic type with masked reveals, a
dot grid seen through a text mask, a hand-projected 3D torus, three kinds of type physics, a live bezier
curve editor, and a closing ring that counts the film's own 15 seconds. 120 bpm; the cuts follow the measured beat grid.

**Watch:** [`videos/showreel.mp4`](videos/showreel.mp4) (with voiceover: ElevenLabs, voice "Victor – Documentary")

## Rebuild (run from this folder)
```bash
python3 audio/synth.py
```
Writes the score (`audio/score_raw.wav`) and the measured grid (`beats.json`).
```bash
python3 ../../shared/vo_mix.py vo/config.json
```
Places the voiceover on the beats; writes `audio/score_vo.wav` at -14 LUFS.
```bash
node render.mjs --contact
```
```bash
node render.mjs
```
Writes `out/contact.png`, then `out/showreel.mp4` (it uses `audio/score_vo.wav` when present).
