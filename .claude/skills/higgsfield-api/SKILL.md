---
name: higgsfield-api
description: Gera imagens e vídeos no Higgsfield pela API (Higgsfield Cloud), com estimativa de custo e confirmação do usuário antes de cada geração. Use quando o usuário pedir para gerar, criar ou animar imagem ou vídeo "no Higgsfield", "pela API do Higgsfield", ou com modelos do Higgsfield como Soul, Kling, Seedance, Veo, MiniMax ou Cinema Studio. O conector do Higgsfield só consulta (saldo, gerações, modelos); para gerar, use esta skill.
---

# Higgsfield API

Gera mídia no Higgsfield chamando a API diretamente. Cada geração gasta dinheiro da conta da API, por isso **nunca gere sem confirmação explícita do usuário para aquele pedido**.

Documentação oficial: https://docs.higgsfield.ai (página de cada modelo traz o endpoint e os parâmetros).

## Pré-requisitos

1. Credenciais em variável de ambiente: `HF_KEY` com a chave única que o console (https://open.higgsfield.ai/api-keys) mostra ao criar a chave, ou `HF_API_KEY_ID` e `HF_API_KEY_SECRET` separados. Se a API responder 401, a chave está errada, foi revogada ou está num formato que precisa ser separado em ID e segredo: avise o usuário sem mostrar a chave.
2. Acesso de rede ao host `api.higgsfield.ai`. Em ambientes na nuvem com rede limitada, o host precisa estar em Allowed domains.

Confira antes de tudo:

```bash
python3 .claude/skills/higgsfield-api/scripts/hf.py check
```

Se `ok` vier `false`, explique ao usuário que faltam as credenciais e onde colocá-las (variáveis de ambiente do ambiente, nunca no chat). Não peça a chave na conversa e nunca imprima o valor dela.

## Fluxo de cada geração

1. **Entenda o pedido**: tipo (texto para imagem, imagem para vídeo, texto para vídeo...), formato, duração, estilo. Se o usuário não escolheu modelo, sugira 1 ou 2 adequados.
2. **Monte o corpo da requisição** conforme a página do modelo na documentação (o conector do Higgsfield, quando ligado, também mostra os parâmetros com `models_get`). Escreva o JSON num arquivo temporário.
3. **Estime o custo** (não gasta nada):
   ```bash
   python3 .claude/skills/higgsfield-api/scripts/hf.py estimate <modelo> @pedido.json
   ```
4. **Peça confirmação**: mostre o modelo, o prompt, os parâmetros principais e o custo estimado em USD. Só siga com um "sim" para este pedido. Aprovação de uma geração anterior não vale para a próxima.
5. **Envie**:
   ```bash
   python3 .claude/skills/higgsfield-api/scripts/hf.py submit <modelo> @pedido.json
   ```
   Guarde o `request_id`.
6. **Espere e baixe**:
   ```bash
   python3 .claude/skills/higgsfield-api/scripts/hf.py wait <request_id> --out <pasta>
   ```
   Os arquivos do Higgsfield expiram em cerca de 7 dias; baixe sempre. Use a pasta de rascunhos da sessão, ou a pasta que o usuário indicar.
7. **Entregue** o arquivo ao usuário e informe o custo estimado. Se o status for `failed` ou `nsfw`, mostre o erro e não reenvie sozinho.

## Regras

- Uma confirmação por geração. Para lotes, mostre o custo total estimado e confirme o lote inteiro.
- Não reenvie automaticamente depois de erro ou timeout: o `submit` usa `Idempotency-Key`, mas uma nova tentativa só com o usuário de acordo.
- Imagens de referência precisam ser URLs públicas; não envie arquivos do usuário sem ele pedir.
- Não gere rostos de pessoas reais sem autorização delas, nem imite marcas de terceiros.
- Para cancelar algo ainda na fila: `hf.py cancel <request_id>`.
