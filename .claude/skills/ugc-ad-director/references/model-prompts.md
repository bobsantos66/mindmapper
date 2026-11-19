# Prompt patterns for AI video and image models

`scripts/ugc_script.py prompts --model image|kling|veo3|all` renders these from each shot's `prompt` object. The patterns are what we found works for UGC-style shots; model limits (clip lengths, resolution, audio support) change with each release, so check the vendor's current docs before relying on a number.

## The shot `prompt` object

| Field | What to write | Example |
|---|---|---|
| `subject` | who or what, concrete, no adjectives that cannot be seen | "fictional woman in her late twenties, towel on her head, holding a makeup sponge toward the lens" |
| `action` | one sentence of motion, in order | "she tilts the sponge to show dried foundation, then looks at the lens" |
| `camera` | framing plus movement | "handheld selfie, eye level, slight sway" |
| `setting` | place and time of day | "small bathroom, white tiles, morning" |
| `lighting` | source and direction | "window daylight from the left, no ring light" |
| `style` | overrides the script-level `style` | "candid phone footage, visible skin texture" |
| `negative` | what must not appear | "text, logos, extra fingers, plastic skin" |
| `audio` | ambient sound (Veo 3) | "room tone, a kettle ticking" |

Write for a phone, not a film set: "handheld", "eye level", "slight sway", "window light", "overcast". Cinematic words (anamorphic, volumetric, bokeh) push the output away from UGC.

## First frame (image model, for image-to-video)

Still, no motion verbs. Subject + setting + lighting + style + `vertical 9:16, sharp focus, no text or logos`. Generate the frame, check hands, product silhouette and skin texture, then feed it to the video model. For product shots, use a real product photo as the first frame instead of a generated one; the video model keeps the silhouette.

## Kling (image-to-video, text-to-video)

```
[5s clip, 9:16, image-to-video from the still above]
<subject>, <action>.
Camera: <camera>.
Lighting: <lighting>.
Style: <style>.
Negative: <negative or default>.
```

- Clip length is rounded to 5 or 10 s from the shot length; cut the shot in the edit rather than asking for odd lengths.
- Keep the action to one movement per clip. Two actions ("pours, then turns to camera") often collapse into one.
- Default negative: `text, watermark, extra fingers, warped product, plastic skin, slow motion`. "slow motion" matters: UGC runs at real speed.
- Speech: Kling clips are generated without the voiceover; record or synthesise the VO separately and cut it over the clip.

## Veo 3 (native speech and audio)

```
<subject>, <setting>.
Action: <action>.
Camera: <camera>.
Lighting: <lighting>.
Dialogue (on camera, natural pace): "<voiceover line>"
Audio: <audio>.
Style: <style>.
No subtitles, no captions, no logos in frame.
```

- The `Dialogue` line is included only when the shot has a voiceover and `on_camera_speech` is not `false` (b-roll with VO leaves it out so the model does not invent a speaker).
- Keep each spoken line within the shot's seconds at about 3 words per second; longer lines get cut off or sped up.
- "No subtitles, no captions" is there because the model otherwise burns in its own text; captions are added in the edit from the script sheet.
- Ask for ambient sound explicitly (`audio`); silence reads as generated.

## Consistency across shots

- Repeat the presenter description word for word in every `subject` ("the same fictional man in his forties, dark apron"). Changing adjectives changes the face.
- Use the same first-frame image for all shots of one presenter where the framing allows; otherwise generate a reference still once and describe it identically.
- Keep lighting and setting strings identical across the beats shot in the same place.

## Where to generate

Any image-to-video or text-to-video service that accepts a start frame and a text prompt works with these outputs. UniqAI runs Kling and Veo among others (image-to-video page: https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=skill&utm_campaign=ugc-ad-director); it is where this skill is used day to day, which is why the two formats above are the ones shipped.
