<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="ugc-ad-director by UniqAI" src="assets/banner.svg" width="1280" height="320">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-d1fe17?style=flat-square&labelColor=0d0f12)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-d1fe17?style=flat-square&labelColor=0d0f12)](#설치)
[![Cursor](https://img.shields.io/badge/Cursor-rules-d1fe17?style=flat-square&labelColor=0d0f12)](#설치)
[![Codex](https://img.shields.io/badge/Codex-AGENTS.md-d1fe17?style=flat-square&labelColor=0d0f12)](#설치)
[![By UniqAI](https://img.shields.io/badge/made_by-UniqAI-fdfc07?style=flat-square&labelColor=0d0f12)](https://uniqai.app/?utm_source=github&utm_medium=readme-ko&utm_campaign=ugc-ad-director)

**AI UGC 광고 스크립트: 2초 훅, 샷 리스트, 자막, Kling / Veo 프롬프트, 컴플라이언스 린트.**

[빠른 시작](#빠른-시작) · [동작 방식](#동작-방식) · [예제](#예제) · [설치](#설치) · [자주 묻는 질문](#자주-묻는-질문)

</div>

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [日本語](README.ja.md) · 한국어

# ugc-ad-director: AI UGC 광고 스크립트와 영상 프롬프트

AI UGC 광고는 프롬프트가 아니라 스크립트에서 시작합니다. 이 스킬은 제품 브리프를 TikTok / Reels / Shorts 광고 스크립트로 바꿉니다. 첫 2초 안에 들어가는 훅, 시간이 지정된 다섯 개의 비트(hook → problem → demo → proof → CTA, 즉 훅 → 문제 → 시연 → 증거 → 행동 유도), 샷 리스트, 화면 자막, 보이스오버, 그리고 샷마다 이미지 모델용, Kling용, 대사가 포함된 Veo 3용 프롬프트가 나옵니다. 표준 라이브러리 전용 Python 스크립트가 결과를 린트하고, 내보내면 안 되는 것을 거부합니다. 고객처럼 말하는 AI 프레젠터, 출처 없는 "clinically proven"(임상 검증), 빠진 AI 표시 같은 것들입니다.

초안을 쓰는 도구이지, 지어내는 도구가 아닙니다. 프레젠터는 가상의 시연자이고, 모든 주장에는 근거가 필요하며, `AI-generated ad` 표시는 첫 프레임부터 자막으로 들어갑니다. 윤리는 각주가 아니라 린트 안에 있습니다.

| **2.0초 안에 훅** | **샷마다, 모델마다 프롬프트** | **빌드를 실패시키는 컴플라이언스** |
|:---|:---|:---|
| 최대 열두 단어, 말과 자막이 동시에 나가며, 카테고리별 훅 라이브러리에서 고릅니다. | 이미지 투 비디오용 첫 프레임, Kling 클립 프롬프트, 대사가 들어간 Veo 3 프롬프트. 프레젠터 묘사는 샷 전체에서 일관되게 유지됩니다. | 가짜 후기, 플랫폼 보증, 근거 없는 주장, 빠진 AI 표시는 경고가 아니라 오류입니다. |

## 빠른 시작

```bash
git clone https://github.com/uniqaiapp/ugc-ad-director && cd ugc-ad-director
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out serum.md
```

첫 번째 명령은 `ok, 0 errors, 0 warnings`를 출력합니다. 두 번째 명령은 타임라인 표, 보이스오버, 자막, 샷 프롬프트, 주장, 컴플라이언스 체크리스트가 담긴 스크립트 시트를 씁니다. 에이전트에서는 "<제품 URL>으로 30초짜리 UGC 광고 써 줘"라고 말하면 스킬이 브리프를 바탕으로 같은 작업을 합니다.

## 데모

<img alt="ugc-ad-director demo: lint rejects a fake-testimonial script, then renders a clean one" src="assets/demo.svg" width="820">

## 동작 방식

1. **브리프 → 사실.** URL이나 한 줄짜리 텍스트에서 스킬은 제품이 하는 일 한 가지, 대상 고객, 제품이 없애 주는 불편, 그리고 확인 가능한 것(라벨, 사양, 화면)을 추출합니다. 그 외에는 아무것도 들어가지 않습니다. "revolutionary"(혁신적)는 사실이 아닙니다.
2. **훅이 먼저.** 아이디어 하나, 12단어 이하, 2.0초 안에 들어가며, 소리가 꺼져 있는 경우가 많으므로 자막과 보이스오버를 함께 씁니다. [`references/hook-library.md`](references/hook-library.md)에 카테고리와 유형(콜아웃, 반론, 결과 먼저, 비교, 시청자가 지금 해 볼 수 있는 테스트)별 훅과 피해야 할 훅 목록이 있습니다.
3. **시간이 지정된 다섯 비트.** hook → problem → demo → proof → cta를 15, 20, 30, 45, 60초에 맞춰 배분합니다([`references/structure.md`](references/structure.md)). demo가 가장 길고 동작 하나만 보여 줍니다. proof는 확인 가능한 것이어야 하며, 나머지가 전부 생성된 광고라도 실제 제품의 실제 영상이나 실제 화면 녹화가 가장 좋습니다.
4. **샷 → 프롬프트.** 각 샷에는 `subject`, `action`, `camera`, `setting`, `lighting`, `negative`, `audio`가 들어갑니다. `scripts/ugc_script.py prompts`가 이를 첫 프레임용 스틸, Kling 클립 프롬프트(5초 또는 10초, 네거티브 프롬프트, 슬로모션 없음), 대사를 `Dialogue`로 넣은 Veo 3 프롬프트로 렌더링합니다([`references/model-prompts.md`](references/model-prompts.md)).
5. **린트.** 타임라인이 끊김 없이 이어져 `duration_s`에서 끝나는지, 훅이 2초 이내인지, 비트 순서가 맞는지, 자막이 줄당 48자 이하인지, 샷별 보이스오버 속도, 생성되는 모든 샷에 프롬프트가 있는지를 검사합니다. AI 프레젠터가 1인칭 고객 화법을 쓰면 오류입니다. "proven", "guaranteed", "#1", 퍼센트, "results in N days"는 근거와 함께 `claims`에 들어 있어야 합니다. AI 표시는 자막에 반드시 나타나야 합니다. 전체 목록은 [`references/script-format.md`](references/script-format.md)에 있습니다.

```
brief ──▶ hook ──▶ beats + timings ──▶ shots ──▶ script.json
                                                   │
                     lint (structure + compliance) ◀┘──▶ render (.md sheet) ──▶ prompts (image / kling / veo3)
```

이 README에 나오는 숫자는 전부 `python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json`에서 나온 것입니다. 샷 6개, 훅은 2초에 종료, 30초 동안 보이스오버 75단어(2.5단어/초), 자막 7줄, 가장 긴 줄 41자, 생성 샷 5개, 근거가 있는 주장 2개. 비트 배분과 3.5단어/초 속도 상한은 실무 기본값이지 측정된 최적값이 아닙니다. 이 저장소는 유지율이나 전환율에 대해 어떤 주장도 하지 않습니다.

## 예제

[`examples/`](examples/README.md)에 여러 업종의 스크립트 11개가 있습니다. 스킨케어, 식단 관리 앱, 주방 도구, 반려견 간식(동의서를 받은 실제 고객), 어학 강의, B2B 인보이스, 보이스오버 없는 청소 스프레이, 러닝화, 여행용 eSIM, 커피 구독, 반려동물 카메라. 렌더링된 시트와 프롬프트 파일은 모두 커밋되어 있고 테스트가 바이트 단위로 재현합니다.

<details>
<summary><b>브리프 → 스크립트의 첫 10초(skincare-serum)</b></summary>

**변환 전**(브리프)

```text
Dewline Barrier Serum: fragrance-free hydrating serum with ceramides and 2% niacinamide.
Audience: women 22-35 with dry, flaky skin under makeup. 30 s, AI presenter.
```

**변환 후**(`examples/rendered/skincare-serum.md` 타임라인의 첫 세 행)

```text
| # | Time | Beat | Visual | Caption | Voiceover | Source |
|---|---|---|---|---|---|---|
| 1 | 0s–2s | hook | Close-up of a fingertip dragging foundation across dry, flaky cheek; product in the mirror | Your foundation isn't the problem. / AI-generated ad | Your foundation isn't the problem. | image-to-video |
| 2 | 2s–7s | problem | Presenter to camera, towel on hair, holding up a flaky makeup sponge | dry skin + makeup = cake | Dry skin drinks the water out of your makeup, so it cakes by lunch. | image-to-video |
| 3 | 7s–15s | demo | Two drops of serum pressed into the cheek with two fingers; skin goes from matte-flaky to even | two drops, press, don't rub | Two drops. Press it in with two fingers, don't rub. Ceramides fill the cracks, niacinamide calms the red. | image-to-video |
```

샷 2의 Veo 3 프롬프트(`examples/prompts/skincare-serum.txt`에서 발췌):

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
<summary><b>린트가 거부하는 것(examples/bad/fake-testimonial.json)</b></summary>

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

경고 여덟 개(자막 길이, 속도, 목록에 없는 숫자, 플랫폼 토글 누락, 묘사되지 않은 프레젠터)는 여기서 생략했습니다. `python3 scripts/ugc_script.py lint examples/bad/fake-testimonial.json`을 실행하면 전부 출력됩니다.

</details>

<details>
<summary><b>새 스크립트 시작하기</b></summary>

```bash
python3 scripts/ugc_script.py new --vertical pets --product "Bitewell Chews" --duration 30 --presenter none > chews.json
# fill in visuals, captions, voiceover, prompts, claims; then
python3 scripts/ugc_script.py lint chews.json --strict
python3 scripts/ugc_script.py prompts chews.json --model veo3
```

</details>

프롬프트를 어디서 렌더링할지: 시작 프레임과 텍스트를 받는 이미지 투 비디오 도구라면 어디든 됩니다. 저희는 제품 사진이 클립의 첫 프레임이 되는 [UniqAI 이미지 투 비디오 페이지](https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=readme-ko&utm_campaign=ugc-ad-director)를 씁니다. 여기에 들어 있는 Kling과 Veo 3 포맷이 그곳에서 쓰는 것과 같습니다.

## 설치

지시 파일을 읽는 모든 에이전트에서 동작합니다. 쓰는 도구를 고르세요. Python 3.9+이면 되고, 별도로 설치할 패키지는 없습니다.

<details open>
<summary><b>Claude Code</b></summary>

```bash
# user-level
git clone https://github.com/uniqaiapp/ugc-ad-director ~/.claude/skills/ugc-ad-director
# or project-level
git clone https://github.com/uniqaiapp/ugc-ad-director .claude/skills/ugc-ad-director
```

그다음 아무 세션에서나 `/ugc-ad-director`를 입력하거나 그냥 광고를 설명하면 됩니다. 스킬의 `description`이 트리거합니다. 클론하면 스킬에 필요한 `scripts/`와 `references/`가 함께 따라옵니다.

</details>

<details>
<summary><b>Cursor</b></summary>

[`SKILL.md`](SKILL.md), `scripts/`, `references/`, [`.cursor/rules/ugc-ad-director.mdc`](.cursor/rules/ugc-ad-director.mdc)를 프로젝트에 복사합니다. 규칙 파일이 스킬을 포함합니다.

</details>

<details>
<summary><b>Codex / AGENTS.md를 읽는 모든 에이전트</b></summary>

`SKILL.md`, `scripts/`, `references/`를 `.agents/skills/ugc-ad-director/`에 복사하고, [`codex/INSTRUCTIONS.md`](codex/INSTRUCTIONS.md)의 스니펫을 프로젝트의 `AGENTS.md`에 추가합니다. 이 저장소의 [`AGENTS.md`](AGENTS.md)가 범용 버전입니다.

</details>

<details>
<summary><b>일반 프롬프트로</b></summary>

[`SKILL.md`](SKILL.md)를 아무 모델의 시스템 프롬프트에 붙여 넣습니다. 컨텍스트가 허락하면 `references/structure.md`와 `references/compliance.md`도 함께 넣습니다. 프런트매터를 제외하면 에이전트 전용 문법이 없습니다. 린트에는 여전히 Python이 필요합니다.

</details>

<details>
<summary><b>에이전트 없이</b></summary>

```bash
python3 scripts/ugc_script.py --help
```

`lint`, `render`, `prompts`, `stats`, `new`는 어떤 스크립트 JSON에든 단독으로 실행됩니다.

</details>

## 자주 묻는 질문

<details>
<summary><b>AI 프레젠터가 제품을 정말 좋아한다고 말해도 되나요?</b></summary>

안 됩니다. AI 프레젠터는 시연자입니다. 보여 주고, 설명하고, 비교하고, 질문합니다. "I've been using this"(계속 써 봤는데), "changed my life"(인생이 바뀌었어요), "honest review"(솔직 후기), "not sponsored"(협찬 아님)는 1인칭 고객 경험이고, 생성된 프레젠터나 프레젠터가 없는 광고에서는 지어낸 후기가 됩니다. 린트가 거부합니다. 동의서에 서명한 실제 고객은 말할 수 있습니다. `examples/scripts/dog-dental-chews.json`을 보세요.

</details>

<details>
<summary><b>광고에 AI 생성 표시를 꼭 해야 하나요?</b></summary>

스킬은 첫 프레임부터 자막에 `AI-generated ad`를 넣고, 플랫폼의 AI 콘텐츠 설정이 켜져 있을 것으로 기대합니다. TikTok, Meta, YouTube는 각각 사실적인 생성 콘텐츠에 대한 공개 규정을 두고 있고, 가짜 리뷰와 후기에 관한 FTC 규정은 AI로 생성된 인물에도 적용되며, EU AI Act의 투명성 조항은 2026년 8월부터 적용됩니다. 세부 내용과 날짜는 [`references/compliance.md`](references/compliance.md)에 있습니다. 출시 전에 실제 정책 페이지를 읽으세요. 이 저장소는 요약만 할 뿐 인용하지 않습니다.

</details>

<details>
<summary><b>프롬프트는 어떤 모델을 대상으로 하나요?</b></summary>

생성되는 샷마다 세 가지 출력이 나옵니다. 첫 프레임용 스틸(아무 이미지 모델), Kling 스타일 클립 프롬프트(5초 또는 10초, 네거티브 프롬프트), 대사를 Dialogue로 넣고 앰비언트 오디오 한 줄을 더한 Veo 3 스타일 프롬프트입니다. 클립 길이와 오디오 지원은 릴리스마다 바뀝니다. 패턴은 [`references/model-prompts.md`](references/model-prompts.md)에 있고 Runway, Wan, Seedance에 맞게 고치기 쉽습니다.

</details>

<details>
<summary><b>린트가 광고의 규정 준수를 증명하나요?</b></summary>

아닙니다. 린트는 자기가 아는 실수만 잡습니다. 타이밍, 속도, 자막 길이, 영어 후기와 주장 표현, 빠진 표시, 보증 문구 같은 것들입니다. 근거가 진짜인지 확인할 수 없고, 다른 언어를 읽지 못하며, 지난주에 플랫폼 정책이 바뀐 것도 모릅니다. 뻔한 실수를 불가능하게 만들고 나머지를 눈에 보이게 할 뿐입니다.

</details>

<details>
<summary><b>왜 텍스트 스크립트가 아니라 JSON인가요?</b></summary>

타이밍, 자막, 주장, 프롬프트를 서로 대조해서 검사해야 하는데, 문서 안의 표는 린트할 수 없기 때문입니다. JSON이 원본이고, `render`가 읽기 좋은 시트를 만들어 줍니다.

</details>

## 관련 저장소

- [video-director](https://github.com/uniqaiapp/video-director): 한 줄 아이디어를 AI 영상 모델(Kling, Veo, Sora 등)용 샷 단위 프롬프트로 바꿉니다. 카메라, 조명, 모션 어휘가 들어 있습니다. UGC가 아니라 시네마틱한 샷이 필요한 광고에 쓰세요.
- [awesome-ai-video-prompts](https://github.com/uniqaiapp/awesome-ai-video-prompts): AI 영상 모델용 프롬프트를 분류별로 선별해 생성 당시 설정과 함께 정리한 모음입니다.
- [no-plastic](https://github.com/uniqaiapp/no-plastic): 자연스러운 AI 인물 사진을 위한 프롬프트 규칙과 검사기입니다. 프레젠터의 첫 프레임에 적용하세요.
- [ai-video-pricing](https://github.com/uniqaiapp/ai-video-pricing): AI 영상 생성 가격을 초당, 클립당으로 직접 확인해 정리한 표입니다. 샷 리스트 예산을 잡을 때 쓰세요.

## 기여하기

이슈와 풀 리퀘스트를 환영합니다. 변경은 작게 유지하고, PR 설명에 before/after 예제를 넣어 주세요.
로컬 검사 방법(`python3 tests/run.py`, 의존성 없음)은 [CONTRIBUTING.md](CONTRIBUTING.md)에 있습니다.

## 라이선스

코드와 예제는 [MIT](LICENSE) © UniqAI, `references/`는 CC BY 4.0입니다.

---

<div align="center">

<sub><a href="https://uniqai.app/?utm_source=github&utm_medium=readme-ko&utm_campaign=ugc-ad-director">UniqAI</a>가 만들었습니다. Kling 3.0, Veo 3, Flux, Nano Banana와 GPT-5/Claude/Gemini/Grok을 앱 하나에서 씁니다. 저희 광고 초안도 이 스킬로 씁니다.</sub>

</div>
