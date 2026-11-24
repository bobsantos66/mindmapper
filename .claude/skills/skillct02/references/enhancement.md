# Esqueleto de ENHANCEMENT (melhorar imagem existente)

Regra mestra: **nenhum verbo anda sozinho**. Toda instrução de melhorar vem amarrada a um contrapeso que impede o modelo de passar do ponto (enhance X while keeping Y). Os negativos nomeiam os modos de falha REAIS de upscaler: pele de plástico, halo de nitidez, rosto recriado.

## Esqueleto

```
[OBJETIVO: enhance to X quality] while preserving [realism/estilo original].
[LIMPEZA: remove defeito1, defeito2, defeito3] while keeping [textura natural chave].
[NITIDEZ: sharpen micro-zona1, micro-zona2, micro-zona3 with high precision].
[RESTAURAÇÃO: restore missing details] without hallucinating [o que não pode inventar].
[RESOLUÇÃO: upscale to X] with clean edges and no pixelation.
[LUZ/COR: balance exposure, correct color tones, enhance contrast] naturally.
Preserve original identity, proportions, and [estrutura] exactly.
Avoid [modo de falha 1], [modo de falha 2], [modo de falha 3].
Enhance micro-details and depth while maintaining a [look final] look.
[FUNDO: regra separada pro background, preservando profundidade de campo].
```

Micro-zonas por tipo de imagem: rosto = eyes, lips, hair strands; produto = logo, material texture, edges; print/documento = text edges, line work; foto antiga = faces, fabric, edges of objects.

## Exemplo canônico (rosto — validado)

```
Enhance this image to ultra high-definition quality while preserving realism.
Remove noise, compression artifacts, and motion blur while keeping natural skin texture.
Sharpen facial details (eyes, lips, hair strands) with high precision.
Restore missing details without hallucinating unrealistic features.
Upscale the image to 4K resolution with clean edges and no pixelation.
Improve lighting dynamically: balance exposure, correct color tones, and enhance contrast naturally.
Preserve original identity, proportions, and facial structure exactly.
Avoid over-smoothing, plastic skin, or artificial sharpening halos.
Enhance micro-details and depth while maintaining a cinematic, natural look.
Background should remain slightly soft but clean and noise-free.
```
