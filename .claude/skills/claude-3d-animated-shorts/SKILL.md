---
name: claude-3d-animated-shorts
description: Make vertical (9:16) animated story Shorts with real 3D cartoon characters in three.js, in the style of the RicksClips YouTube channel. White deadpan heads, pear bodies, noodle limbs, lit 3D sets (office, home, rail), a cinematic darker grade, word-by-word captions and the story-first explainer formula. Use when asked for a 3D animated short, a RicksClips-style video, or to extend this engine.
---

# Claude 3D Animated Shorts

The workflow comes from mromidev/claude-animated-shorts (see `upstream-2d/SKILL-2d.md`): topic, then script, then voice, then shot plan, then stills, then renders. Everything here runs in **true 3D**. Characters are rigged models built by `engine/stickrig.js`, not billboards. The look and story formula follow the RicksClips YouTube channel.

## 1. Story (RicksClips formula)
Story-first explainers did 9–33 M views on the channel. Pure question-hook explainers got 0.1–0.3 M.
1. State an odd act as a fact in line 1. Show the consequence in the first 3 s.
2. Give context: why they were there.
3. A doubter mocks it with one funny quoted line.
4. The hero replies, short and stubborn.
5. Early evidence favours the doubters. Time ticks.
6. The disaster or turn hits the doubter.
7. The science in one line with a real number, then one everyday analogy.
8. Cut the last line mid-sentence ("… then…") so it loops back into line 1.

Target 35–45 s, about 4 words per second. Skits can be 10 s: setup, mistake, reaction.

## 2. Characters (`engine/stickrig.js`, options on `SR.build({...})`)
These values were approved line by line against reference frames.
- **Head:** `headCol '#ffffff'`, `flatHead: true` (flat fill, a soft cel shadow, no gloss), `headShape 'rround'` (round, slightly wide), `headR 0.3`. Every character uses the same head size. Differences come from hats and clothes.
- **Outline:** `inkPx 4.5` is measured in screen pixels on a 1000-px-tall frame, so it looks the same at any zoom. The colour is dark brown `#2a1612`, never pure black. Front details snap onto the body surface so they never float when seen side-on.
- **Face:** small black oval eyes under a heavy flat lid, set close together and high, just under the hat. The mouth is a tiny frown. No nose, no cheeks. All moods are drawn as canvas decals in `FACES`.
- **Body:** `roundBottom: true`, a pear that is wider at the bottom, `bodyW 0.82`. Clothes are flat colours (`flatCloth: true`) with `pattern: [kind, colour2]`. Kinds are stripes, hstripes, pinstripe, plaid, dots, zigzag and vest.
- **Outfits** (as `details`): `hoodie` (hood ring, kangaroo pocket that wraps the belly, drawstrings), `vest` pattern with `tie`, `vestBtn` and `hanky`, `polo` (collar, placket, logo, short sleeves), plus `buttons`, `belt`, `collar`, `tie`, `bow`.
- **Limbs:** `noodle: true` makes each arm and leg one smooth curved tube through the joints. Use `limbK 0.6` (thin), dark `#3a2418` arms, `#2b2230` legs, and `mitten: true` for white mittens with a thumb and outline. Shoes are small and dark.
- **Hats:** `cap` (`capBack` wears it backwards, brim hidden), `nonla` (rides high so the head never pokes through), `boonie`, `beret`, `pith`.

Review the cast on `viewer.html` before any render. You can orbit, zoom, change mood and pose, and send OK/fix notes.

## 3. Sets and look
- **Office or home** (`?viewer=1[&set=home]`): walls, floor, windows with sun shafts and a floor patch, a ceiling and lights. Furniture comes from Kenney and KayKit (CC0) through `put(kit, name, x, z, ry, {k, y})`. One scale per kit keeps proportions. Props use real PBR materials with no ink, so the world reads as lit 3D and only the people are flat.
- **Lighting** was measured against 12 reference Shorts (average luma about 112 of 255):
  - exposure 0.42, saturation 1.2, contrast 1.22, warm 0.07, vignette 0.55;
  - warm sun `#ffd29a` through the windows, cool blue hemisphere fill;
  - `RoomEnvironment` at 0.55, n8ao ambient occlusion.
  - Use `&light=bright` for the old bright look.
- **Outdoor rail world** (`world.js`): track, telegraph poles, a day or dusk sky, a train. `?chase=1` adds a desert recolour, mesas, saguaros, a steam train and galloping horses (test only).
- **Avoid:** fast physical action such as riding, fighting, precise hand grips, or animals as leads. Keep it to 2–4 people in one place, around one object or phenomenon.

## 4. Shots
Write each shot as `shot(t0, (t) => { …pose people…; look(camPos, target, fov); })`.
- Every shot moves a little: push in, pan or rise.
- Use 2–3.5 s shots. Over-the-shoulder inserts carry screen content (canvas textures).
- Coworkers react with `face(c, 'wide')`, a head turn (`yawTo`) and "!" bubbles.
- People stand at standing desks: chairs are hidden in skits.
- Long pieces such as a tie lean with the belly.

### Director's shot plan (used in the skit)
Never keep one framing for long. Every shot gets a size, an angle and a motivated move:
1. **Establish:** crane down from a high corner, 24–28 mm. Show where everyone sits.
2. **Hero:** low angle, 38 mm, slow push-in, shallow DOF.
3. **OTS insert:** shoulder in the foreground, the screen sharp, the cursor creeping.
4. **ECU + snap-zoom** on the action (mitten clicks the mouse).
5. **Whip pan** between reactions: hold, a 0.28 s whip with a slight roll, hold.
6. **Dolly-zoom** (vertigo) with a dutch tilt on the "oh no". The camera pulls back while the fov narrows so the face stays the same size.

Set DOF per shot with `post.bokeh.uniforms.focus/aperture`. Check stills at the start, middle and end of each move.

## 5. Voice, captions, render
```bash
cd <work>; node tools/tts.mjs                # ElevenLabs: voice_raw.mp3 + timing_raw.json (ELEVENLABS_API_KEY)
python3 tools/fit.py --target 40             # tempo ≤ ×1.3 + pause before the end line (long videos)
CAP_Y=0.8 python3 tools/captions.py          # word-by-word captions → cap/overlay.mov (move them off screen UI)
XQ="&viewer=1&skit=1" node engine/render.cjs out/video.mp4 1080 1920 30
ffmpeg -i out/video.mp4 -i cap/overlay.mov -i voice.wav … overlay + amix + loudnorm -14
```
`render.cjs out.mp4 W H fps t1 t2 …` writes stills only. Look at them before every full render.

## 6. QA checklist
- [ ] Heads are the same size and the outline is visible at the farthest shot.
- [ ] Nothing floats: buttons, ties, pockets and hats seen from the side.
- [ ] No hat clips through a head. Mittens sit on the wrists.
- [ ] Frame luma is about 100–130. The heads are the brightest thing in frame.
- [ ] Captions never cover screen UI or faces.
- [ ] Every voice line has a matching action on screen.
