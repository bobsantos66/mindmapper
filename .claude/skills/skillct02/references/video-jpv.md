># VÍDEO DO JPV — receitas

**REGRA DO FELLIPE (24/08/2026): usar SEMPRE o Morphix. NÃO usar o Higgsfield.**

Consequência prática: motion control (transferência de movimento de um vídeo de referência) **não está disponível**, porque o Morphix lista os modelos Kling de motion control no catálogo mas não expõe a ferramenta de execução. Só o Higgsfield executa, e está vetado.

## Substituto do motion control: coreografia escrita

Quando o Fellipe mandar um vídeo de referência e quiser o JPV imitando:
1. Extrair os frames do vídeo com ffmpeg (`fps=1,tile=5x2`) e LER a coreografia.
2. Gerar no Morphix uma foto do JPV que bata com o enquadramento, a roupa e o ambiente do primeiro frame.
3. Gerar o vídeo com essa foto como `start_frame_asset_id` e um prompt que descreve a coreografia **em ordem, ação por ação**, separada por vírgulas.
4. Opcional: gerar também o último frame e usar `end_frame_asset_id` pra forçar o arco.

## Modelos (Morphix)

| Uso | Modelo | Notas |
|---|---|---|
| Vídeo com FALA e áudio | `google/veo-3.1` | áudio nativo, 9:16, máx 8s, aceita start e end frame |
| Movimento de corpo / fit check / ação | `kwaivgi/kling-v3-video` | 3 a 15s, 1080p e 4k, start e end frame |
| Muitas referências de personagem | `bytedance/seedance-2.5` | até 30 imagens de referência |

## "Mais cara de humano" (pedido do Fellipe, 24/08/2026)

O que falta quando um vídeo fica bom mas ainda não parece gente: **micro-comportamento involuntário**. Nomear no prompt, sempre:

- pisca 3-4 vezes, olho lacrimeja no contraluz, aperta os olhos contra a luz
- peito sobe e desce respirando o clipe inteiro
- engole em seco uma vez, funga, comprime os lábios
- olha pro lado da câmera e volta pra lente
- troca o apoio do peso, rola o ombro, dedos mexendo na perna da calça
- o sorriso NASCE devagar e por um lado só, nunca já vem pronto
- nunca congelado, nunca segurando pose

E na pele: poro aberto, brilho oleoso no nariz e na testa, barba falhada desigual, lábio rachado, um ombro mais alto que o outro, assimetria na expressão.

E na câmera: celular na mão que respira junto com quem segura, wobble de rolling shutter no movimento, autofoco caçando uma vez, exposição bombeando.

## Regras fixas

- **Sempre image-to-video** partindo de foto aprovada do JPV. Nunca text-to-video puro: o rosto derrete.
- Selfie de câmera frontal: gerar antes um frame com distorção de grande angular, rosto grande e perto, braço cortando o canto, quadro torto, luz feia.
- Descrever o comportamento da CÂMERA como se ela fosse burra: celular escorregando alguns graus, autofoco respirando uma vez, exposição caçando, borrão nas mãos, ruído digital, flare. É isso que tira a cara de render.
- Fechar sempre com: `raw unedited phone footage, no cuts, no music, no color grade, no filter, no slow motion`.
- Repetir no fim do prompt que rosto, corpo e roupa não mudam durante o clipe.
- Se o vídeo tiver fala, nomear "João Pedro" no áudio.

## Vídeos já feitos

- `da8bdbd9-d354-47f3-8519-50bd31646c35` selfie escovando o dente, 8s 1080p com áudio (veo-3.1, frame `23860ef8`)
- fit check no quarto branco (kling-v3-video, frame `9bb899a6`) — ver `identidade-jpv.md`

## Custo: rascunho baixo, upscale depois (regra do Fellipe, 04/09/2026)

Gerar SEMPRE a primeira leva no menor preset do modelo (720p em vídeo, 1K em imagem) e só passar `upscale_video` / `upscale_image` no take aprovado. A maioria das gerações morre por deriva de identidade ou enquadramento errado, e crédito de Morphix acaba: em 04/09 o 15s em 1080p no Seedance foi recusado por saldo com 470 créditos.

A regra "qualidade inegociável em 2K+" da SKILL.md vale pro que vai ser POSTADO, não pro rascunho.

**Custo medido em 04/09/2026**: um `kling-v3-video` de 15s em 1080p 9:16 custou **357 créditos** numa tacada só (saldo caiu de 470 pra 113). Vídeo longo em alta é o item mais caro do catálogo: conferir `get_account` ANTES e nunca mandar rascunho nesse preset.

## Limite de caracteres do prompt (descoberto em 04/09/2026)

| Modelo | Teto do promptText |
|---|---|
| `kwaivgi/kling-v3-video` | 2500 |
| `bytedance/seedance-2.0` | 4000 |

Prompt longo no estilo shot-list (SHOT 1 a SHOT 6 + IDENTITY + IMPORTANT) estoura fácil os 2500 do Kling. Medir antes com `wc -c`.

Outra limitação: `seedance-2.0` NÃO aceita `imageReferenceAssetIds` junto com `start_frame_asset_id`, e o `kling-v3-video` não aceita referência nenhuma. Ou seja, em vídeo a identidade tem que vir do start frame + do bloco IDENTITY escrito, nunca dos seeds.

## Seedance está quebrado nessa conta (04/09/2026)

Dois disparos de `bytedance/seedance-2.0` e `bytedance/seedance-2.0-mini` voltaram FAILED sem gerar nada e sem cobrar crédito. O único motor de vídeo confiável hoje é `kwaivgi/kling-v3-video`. Testar Seedance de novo antes de contar com ele.

Kling também é LENTO: o de 15s 1080p ficou quase 2h em PENDING antes de completar. Planejar em cima disso.

## Limites de caracteres (medidos)

| Modelo | Teto do promptText |
|---|---|
| `kwaivgi/kling-v3-video` | 2500 |
| `bytedance/seedance-2.0` | 4000 |
| `google/nano-banana-2` (imagem) | 4000 |

Medir com `wc -c` antes de disparar. O prompt no estilo shot-list estoura fácil.

## Frame de partida: a tensão olhar x identidade

Cena que exige o personagem olhando pro horizonte briga com a regra do rosto de frente. A solução que funcionou: **câmera em três quartos**, torso virado pro que ele olha, cabeça girada de volta quase pra lente, e o evento entrando pelo lado do quadro na direção do olhar. Assim os dois olhos ficam expostos e a geometria fecha.

Também: o bloco BUILD precisa ser AGRESSIVO ("powerlifter body", "no gap between sleeve and skin", "if in doubt make him bigger"). O bloco padrão da bíblia sozinho ainda entrega ele magro.

## Tabela de custo medida (04/09/2026, conta PARTNER)

| Geração | Créditos |
|---|---|
| imagem `nano-banana-2` 1K | 4 |
| imagem `nano-banana-2` 2K | 8 |
| vídeo `kling-v3-video` 5s 720p | 85 |
| vídeo `kling-v3-video` 15s 1080p | 357 |

Ou seja: **um vídeo de 15s em 1080p vale ~90 imagens em 1K**. Sempre fechar o frame primeiro em 1K, aprovar, e só então gastar em vídeo. Vídeo de 5s em 720p é o rascunho mais barato que ainda dá pra julgar.

## Frames aprovados da cena do meteoro (reusar, já pagos)

- `e7a83c21-c81b-43e9-b344-97c90d963bd2` — JPV na varanda da casa velha, fim de tarde, jornal na mão, garrafa e cinzeiro na mesa, meteoro baixo no horizonte à esquerda, câmera em três quartos com os dois olhos expostos. **Melhor frame de identidade + geometria que a cena do meteoro tem.** Vídeo gerado dele: `4362be43-b774-499f-92cc-ff194c04565e` (5s, identidade segurou).
