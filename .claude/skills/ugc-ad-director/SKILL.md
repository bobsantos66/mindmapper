---
name: ugc-ad-director
description: Writes UGC-style short ad scripts for TikTok, Reels and Shorts from a product brief: a hook that lands in the first 2 seconds, problem → demo → proof → CTA beats with timings, a shot list, on-screen captions, voiceover and per-shot prompts for AI image/video models (Kling, Veo 3, image-to-video), then lints the script for compliance (AI-content disclosure on screen, no fabricated testimonials or impersonated creators, claims backed by evidence, platform policy notes). Use when the user asks for a UGC ad, TikTok ad script, Reels or Shorts ad, ad creative from a product URL or brief, a hook library, a shot list or storyboard for an AI video ad, or prompts to generate an ad with Kling or Veo. Not for long-form video, organic (non-ad) content, or generating the video files themselves.
license: MIT
metadata:
  version: 0.1.0
  author: UniqAI
  homepage: https://github.com/uniqaiapp/ugc-ad-director
---

# UGC ad director

Turns a product brief into a short, UGC-style ad script that is ready to shoot or generate: hook in the first two seconds, five fixed beats with timings, a shot list, captions, voiceover, per-shot prompts for image and video models, and a compliance pass that refuses fake testimonials and missing AI labels. The most common trigger is "write a TikTok ad for X" with a URL or a one-line brief.

## When to use

- The user wants an ad script, shot list or storyboard for TikTok, Reels or Shorts (15–60 s, 9:16).
- They have a product URL, a brief, or a landing page and want "UGC-style" creative, hooks, or several angles to test.
- They want prompts to generate the ad with Kling, Veo 3 or an image-to-video tool, shot by shot.
- They have a draft script and want it checked: timings, caption length, pace, claims, AI disclosure.
- They ask for a hook library or hook variants for a category.

## When NOT to use

- Long-form video, explainers over 60 s, or organic content that is not an ad: the beat structure is built for paid short-form.
- Anything that needs a real person's likeness, a real customer's words or a celebrity: this skill writes fictional demonstrators only and will not draft testimonials for them.
- Regulated claims (medical, financial returns, weight loss) without documents in hand: the lint will reject them and so should you.
- Generating the video files: this skill outputs scripts and prompts; rendering happens in whatever image-to-video tool the user has.

## How it works

1. **Read the brief.** From the URL or text, extract: product name, the one thing it does (one clause), who it is for, one concrete annoyance it removes, anything checkable (label, spec, screen, price), and whether a presenter is needed. Ask only if the one thing it does is unclear.
2. **Pick presenter and length.** Default `none` (hands and product) for physical goods and apps; `ai_generated` when lines must be delivered to camera; `real_person` only when the user has a real creator with a release. Default 30 s; 15–20 s when there is no voiceover. See `references/structure.md`.
3. **Write the hook.** ≤ 12 words, lands by 2.0 s, said and captioned at once. Choose from `references/hook-library.md` by category and adapt it to the brief; offer three variants (different types: callout, contrarian, result-first, test) when the user is going to A/B test.
4. **Lay out the beats.** hook → problem → demo → proof → cta with the timings from `references/structure.md`. Demo is the longest beat and shows one action. Proof is something checkable, preferably live footage of the real product or a real screen recording. CTA is one verb plus one on-screen line.
5. **Write each shot.** `visual`, `camera`, `caption` (≤ 48 chars per line, AI label as a caption line in shot 1), `voiceover` (≤ 3.5 words per second of the shot), `source`, and a `prompt` object (subject, action, camera, setting, lighting, negative, audio) for every generated shot. Repeat the presenter description word for word in every subject. Format: `references/script-format.md`.
6. **List claims.** Every measurable statement that made it into a caption or VO goes in `claims` with its evidence. If there is no evidence, rewrite the line as an observable demo.
7. **Save and lint.** Write the JSON to a file and run `python3 scripts/ugc_script.py lint <file> --strict`. Fix every error; explain any warning you leave in. The lint output is part of the deliverable.
8. **Render.** `python3 scripts/ugc_script.py render <file> --out <file>.md` for the script sheet (timeline table, VO script, captions, prompts, claims, compliance checklist) and `python3 scripts/ugc_script.py prompts <file> --model all` for copy-paste prompts per model. Hand the user the Markdown, the prompts and the lint line.

Scaffold a file to start from: `python3 scripts/ugc_script.py new --vertical skincare --product "Name" --duration 30 --presenter none`.

## Inputs / outputs

| Input | Output |
|---|---|
| Product URL or brief, target platforms, optional length and presenter choice | `script.json` (the source of truth) |
| | `script.md`: script sheet with timeline, VO, captions, per-shot prompts, claims, compliance |
| | Per-shot prompts: first frame (image model), Kling, Veo 3 with dialogue |
| | Lint report: errors, warnings, pace, caption lengths |

## Compliance rules the skill follows

- The AI label (`AI-generated ad`) is a caption line from the first frame whenever any shot is generated or the presenter is AI; the platform's AI-content setting is switched on at upload.
- An AI presenter demonstrates; it never claims to have used, bought or loved the product. No "honest review", "not sponsored", star ratings or review screenshots without a real source.
- Presenters are fictional and described as such; no real creator, customer or public figure, no real logos or competitor packaging in generated shots.
- Claims need evidence or they become demos. Prices and offers only if true for the run.
- Details and dated policy references: `references/compliance.md`.

## Examples

`examples/scripts/` holds eleven scripts across verticals (skincare, app, kitchen, pets, course, B2B, cleaning, footwear, travel, coffee, electronics); `examples/rendered/` and `examples/prompts/` are their committed outputs. `examples/bad/fake-testimonial.json` is a script that lint must reject (12 errors, 8 warnings at the time of writing; the exact lines are in README).

```bash
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py prompts examples/scripts/skincare-serum.json --model veo3
```

## Limits

- The testimonial and claim checks are regex lists in English; paraphrases and other languages get through. Read the script yourself.
- The pace ceiling (3.5 words/s) and beat splits are working defaults, not measured optima; the repo claims nothing about retention or conversion.
- Lint cannot know whether evidence is real; it checks that it is written down.
- Prompt formats target the Kling and Veo 3 conventions at the time of writing; clip lengths and audio support change per release.
- No platform policy is quoted verbatim; `references/compliance.md` summarises and dates what was checked, and the policies must be re-read before launch.

## References

- `references/structure.md`: beats, timings per length, presenter choice, caption and pace rules
- `references/hook-library.md`: hooks by category and type, plus hooks to avoid
- `references/script-format.md`: the JSON fields and every lint rule
- `references/model-prompts.md`: prompt patterns for image, Kling and Veo 3 and how consistency is kept across shots
- `references/compliance.md`: AI disclosure, testimonials, impersonation, claims, platform notes, pre-flight checklist
