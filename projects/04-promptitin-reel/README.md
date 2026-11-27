# PromptItIn reel (Instagram, 9:16)

A 40 s reel: a 20 s captioned selfie intro ("this is how the video looks like") that hard-cuts into the
[PromptItIn v1](../02-promptitin/v1) film.

## The edit

- **Source:** `src/IMG_9459.MOV`, an iPhone HDR clip (HEVC 10-bit HLG, 60 fps, 23.3 s). It isn't in git; put it there before rebuilding.
- **Cut** (`edit.json` → `shots`): six shots. Three pauses are removed with jump cuts (6.9–7.7 s, 9.9–10.8 s, 17.7–18.6 s,
  plus a short gap at 15.2 s), and the tail where the hand reaches for the stop button is trimmed. Punch-ins of 1.00/1.12/1.22,
  anchored just above the head, hide the jump cuts and give each shot its own frame. 23.3 s → 20.1 s.
- **Picture:** HLG → SDR BT.709 with zscale + Hable tone-mapping, 30 fps to match the film.
- **Voice:** high-pass, slight low-mid cut, presence lift and gentle compression, then two-pass loudnorm to −14 LUFS.
  The v1 film is already mastered at −14 LUFS, so both halves match.
- **Captions** (`captions.html`, a pure function of `seek(t)`): 2–4 word beats on the wall above the head,
  clear of the face and of the Reels header and bottom UI. Geist 800 in ink `#111827`. The active word sits on an
  accent `#7c3aed` pill that slides word to word, and the callouts (*Claude Opus 5.5*, *ElevenLabs*, *voiceover*, *crazy*)
  are set in Gelasio italic, the same pairing as the film.
- **Transcript:** `src/words.json`, from faster-whisper `large-v3` with word timestamps. The captions drop one stumble ("and ~~it~~ the videos").

## Rebuild

```bash
python3 ../02-promptitin/v1/audio/synth.py   # run from ../02-promptitin/v1, then the vo_mix + render there (see its README)
```
```bash
python3 build.py            # out/talk.mp4, out/talk.wav, data.js   (--data: captions only)
```
```bash
node render.mjs             # out/promptitin-reel-9x16.mp4 (CRF 16 master)
```
```bash
node render.mjs --contact   # out/contact.png
```

The Instagram upload copy is the master re-encoded with H.264 High 4.2 at CRF 17, maxrate 14 Mbps, 2 s GOP, and AAC 256k at 48 kHz.
