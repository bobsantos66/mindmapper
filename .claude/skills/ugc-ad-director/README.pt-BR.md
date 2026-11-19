<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="ugc-ad-director by UniqAI" src="assets/banner.svg" width="1280" height="320">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-d1fe17?style=flat-square&labelColor=0d0f12)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-d1fe17?style=flat-square&labelColor=0d0f12)](#instalação)
[![Cursor](https://img.shields.io/badge/Cursor-rules-d1fe17?style=flat-square&labelColor=0d0f12)](#instalação)
[![Codex](https://img.shields.io/badge/Codex-AGENTS.md-d1fe17?style=flat-square&labelColor=0d0f12)](#instalação)
[![By UniqAI](https://img.shields.io/badge/made_by-UniqAI-fdfc07?style=flat-square&labelColor=0d0f12)](https://uniqai.app/?utm_source=github&utm_medium=readme-pt-br&utm_campaign=ugc-ad-director)

**Roteiros de anúncios UGC com IA: gancho em 2 segundos, lista de planos, legendas, prompts para Kling / Veo, lint de conformidade.**

[Início rápido](#início-rápido) · [Como funciona](#como-funciona) · [Exemplos](#exemplos) · [Instalação](#instalação) · [Perguntas frequentes](#perguntas-frequentes)

</div>

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · Português (BR) · [日本語](README.ja.md) · [한국어](README.ko.md)

# ugc-ad-director: roteiros de anúncios UGC com IA e prompts de vídeo

Anúncios UGC com IA começam com um roteiro, não com um prompt. Esta skill transforma um briefing de produto em um roteiro de anúncio para TikTok / Reels / Shorts com o gancho dentro dos primeiros dois segundos, cinco beats com tempo marcado (hook → problem → demo → proof → CTA, ou seja, gancho → problema → demonstração → prova → chamada para ação), uma lista de planos, legendas na tela, locução e um prompt por plano para o modelo de imagem, para o Kling e para o Veo 3 com falas. Um script Python só com a biblioteca padrão faz o lint do resultado e recusa o que não deveria ir ao ar: um apresentador de IA falando como cliente, "clinically proven" (clinicamente comprovado) sem fonte, a falta do rótulo de IA.

Ele redige; não inventa. Os apresentadores são demonstradores fictícios, toda alegação precisa de evidência, e o rótulo `AI-generated ad` é uma legenda desde o primeiro frame. A ética está no lint, não em uma nota de rodapé.

| **Gancho até 2.0 s** | **Prompts por plano, por modelo** | **Conformidade que reprova o build** |
|:---|:---|:---|
| No máximo doze palavras, faladas e legendadas ao mesmo tempo, escolhidas de uma biblioteca de ganchos por categoria. | Primeiro frame para imagem para vídeo, um prompt de clipe para Kling, um prompt para Veo 3 com diálogo; descrição do apresentador consistente entre os planos. | Depoimentos falsos, endossos de plataforma, alegações sem respaldo e a ausência do rótulo de IA são erros, não avisos. |

## Início rápido

```bash
git clone https://github.com/uniqaiapp/ugc-ad-director && cd ugc-ad-director
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out serum.md
```

O primeiro comando imprime `ok, 0 errors, 0 warnings`; o segundo escreve uma folha de roteiro com a tabela da linha do tempo, locução, legendas, prompts por plano, alegações e um checklist de conformidade. Em um agente, diga "escreva um anúncio UGC de 30 segundos para <URL do produto>" e a skill faz o mesmo a partir do seu briefing.

## Demo

<img alt="ugc-ad-director demo: lint rejects a fake-testimonial script, then renders a clean one" src="assets/demo.svg" width="820">

## Como funciona

1. **Briefing → fatos.** A partir de uma URL ou de uma linha de texto, a skill extrai a única coisa que o produto faz, para quem ele é, o incômodo que ele elimina e qualquer coisa verificável (rótulo, especificação, tela). Nada mais entra; "revolutionary" não é um fato.
2. **Gancho primeiro.** Uma ideia, ≤ 12 palavras, entregue até 2.0 s, legenda e locução juntas, porque o som geralmente está desligado. [`references/hook-library.md`](references/hook-library.md) tem ganchos por categoria e tipo (chamada direta, contrário ao senso comum, resultado primeiro, comparação, um teste que o espectador pode fazer agora) e uma lista de ganchos a evitar.
3. **Cinco beats com tempos.** hook → problem → demo → proof → cta, escalados para 15, 20, 30, 45 ou 60 s ([`references/structure.md`](references/structure.md)). A demonstração é a mais longa e mostra uma única ação. A prova é algo verificável, de preferência filmagem real do produto real ou uma gravação de tela real, mesmo dentro de um anúncio que no restante é gerado.
4. **Planos → prompts.** Cada plano carrega `subject`, `action`, `camera`, `setting`, `lighting`, `negative`, `audio`. `scripts/ugc_script.py prompts` renderiza cada um como uma imagem estática para o primeiro frame, um prompt de clipe para Kling (5 ou 10 s, prompt negativo, sem câmera lenta) e um prompt para Veo 3 com a fala como `Dialogue` ([`references/model-prompts.md`](references/model-prompts.md)).
5. **Lint.** Linha do tempo contígua e terminando em `duration_s`; gancho ≤ 2 s; beats em ordem; legendas com ≤ 48 caracteres por linha; ritmo da locução por plano; todo plano gerado tem prompt; frase de cliente em primeira pessoa com apresentador de IA é erro; "proven", "guaranteed", "#1", porcentagens e "results in N days" (resultados em N dias) precisam estar em `claims` com evidência; o rótulo de IA precisa aparecer em uma legenda. Lista completa em [`references/script-format.md`](references/script-format.md).

```
brief ──▶ hook ──▶ beats + timings ──▶ shots ──▶ script.json
                                                   │
                     lint (structure + compliance) ◀┘──▶ render (.md sheet) ──▶ prompts (image / kling / veo3)
```

Os únicos números citados neste README vêm de `python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json`: 6 planos, gancho termina em 2 s, 75 palavras de locução em 30 s (2.5 palavras/s), 7 linhas de legenda, a mais longa com 41 caracteres, 5 planos gerados, 2 alegações com evidência. As divisões dos beats e o teto de ritmo de 3.5 palavras/s são padrões de trabalho, não ótimos medidos; o repositório não afirma nada sobre retenção ou conversão.

## Exemplos

Onze roteiros em diferentes verticais em [`examples/`](examples/README.md): skincare, um app de planejamento de refeições, um utensílio de cozinha, petiscos para cachorro (cliente real com autorização de uso de imagem), um curso de idiomas, faturamento B2B, um spray de limpeza sem locução, tênis de corrida, um eSIM de viagem, uma assinatura de café e uma câmera para pets. Toda folha renderizada e todo arquivo de prompts estão commitados e são reproduzidos byte a byte pelos testes.

<details>
<summary><b>Briefing → primeiros dez segundos de um roteiro (skincare-serum)</b></summary>

**Antes** (o briefing)

```text
Dewline Barrier Serum: fragrance-free hydrating serum with ceramides and 2% niacinamide.
Audience: women 22-35 with dry, flaky skin under makeup. 30 s, AI presenter.
```

**Depois** (as três primeiras linhas da linha do tempo em `examples/rendered/skincare-serum.md`)

```text
| # | Time | Beat | Visual | Caption | Voiceover | Source |
|---|---|---|---|---|---|---|
| 1 | 0s–2s | hook | Close-up of a fingertip dragging foundation across dry, flaky cheek; product in the mirror | Your foundation isn't the problem. / AI-generated ad | Your foundation isn't the problem. | image-to-video |
| 2 | 2s–7s | problem | Presenter to camera, towel on hair, holding up a flaky makeup sponge | dry skin + makeup = cake | Dry skin drinks the water out of your makeup, so it cakes by lunch. | image-to-video |
| 3 | 7s–15s | demo | Two drops of serum pressed into the cheek with two fingers; skin goes from matte-flaky to even | two drops, press, don't rub | Two drops. Press it in with two fingers, don't rub. Ceramides fill the cracks, niacinamide calms the red. | image-to-video |
```

Prompt para Veo 3 do plano 2 (de `examples/prompts/skincare-serum.txt`):

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
<summary><b>O que o lint recusa (examples/bad/fake-testimonial.json)</b></summary>

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

Os oito avisos (tamanho de legenda, ritmo, números não listados, toggle de plataforma ausente, apresentador sem descrição) foram omitidos aqui; `python3 scripts/ugc_script.py lint examples/bad/fake-testimonial.json` imprime todos eles.

</details>

<details>
<summary><b>Começar um roteiro novo</b></summary>

```bash
python3 scripts/ugc_script.py new --vertical pets --product "Bitewell Chews" --duration 30 --presenter none > chews.json
# fill in visuals, captions, voiceover, prompts, claims; then
python3 scripts/ugc_script.py lint chews.json --strict
python3 scripts/ugc_script.py prompts chews.json --model veo3
```

</details>

Onde renderizar os prompts: qualquer ferramenta de imagem para vídeo que aceite um frame inicial e texto. Nós usamos a [página de imagem para vídeo da UniqAI](https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=readme-pt-br&utm_campaign=ugc-ad-director), onde uma foto do produto vira o primeiro frame de um clipe; os formatos de Kling e Veo 3 que vêm aqui são os usados lá.

## Instalação

Funciona com qualquer agente que leia arquivos de instruções. Escolha o seu. Python 3.9+; nenhum pacote para instalar.

<details open>
<summary><b>Claude Code</b></summary>

```bash
# user-level
git clone https://github.com/uniqaiapp/ugc-ad-director ~/.claude/skills/ugc-ad-director
# or project-level
git clone https://github.com/uniqaiapp/ugc-ad-director .claude/skills/ugc-ad-director
```

Depois, `/ugc-ad-director` em qualquer sessão, ou simplesmente descreva o anúncio; a `description` da skill a aciona. O clone traz `scripts/` e `references/` junto, e a skill precisa deles.

</details>

<details>
<summary><b>Cursor</b></summary>

Copie [`SKILL.md`](SKILL.md), `scripts/`, `references/` e [`.cursor/rules/ugc-ad-director.mdc`](.cursor/rules/ugc-ad-director.mdc) para o seu projeto. O arquivo de regra incorpora a skill.

</details>

<details>
<summary><b>Codex / qualquer agente que leia AGENTS.md</b></summary>

Copie `SKILL.md`, `scripts/` e `references/` para `.agents/skills/ugc-ad-director/` e adicione o snippet de [`codex/INSTRUCTIONS.md`](codex/INSTRUCTIONS.md) ao seu `AGENTS.md`. O [`AGENTS.md`](AGENTS.md) deste repositório é a versão genérica.

</details>

<details>
<summary><b>Prompt puro</b></summary>

Cole [`SKILL.md`](SKILL.md) no system prompt de qualquer modelo, com `references/structure.md` e `references/compliance.md` se o contexto permitir. Ele não tem sintaxe específica de agente fora do frontmatter. O lint continua precisando de Python.

</details>

<details>
<summary><b>Sem agente</b></summary>

```bash
python3 scripts/ugc_script.py --help
```

`lint`, `render`, `prompts`, `stats` e `new` rodam sozinhos em qualquer JSON de roteiro.

</details>

## Perguntas frequentes

<details>
<summary><b>O apresentador de IA pode dizer que ama o produto?</b></summary>

Não. Um apresentador de IA é um demonstrador: ele mostra, explica, compara e pergunta. "I've been using this", "changed my life", "honest review" e "not sponsored" (eu uso isso, mudou minha vida, review sincero, não patrocinado) são experiência de cliente em primeira pessoa, e com um apresentador gerado ou ausente viram depoimento inventado. O lint rejeita essas frases. Um cliente real com autorização assinada pode dizê-las; veja `examples/scripts/dog-dental-chews.json`.

</details>

<details>
<summary><b>Eu preciso mesmo rotular o anúncio como gerado por IA?</b></summary>

A skill coloca `AI-generated ad` em uma legenda desde o primeiro frame e espera que a configuração de conteúdo de IA da plataforma esteja ligada. TikTok, Meta e YouTube têm, cada um, regras de divulgação para conteúdo gerado realista, a regra da FTC sobre avaliações e depoimentos falsos cobre pessoas geradas por IA, e o artigo de transparência do AI Act da UE se aplica a partir de agosto de 2026. Detalhes e datas em [`references/compliance.md`](references/compliance.md). Leia as páginas de política atualizadas antes de lançar; este repositório resume, não cita.

</details>

<details>
<summary><b>Quais modelos os prompts têm como alvo?</b></summary>

Três saídas por plano gerado: uma imagem estática para o primeiro frame (qualquer modelo de imagem), um prompt de clipe no estilo Kling (5 ou 10 s, prompt negativo) e um prompt no estilo Veo 3 com a fala como diálogo e uma linha de áudio ambiente. Durações de clipe e suporte a áudio mudam a cada versão; os padrões estão em [`references/model-prompts.md`](references/model-prompts.md) e são fáceis de adaptar para Runway, Wan ou Seedance.

</details>

<details>
<summary><b>O lint prova que o anúncio está em conformidade?</b></summary>

Não. Ele pega os erros que conhece: tempo, ritmo, tamanho de legenda, frases de depoimento e de alegação em inglês, rótulos ausentes, linguagem de endosso. Ele não consegue verificar se a sua evidência é real, ler outros idiomas, nem saber que a política de uma plataforma mudou na semana passada. Ele torna os erros óbvios impossíveis e o restante visível.

</details>

<details>
<summary><b>Por que JSON e não um roteiro em texto?</b></summary>

Porque tempos, legendas, alegações e prompts precisam ser conferidos uns contra os outros, e uma tabela em um documento não passa por lint. O JSON é a fonte; `render` entrega a folha legível.

</details>

## Relacionados

- [video-director](https://github.com/uniqaiapp/video-director): transforma uma ideia de uma linha em um prompt plano a plano para modelos de vídeo com IA (Kling, Veo, Sora e outros), com vocabulário de câmera, iluminação e movimento. Use-o quando o anúncio precisar de planos cinematográficos em vez de UGC.
- [awesome-ai-video-prompts](https://github.com/uniqaiapp/awesome-ai-video-prompts): prompts curados e categorizados para modelos de vídeo com IA, com as configurações que os produziram.
- [no-plastic](https://github.com/uniqaiapp/no-plastic): regras de prompt e um verificador para retratos com IA de aparência natural; aplique-as ao primeiro frame do apresentador.
- [ai-video-pricing](https://github.com/uniqaiapp/ai-video-pricing): tabela de preços conferida à mão para geração de vídeo com IA, por segundo e por clipe, para orçar a lista de planos.

## Contribuindo

Issues e pull requests são bem-vindos. Mantenha as mudanças pequenas e inclua um exemplo de antes/depois na descrição do PR.
Veja [CONTRIBUTING.md](CONTRIBUTING.md) para as verificações locais (`python3 tests/run.py`, sem dependências).

## Licença

[MIT](LICENSE) © UniqAI para código e exemplos; `references/` é CC BY 4.0.

---

<div align="center">

<sub>Feito pela <a href="https://uniqai.app/?utm_source=github&utm_medium=readme-pt-br&utm_campaign=ugc-ad-director">UniqAI</a> — Kling 3.0, Veo 3, Flux, Nano Banana e GPT-5/Claude/Gemini/Grok em um só app. Escrevemos nossos próprios rascunhos de anúncio com esta skill.</sub>

</div>
