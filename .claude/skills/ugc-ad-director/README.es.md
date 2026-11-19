<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="ugc-ad-director by UniqAI" src="assets/banner.svg" width="1280" height="320">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-d1fe17?style=flat-square&labelColor=0d0f12)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-d1fe17?style=flat-square&labelColor=0d0f12)](#instalación)
[![Cursor](https://img.shields.io/badge/Cursor-rules-d1fe17?style=flat-square&labelColor=0d0f12)](#instalación)
[![Codex](https://img.shields.io/badge/Codex-AGENTS.md-d1fe17?style=flat-square&labelColor=0d0f12)](#instalación)
[![By UniqAI](https://img.shields.io/badge/made_by-UniqAI-fdfc07?style=flat-square&labelColor=0d0f12)](https://uniqai.app/?utm_source=github&utm_medium=readme-es&utm_campaign=ugc-ad-director)

**Guiones de anuncios UGC con IA: gancho en 2 segundos, lista de planos, subtítulos, prompts para Kling / Veo, lint de cumplimiento.**

[Inicio rápido](#inicio-rápido) · [Cómo funciona](#cómo-funciona) · [Ejemplos](#ejemplos) · [Instalación](#instalación) · [Preguntas frecuentes](#preguntas-frecuentes)

</div>

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · Español · [Português (BR)](README.pt-BR.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

# ugc-ad-director: guiones de anuncios UGC con IA y prompts de video

Los anuncios UGC con IA empiezan por un guion, no por un prompt. Esta skill convierte un brief de producto en un guion de anuncio para TikTok / Reels / Shorts con el gancho dentro de los dos primeros segundos, cinco beats con tiempos (hook → problem → demo → proof → CTA, es decir, gancho → problema → demostración → prueba → llamada a la acción), una lista de planos, subtítulos en pantalla, voz en off y un prompt por plano para el modelo de imagen, para Kling y para Veo 3 con líneas habladas. Un script de Python de biblioteca estándar pasa un lint al resultado y rechaza lo que no debería publicarse: un presentador de IA hablando como un cliente, "clinically proven" sin fuente, una etiqueta de IA ausente.

Redacta; no inventa. Los presentadores son demostradores ficticios, cada afirmación necesita evidencia y la etiqueta `AI-generated ad` es un subtítulo desde el primer fotograma. La ética está en el lint, no en una nota al pie.

| **Gancho antes de 2.0 s** | **Prompts por plano y por modelo** | **Cumplimiento que hace fallar el build** |
|:---|:---|:---|
| Doce palabras como máximo, dichas y subtituladas a la vez, elegidas de una biblioteca de ganchos por categoría. | Primer fotograma para imagen a video, un prompt de clip para Kling, un prompt para Veo 3 con diálogo; descripción coherente del presentador en todos los planos. | Los testimonios falsos, los avales de plataformas, las afirmaciones sin respaldo y la etiqueta de IA ausente son errores, no avisos. |

## Inicio rápido

```bash
git clone https://github.com/uniqaiapp/ugc-ad-director && cd ugc-ad-director
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out serum.md
```

El primer comando imprime `ok, 0 errors, 0 warnings`; el segundo escribe una hoja de guion con la tabla de la línea de tiempo, la voz en off, los subtítulos, los prompts por plano, las afirmaciones y una lista de verificación de cumplimiento. En un agente, di "write a 30-second UGC ad for <product URL>" (escribe un anuncio UGC de 30 segundos para <URL del producto>) y la skill hace lo mismo a partir de tu brief.

## Demo

<img alt="ugc-ad-director demo: lint rejects a fake-testimonial script, then renders a clean one" src="assets/demo.svg" width="820">

## Cómo funciona

1. **Brief → hechos.** A partir de una URL o de una línea de texto, la skill extrae la única cosa que hace el producto, para quién es, la molestia que elimina y cualquier cosa comprobable (etiqueta, especificación, pantalla). Nada más entra; "revolutionary" no es un hecho.
2. **Primero el gancho.** Una idea, ≤ 12 palabras, que aterriza antes de los 2.0 s, con subtítulo y voz en off a la vez porque el sonido suele estar apagado. [`references/hook-library.md`](references/hook-library.md) tiene ganchos por categoría y tipo (interpelación, contrario a la intuición, resultado primero, comparación, una prueba que el espectador puede hacer ahora mismo) y una lista de ganchos que conviene evitar.
3. **Cinco beats con tiempos.** hook → problem → demo → proof → cta, escalados a 15, 20, 30, 45 o 60 s ([`references/structure.md`](references/structure.md)). La demostración es el más largo y muestra una sola acción. La prueba es algo comprobable, preferiblemente metraje real del producto real o una grabación de pantalla real, incluso dentro de un anuncio generado por lo demás.
4. **Planos → prompts.** Cada plano lleva `subject`, `action`, `camera`, `setting`, `lighting`, `negative`, `audio`. `scripts/ugc_script.py prompts` los renderiza como una imagen fija para el primer fotograma, un prompt de clip para Kling (5 o 10 s, prompt negativo, sin cámara lenta) y un prompt para Veo 3 con la línea hablada como `Dialogue` ([`references/model-prompts.md`](references/model-prompts.md)).
5. **Lint.** Línea de tiempo contigua y que termina en `duration_s`; gancho ≤ 2 s; beats en orden; subtítulos ≤ 48 caracteres por línea; ritmo de la voz en off por plano; cada plano generado tiene un prompt; la frase en primera persona de cliente con un presentador de IA es un error; "proven", "guaranteed", "#1", los porcentajes y "results in N days" deben estar en `claims` con evidencia; la etiqueta de IA debe aparecer en un subtítulo. Lista completa en [`references/script-format.md`](references/script-format.md).

```
brief ──▶ hook ──▶ beats + timings ──▶ shots ──▶ script.json
                                                   │
                     lint (structure + compliance) ◀┘──▶ render (.md sheet) ──▶ prompts (image / kling / veo3)
```

Los únicos números que cita este README salen de `python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json`: 6 planos, el gancho termina a los 2 s, 75 palabras de voz en off en 30 s (2.5 palabras/s), 7 líneas de subtítulo, la más larga de 41 caracteres, 5 planos generados, 2 afirmaciones con evidencia. Los repartos de beats y el techo de ritmo de 3.5 palabras/s son valores por defecto de trabajo, no óptimos medidos; el repositorio no afirma nada sobre retención ni conversión.

## Ejemplos

Once guiones de distintos sectores en [`examples/`](examples/README.md): cuidado de la piel, una app de planificación de comidas, un utensilio de cocina, snacks para perros (cliente real con autorización firmada), un curso de idiomas, facturación B2B, un spray de limpieza sin voz en off, zapatillas de running, una eSIM de viaje, una suscripción de café y una cámara para mascotas. Cada hoja renderizada y cada archivo de prompts están versionados y los tests los reproducen byte a byte.

<details>
<summary><b>Brief → primeros diez segundos de un guion (skincare-serum)</b></summary>

**Antes** (el brief)

```text
Dewline Barrier Serum: fragrance-free hydrating serum with ceramides and 2% niacinamide.
Audience: women 22-35 with dry, flaky skin under makeup. 30 s, AI presenter.
```

**Después** (las tres primeras filas de la línea de tiempo en `examples/rendered/skincare-serum.md`)

```text
| # | Time | Beat | Visual | Caption | Voiceover | Source |
|---|---|---|---|---|---|---|
| 1 | 0s–2s | hook | Close-up of a fingertip dragging foundation across dry, flaky cheek; product in the mirror | Your foundation isn't the problem. / AI-generated ad | Your foundation isn't the problem. | image-to-video |
| 2 | 2s–7s | problem | Presenter to camera, towel on hair, holding up a flaky makeup sponge | dry skin + makeup = cake | Dry skin drinks the water out of your makeup, so it cakes by lunch. | image-to-video |
| 3 | 7s–15s | demo | Two drops of serum pressed into the cheek with two fingers; skin goes from matte-flaky to even | two drops, press, don't rub | Two drops. Press it in with two fingers, don't rub. Ceramides fill the cracks, niacinamide calms the red. | image-to-video |
```

Prompt para Veo 3 del plano 2 (de `examples/prompts/skincare-serum.txt`):

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
<summary><b>Lo que el lint rechaza (examples/bad/fake-testimonial.json)</b></summary>

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

Los ocho avisos (longitud de subtítulos, ritmo, números no listados, ajuste de plataforma ausente, presentador sin describir) se omiten aquí; `python3 scripts/ugc_script.py lint examples/bad/fake-testimonial.json` los imprime todos.

</details>

<details>
<summary><b>Empezar un guion nuevo</b></summary>

```bash
python3 scripts/ugc_script.py new --vertical pets --product "Bitewell Chews" --duration 30 --presenter none > chews.json
# fill in visuals, captions, voiceover, prompts, claims; then
python3 scripts/ugc_script.py lint chews.json --strict
python3 scripts/ugc_script.py prompts chews.json --model veo3
```

</details>

Dónde renderizar los prompts: cualquier herramienta de imagen a video que acepte un fotograma inicial y texto. Nosotros usamos la [página de imagen a video de UniqAI](https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=readme-es&utm_campaign=ugc-ad-director), donde una foto de producto se convierte en el primer fotograma de un clip; los formatos para Kling y Veo 3 que se incluyen aquí son los que se usan allí.

## Instalación

Funciona con cualquier agente que lea archivos de instrucciones. Elige el tuyo. Python 3.9+; no hay paquetes que instalar.

<details open>
<summary><b>Claude Code</b></summary>

```bash
# user-level
git clone https://github.com/uniqaiapp/ugc-ad-director ~/.claude/skills/ugc-ad-director
# or project-level
git clone https://github.com/uniqaiapp/ugc-ad-director .claude/skills/ugc-ad-director
```

Después escribe `/ugc-ad-director` en cualquier sesión, o simplemente describe el anuncio; la `description` de la skill la activa. El clon trae consigo `scripts/` y `references/`, que la skill necesita.

</details>

<details>
<summary><b>Cursor</b></summary>

Copia [`SKILL.md`](SKILL.md), `scripts/`, `references/` y [`.cursor/rules/ugc-ad-director.mdc`](.cursor/rules/ugc-ad-director.mdc) a tu proyecto. El archivo de regla incrusta la skill.

</details>

<details>
<summary><b>Codex / cualquier agente con AGENTS.md</b></summary>

Copia `SKILL.md`, `scripts/` y `references/` a `.agents/skills/ugc-ad-director/` y añade el fragmento de [`codex/INSTRUCTIONS.md`](codex/INSTRUCTIONS.md) a tu `AGENTS.md`. El [`AGENTS.md`](AGENTS.md) de este repositorio es la versión genérica.

</details>

<details>
<summary><b>Prompt sin más</b></summary>

Pega [`SKILL.md`](SKILL.md) en el system prompt de cualquier modelo, junto con `references/structure.md` y `references/compliance.md` si el contexto lo permite. No tiene sintaxis específica de ningún agente fuera del frontmatter. El lint sigue necesitando Python.

</details>

<details>
<summary><b>Sin agente</b></summary>

```bash
python3 scripts/ugc_script.py --help
```

`lint`, `render`, `prompts`, `stats` y `new` funcionan de forma independiente sobre cualquier JSON de guion.

</details>

## Preguntas frecuentes

<details>
<summary><b>¿Puede el presentador de IA decir que le encanta el producto?</b></summary>

No. Un presentador de IA es un demostrador: muestra, explica, compara y pregunta. "I've been using this", "changed my life", "honest review" y "not sponsored" son experiencia de cliente en primera persona y, con un presentador generado o ausente, constituyen un testimonio inventado. El lint las rechaza. Un cliente real con una autorización firmada sí puede decirlas; mira `examples/scripts/dog-dental-chews.json`.

</details>

<details>
<summary><b>¿De verdad tengo que etiquetar el anuncio como generado con IA?</b></summary>

La skill pone `AI-generated ad` en un subtítulo desde el primer fotograma y da por hecho que el ajuste de contenido de IA de la plataforma está activado. TikTok, Meta y YouTube tienen cada uno reglas de divulgación para contenido generado realista, la norma de la FTC sobre reseñas y testimonios falsos cubre a las personas generadas con IA, y el artículo de transparencia de la Ley de IA de la UE se aplica desde agosto de 2026. Detalles y fechas en [`references/compliance.md`](references/compliance.md). Lee las páginas de políticas vigentes antes de lanzar; este repositorio resume, no cita.

</details>

<details>
<summary><b>¿A qué modelos apuntan los prompts?</b></summary>

Tres salidas por plano generado: una imagen fija para el primer fotograma (cualquier modelo de imagen), un prompt de clip estilo Kling (5 o 10 s, prompt negativo) y un prompt estilo Veo 3 con la línea hablada como diálogo y una línea de audio ambiente. Las duraciones de clip y el soporte de audio cambian con cada versión; los patrones están en [`references/model-prompts.md`](references/model-prompts.md) y son fáciles de adaptar a Runway, Wan o Seedance.

</details>

<details>
<summary><b>¿El lint demuestra que el anuncio cumple la normativa?</b></summary>

No. Detecta los errores que conoce: tiempos, ritmo, longitud de subtítulos, fraseo de testimonios y afirmaciones en inglés, etiquetas ausentes, redacción de avales. No puede comprobar que tu evidencia sea real, leer otros idiomas ni saber que la política de una plataforma cambió la semana pasada. Hace imposibles los errores obvios y visibles los demás.

</details>

<details>
<summary><b>¿Por qué JSON y no un guion en texto?</b></summary>

Porque los tiempos, los subtítulos, las afirmaciones y los prompts tienen que comprobarse unos contra otros, y una tabla en un documento no se puede pasar por un lint. El JSON es la fuente; `render` te da la hoja legible.

</details>

## Relacionados

- [video-director](https://github.com/uniqaiapp/video-director): convierte una idea de una línea en un prompt plano a plano para modelos de video con IA (Kling, Veo, Sora y otros), con vocabulario de cámara, iluminación y movimiento. Úsalo cuando el anuncio necesite planos cinematográficos en lugar de UGC.
- [awesome-ai-video-prompts](https://github.com/uniqaiapp/awesome-ai-video-prompts): prompts seleccionados y categorizados para modelos de video con IA, con los ajustes que los produjeron.
- [no-plastic](https://github.com/uniqaiapp/no-plastic): reglas de prompt y un comprobador para retratos con IA de aspecto natural; aplícalas al primer fotograma del presentador.
- [ai-video-pricing](https://github.com/uniqaiapp/ai-video-pricing): tabla de precios verificada a mano para la generación de video con IA, por segundo y por clip, para presupuestar la lista de planos.

## Contribuir

Los issues y los pull requests son bienvenidos. Mantén los cambios pequeños e incluye un ejemplo de antes/después en la descripción del PR.
Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para las comprobaciones locales (`python3 tests/run.py`, sin dependencias).

## Licencia

[MIT](LICENSE) © UniqAI para el código y los ejemplos; `references/` es CC BY 4.0.

---

<div align="center">

<sub>Hecho por <a href="https://uniqai.app/?utm_source=github&utm_medium=readme-es&utm_campaign=ugc-ad-director">UniqAI</a> — Kling 3.0, Veo 3, Flux, Nano Banana y GPT-5/Claude/Gemini/Grok en una sola app. Nosotros escribimos nuestros propios borradores de anuncios con esta skill.</sub>

</div>
