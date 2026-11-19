#!/usr/bin/env python3
"""ugc_script.py: lint, render and export UGC-style short ad scripts.

Zero dependencies (Python 3.9+ stdlib). A script is one JSON file; see
references/script-format.md for the fields. Subcommands:

  lint    <script.json> [--max-wps 3.0] [--strict]   structure + compliance checks
  render  <script.json> [--out file.md]              Markdown: timeline, captions, VO, prompts
  prompts <script.json> --model veo3|kling|image|all per-shot prompts for AI video/image models
  stats   <script.json>                              durations, words per second, caption lengths
  new     --vertical NAME --product NAME [--duration 30] [--presenter ai_generated]
                                                      scaffold a script JSON to stdout

Exit codes: 0 ok, 1 lint errors (or usage), 2 file/JSON error.
"""
import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BEATS = ["hook", "problem", "demo", "proof", "cta"]
PRESENTERS = ("ai_generated", "real_person", "none")
SOURCES = ("image-to-video", "text-to-video", "screen-recording", "live-footage", "still")
HOOK_MAX_S = 2.0
HOOK_MAX_WORDS = 12
CAPTION_MAX_CHARS = 48
DEFAULT_MAX_WPS = 3.5

# Phrases that read as first-person customer experience. With an AI-generated
# or no presenter they turn a draft into a fabricated testimonial.
TESTIMONIAL_PATTERNS = [
    r"\bi(?:'ve| have) (?:been )?(?:using|used|tried|owned)\b",
    r"\bi (?:bought|ordered|tried|use|used|switched)\b",
    r"\bmy (?:results?|skin|hair|dog|cat|team|kids?|husband|wife) (?:is|are|was|were|has|have|got)\b",
    r"\bchanged my life\b",
    r"\bas a (?:customer|real customer|verified buyer|user)\b",
    r"\bverified (?:buyer|purchase|review)\b",
    r"\b(?:honest|real|genuine) review\b",
    r"\bnot sponsored\b",
    r"\bi'?m not (?:paid|sponsored)\b",
]
# Claims that need evidence (a URL, a test, a source) before they go in a script.
CLAIM_PATTERNS = [
    r"\bclinically\b", r"\bproven\b", r"\bguarantee[ds]?\b", r"\bcures?\b", r"\bdoctor[- ]recommended\b",
    r"\bdermatologist[- ](?:recommended|tested|approved)\b", r"\b#\s?1\b", r"\bbest[- ]selling\b",
    r"\bfda[- ](?:approved|cleared)\b", r"\bscientifically\b", r"\bresults? in \d+ (?:days?|weeks?|hours?)\b",
    r"\blose \d+", r"\b\d+\s?%", r"\b\d+x\b", r"\baward[- ]winning\b", r"\bsafe for\b", r"\bno side effects\b",
]
# Wording that implies a platform or a third party endorses the product.
IMPERSONATION_PATTERNS = [
    r"\bas seen on\b", r"\b(?:tiktok|instagram|youtube|meta) (?:recommends|approved|official)\b",
    r"\bofficial (?:tiktok|instagram|youtube) partner\b", r"\bendorsed by\b",
]
NUMBER_RE = re.compile(r"(?<![\w$])\d[\d,.]*\s?(?:%|x|k|m|days?|weeks?|hours?|minutes?|lbs?|kg|years?)?\b", re.I)
WORD_RE = re.compile(r"[A-Za-z0-9'’]+")


# ---------------------------------------------------------------- helpers

def load(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        sys.stderr.write(f"error: file not found: {path}\n")
        sys.exit(2)
    except json.JSONDecodeError as exc:
        sys.stderr.write(f"error: invalid JSON in {path}: {exc}\n")
        sys.exit(2)


def words(text):
    return len(WORD_RE.findall(text or ""))


def fmt_s(value):
    return f"{value:g}s"


def shot_text(shot):
    return " ".join(str(shot.get(k, "")) for k in ("caption", "voiceover", "visual"))


def any_match(patterns, text):
    low = (text or "").lower()
    return [p for p in patterns if re.search(p, low)]


# ---------------------------------------------------------------- lint

class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, where, msg):
        self.errors.append((where, msg))

    def warn(self, where, msg):
        self.warnings.append((where, msg))

    @property
    def ok(self):
        return not self.errors


def lint(script, max_wps=DEFAULT_MAX_WPS):
    r = Report()
    for key in ("title", "vertical", "product", "duration_s", "presenter", "hook", "shots", "cta", "compliance"):
        if key not in script:
            r.error("script", f"missing top-level field '{key}'")
    if r.errors:
        return r

    duration = script["duration_s"]
    presenter = script["presenter"].get("type")
    if presenter not in PRESENTERS:
        r.error("presenter", f"type must be one of {', '.join(PRESENTERS)}")
    if duration > 60:
        r.warn("duration", "over 60 s: check the current length limits of each target platform")

    shots = script["shots"]
    if not shots:
        r.error("shots", "no shots")
        return r

    # --- hook: first two seconds
    hook = script["hook"]
    hook_text = hook.get("text", "")
    if not hook_text.strip():
        r.error("hook", "hook text is empty")
    if words(hook_text) > HOOK_MAX_WORDS:
        r.error("hook", f"hook is {words(hook_text)} words; keep it under {HOOK_MAX_WORDS + 1} so it lands inside {HOOK_MAX_S:g} s")
    first = shots[0]
    if first.get("beat") != "hook":
        r.error("shot 1", "first shot must be the hook")
    if first.get("start_s", 0) != 0:
        r.error("shot 1", "first shot must start at 0")
    if first.get("end_s", 99) > HOOK_MAX_S:
        r.error("shot 1", f"hook shot ends at {fmt_s(first.get('end_s', 0))}; it must end by {fmt_s(HOOK_MAX_S)}")
    core = hook_text.lower().rstrip(".!?")
    if core and first.get("caption") and core not in first["caption"].lower() and core not in (first.get("voiceover") or "").lower():
        r.warn("shot 1", "hook text does not appear in the first shot's caption or voiceover")

    # --- beats in order, timeline contiguous
    seen = [s.get("beat") for s in shots]
    order = [b for b in BEATS if b in seen]
    if order != BEATS:
        missing = [b for b in BEATS if b not in seen]
        r.error("beats", f"missing beat(s): {', '.join(missing)}" if missing else "beats present")
    compact = [b for i, b in enumerate(seen) if i == 0 or seen[i - 1] != b]
    if [b for b in compact if b in BEATS] != [b for b in BEATS if b in compact]:
        r.error("beats", f"beats out of order: {' > '.join(seen)}; expected {' > '.join(BEATS)}")
    if shots[-1].get("beat") != "cta":
        r.error("shots", "last shot must be the cta")

    prev_end = 0
    for i, s in enumerate(shots, 1):
        where = f"shot {i}"
        missing = [k for k in ("beat", "start_s", "end_s", "visual", "caption", "source") if k not in s]
        if missing:
            r.error(where, f"missing field(s): {', '.join(missing)}")
            prev_end = s.get("end_s", prev_end)
            continue
        if s["start_s"] != prev_end:
            r.error(where, f"starts at {fmt_s(s['start_s'])} but previous shot ended at {fmt_s(prev_end)}")
        if s["end_s"] <= s["start_s"]:
            r.error(where, "end_s must be greater than start_s")
        prev_end = s["end_s"]
        if s["source"] not in SOURCES:
            r.error(where, f"source must be one of {', '.join(SOURCES)}")
        if s["source"] in ("image-to-video", "text-to-video") and not s.get("prompt"):
            r.error(where, "AI-generated shot has no 'prompt' object")
        if s.get("prompt"):
            for key in ("subject", "action", "camera"):
                if not s["prompt"].get(key):
                    r.error(where, f"prompt is missing '{key}'")
        for line in str(s.get("caption", "")).split("\n"):
            if len(line) > CAPTION_MAX_CHARS:
                r.warn(where, f"caption line is {len(line)} chars; keep lines under {CAPTION_MAX_CHARS + 1} for a phone screen")
        length = s["end_s"] - s["start_s"]
        vo = s.get("voiceover") or ""
        if vo and length > 0:
            wps = words(vo) / length
            if wps > max_wps:
                r.warn(where, f"voiceover runs at {wps:.1f} words/s over {fmt_s(length)}; above --max-wps {max_wps:g}")
        # compliance, per shot
        if presenter != "real_person":
            hits = any_match(TESTIMONIAL_PATTERNS, s.get("voiceover", "") + " " + s.get("caption", ""))
            if hits:
                r.error(where, "reads as a first-person customer testimonial but the presenter is "
                               f"'{presenter}': rewrite as a demo or a sourced claim")
        if any_match(IMPERSONATION_PATTERNS, shot_text(s)):
            r.error(where, "implies a platform or third-party endorsement; remove it")
    if prev_end != duration:
        r.error("timeline", f"shots end at {fmt_s(prev_end)} but duration_s is {fmt_s(duration)}")

    # --- claims need evidence
    claims = script.get("claims", [])
    claim_texts = [c.get("text", "").lower() for c in claims]
    for i, c in enumerate(claims, 1):
        if not (c.get("evidence") or "").strip():
            r.error(f"claim {i}", f"'{c.get('text', '')}' has no evidence; add a source, a test or remove the claim")
    for i, s in enumerate(shots, 1):
        text = (s.get("voiceover") or "") + " " + (s.get("caption") or "")
        for pat in any_match(CLAIM_PATTERNS, text):
            frag = re.search(pat, text.lower()).group(0)
            if not any(frag in ct for ct in claim_texts):
                r.error(f"shot {i}", f"'{frag}' is a claim; list it under 'claims' with evidence or drop it")
        for m in NUMBER_RE.finditer(text):
            token = m.group(0).strip()
            if re.fullmatch(r"\d{1,2}", token):
                continue  # small counts like "3 steps" are fine
            if not any(token.lower() in ct for ct in claim_texts):
                r.warn(f"shot {i}", f"number '{token}' is not backed by an entry in 'claims'")

    # --- AI disclosure
    comp = script["compliance"]
    label = (comp.get("ai_label") or "").strip()
    if presenter == "ai_generated" or any(s.get("source") in ("image-to-video", "text-to-video") for s in shots):
        if not label:
            r.error("compliance", "ai_label is empty but the ad contains AI-generated footage or an AI presenter")
        elif not any(label.lower() in (s.get("caption") or "").lower() for s in shots):
            r.error("compliance", f"ai_label '{label}' does not appear in any caption; put it on screen")
        if not comp.get("platform_toggle"):
            r.warn("compliance", "set platform_toggle: true once the AI-generated content switch is on in the ad manager")
    if presenter == "ai_generated" and not (script["presenter"].get("description") or "").strip():
        r.warn("presenter", "describe the AI presenter so it cannot be mistaken for a specific real person")
    cta = script["cta"]
    if not (cta.get("text") or "").strip():
        r.error("cta", "cta text is empty")
    return r


def print_report(r, path):
    for where, msg in r.errors:
        print(f"error   {where}: {msg}")
    for where, msg in r.warnings:
        print(f"warning {where}: {msg}")
    status = "ok" if r.ok else "failed"
    print(f"{path}: {status}, {len(r.errors)} errors, {len(r.warnings)} warnings")


# ---------------------------------------------------------------- stats

def stats(script):
    shots = script["shots"]
    vo_words = sum(words(s.get("voiceover")) for s in shots)
    cap_lines = [ln for s in shots for ln in str(s.get("caption", "")).split("\n") if ln]
    ai_shots = [s for s in shots if s.get("source") in ("image-to-video", "text-to-video")]
    return {
        "shots": len(shots),
        "duration_s": script["duration_s"],
        "hook_ends_s": shots[0].get("end_s"),
        "hook_words": words(script["hook"].get("text")),
        "voiceover_words": vo_words,
        "voiceover_wps": round(vo_words / script["duration_s"], 2) if script["duration_s"] else 0,
        "caption_lines": len(cap_lines),
        "longest_caption_line": max((len(ln) for ln in cap_lines), default=0),
        "ai_generated_shots": len(ai_shots),
        "claims": len(script.get("claims", [])),
    }


# ---------------------------------------------------------------- prompts

def _join(*parts):
    return ", ".join(p.strip().rstrip(".") for p in parts if p and p.strip())


def prompt_image(shot, script):
    """First frame for image-to-video: a still, no motion words."""
    p = shot.get("prompt", {})
    style = p.get("style") or script.get("style") or "candid phone video still, natural light, realistic skin texture"
    return _join(p.get("subject"), p.get("setting"), p.get("lighting"), style, "vertical 9:16, sharp focus, no text or logos") + "."


def prompt_kling(shot, script):
    p = shot.get("prompt", {})
    length = shot["end_s"] - shot["start_s"]
    clip = 5 if length <= 5 else 10
    lines = [
        f"[{clip}s clip, 9:16, image-to-video from the still above]" if shot.get("source") == "image-to-video" else f"[{clip}s clip, 9:16, text-to-video]",
        _join(p.get("subject"), p.get("action")) + ".",
        f"Camera: {p.get('camera', 'static handheld')}." ,
    ]
    if p.get("lighting"):
        lines.append(f"Lighting: {p['lighting']}.")
    if p.get("style") or script.get("style"):
        lines.append(f"Style: {p.get('style') or script.get('style')}.")
    lines.append("Negative: " + (p.get("negative") or "text, watermark, extra fingers, warped product, plastic skin, slow motion") + ".")
    return "\n".join(lines)


def prompt_veo3(shot, script):
    p = shot.get("prompt", {})
    lines = [
        _join(p.get("subject"), p.get("setting")) + ".",
        f"Action: {p.get('action', '')}.",
        f"Camera: {p.get('camera', 'static handheld')}.",
    ]
    if p.get("lighting"):
        lines.append(f"Lighting: {p['lighting']}.")
    if shot.get("voiceover") and script["presenter"].get("type") != "none" and shot.get("on_camera_speech", True):
        lines.append(f'Dialogue (on camera, natural pace): "{shot["voiceover"]}"')
    if p.get("audio"):
        lines.append(f"Audio: {p['audio']}.")
    lines.append(f"Style: {p.get('style') or script.get('style') or 'UGC phone footage, realistic, no on-screen text'}.")
    lines.append("No subtitles, no captions, no logos in frame.")
    return "\n".join(lines)


MODELS = {"image": prompt_image, "kling": prompt_kling, "veo3": prompt_veo3}


def render_prompts(script, model):
    chosen = MODELS if model == "all" else {model: MODELS[model]}
    out = []
    for s in script["shots"]:
        if s.get("source") not in ("image-to-video", "text-to-video") and not s.get("prompt"):
            continue
        for name, fn in chosen.items():
            if name == "image" and s.get("source") != "image-to-video":
                continue
            out.append(f"## shot {s['id']} · {s['beat']} · {fmt_s(s['start_s'])}-{fmt_s(s['end_s'])} · {name}")
            out.append(fn(s, script))
            out.append("")
    return "\n".join(out).rstrip() + "\n"


# ---------------------------------------------------------------- render

def render_markdown(script):
    p = script["product"]
    pres = script["presenter"]
    comp = script["compliance"]
    st = stats(script)
    L = []
    L.append(f"# {script['title']}")
    L.append("")
    L.append(f"**Product:** {p['name']} — {p.get('one_liner', '')}  ")
    L.append(f"**Vertical:** {script['vertical']} · **Platforms:** {', '.join(script.get('platforms', []))} · "
             f"**Length:** {fmt_s(script['duration_s'])} · **Aspect:** {script.get('aspect', '9:16')}  ")
    L.append(f"**Audience:** {script.get('audience', '')}  ")
    L.append(f"**Presenter:** {pres['type'].replace('_', ' ')}" + (f" — {pres['description']}" if pres.get('description') else ""))
    L.append("")
    L.append(f"## Hook ({fmt_s(script['shots'][0]['end_s'])})")
    L.append("")
    L.append(f"> {script['hook']['text']}")
    L.append("")
    L.append(f"Type: {script['hook'].get('type', '')}. {script['hook'].get('why', '')}".strip())
    L.append("")
    L.append("## Timeline")
    L.append("")
    L.append("| # | Time | Beat | Visual | Caption | Voiceover | Source |")
    L.append("|---|---|---|---|---|---|---|")
    for s in script["shots"]:
        cap = str(s.get("caption", "")).replace("\n", " / ").replace("|", "\\|")
        vo = str(s.get("voiceover", "")).replace("|", "\\|")
        vis = str(s.get("visual", "")).replace("|", "\\|")
        L.append(f"| {s['id']} | {fmt_s(s['start_s'])}–{fmt_s(s['end_s'])} | {s['beat']} | {vis} | {cap} | {vo} | {s['source']} |")
    L.append("")
    L.append("## Voiceover script")
    L.append("")
    for s in script["shots"]:
        if s.get("voiceover"):
            L.append(f"- **{fmt_s(s['start_s'])}** {s['voiceover']}")
    L.append("")
    L.append(f"{st['voiceover_words']} words over {fmt_s(script['duration_s'])} ({st['voiceover_wps']} words/s).")
    L.append("")
    L.append("## On-screen captions")
    L.append("")
    for s in script["shots"]:
        for line in str(s.get("caption", "")).split("\n"):
            if line:
                L.append(f"- `{fmt_s(s['start_s'])}` {line}")
    L.append("")
    L.append("## Shot prompts")
    L.append("")
    for s in script["shots"]:
        if not s.get("prompt"):
            L.append(f"**Shot {s['id']} ({s['source']}):** {s['visual']}")
            L.append("")
            continue
        L.append(f"**Shot {s['id']} · {s['beat']} · {s['source']}**")
        L.append("")
        if s["source"] == "image-to-video":
            L.append("First frame (image model):")
            L.append("")
            L.append("```text")
            L.append(prompt_image(s, script))
            L.append("```")
            L.append("")
        L.append("Video (Kling):")
        L.append("")
        L.append("```text")
        L.append(prompt_kling(s, script))
        L.append("```")
        L.append("")
        L.append("Video with speech (Veo 3):")
        L.append("")
        L.append("```text")
        L.append(prompt_veo3(s, script))
        L.append("```")
        L.append("")
    L.append("## CTA")
    L.append("")
    L.append(f"Spoken: {script['cta']['text']}  ")
    L.append(f"On screen: {script['cta'].get('on_screen', '')}")
    L.append("")
    L.append("## Claims and evidence")
    L.append("")
    claims = script.get("claims", [])
    if claims:
        L.append("| Claim | Evidence |")
        L.append("|---|---|")
        for c in claims:
            L.append(f"| {c['text']} | {c['evidence']} |")
    else:
        L.append("No factual claims in this script.")
    L.append("")
    L.append("## Compliance")
    L.append("")
    L.append(f"- AI label on screen: `{comp.get('ai_label', '')}`")
    L.append(f"- Platform AI-content toggle: {'on' if comp.get('platform_toggle') else 'not yet set'}")
    L.append(f"- Presenter: {pres['type'].replace('_', ' ')}; " + (
        "fictional, not modelled on any real person" if pres['type'] == 'ai_generated' else
        "real person with a signed release" if pres['type'] == 'real_person' else "no presenter"))
    for note in comp.get("notes", []):
        L.append(f"- {note}")
    L.append("")
    return "\n".join(L)


# ---------------------------------------------------------------- scaffold

def scaffold(vertical, product, duration=30, presenter="ai_generated"):
    # Beat shares from references/structure.md (30 s column), scaled to the duration.
    shares = [("hook", 2), ("problem", 5), ("demo", 12), ("proof", 7), ("cta", 4)]
    total = sum(v for _, v in shares)
    shots, t = [], 0
    for i, (beat, share) in enumerate(shares, 1):
        length = HOOK_MAX_S if beat == "hook" else round((duration - HOOK_MAX_S) * share / (total - 2), 1)
        end = duration if beat == "cta" else round(t + length, 1)
        shots.append({
            "id": i, "beat": beat, "start_s": t, "end_s": end,
            "visual": f"[{beat}] what the viewer sees",
            "camera": "handheld phone, eye level",
            "caption": "AI-generated ad" if beat == "hook" else "",
            "voiceover": "",
            "source": "image-to-video",
            "prompt": {"subject": "", "action": "", "setting": "", "camera": "static handheld, slight sway", "lighting": "", "negative": ""},
        })
        t = end
    return {
        "title": f"{product}: 30 s UGC draft",
        "vertical": vertical,
        "product": {"name": product, "one_liner": ""},
        "platforms": ["tiktok", "reels", "shorts"],
        "aspect": "9:16",
        "duration_s": duration,
        "audience": "",
        "presenter": {"type": presenter, "description": "" if presenter != "none" else None},
        "hook": {"type": "", "text": "", "why": ""},
        "style": "candid phone footage, natural light, realistic skin texture",
        "shots": shots,
        "claims": [],
        "cta": {"text": "", "on_screen": ""},
        "compliance": {"ai_label": "AI-generated ad", "platform_toggle": False, "notes": []},
    }


# ---------------------------------------------------------------- main

def main(argv=None):
    ap = argparse.ArgumentParser(prog="ugc_script.py", description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("lint", help="structure and compliance checks")
    a.add_argument("script")
    a.add_argument("--max-wps", type=float, default=DEFAULT_MAX_WPS, help="voiceover words per second that trigger a warning")
    a.add_argument("--strict", action="store_true", help="exit 1 on warnings too")
    a = sub.add_parser("render", help="Markdown script sheet")
    a.add_argument("script")
    a.add_argument("--out")
    a = sub.add_parser("prompts", help="per-shot prompts")
    a.add_argument("script")
    a.add_argument("--model", choices=["veo3", "kling", "image", "all"], default="all")
    a = sub.add_parser("stats", help="numbers about the script")
    a.add_argument("script")
    a = sub.add_parser("new", help="scaffold a script JSON")
    a.add_argument("--vertical", required=True)
    a.add_argument("--product", required=True)
    a.add_argument("--duration", type=int, default=30)
    a.add_argument("--presenter", choices=PRESENTERS, default="ai_generated")
    args = ap.parse_args(argv)

    if args.cmd == "new":
        print(json.dumps(scaffold(args.vertical, args.product, args.duration, args.presenter), indent=2, ensure_ascii=False))
        return 0
    script = load(args.script)
    if args.cmd == "lint":
        r = lint(script, args.max_wps)
        print_report(r, args.script)
        return 0 if r.ok and not (args.strict and r.warnings) else 1
    if args.cmd == "render":
        md = render_markdown(script)
        if args.out:
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write(md)
            print(f"wrote {args.out}")
        else:
            sys.stdout.write(md)
        return 0
    if args.cmd == "prompts":
        sys.stdout.write(render_prompts(script, args.model))
        return 0
    if args.cmd == "stats":
        print(json.dumps(stats(script), indent=2))
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
