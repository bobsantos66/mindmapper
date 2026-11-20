---
name: luz-campanha
description: Aplica a iluminação padrão da campanha (low-key cinematográfico, key quente lateral, rim teal sutil, look ARRI ALEXA 35) a prompts de imagem de ambientes e cenas para Nano Banana e GPT Image. Use sempre que o usuário pedir uma imagem, cena, ambiente ou prompt "da campanha", "com a luz padrão", "no nosso look", colar um prompt para "aplicar a luz", ou descrever uma ideia de cena para virar prompt, mesmo que não mencione iluminação. Escreve o prompt completo a partir de uma ideia ou encaixa o bloco de luz num prompt que o usuário já escreveu.
---

# Luz padrão da campanha

Esta skill garante que toda imagem da campanha tenha a mesma luz, mesmo quando cenas, pessoas da equipe ou dias de produção mudam. A luz é a assinatura visual: o assunto da cena varia, a luz não.

As imagens são ambientes e cenas (interiores, exteriores, objetos no espaço), sem rosto em destaque. Os geradores são Nano Banana (Gemini) e GPT Image.

## O bloco de luz (fixo)

Use este texto sem alterar o sentido. Pode ajustar a gramática para encaixar na frase, mas não troque, não remova e não "melhore" os termos de luz e cor.

```
Cinematic low-key lighting with a warm directional side key light, deep controlled shadows and minimal fill light, a subtle cool teal rim light separating the main forms from the background. High local contrast, smooth highlight roll-off, restrained saturation, atmospheric dark background. Shallow depth of field with precise focus on the focal subject. Organic filmic texture and professional cinema color grading, photorealistic, ARRI ALEXA 35 look, 50mm anamorphic lens at T2.0, 2.39:1 widescreen composition.
```

O bloco original falava de pele, poros e olhos. Como as cenas são ambientes, esses termos viraram "focal subject" e "main forms". Se aparecer uma pessoa ao fundo ou de passagem, acrescente apenas: "natural, unretouched skin tones".

## Por que não há negativos no texto

Nano Banana e GPT Image não têm campo de negative prompt nem parâmetros como `--no`. Escrever "no plastic skin" ou "no HDR" dentro do prompt costuma puxar justamente esses efeitos, porque o modelo lê as palavras. Por isso os negativos do prompt original viram descrições positivas, sempre no final:

```
Clean, unsharpened natural micro-detail, true-to-life material textures, natural dynamic range with dark shadows kept dark.
```

## Proporção da imagem

A proporção se escolhe na interface ou na API, não no texto. O prompt diz "2.39:1 widescreen composition" para orientar o enquadramento, mas lembre o usuário de configurar a proporção no gerador. Nenhum dos dois oferece 2.39:1 exato: use 21:9 no Nano Banana (quando disponível) ou a opção mais larga (16:9 / 1536x1024 no GPT Image) e recorte depois.

Se a peça for para outro formato (4:5, 9:16, 1:1), troque "2.39:1 widescreen composition" por "[formato] composition with cinematic framing" e mantenha o resto do bloco igual.

## Modo 1: o usuário traz uma ideia

Escreva o prompt completo, em inglês, em texto corrido, nesta ordem:

1. **Cena:** o lugar, o ponto focal e o que acontece, com materiais concretos (concreto úmido, madeira escura, vidro fosco). Diga de que lado vem a luz quente, se a cena permitir (janela, abajur, porta entreaberta), para a luz parecer motivada e não artificial.
2. **Bloco de luz** (fixo, acima).
3. **Fechamento positivo** (fixo, acima).

## Modo 2: o usuário traz um prompt pronto

1. Preserve a cena e o conteúdo dele.
2. Remova o que conflita com a luz padrão: "bright", "high-key", "soft even lighting", "vibrant colors", "HDR", "golden hour sunlight flooding", fundos claros, termos de lente ou câmera diferentes.
3. Aplique o bloco de luz e o fechamento positivo.
4. Diga em uma linha o que foi removido e por quê.

## Formato da resposta

Sempre entregue:

- O prompt final em inglês, num bloco de código para copiar.
- A tradução em português logo abaixo, para conferência.
- Uma linha com a proporção a configurar no gerador.

Não gere a imagem; a skill só escreve o prompt.

## Exemplo

Ideia: "um corredor de hotel antigo à noite"

```
A long, narrow corridor of an old hotel at night, worn burgundy carpet, dark wood wall panels and brass door numbers, a single door at the end left ajar with warm lamplight spilling out from the left side. Cinematic low-key lighting with a warm directional side key light, deep controlled shadows and minimal fill light, a subtle cool teal rim light separating the main forms from the background. High local contrast, smooth highlight roll-off, restrained saturation, atmospheric dark background. Shallow depth of field with precise focus on the focal subject. Organic filmic texture and professional cinema color grading, photorealistic, ARRI ALEXA 35 look, 50mm anamorphic lens at T2.0, 2.39:1 widescreen composition. Clean, unsharpened natural micro-detail, true-to-life material textures, natural dynamic range with dark shadows kept dark.
```

Proporção: 21:9 no Nano Banana ou 16:9 no GPT Image, recortar para 2.39:1.
