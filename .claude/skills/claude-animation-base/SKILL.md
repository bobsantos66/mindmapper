---
name: claude-animation-base
description: Make a hand-painted 2D cartoon video (MP4) drawn entirely in code with p5.js and p5.brush, using the ClaudeAnimationBase starter kit (JohnHeibel/ClaudeAnimationBase, MIT): storyboard first, shot by shot, brush-stroke look, boiling linework, brush-wipe transitions, contact sheets to check the work. Use when the user asks for a hand-painted / watercolour / brush-drawn cartoon, a character animation drawn in code, or names ClaudeAnimationBase.
---

# ClaudeAnimationBase (hand-painted 2D cartoons in p5.js)

The kit lives in `kit/` next to this file (`<skill dir>/kit`). Never edit it in place: each video is its own copy.

1. **Make the project.** Copy the kit into a new folder in the user's working directory and install it:
   `cp -r "<skill dir>/kit" <name> && cd <name> && npm install`
2. **Read `<name>/ANIMATION_GUIDE.md` in full** and follow it: the rules (handmade, alive, one piece, no text,
   transitions always, something happens in every scene), the workflow (storyboard before code, build shot by shot,
   contact sheets) and the API (`src/core.js`, `src/timeline.js`, `src/clawd.js`).
3. **Write the video** in `src/scenes/` (the demo in `src/scenes/demo.js` is an example) and set length and tempo in
   `src/config.js`.
4. **Check, then render.** Contact sheet first: `node render.mjs --soft-gl --sheet=1,4,8 --out=out/check/a.jpg`,
   then the film: `node render.mjs --soft-gl --clip --out=out/video.mp4`. In this cloud environment there is no
   GPU, so keep `--soft-gl`: measured 8-15 s per frame on the demo, i.e. roughly 40-80 minutes for 10 s at 30 fps.
   Tell the user the estimate before a full render, run it in the background, and use fewer p5.brush watercolour
   fills to speed it up. `render.mjs` uses `/usr/bin/google-chrome`; otherwise pass `--chrome=<path>`.
   Tell the user where `out/video.mp4` is.

**Character rights.** The kit's built-in character is Clawd, Anthropic's mascot: its design and name are Anthropic's
and are not covered by the kit's MIT licence. For anything commercial, client work or published under the user's
brand, ask the model to replace Clawd with the user's own character (the guide shows how to swap the character).
