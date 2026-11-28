# Still Building v2: the new script, made without ElevenLabs

**Watch:** [`../videos/still-building-v2-9x16.mp4`](../videos/still-building-v2-9x16.mp4) (76.2 s, 9:16)

The user's new script (eighth grade → Lithuania → the weight of money and survival → building as a way out → keep going),
tightened with the `viral-video-writing` skill (`score.py` 90/100, no hard fails): [`script.txt`](script.txt).

Nothing here uses ElevenLabs or any paid generation:

| Step | Tool (all open-source, local) | File |
|---|---|---|
| Voice | Kokoro TTS (`kokoro-onnx`, voice `am_michael`, speed 1.0), one line at a time on CPU | `tts.py` → `vo/take.flac`, `vo/lines.json` |
| Word timings | faster-whisper `small.en` (203/203 words heard, which also checks the read) | `tts.py` → `vo/words.json` |
| Beat placement | 90 BPM quarter-beat grid, longer gaps at scene changes | `plan.py` → `vo/config.json`, `captions.json`, `timeline.json` |
| Score | synthesized piano, snow steps, heartbeat, hits; drums land on "freedom", break on "couldn't stop", the big chord on "keep going" | `audio/score.py` → `audio/score_raw.wav`, `beats.json` |
| Mix | `shared/vo_mix.py` (duck, +8 dB voice, -14 LUFS) | `audio/still_v2_vo.wav` |
| Picture | the 25 Pixar clips already made for the animated cut (`../pixar/clips`, git-ignored) + the real shawgames.com scroll, recut frame-exact on the words | `compose.mjs`, `overlay.html` |

Kokoro's model (`~/.cache/kokoro/kokoro-v1.0.onnx`, `voices-v1.0.bin`) comes from github.com/thewh1teagle/kokoro-onnx releases.

Run from this folder:
```bash
python3 tts.py am_michael 1.0
```
```bash
python3 plan.py
```
```bash
python3 audio/score.py
```
```bash
python3 ../../../shared/vo_mix.py vo/config.json
```
```bash
node compose.mjs
```
