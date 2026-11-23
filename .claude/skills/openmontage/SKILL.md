---
name: openmontage
description: Produce a finished video with OpenMontage (OpenMontageInc/OpenMontage, AGPL-3.0), an agentic video production system with full pipelines - animated explainer, animation / motion graphics, avatar spokesperson, cinematic trailer or teaser, clip factory (ranked shorts from one long video), documentary montage from free stock and open archives, hybrid (own footage plus generated visuals). Research, script, narration, music, word-level subtitles, render and self-review. Use when the user asks for OpenMontage, or for one of those pipelines end to end (e.g. "make a 60-second animated explainer about...", "a documentary montage about...", "a cinematic trailer for...").
---

# OpenMontage

OpenMontage is a whole project, not a single skill. It lives in `~/OpenMontage` (cloned and set up by
`bash .claude/setup/setup-video-tools.sh`, pinned to commit 2e003e6). If that folder or `~/OpenMontage/.venv`
is missing, run the setup script first.

1. **Work from its folder.** Every OpenMontage command runs with `cd ~/OpenMontage` and its venv
   (`~/OpenMontage/.venv/bin/python`). Its own instructions are the rules: read `~/OpenMontage/AGENT_GUIDE.md`
   in full before acting on the request (its `CLAUDE.md` says the same), then follow its routing, pipelines
   (`pipeline_defs/`, `skills/`) and the Layer 3 skills it points to in `~/OpenMontage/.agents/skills/` or
   `~/OpenMontage/.claude/skills/`.
2. **Approvals.** OpenMontage asks for approval of creative decisions and paid provider calls. Put each of those
   questions to the user; do not approve on their behalf. Without keys in `~/OpenMontage/.env` it uses only the
   free paths (Remotion, Piper TTS, free stock); say so before planning a film that needs paid providers.
3. **Deliver into the user's workspace.** OpenMontage writes to `~/OpenMontage/projects/<project>/renders/`,
   which the user cannot open from the Claude app. Copy the final video(s) to `videos/openmontage/<project>/` in
   the primary working directory (gitignored) and send them to the user.

**Environment notes (this cloud session):** no GPU, so prefer the CPU paths; the system ffmpeg is 6.1.
**Licence:** AGPL-3.0. Videos made with it belong to the user (commercial use allowed). Modifying OpenMontage
itself and offering it to others, including as a network service, brings AGPL obligations: tell the user before
doing that.
