# Contributing

Thanks for helping. Small, focused changes land fastest.

## What is welcome

- New example scripts in `examples/scripts/` for verticals not yet covered. They must pass `lint` with zero errors and zero warnings and have their outputs committed (see below).
- Hooks for `references/hook-library.md`, tagged with a type and a category, ≤ 12 words, no first-person customer experience.
- Lint rules that catch a real mistake you saw in an ad draft, with a test in `tests/test_scripts.py`.
- Prompt-pattern fixes for a specific model version, stated as "on Kling X / Veo Y, on <date>".
- Corrections to `references/compliance.md` with a link to the policy page and the date you read it.

## Local checks

```bash
python3 tests/run.py
```

No packages to install; Python 3.9+ only. After changing `scripts/ugc_script.py` or any example, regenerate the committed outputs so the byte-for-byte tests pass:

```bash
for f in examples/scripts/*.json; do
  n=$(basename "$f" .json)
  python3 scripts/ugc_script.py render "$f" --out "examples/rendered/$n.md"
  python3 scripts/ugc_script.py prompts "$f" --model all > "examples/prompts/$n.txt"
done
```

## Rules

- No personal names anywhere (author is UniqAI <support@uniqai.app>); no secrets; no real brands, real people or real customer quotes in examples.
- No invented numbers. Anything quantitative in README comes from `scripts/ugc_script.py stats` on a committed example or from a dated source.
- Keep `SKILL.md` under 500 lines; long material goes to `references/`.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), subject ≤ 72 characters.
- Include a before/after (a script that failed and now passes, or a rendered diff) in the PR description.

## Deviations from org conventions

- README follows the shared `README.template.md` (badge row, `<picture>` banner, collapsible sections) rather than the older section list in `CONVENTIONS.md` §4; the "Limits and honesty" and "Related" content is kept under the FAQ and a "Related" section.
- `references/` is CC BY 4.0 while code is MIT; `LICENSE` holds both texts with a header saying which paths fall under which.

## Reporting problems

Open an issue with the script JSON (redact product names if you must) and the lint output. Security or policy concerns: support@uniqai.app.
