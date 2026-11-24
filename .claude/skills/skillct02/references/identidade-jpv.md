# Identidade — João Pedro Voss (JPV)

Avatar/influencer IA do Fellipe. Character sheet oficial: `C:\Users\<seu-usuario>\Downloads\JPV\` (3 PNGs, 25 quadros no total).

- sheet 1: 9 expressões faciais (neutral, subtle smile, big smile, laughing, serious, confident, thoughtful, surprised, concerned)
- sheet 2: 8 ângulos de cabeça/torso (front neutral, front smile, 3/4 esquerdo/direito, perfil esquerdo/direito, full body, seated half body)
- sheet 3: 8 poses de corpo inteiro (relaxed front, hands in pockets, arms crossed, hands clasped, 3/4 esquerdo/direito, side profile, walking)

## Descrição física (fonte da verdade)

Homem brasileiro, aparência de 30 e poucos anos. Cabelo castanho escuro raspado bem curto (buzz cut) com linha do cabelo levemente recuada. Barba rala curta e uniforme acompanhando maxilar forte e quadrado. Olhos castanho-escuros fundos, sobrancelhas grossas escuras, leves linhas de expressão na testa. Pele bronzeada oliva com textura real. Físico atlético e musculoso: ombros largos, braços definidos, panturrilhas fortes, postura ereta. Base do sheet: camiseta preta gola careca + shorts preto, descalço, fundo cinza neutro.

## ⚠️ Duas regras descobertas em 27/08/2026 (reel de academia)

**1. NUNCA usar imagem gerada como referência de identidade.** A deriva é encadeada: sheet → ref "aprovada" (já mais fina) → geração nova (mais fina ainda). Em toda geração nova, `assetIds` = SÓ os dois seeds byte-perfect (`02991508` rosto + `a2c9adb9` corpo). As "refs aprovadas" listadas abaixo servem pra conferir resultado, não pra alimentar prompt.

**2. NUNCA esconder olho e sobrancelha no frame base.** Olho fechado no riso, rosto virado de perfil, cabeça jogada pra trás ou aba de boné sombreando a testa = o modelo fica sem as marcas que identificam o JPV e preenche com rosto genérico bonito de IA. Frame base sempre: rosto quase de frente, **os dois olhos abertos**, testa e sobrancelha expostas. O riso/careta entra depois, na animação do Kling.

**3. A geometria do rosto precisa estar escrita.** O bloco IDENTITY antigo não dizia que o rosto é largo, então o modelo caía no rosto fino padrão. Usar o bloco GEOMETRIA abaixo junto com o IDENTITY.

```
FACE GEOMETRY, follow this literally: the face is WIDE, SHORT and SQUARE, broad across the cheekbones and broad across the jaw, never a long or narrow face. Heavy square jaw with a wide flat chin. Wide-set deep-set dark brown eyes with heavy upper lids, both open. Thick straight dark eyebrows sitting low and close to the eyes. Broad nose with a wide bridge, a rounded slightly bulbous tip and wide nostrils. Very wide mouth with full lips and big even white teeth, deep nasolabial folds. Full heavy cheeks, not hollow. Thick neck as wide as his jaw.
```

Negativo obrigatório junto: `narrow face, long face, thin face, slim jaw, pointed chin, hollow cheeks, delicate features, model face, generic handsome face, eyes closed, head thrown back, face turned away, brim shadowing the eyes`.

**Frame base validado nesse padrão**: assetId `9cf588c4-feac-4807-bd21-49d8e913be17` (academia, boné, cantando com fone, rosto de frente, olho aberto) — melhor match de identidade até hoje, melhor que `bafe3264`.

## Bloco IDENTITY (entra em TODO prompt do JPV)

```
IDENTITY: reference images are the ONLY source for João Pedro. Brazilian man, early 30s, dark brown buzz-cut hair with slightly receded hairline, short even stubble beard, strong square jaw, deep-set dark brown eyes, thick dark eyebrows, subtle forehead lines, tanned olive skin with real texture, athletic muscular build with broad shoulders. Same face, proportions and skin tone every angle, even [condição extrema da cena]. Wardrobe this scene: [roupa da cena].
```

Diferente do exemplo da Blair (roupa fixa em toda cena), o JPV é influencer: a ROUPA é slot que muda por cena; rosto, corpo e pele nunca mudam.

## No Morphix (motor de geração padrão) — refs ATIVAS

- **Seed facial (upload byte-perfeito 23/08/2026)**: assetId `02991508-e47b-41e2-86e6-69e92d18ece8` (rosto frontal neutro 256px recortado do sheet 2).
- **Seed de CORPO (upload byte-perfeito 23/08/2026)**: assetId `a2c9adb9-8727-4726-b2bf-9a0508e3c639` (corpo inteiro de frente, recortado do sheet 3). OBRIGATÓRIO em todo prompt: sem ele o modelo inventa o corpo e sai magro. Personalidade completa em `biblia-jpv.md`.
- **V3 aprovadas (corpo + postura corretos)**: `b169a9d6-9214-4bdc-9f37-e104715914b9` (aeroporto sentado, braço no encosto), `2db039d6-1c69-4fae-825b-7028e6d66507` (café flash, gesticulando), `316b285d-59ea-4a67-b4da-6c1915608e48` (quiosque com amigos).
- **VÍDEO**: `da8bdbd9-d354-47f3-8519-50bd31646c35` (selfie escovando o dente, 8s 1080p com áudio, Veo 3.1 a partir do frame `23860ef8`). Receita: gerar foto selfie de câmera frontal → usar como `start_frame_asset_id` no veo-3.1, 9:16, 8s, audio on. Nunca text-to-video puro.
- ⚠️ Deriva conhecida: **cabelo cresce** se o prompt não proibir comprimento (ver seção 5 da bíblia). Conferir em toda geração.
- **Refs 2K aprovadas no teste de consistência (23/08/2026)**, geradas com o seed e conferidas contra o sheet:
  - `bafe3264-a234-4291-a601-1e3c58117b33` (nano-banana-2, rindo na rua, golden hour) — bom, mas já MAIS FINO que o sheet; usar só pra conferência, nunca como input (ver regra 1)
  - `a9fb47cc-c283-4966-8de2-e65b1c3c5cc9` (seedream-5-pro, luz dura de cinema)
- **Toda imagem nova do JPV**: `assetIds` = SÓ os dois seeds (`02991508` + `a2c9adb9`) + bloco IDENTITY + bloco FACE GEOMETRY no texto. Ver regra 1 no topo: ref gerada realimentada = deriva encadeada.
- **Modelo campeão de identidade**: `google/nano-banana-2` em 2K. Segundo look (mais cinema): `bytedance/seedream-5-pro`. Sempre 2K+.
- Vídeo do JPV: foto da cena aprovada → `start_frame_asset_id` / `imageReferenceAssetIds` (i2v segura o rosto; nunca t2v puro).
- **Duração**: veo-3.1 trava em 8s, mas `kwaivgi/kling-v3-video` faz até 15s em tomada única (9:16, 1080p, start frame) e `bytedance/seedance-2.5` até 30s. Reel de 12s sai sem emenda no kling-v3.
- **Lip-sync real com faixa existente**: a MCP NÃO faz (generate_video não aceita áudio nem vídeo condutor). Só pelo site, em Motion Control (kling-v3-motion-control, imagem do personagem + vídeo condutor, teto 10s). Pela MCP dá pra fazer ele cantando convincente, mas sem casar sílaba.
- Formatos IG: feed 4:5 (gerar 3:4 no seedream, que não tem 4:5), stories/reels 9:16. Em vídeo com fala, nomear "João Pedro".
- Sheets completos (25 quadros) seguem em Downloads\JPV; upload direto pelo MCP é limitado (base64 na mão corrompe), então pra ângulos difíceis: gerar ref nova por bootstrap (seed + aprovadas) ou subir o sheet inteiro pelo site do Morphix.
- Assets lixo na biblioteca (uploads corrompidos das tentativas): `f43b9d32` e `a850792a`. Ignorar ou apagar pelo site.

## Fotos do feed (23/08/2026)

**V2 aprovadas — padrão a seguir** (passaram no checklist anti-cara-de-IA):
- `f55ad942-7980-416d-9987-75d8be811a58` flash direto na mesa do café, gesticulando, braço de outra pessoa no quadro, mesa imunda (pilar autoridade)
- `6187a82d-befb-46f7-b0a7-c1986d3c286a` sentado no chão do aeroporto às 3h carregando o celular, fluorescente verde, gente dormindo ao fundo
- `87dc0982-b175-4326-8999-6bb7e37dda10` quiosque na praia com amigos, rindo, ombro de alguém borrado colado na lente, garçom passando

**V1 REJEITADAS pelo Fellipe** ("muita cara de IA e sem contexto humano"): `b77fb56a` (café sozinho com glow de tela), `f363a1fa` (aeroporto andando, composição perfeita), `00bc16ea` (varanda golden hour). Todas: personagem sozinho, luz bonita, enquadramento profissional. Ver o checklist em `lentes-imagem.md`.

## Feed atual do JPV (analisado do print) — estética a manter

Grade escura, contrastada, cara de foto de celular real. Os 6 posts existentes: corrida na praia (Rio, dia), selfie com flash em balada com uma mulher, street style ao lado de G-Wagon preta, selfie de espelho na academia, garagem à noite puxando a mão de alguém, street style dia com camiseta branca oversized e óculos escuros. Pilares presentes: fitness, nightlife, luxo/carro, social. **Pilar ausente: trabalho/autoridade** (o que sustenta o posicionamento com IA) — preencher.

⚠️ **Decisão pendente sobre TATUAGENS**: o character sheet tem braços LIMPOS, mas 2-3 fotos do feed atual mostram tatuagens no antebraço. Gerações novas seguem o sheet (`clean forearms with no tattoos`, já no bloco IDENTITY). Se o Fellipe decidir que o JPV é tatuado, descrever as tattoos por escrito aqui e trocar essa linha em todos os prompts.
