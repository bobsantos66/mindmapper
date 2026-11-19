<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="ugc-ad-director by UniqAI" src="assets/banner.svg" width="1280" height="320">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-d1fe17?style=flat-square&labelColor=0d0f12)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-d1fe17?style=flat-square&labelColor=0d0f12)](#установка)
[![Cursor](https://img.shields.io/badge/Cursor-rules-d1fe17?style=flat-square&labelColor=0d0f12)](#установка)
[![Codex](https://img.shields.io/badge/Codex-AGENTS.md-d1fe17?style=flat-square&labelColor=0d0f12)](#установка)
[![By UniqAI](https://img.shields.io/badge/made_by-UniqAI-fdfc07?style=flat-square&labelColor=0d0f12)](https://uniqai.app/?utm_source=github&utm_medium=readme-ru&utm_campaign=ugc-ad-director)

**Сценарии UGC-рекламы с ИИ: хук за 2 секунды, список кадров, субтитры, промпты для Kling / Veo, линт на соответствие правилам.**

[Быстрый старт](#быстрый-старт) · [Как это работает](#как-это-работает) · [Примеры](#примеры) · [Установка](#установка) · [FAQ](#faq)

</div>

[English](README.md) · Русский · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

# ugc-ad-director: сценарии UGC-рекламы с ИИ и промпты для видео

UGC-реклама с ИИ начинается со сценария, а не с промпта. Этот скилл превращает бриф на продукт в сценарий ролика для TikTok / Reels / Shorts: хук в первые две секунды, пять битов с таймингом (hook → problem → demo → proof → CTA, то есть хук → проблема → демонстрация → доказательство → призыв к действию), список кадров, экранные субтитры, закадровый текст и промпт на каждый кадр для модели изображений, для Kling и для Veo 3 с репликами. Python-скрипт на стандартной библиотеке линтит результат и отбраковывает то, что нельзя выпускать: ИИ-ведущего, говорящего как покупатель, «clinically proven» без источника, отсутствующую пометку об ИИ.

Он пишет черновики, а не выдумывает. Ведущие это вымышленные демонстраторы, у каждого утверждения должны быть доказательства, а пометка `AI-generated ad` стоит в субтитрах с первого кадра. Этика зашита в линт, а не в сноску.

| **Хук к 2.0 с** | **Промпты на каждый кадр, под каждую модель** | **Несоответствие правилам валит сборку** |
|:---|:---|:---|
| Не больше двенадцати слов, произносятся и выводятся субтитром одновременно, выбираются из библиотеки хуков по категории. | Первый кадр для image-to-video, промпт клипа для Kling, промпт для Veo 3 с диалогом; одинаковое описание ведущего во всех кадрах. | Фальшивые отзывы, ссылки на одобрение платформ, утверждения без доказательств и отсутствие пометки об ИИ это ошибки, а не предупреждения. |

## Быстрый старт

```bash
git clone https://github.com/uniqaiapp/ugc-ad-director && cd ugc-ad-director
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out serum.md
```

Первая команда печатает `ok, 0 errors, 0 warnings`; вторая записывает лист сценария с таблицей таймлайна, закадровым текстом, субтитрами, промптами кадров, утверждениями и чек-листом соответствия. В агенте скажите «напиши 30-секундную UGC-рекламу для <URL продукта>», и скилл сделает то же самое из вашего брифа.

## Демо

<img alt="ugc-ad-director demo: lint rejects a fake-testimonial script, then renders a clean one" src="assets/demo.svg" width="820">

## Как это работает

1. **Бриф → факты.** Из URL или строки текста скилл извлекает одну вещь, которую делает продукт, для кого он, какое раздражение убирает и всё, что можно проверить (этикетка, спецификация, экран). Больше ничего не попадает внутрь; «revolutionary» это не факт.
2. **Сначала хук.** Одна мысль, ≤ 12 слов, срабатывает к 2.0 с, субтитр и закадровый текст вместе, потому что звук обычно выключен. В [`references/hook-library.md`](references/hook-library.md) хуки собраны по категории и типу (обращение, контраст, результат вперёд, сравнение, тест, который зритель может сделать прямо сейчас) плюс список хуков, которых стоит избегать.
3. **Пять битов с таймингом.** hook → problem → demo → proof → cta, масштабируются под 15, 20, 30, 45 или 60 с ([`references/structure.md`](references/structure.md)). Demo самый длинный и показывает одно действие. Proof это что-то проверяемое, лучше всего реальные съёмки реального продукта или реальная запись экрана, даже внутри полностью сгенерированного ролика.
4. **Кадры → промпты.** У каждого кадра есть `subject`, `action`, `camera`, `setting`, `lighting`, `negative`, `audio`. `scripts/ugc_script.py prompts` рендерит их как стоп-кадр для первого фрейма, промпт клипа для Kling (5 или 10 с, негативный промпт, без слоу-мо) и промпт для Veo 3 с репликой в поле `Dialogue` ([`references/model-prompts.md`](references/model-prompts.md)).
5. **Линт.** Таймлайн непрерывен и заканчивается на `duration_s`; хук ≤ 2 с; биты по порядку; субтитры ≤ 48 символов в строке; темп закадрового текста на кадр; у каждого генерируемого кадра есть промпт; формулировки от первого лица покупателя при ИИ-ведущем это ошибка; «proven», «guaranteed», «#1», проценты и «results in N days» должны лежать в `claims` с доказательствами; пометка об ИИ должна быть в субтитре. Полный список в [`references/script-format.md`](references/script-format.md).

```
brief ──▶ hook ──▶ beats + timings ──▶ shots ──▶ script.json
                                                   │
                     lint (structure + compliance) ◀┘──▶ render (.md sheet) ──▶ prompts (image / kling / veo3)
```

Единственные числа в этом README получены командой `python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json`: 6 кадров, хук заканчивается на 2 с, 75 слов закадрового текста за 30 с (2.5 слова/с), 7 строк субтитров, самая длинная 41 символ, 5 генерируемых кадров, 2 утверждения с доказательствами. Разбивка на биты и потолок темпа 3.5 слова/с это рабочие значения по умолчанию, а не измеренные оптимумы; репозиторий ничего не утверждает про удержание или конверсию.

## Примеры

Одиннадцать сценариев из разных ниш в [`examples/`](examples/README.md): уход за кожей, приложение для планирования питания, кухонный гаджет, лакомства для собак (реальный покупатель с подписанным разрешением), языковой курс, B2B-выставление счетов, чистящий спрей без закадрового текста, беговые кроссовки, eSIM для путешествий, подписка на кофе и камера для питомцев. Каждый отрендеренный лист и файл с промптами закоммичен и побайтово воспроизводится тестами.

<details>
<summary><b>Бриф → первые десять секунд сценария (skincare-serum)</b></summary>

**До** (бриф)

```text
Dewline Barrier Serum: fragrance-free hydrating serum with ceramides and 2% niacinamide.
Audience: women 22-35 with dry, flaky skin under makeup. 30 s, AI presenter.
```

**После** (первые три строки таймлайна в `examples/rendered/skincare-serum.md`)

```text
| # | Time | Beat | Visual | Caption | Voiceover | Source |
|---|---|---|---|---|---|---|
| 1 | 0s–2s | hook | Close-up of a fingertip dragging foundation across dry, flaky cheek; product in the mirror | Your foundation isn't the problem. / AI-generated ad | Your foundation isn't the problem. | image-to-video |
| 2 | 2s–7s | problem | Presenter to camera, towel on hair, holding up a flaky makeup sponge | dry skin + makeup = cake | Dry skin drinks the water out of your makeup, so it cakes by lunch. | image-to-video |
| 3 | 7s–15s | demo | Two drops of serum pressed into the cheek with two fingers; skin goes from matte-flaky to even | two drops, press, don't rub | Two drops. Press it in with two fingers, don't rub. Ceramides fill the cracks, niacinamide calms the red. | image-to-video |
```

Промпт для Veo 3 для кадра 2 (из `examples/prompts/skincare-serum.txt`):

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
<summary><b>Что отбраковывает линт (examples/bad/fake-testimonial.json)</b></summary>

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

Восемь предупреждений (длина субтитров, темп, неучтённые числа, не включённый переключатель платформы, неописанный ведущий) здесь опущены; `python3 scripts/ugc_script.py lint examples/bad/fake-testimonial.json` печатает их все.

</details>

<details>
<summary><b>Начать новый сценарий</b></summary>

```bash
python3 scripts/ugc_script.py new --vertical pets --product "Bitewell Chews" --duration 30 --presenter none > chews.json
# fill in visuals, captions, voiceover, prompts, claims; then
python3 scripts/ugc_script.py lint chews.json --strict
python3 scripts/ugc_script.py prompts chews.json --model veo3
```

</details>

Где рендерить промпты: в любом инструменте image-to-video, который принимает стартовый кадр и текст. Мы используем [страницу image-to-video в UniqAI](https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=readme-ru&utm_campaign=ugc-ad-director), где фото продукта становится первым кадром клипа; форматы Kling и Veo 3 из этого репозитория это те же форматы, что используются там.

## Установка

Работает с любым агентом, который читает файлы инструкций. Выберите свой. Python 3.9+; пакеты ставить не нужно.

<details open>
<summary><b>Claude Code</b></summary>

```bash
# user-level
git clone https://github.com/uniqaiapp/ugc-ad-director ~/.claude/skills/ugc-ad-director
# or project-level
git clone https://github.com/uniqaiapp/ugc-ad-director .claude/skills/ugc-ad-director
```

Дальше `/ugc-ad-director` в любой сессии, или просто опишите ролик; скилл срабатывает по своему `description`. Клон приносит с собой `scripts/` и `references/`, которые нужны скиллу.

</details>

<details>
<summary><b>Cursor</b></summary>

Скопируйте [`SKILL.md`](SKILL.md), `scripts/`, `references/` и [`.cursor/rules/ugc-ad-director.mdc`](.cursor/rules/ugc-ad-director.mdc) в свой проект. Файл правила встраивает скилл.

</details>

<details>
<summary><b>Codex / любой агент с AGENTS.md</b></summary>

Скопируйте `SKILL.md`, `scripts/` и `references/` в `.agents/skills/ugc-ad-director/` и добавьте сниппет из [`codex/INSTRUCTIONS.md`](codex/INSTRUCTIONS.md) в свой `AGENTS.md`. [`AGENTS.md`](AGENTS.md) в этом репозитории это универсальная версия.

</details>

<details>
<summary><b>Обычный промпт</b></summary>

Вставьте [`SKILL.md`](SKILL.md) в системный промпт любой модели, а если позволяет контекст, добавьте `references/structure.md` и `references/compliance.md`. Кроме frontmatter, в нём нет синтаксиса, привязанного к конкретному агенту. Для линта по-прежнему нужен Python.

</details>

<details>
<summary><b>Без агента</b></summary>

```bash
python3 scripts/ugc_script.py --help
```

`lint`, `render`, `prompts`, `stats` и `new` работают автономно с любым JSON сценария.

</details>

## FAQ

<details>
<summary><b>Может ли ИИ-ведущий сказать, что ему нравится продукт?</b></summary>

Нет. ИИ-ведущий это демонстратор: он показывает, объясняет, сравнивает и спрашивает. «I've been using this», «changed my life», «honest review» и «not sponsored» это опыт покупателя от первого лица, и при сгенерированном или отсутствующем ведущем это сфабрикованный отзыв. Линт их отклоняет. Реальный покупатель с подписанным разрешением может так говорить; см. `examples/scripts/dog-dental-chews.json`.

</details>

<details>
<summary><b>Обязательно ли помечать ролик как сгенерированный ИИ?</b></summary>

Скилл ставит `AI-generated ad` в субтитр с первого кадра и рассчитывает, что в настройках платформы включён флаг ИИ-контента. У TikTok, Meta и YouTube есть свои правила раскрытия для реалистичного сгенерированного контента, правило FTC о фальшивых отзывах и рекомендациях распространяется на сгенерированных ИИ людей, а статья о прозрачности AI Act ЕС применяется с августа 2026 года. Детали и даты в [`references/compliance.md`](references/compliance.md). Перед запуском прочитайте актуальные страницы политик; этот репозиторий пересказывает, а не цитирует.

</details>

<details>
<summary><b>Под какие модели сделаны промпты?</b></summary>

Три выхода на каждый генерируемый кадр: стоп-кадр для первого фрейма (любая модель изображений), промпт клипа в стиле Kling (5 или 10 с, негативный промпт) и промпт в стиле Veo 3 с репликой в виде диалога и строкой фонового звука. Длина клипов и поддержка звука меняются от релиза к релизу; шаблоны лежат в [`references/model-prompts.md`](references/model-prompts.md) и легко адаптируются под Runway, Wan или Seedance.

</details>

<details>
<summary><b>Доказывает ли линт, что ролик соответствует правилам?</b></summary>

Нет. Он ловит ошибки, которые знает: тайминг, темп, длина субтитров, английские формулировки отзывов и утверждений, отсутствующие пометки, слова об одобрении. Он не может проверить, что ваши доказательства настоящие, не читает другие языки и не знает, что платформа поменяла политику на прошлой неделе. Он делает очевидные ошибки невозможными, а остальные видимыми.

</details>

<details>
<summary><b>Почему JSON, а не текстовый сценарий?</b></summary>

Потому что тайминги, субтитры, утверждения и промпты нужно сверять друг с другом, а таблицу в документе пролинтить нельзя. JSON это источник; `render` даёт читаемый лист.

</details>

## Смежные проекты

- [video-director](https://github.com/uniqaiapp/video-director): превращает идею из одной строки в покадровый промпт для моделей ИИ-видео (Kling, Veo, Sora и другие) со словарём камеры, света и движения. Используйте его, когда ролику нужны кинематографичные кадры, а не UGC.
- [awesome-ai-video-prompts](https://github.com/uniqaiapp/awesome-ai-video-prompts): подборка промптов для ИИ-видео по категориям, с настройками, на которых они были сгенерированы.
- [no-plastic](https://github.com/uniqaiapp/no-plastic): правила промптов и чекер для естественных ИИ-портретов; примените их к первому кадру с ведущим.
- [ai-video-pricing](https://github.com/uniqaiapp/ai-video-pricing): проверенная вручную таблица цен на генерацию ИИ-видео, за секунду и за клип, чтобы посчитать бюджет списка кадров.

## Участие в проекте

Issues и pull request приветствуются. Делайте изменения небольшими и прикладывайте к описанию PR пример «до/после».
Локальные проверки описаны в [CONTRIBUTING.md](CONTRIBUTING.md) (`python3 tests/run.py`, без зависимостей).

## Лицензия

[MIT](LICENSE) © UniqAI для кода и примеров; `references/` под CC BY 4.0.

---

<div align="center">

<sub>Проект <a href="https://uniqai.app/?utm_source=github&utm_medium=readme-ru&utm_campaign=ugc-ad-director">UniqAI</a> — Kling 3.0, Veo 3, Flux, Nano Banana и GPT-5/Claude/Gemini/Grok в одном приложении. Черновики собственной рекламы мы пишем этим скиллом.</sub>

</div>
