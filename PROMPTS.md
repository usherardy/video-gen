# Prompts, tools & skills

Every film's own prompts live next to it:

| Project | Prompts |
|---|---|
| 01 Showreel | [projects/01-showreel/PROMPTS.md](projects/01-showreel/PROMPTS.md) |
| 02 PromptItIn v1 + v2 | [projects/02-promptitin/PROMPTS.md](projects/02-promptitin/PROMPTS.md) |
| 03 DECRU | [projects/03-decru/PROMPTS.md](projects/03-decru/PROMPTS.md) |

This file holds the prompts that set up the studio itself. User prompts are quoted verbatim (typos included).

## 1. Install a skill

```text
https://github.com/haidrrrry/claude-remotion-skill install
```
→ Installed the `remotion-motion-graphics` skill into `~/.claude/skills/` (session-only; see "Skills" below).

## 2. Studio rules (became `CLAUDE.md`)

```text
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
- Place hits on the measured beat grid (beats.json). Loudness -14 LUFS.

## Loop before you show me anything
1. Render one frame per beat as a contact sheet and LOOK at it.
2. Score it 1-10 on: hook in first 2s, readability at phone size,
   motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+.
4. Only then do the full render.
```

## 3. Runtime setup

```text
# 1. Runtime: Node 22+, ffmpeg, Python for audio analysis
brew install node ffmpeg python          # macOS; apt install on Linux
pip install numpy librosa soundfile

# 2. A clean project and a headless browser
mkdir motion-studio && cd motion-studio && npm init -y
npm i -D playwright && npx playwright install chromium

# 3. Framework skills (optional, route B)
npx skills add remotion-dev/skills       # /remotion-create, /remotion-render ...
npx skills add heygen-com/hyperframes    # /hyperframes router + GSAP skills

# 4. Hand-drawn look (optional): Node canvas rigs, pens, synthesized sound
claude plugin marketplace add buildwithhanif/claude-animation-skill
claude plugin install claude-animation@claude-animation-skill

# 5. Start Claude Code on Opus 5.5 at high effort
claude --model claude-opus-5-5
> /model   # pick Opus 5.5, then set effort to xhigh for one-shots, max for flagship pieces
```
→ Steps 1–2 were done in the cloud container (the pre-installed Playwright Chromium was reused). Steps 3–4 were optional and
not installed. Step 5 applies to a local machine.

## 4. The repo

```text
lets do the github thingy
```
```text
usherardy and creeate a repo video-make
```
```text
https://github.com/usherardy/video-gen
```
```text
put all the videos in differnet folders and seperate the projects by folders so it is easily readable and structure the repo
```
```text
mention all the prompts we gave fro each video,
```
```text
and tools or  skills we used
```

## 5. Prompt patterns shared, not produced yet

```text
# Longer, with a sound bar (pattern from @kloss_xyz's 90-second piano reel)
make a dynamic 16:9, 60-second motion graphics showreel that shows your real creative limits.
S-tier sound design, no generic synth pads. Compose an original piano score and sync every
cut to it. Export 1080p MP4.

# Anti-slop guardrail (pattern from @1littlecoder)
make a dynamic 10-second motion graphics video that introduces who you are as Opus 5.5.
Avoid frames and text in the corners, the usual giveaways of AI-made video.

# Story instead of techniques (pattern from @sonnylazuardi)
use your showreel energy, but tell a story: the history of [TOPIC] from [START] to today,
surprise me with the storyboard. 45 seconds, vertical 9:16.

# Agency persona
make a 30-second showreel as if you were a niche branding studio for startup founders.
Create every graphic from scratch. One accent color. Every shot is a different technique.
```
→ Two of these rules were adopted studio-wide: no generic synth pads (added to `CLAUDE.md`), and no text in the corners (already a rule).

## Tools & skills used across the studio

| Tool | Used for |
|---|---|
| Claude Code (cloud session) | everything. Sonnet 5.5 built the Showreel and PromptItIn v1; after `/model claude-opus-5-5`, Opus 5.5 built PromptItIn v2, the voiceovers and DECRU |
| Node 22 + Playwright (headless Chromium) | deterministic frame capture through `window.seek(t)`; site screenshots |
| ffmpeg / ffprobe | H.264 encode, `loudnorm` (two-pass, -14 LUFS), `ebur128` checks, `silencedetect` to split voiceover takes |
| Python: numpy, scipy, soundfile, librosa, Pillow | synthesized scores, beat-grid measurement, mixing, image crops and frosting |
| ElevenLabs connector (MCP) | voiceovers for all films; music + sound effects for DECRU |
| git + GitHub | this repo; `usherardy/DeCru-web` attached read-only for DECRU brand assets |
| Cloud environment `video-gen` | personal environment created so the session could reach promptitin.com |

**Skills:** the `remotion-motion-graphics` skill (from `haidrrrry/claude-remotion-skill`) was installed but **not used** for
any film. The studio rules above chose a plain-HTML `seek(t)` pipeline instead of Remotion. No other skills or plugins were used.
