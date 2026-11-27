# BEGIN — 15s launch film

**App:** BEGIN: Wake to Action (iOS, App Store id 6813547382), from `usherardy/begin`.
**Positioning** (begin repo `docs/05_MARKETING/01_POSITIONING.md`): the alarm that gets you out of bed *and* into the thing you got up for.
**Output:** `out/begin-9x16.mp4`, 1080x1920, 30 fps, 15.0 s, H.264 yuv420p CRF 16, AAC, -14 LUFS.

## Concept: "Monday"
Everyone pushes the start back. The film opens on the excuses, kills them, and the rest is the Promise:
wake time → mission → the first thing you got up for.

| Time | Beats | Picture | VO |
|---|---|---|---|
| 0–2 s | 0–4 | Ink frame. SNOOZE. / 5 MORE MIN. / TOMORROW. / MONDAY. slam full-bleed, each pushing the last out; the alarm time snoozes 6:30 → 6:57 | "Five more minutes..." |
| 2–3 s | 4–6 | Dead stop. A yellow strike drags through MONDAY | "Or..." |
| 3–4.5 s | 6–9 | The strike floods the frame yellow, BEGIN slams, a thumb taps; the yellow closes down onto the real **Start mission** button | "just begin." |
| 4.5–6 s | 9–12 | Real alarm screen (Gym 3:18). IT RINGS / until your mission is done. Tap on Start mission | |
| 6–8.5 s | 12–17 | Real squat mission; push-in on the rep beats; tally 1-2-3 | "Three squats to switch it off." |
| 8.5–11.5 s | 17–23 | Yellow wipe to real Focus Mode: Woke Up → Gym Shoe → Dumbbell → Mirror Selfie tick done on the beat | "Then the first thing you got up for." |
| 11.5–13 s | 23–26 | Real mission picker; squats, push-ups, math, shake, QR light one per half beat | |
| 13–15 s | 26–30 | App icon, BEGIN, Wake to action., Free on the App Store | "Begin. Wake to action." |

## Rules followed
- Every UI pixel is from the App Store screenshots (`assets/shot1/2/3/7.png`); only taps, done-ticks and selection rings are drawn over real elements.
- Claims only from the live listing / positioning safe list: real alarm, rings again until the mission is done, squats counted on the phone, Focus Mode checkpoints, free download. No reliability claims, stats, streaks or Friend Rescue.
- Brand: ink `#050506`, text `#FFF9F4`, one accent `#FFD60A` (begin `src/features/home/homeTheme.ts`). Display face Anton, UI face Geist.

## Build
```bash
python3 begin/synth.py                      # audio/begin_score.wav + audio/begin_hits.wav + begin/beats.json
python3 audio/vo_mix.py audio/vo/begin.json # audio/begin.wav (VO placed on beats, score ducked, -14 LUFS)
node begin/render.mjs --contact             # out/begin_contact-9x16.png
node begin/render.mjs                       # out/begin-9x16.mp4
```
VO: ElevenLabs eleven_v4, voice Erik - Confident Commercial Narration, one take (`audio/vo/begin_takeA.mp3`).
