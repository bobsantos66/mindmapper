# ugc-ad-director for Codex

Paste the block below into your project's AGENTS.md (or Codex custom instructions),
and copy `SKILL.md`, `scripts/` and `references/` from https://github.com/uniqaiapp/ugc-ad-director into `.agents/skills/ugc-ad-director/`.

---
When the user asks for a UGC-style ad, a TikTok / Reels / Shorts ad script, hook variants, a shot list or storyboard for an AI video ad, or Kling / Veo prompts for an ad, follow `.agents/skills/ugc-ad-director/SKILL.md`. Write the script as JSON, run `python3 .agents/skills/ugc-ad-director/scripts/ugc_script.py lint <file> --strict`, fix every error, then `render` it to Markdown for the user. Never draft first-person testimonials for an AI presenter and always put the AI label in an on-screen caption.
---
