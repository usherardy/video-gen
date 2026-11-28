# 04 Still Building: prompts

## Script
Written with the `viral-video-writing` skill from the user's own story ("The Boy Who Couldn't Stop Building"),
then corrected with their facts: Pexel (an anonymous feedback chat, built in tenth grade, no users) and
Shaw Games (shawgames.com, 15K monthly active users). Final text: [`script.txt`](script.txt), scored 100/100 by the
skill's `score.py`.

The user's prompts, in order:
1. A five-chapter draft (Chapter I "The Dream" … Chapter V "Somewhere in the Future", ending "THE BOY WHO COULDN'T STOP
   BUILDING / The story is still being written.") with the instruction *"lets try to write a personal one"*.
2. *"we build a pexela website that no one used or we failed at distributoin miserabely, in 10 grade and the site that has
   thousands of users is shawgames.com"*
3. *"pexel is the name of the site it was website for anonymus chat to give feedaback., 15k shawgames mau mention me not we"*
4. *"yes use eleven labs"*
5. *"well i NEED THE VIDEO as well, correct?"*
6. *"did you not use the skill"* → *"it does not look like that video at all"* → reference reel picked: an X post by
   Ernesto Lopez ("How I went from high school dropout to $200,000 months at 22"), a Pixar-style animated story with
   one-word captions and real footage at the end. Accent: green.
7. Budget: Kling 2.5 Turbo, ~75K ElevenLabs credits. A photo of the user as the character reference; *"ok design the
   chatecter"*; *"so where is teh video"*.

## Animated cut
- Character sheets: ElevenLabs `gemini-3-pro-image` (2 options each; adult option B and boy option A kept).
- Keyframes: `gemini-3.1-flash-image`, 9:16, wired to the character sheets; prompts are on the flow nodes (labels KF01–KF26).
- Clips: `kling-2.5-turbo`, 5 s, 9:16, start frame = keyframe, one action and one camera move each (labels V01–V26).
- Credits: about 2,750 (voiceover) + 6,100 (character sheets) + 15,600 (keyframes) + 53,000 (clips).

## Film
Built with the studio rules in the root `CLAUDE.md`: a pure `seek(t)` Canvas film, a synthesized score on a measured
90 BPM grid, the voiceover placed phrase by phrase with `shared/vo_mix.py`, and three contact-sheet review rounds
(hook, readability at phone size, motion, variety, brand accuracy, sound sync) before the full render. Fixes made in
review: numbers moved to the mono face (Gelasio's old-style figures sank below the line), a dark road under the Lithuania
captions, a push-in that zooms about the window, the Shaw Games phone cut before the comparison, and people icons
instead of dots.

Tools: ElevenLabs connector (TTS `eleven_v4`, Scribe `eleven_scribe_v1` for word timings), Playwright (renders and the
shawgames.com screenshot), ffmpeg, numpy/scipy/soundfile/librosa. Skills: `viral-video-writing` for the script.

## Voiceover
ElevenLabs TTS, model `eleven_v4`, voice **Justin – Trusting Calm** (`NyBVtlh1XAem9yCxNuWk`), 2 takes of the whole
script (`vo/takeA.mp3` 72.3 s, `vo/takeB.mp3` 68.8 s; take B is used). Prompt:

```text
[quiet, sincere, late-night reflective read, like talking to a friend at 2 AM] I'm twenty-four, it's two A.M., and I'm awake thinking about something that doesn't exist yet.

I don't know which idea will change my life. I don't know where I'll be next year.

But it all started in eighth grade, when I decided I was going to build a company.

I just wanted to make something that didn't exist before.

Two years later, I built my first real website, Pexel, an anonymous chat for giving feedback.

Nobody used it. I had no idea how to get it in front of people, and I failed miserably.

But then life took me to Lithuania, and I studied technology.

The first thing I learned there was that an idea doesn't have to stay an idea.

[a little more energy] So I kept building. Games, websites, robots, apps.

Some worked. Others didn't.

And one of them, Shaw Games, now has fifteen thousand people using it every month.

This time, people actually showed up.

[softer] But every time I finish something, another idea appears.

[a small, tired laugh] I wish my brain had an off switch.

So some nights I wonder if I'm getting closer to my dream, or just chasing a new one.

[warm, quietly determined] But the boy from eighth grade is still in there, still curious, still believing something he builds will matter.

I owe it to him to find out.

Follow along and watch me find out.
```
