# Script format (JSON)

One file per ad. `scripts/ugc_script.py lint` checks it; `render` turns it into a script sheet; `prompts` exports per-shot prompts. Scaffold one with `python3 scripts/ugc_script.py new --vertical skincare --product "Name"`.

```jsonc
{
  "title": "short working title",
  "vertical": "skincare",                       // free text; used for the hook library lookup
  "product": { "name": "…", "one_liner": "what it is, in one clause" },
  "platforms": ["tiktok", "reels", "shorts"],
  "aspect": "9:16",
  "duration_s": 30,                             // total length; the last shot must end here
  "audience": "who this is for, in one line",
  "presenter": {
    "type": "ai_generated" | "real_person" | "none",
    "description": "for ai_generated: a fictional description, never a real person's likeness"
  },
  "hook": { "type": "pattern-interrupt", "text": "≤ 12 words", "why": "one line on why it works" },
  "style": "global look for every generated shot (optional)",
  "shots": [
    {
      "id": 1,
      "beat": "hook" | "problem" | "demo" | "proof" | "cta",
      "start_s": 0, "end_s": 2,                 // contiguous; shot 1 starts at 0, hook ends by 2.0
      "visual": "what the viewer sees",
      "camera": "framing and movement, in words",
      "caption": "on-screen text\nsecond line",  // ≤ 48 chars per line; one caption carries the AI label
      "voiceover": "spoken line, or empty",
      "source": "image-to-video" | "text-to-video" | "screen-recording" | "live-footage" | "still",
      "on_camera_speech": true,                 // false = VO over b-roll (Veo 3 prompt then omits Dialogue)
      "prompt": {                               // required for image-to-video / text-to-video
        "subject": "who/what, concrete",        // required
        "action": "what moves, in one sentence",// required
        "camera": "static handheld, slow push in, …", // required
        "setting": "", "lighting": "", "style": "", "negative": "", "audio": ""
      }
    }
  ],
  "claims": [ { "text": "exact wording used in a caption or VO", "evidence": "where it is proven" } ],
  "cta": { "text": "spoken", "on_screen": "caption" },
  "compliance": {
    "ai_label": "AI-generated ad",               // must appear verbatim in at least one caption
    "platform_toggle": true,                     // AI-content switch set in the ad manager
    "notes": ["anything a reviewer should know"]
  }
}
```

## What lint enforces

| Check | Level | Rule |
|---|---|---|
| Hook | error | shot 1 is the hook, starts at 0, ends by 2.0 s; hook text ≤ 12 words |
| Beats | error | hook → problem → demo → proof → cta, in that order, all present; last shot is cta |
| Timeline | error | shots are contiguous and end exactly at `duration_s` |
| Prompts | error | every generated shot has `prompt.subject`, `.action`, `.camera` |
| Testimonial | error | first-person customer phrasing ("I've been using", "changed my life", "not sponsored"…) with an `ai_generated` or `none` presenter |
| Endorsement | error | "as seen on", "TikTok recommends", "endorsed by" |
| Claims | error | "clinically", "proven", "guaranteed", "#1", "N%", "results in N days"… must be listed under `claims` with non-empty evidence |
| AI label | error | `compliance.ai_label` set and present in a caption when any shot is generated or the presenter is AI |
| Captions | warning | lines over 48 characters |
| Pace | warning | voiceover above `--max-wps` (default 3.5 words/s) for that shot |
| Numbers | warning | any number with three or more digits or a unit that is not in `claims` |
| Length | warning | over 60 s |

`--strict` turns warnings into a failing exit code.
