# 02 — PromptItIn promo

20 s launch promos for [promptitin.com](https://promptitin.com), in 9:16, 1:1 and 16:9 from one timeline.
Every UI frame is cropped from the site's real screenshots in [`assets/`](assets) (see `assets/ASSETS.md`);
no UI is redrawn.

| Version | Idea | Watch |
|---|---|---|
| [`v1/`](v1) | "Vague prompts get vague answers": the UI assembles from tiles, three features, a 1,000-credit counter, CTA | [9:16](v1/videos/promptitin-v1-9x16.mp4) · [1:1](v1/videos/promptitin-v1-1x1.mp4) · [16:9](v1/videos/promptitin-v1-16x9.mp4) |
| [`v2/`](v2) | "Your prompt is 40% there": the hook's "40%" match-cuts into the real score meter, the enhanced prompt streams in, real sidebar navigation, a zoom through Continue, an odometer | [9:16](v2/videos/promptitin-v2-9x16.mp4) · [1:1](v2/videos/promptitin-v2-1x1.mp4) · [16:9](v2/videos/promptitin-v2-16x9.mp4) |

Both use a synthesized piano/drum score plus an ElevenLabs voiceover (voice "Erik – Confident Commercial Narration").

## Rebuild (run from `v1/` or `v2/`)
```bash
python3 audio/synth.py
```
```bash
python3 ../../../shared/vo_mix.py vo/config.json
```
```bash
node render.mjs --fmt 9x16 --contact
```
```bash
node render.mjs --fmt 9x16
```
`--fmt` is `9x16`, `1x1` or `16x9`. Output goes to `out/`.
