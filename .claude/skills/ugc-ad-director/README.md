<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="ugc-ad-director by UniqAI" src="assets/banner.svg" width="1280" height="320">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-d1fe17?style=flat-square&labelColor=0d0f12)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-d1fe17?style=flat-square&labelColor=0d0f12)](#install)
[![Cursor](https://img.shields.io/badge/Cursor-rules-d1fe17?style=flat-square&labelColor=0d0f12)](#install)
[![Codex](https://img.shields.io/badge/Codex-AGENTS.md-d1fe17?style=flat-square&labelColor=0d0f12)](#install)
[![By UniqAI](https://img.shields.io/badge/made_by-UniqAI-fdfc07?style=flat-square&labelColor=0d0f12)](https://uniqai.app/?utm_source=github&utm_medium=readme&utm_campaign=ugc-ad-director)

**AI UGC ad scripts: 2-second hook, shot list, captions, Kling / Veo prompts, compliance lint.**

[Quickstart](#quickstart) · [How it works](#how-it-works) · [Examples](#examples) · [Install](#install) · [FAQ](#faq)

</div>

English · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

# ugc-ad-director: AI UGC ad scripts and video prompts

AI UGC ads start with a script, not a prompt. This skill turns a product brief into a TikTok / Reels / Shorts ad script with the hook inside the first two seconds, five timed beats (hook → problem → demo → proof → CTA), a shot list, on-screen captions, voiceover, and a per-shot prompt for the image model, for Kling and for Veo 3 with spoken lines. A stdlib Python script lints the result and refuses what should not ship: an AI presenter talking like a customer, "clinically proven" without a source, a missing AI label.

It drafts; it does not fabricate. Presenters are fictional demonstrators, every claim needs evidence, and the `AI-generated ad` label is a caption from frame one. The ethics are in the lint, not in a footnote.

| **Hook by 2.0 s** | **Prompts per shot, per model** | **Compliance that fails the build** |
|:---|:---|:---|
| Twelve words max, said and captioned at once, chosen from a hook library by category. | First frame for image-to-video, a Kling clip prompt, a Veo 3 prompt with dialogue; consistent presenter wording across shots. | Fake testimonials, platform endorsements, unbacked claims and a missing AI label are errors, not warnings. |

## Quickstart

```bash
git clone https://github.com/uniqaiapp/ugc-ad-director && cd ugc-ad-director
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out serum.md
```

The first command prints `ok, 0 errors, 0 warnings`; the second writes a script sheet with the timeline table, voiceover, captions, shot prompts, claims and a compliance checklist. In an agent, say "write a 30-second UGC ad for <product URL>" and the skill does the same from your brief.

## Demo

<img alt="ugc-ad-director demo: lint rejects a fake-testimonial script, then renders a clean one" src="assets/demo.svg" width="820">

## How it works

1. **Brief → facts.** From a URL or a line of text the skill extracts the one thing the product does, who it is for, the annoyance it removes and anything checkable (label, spec, screen). Nothing else gets in; "revolutionary" is not a fact.
2. **Hook first.** One idea, ≤ 12 words, lands by 2.0 s, caption and voiceover together because the sound is usually off. [`references/hook-library.md`](references/hook-library.md) has hooks by category and type (callout, contrarian, result-first, comparison, a test the viewer can do now) and a list of hooks to avoid.
3. **Five beats with timings.** hook → problem → demo → proof → cta, scaled to 15, 20, 30, 45 or 60 s ([`references/structure.md`](references/structure.md)). Demo is the longest and shows one action. Proof is something checkable, preferably real footage of the real product or a real screen recording, even inside an otherwise generated ad.
4. **Shots → prompts.** Each shot carries `subject`, `action`, `camera`, `setting`, `lighting`, `negative`, `audio`. `scripts/ugc_script.py prompts` renders them as a still for the first frame, a Kling clip prompt (5 or 10 s, negative prompt, no slow motion) and a Veo 3 prompt with the spoken line as `Dialogue` ([`references/model-prompts.md`](references/model-prompts.md)).
5. **Lint.** Timeline contiguous and ending at `duration_s`; hook ≤ 2 s; beats in order; captions ≤ 48 characters per line; voiceover pace per shot; every generated shot has a prompt; first-person customer phrasing with an AI presenter is an error; "proven", "guaranteed", "#1", percentages and "results in N days" must sit in `claims` with evidence; the AI label must appear in a caption. Full list in [`references/script-format.md`](references/script-format.md).

```
brief ──▶ hook ──▶ beats + timings ──▶ shots ──▶ script.json
                                                   │
                     lint (structure + compliance) ◀┘──▶ render (.md sheet) ──▶ prompts (image / kling / veo3)
```

The only numbers this README quotes come from `python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json`: 6 shots, hook ends at 2 s, 75 words of voiceover over 30 s (2.5 words/s), 7 caption lines, longest 41 characters, 5 generated shots, 2 claims with evidence. The beat splits and the 3.5 words/s pace ceiling are working defaults, not measured optima; the repo claims nothing about retention or conversion.

## Examples

Eleven scripts across verticals in [`examples/`](examples/README.md): skincare, a meal-planning app, a kitchen gadget, dog chews (real customer with a release), a language course, B2B invoicing, a cleaning spray with no voiceover, running shoes, a travel eSIM, a coffee subscription and a pet camera. Every rendered sheet and prompt file is committed and reproduced byte-for-byte by the tests.

<details>
<summary><b>Brief → first ten seconds of a script (skincare-serum)</b></summary>

**Before** (the brief)

```text
Dewline Barrier Serum: fragrance-free hydrating serum with ceramides and 2% niacinamide.
Audience: women 22-35 with dry, flaky skin under makeup. 30 s, AI presenter.
```

**After** (first three rows of the timeline in `examples/rendered/skincare-serum.md`)

```text
| # | Time | Beat | Visual | Caption | Voiceover | Source |
|---|---|---|---|---|---|---|
| 1 | 0s–2s | hook | Close-up of a fingertip dragging foundation across dry, flaky cheek; product in the mirror | Your foundation isn't the problem. / AI-generated ad | Your foundation isn't the problem. | image-to-video |
| 2 | 2s–7s | problem | Presenter to camera, towel on hair, holding up a flaky makeup sponge | dry skin + makeup = cake | Dry skin drinks the water out of your makeup, so it cakes by lunch. | image-to-video |
| 3 | 7s–15s | demo | Two drops of serum pressed into the cheek with two fingers; skin goes from matte-flaky to even | two drops, press, don't rub | Two drops. Press it in with two fingers, don't rub. Ceramides fill the cracks, niacinamide calms the red. | image-to-video |
```

Veo 3 prompt for shot 2 (from `examples/prompts/skincare-serum.txt`):

```text
fictional woman in her late twenties, towel wrapped on her head, no makeup, holding a makeup sponge toward the lens, small bathroom, white tiles.
Action: she talks to the camera and tilts the sponge to show dried foundation on it.
Camera: handheld selfie, eye level, slight sway.
Lighting: window daylight, no ring light.
Dialogue (on camera, natural pace): "Dry skin drinks the water out of your makeup, so it cakes by lunch."
Audio: room tone, faint bathroom echo.
Style: candid bathroom phone video, soft window light, visible pores and skin texture.
No subtitles, no captions, no logos in frame.
```

</details>

<details>
<summary><b>What lint refuses (examples/bad/fake-testimonial.json)</b></summary>

```text
error   hook: hook is 18 words; keep it under 13 so it lands inside 2 s
error   shot 1: hook shot ends at 3s; it must end by 2s
error   beats: missing beat(s): proof
error   shot 1: prompt is missing 'camera'
error   shot 1: reads as a first-person customer testimonial but the presenter is 'ai_generated': rewrite as a demo or a sourced claim
error   shot 2: reads as a first-person customer testimonial but the presenter is 'ai_generated': rewrite as a demo or a sourced claim
error   shot 3: implies a platform or third-party endorsement; remove it
error   claim 1: 'clinically proven' has no evidence; add a source, a test or remove the claim
error   shot 3: 'guaranteed' is a claim; list it under 'claims' with evidence or drop it
error   shot 3: 'doctor recommended' is a claim; list it under 'claims' with evidence or drop it
error   shot 4: '50%' is a claim; list it under 'claims' with evidence or drop it
error   compliance: ai_label is empty but the ad contains AI-generated footage or an AI presenter
examples/bad/fake-testimonial.json: failed, 12 errors, 8 warnings
```

The eight warnings (caption length, pace, unlisted numbers, missing platform toggle, undescribed presenter) are omitted here; `python3 scripts/ugc_script.py lint examples/bad/fake-testimonial.json` prints all of them.

</details>

<details>
<summary><b>Start a new script</b></summary>

```bash
python3 scripts/ugc_script.py new --vertical pets --product "Bitewell Chews" --duration 30 --presenter none > chews.json
# fill in visuals, captions, voiceover, prompts, claims; then
python3 scripts/ugc_script.py lint chews.json --strict
python3 scripts/ugc_script.py prompts chews.json --model veo3
```

</details>

Where to render the prompts: any image-to-video tool that takes a start frame and text. We use [UniqAI's image-to-video page](https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=readme&utm_campaign=ugc-ad-director), where a product photo becomes the first frame of a clip; the Kling and Veo 3 formats shipped here are the ones used there.

## Install

Works with every agent that reads instruction files. Pick yours. Python 3.9+; no packages to install.

<details open>
<summary><b>Claude Code</b></summary>

```bash
# user-level
git clone https://github.com/uniqaiapp/ugc-ad-director ~/.claude/skills/ugc-ad-director
# or project-level
git clone https://github.com/uniqaiapp/ugc-ad-director .claude/skills/ugc-ad-director
```

Then `/ugc-ad-director` in any session, or just describe the ad; the skill's `description` triggers it. The clone brings `scripts/` and `references/` along, which the skill needs.

</details>

<details>
<summary><b>Cursor</b></summary>

Copy [`SKILL.md`](SKILL.md), `scripts/`, `references/` and [`.cursor/rules/ugc-ad-director.mdc`](.cursor/rules/ugc-ad-director.mdc) into your project. The rule file embeds the skill.

</details>

<details>
<summary><b>Codex / any AGENTS.md agent</b></summary>

Copy `SKILL.md`, `scripts/` and `references/` into `.agents/skills/ugc-ad-director/` and add the snippet from [`codex/INSTRUCTIONS.md`](codex/INSTRUCTIONS.md) to your `AGENTS.md`. [`AGENTS.md`](AGENTS.md) in this repo is the generic version.

</details>

<details>
<summary><b>Plain prompt</b></summary>

Paste [`SKILL.md`](SKILL.md) into the system prompt of any model, with `references/structure.md` and `references/compliance.md` if the context allows. It has no agent-specific syntax outside the frontmatter. The lint still needs Python.

</details>

<details>
<summary><b>Without an agent</b></summary>

```bash
python3 scripts/ugc_script.py --help
```

`lint`, `render`, `prompts`, `stats` and `new` run standalone on any script JSON.

</details>

## FAQ

<details>
<summary><b>Can the AI presenter say it loves the product?</b></summary>

No. An AI presenter is a demonstrator: it shows, explains, compares and asks. "I've been using this", "changed my life", "honest review" and "not sponsored" are first-person customer experience, and with a generated or absent presenter they are a fabricated testimonial. The lint rejects them. A real customer with a signed release can say them; see `examples/scripts/dog-dental-chews.json`.

</details>

<details>
<summary><b>Do I really have to label the ad as AI-generated?</b></summary>

The skill puts `AI-generated ad` in a caption from the first frame and expects the platform's AI-content setting to be on. TikTok, Meta and YouTube each have disclosure rules for realistic generated content, the FTC's rule on fake reviews and testimonials covers AI-generated people, and the EU AI Act's transparency article applies from August 2026. Details and dates in [`references/compliance.md`](references/compliance.md). Read the live policy pages before launch; this repo summarises, it does not quote.

</details>

<details>
<summary><b>Which models do the prompts target?</b></summary>

Three outputs per generated shot: a still for the first frame (any image model), a Kling-style clip prompt (5 or 10 s, negative prompt) and a Veo 3-style prompt with the spoken line as dialogue and an ambient audio line. Clip lengths and audio support change per release; the patterns are in [`references/model-prompts.md`](references/model-prompts.md) and are easy to adapt to Runway, Wan or Seedance.

</details>

<details>
<summary><b>Does lint prove the ad is compliant?</b></summary>

No. It catches the mistakes it knows: timing, pace, caption length, English testimonial and claim phrasing, missing labels, endorsement wording. It cannot check that your evidence is real, read other languages, or know a platform's policy changed last week. It makes the obvious mistakes impossible and the rest visible.

</details>

<details>
<summary><b>Why JSON and not a text script?</b></summary>

Because timings, captions, claims and prompts need to be checked against each other, and a table in a document cannot be linted. The JSON is the source; `render` gives you the readable sheet.

</details>

## Related

- [video-director](https://github.com/uniqaiapp/video-director): turn a one-line idea into a shot-by-shot prompt for AI video models (Kling, Veo, Sora and others), with camera, lighting and motion vocabulary. Use it when the ad needs cinematic shots rather than UGC.
- [awesome-ai-video-prompts](https://github.com/uniqaiapp/awesome-ai-video-prompts): curated, categorised prompts for AI video models with the settings that produced them.
- [no-plastic](https://github.com/uniqaiapp/no-plastic): prompt rules and a checker for natural-looking AI portraits; apply them to the presenter's first frame.
- [ai-video-pricing](https://github.com/uniqaiapp/ai-video-pricing): hand-checked price table for AI video generation, per second and per clip, for budgeting the shot list.

## Contributing

Issues and pull requests are welcome. Keep changes small and include a before/after example in the PR description.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the local checks (`python3 tests/run.py`, no dependencies).

## License

[MIT](LICENSE) © UniqAI for code and examples; `references/` is CC BY 4.0.

---

<div align="center">

<sub>Made by <a href="https://uniqai.app/?utm_source=github&utm_medium=readme&utm_campaign=ugc-ad-director">UniqAI</a> — Kling 3.0, Veo 3, Flux, Nano Banana and GPT-5/Claude/Gemini/Grok in one app. We write our own ad drafts with this skill.</sub>

</div>
