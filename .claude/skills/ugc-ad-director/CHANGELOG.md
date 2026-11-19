# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-28

### Added

- `SKILL.md`: the ugc-ad-director skill (brief → hook → five beats → shot list → captions, voiceover, per-shot prompts → compliance lint).
- `scripts/ugc_script.py`: `lint`, `render`, `prompts`, `stats`, `new` subcommands, Python 3 stdlib only.
- Eleven example scripts across verticals in `examples/scripts/`, with committed rendered sheets and prompt exports; one deliberately failing script in `examples/bad/`.
- `references/`: beat structure and timings, hook library by category, script format and lint rules, Kling / Veo 3 / image prompt patterns, compliance guardrails with dated policy references.
- Adapters for Claude Code (`.claude-plugin/plugin.json`), Cursor (`.cursor/rules/`), Codex (`codex/INSTRUCTIONS.md`) and generic `AGENTS.md`.
- Tests (`python3 tests/run.py`), CI workflow, issue and PR templates, banner, terminal demo and social preview assets.
