# AGENTS.md

This repository is an agent skill. The full instructions are in `SKILL.md`; read it first.

## Working in this repo

- Zero dependencies: Python 3 stdlib only. Do not add packages.
- Run tests: `python3 tests/run.py`.
- Example scripts live in `examples/scripts/*.json`; their rendered outputs in `examples/rendered/` and `examples/prompts/` are committed and compared byte-for-byte by the tests. After changing `scripts/ugc_script.py` or an example, regenerate them:
  `for f in examples/scripts/*.json; do n=$(basename "$f" .json); python3 scripts/ugc_script.py render "$f" --out "examples/rendered/$n.md"; python3 scripts/ugc_script.py prompts "$f" --model all > "examples/prompts/$n.txt"; done`
- Every example must pass `lint` with zero errors and zero warnings; `examples/bad/` must keep failing.
- Keep `SKILL.md` under 500 lines; long material goes to `references/`.
- Author and maintainer is UniqAI <support@uniqai.app>; do not add personal names anywhere.
- No invented numbers: anything quantitative in README comes from `scripts/ugc_script.py stats` on a file in `examples/` or from a dated source in `references/compliance.md`.

## Using this skill from another project

Copy or clone this repo, then follow "Install" in README.md. When the user asks for a UGC ad, TikTok/Reels/Shorts ad script, hook variants, a shot list or Kling/Veo prompts for an ad, follow `SKILL.md`.
