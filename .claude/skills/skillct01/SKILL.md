---
name: skillct01
description: Monta carrossel de Instagram pronto pra postar (PNGs 1080x1350 + legenda) no design aprovado pelo Fellipe, com fonte Inter Tight apertada, fundos preto, branco e creme, detalhe em laranja, caixa de mensagem do Claude com o pedido pronto e capa com os slides em leque. Use sempre que ele pedir "monta um carrossel", "faz um carrossel", "carrossel sobre X", "post em carrossel", "transforma isso em carrossel" ou mandar um gancho/lista pra virar carrossel.
---

# Carrossel (design padrão do Fellipe)

Este é O design de carrossel dele. Ele aprovou em 16/10/2026 ("ficou top", "sempre vou
utilizar esse pra carrossel"). Não trocar layout, fonte nem cor sem ele pedir.

## Regras fixas do visual

- **Sem foto dele.** Nenhuma foto do Fellipe em nenhum slide (ele pediu).
- **Sem vermelho.** Paleta: preto #0C0C0C, branco, creme #F2EDE4. Laranja #FF5A1F só em
  detalhe: número do slide, selo, botão de enviar, etiqueta e uma parte do título final.
- Fonte Inter Tight: título 800 bem apertado, texto 300. Texto centralizado.
- Cantos em todo slide: @ofellipesales, **IA** na prática, Conteúdo, automação.
- Capa preta com título grande, etiqueta laranja e 3 slides de dentro em leque.
- Slides de conteúdo alternam claro, escuro e creme. Último slide creme.
- Origem do layout: post do @socialmediadeelite (instagram.com/p/DdZqt5aFBio), adaptado.

Tudo isso já está no `modelo.html`. Quem decide o conteúdo é o `dados.js` de cada carrossel.

## Como fazer

1. **Pasta:** `C:\Users\<seu-usuario>\Desktop\carrosseis\<nome-curto>\`
2. **Conteúdo:** copiar `exemplo-dados.js` desta skill pra pasta como `dados.js` e
   reescrever. Campos:
   - `capa.linhas`: 2 ou 3 linhas de até uns 15 caracteres, com número ("7 coisas que o").
   - `capa.tag`: o laço que puxa o arraste ("quase ninguém usa a 4ª").
   - `itens[]`: de 5 a 8. Cada um tem `tit`, `txt` e `pede` (o pedido exato pro Claude,
     aparece na caixa de mensagem). Sem pedido, usar `lista: [...]` (até 4 linhas curtas)
     ou só o `txt`; o título cresce sozinho. Slide só com `txt` fica vazio no meio,
     então preferir sempre `pede` ou `lista`.
   - `destaque` no item que a etiqueta da capa promete (vira o slide do meio do leque).
   - `tema` ('claro', 'escuro', 'creme') é opcional; sem ele, alterna sozinho.
   - `fim`: `titulo` + `laranja` (pedaço em laranja) + `texto`. Uma chamada só, e ela é
     SEMPRE de palavra-chave: `titulo: 'Comenta'`, `laranja: 'PALAVRA'`, `texto` dizendo o
     que a pessoa recebe no direct. Veja "Funil da palavra-chave" abaixo.
   - `selo: false` quando o assunto não for o Claude (some o selo laranja).
3. **Gerar:** `node "C:\Users\<seu-usuario>\.claude\skills$1skillct01\gerar.mjs" "<pasta>"`
   (pra refazer só alguns: acrescentar os números, ex.: `... "<pasta>" 1 4`).
   O script copia o modelo pra pasta como `carrossel.html` e salva `slide-01.png` em diante.
4. **Conferir:** abrir cada PNG com Read. Procurar texto vazando, palavra sozinha na
   última linha, selo tampando palavra. O título encolhe sozinho se não couber, mas
   texto longo demais é pra cortar, não pra encolher.
5. **Legenda:** `legenda.txt` na pasta. Gancho inteiro nos primeiros 125 caracteres, corpo
   curto, uma chamada só, de 3 a 5 hashtags.
6. **Página do material** e **automação**: ver "Funil da palavra-chave".
7. **Entregar:** `Invoke-Item -LiteralPath "<pasta>\slide-01.png"` e abrir a pasta no
   Explorador (`Start-Process explorer.exe -ArgumentList '"<pasta>"'`). Dizer o caminho.

## Funil da palavra-chave (sempre)

O jeito que o Fellipe trabalha: **post > palavra-chave no comentário > automação manda o
link no direct > página com o material detalhado** que resolve a dúvida do carrossel.
Todo carrossel sai com as três partes:

- **Slide final:** "Comenta PALAVRA" (palavra curta, em maiúscula, ligada ao tema).
  A legenda repete a mesma chamada.
- **Página:** `C:\Users\<seu-usuario>\Desktop\material-<tema>\index.html`, um arquivo só,
  no visual do carrossel (Inter Tight, preto, creme, laranja). Aprofunda cada item do
  carrossel (por que acontece, faz assim, pedido pronto com botão de copiar), tem um bônus
  e termina com uma chamada só. Pensada pro celular, que abre pelo navegador do Instagram.
  Modelo: `Desktop\material-limite-claude\`. Publicar no Vercel (projeto próprio,
  como `material-seguidores`) só depois que ele confirmar.
- **`automacao.txt`** na pasta do carrossel: palavra-chave e variações, 3 respostas
  públicas pro comentário, mensagem do direct com botão e o link da página.

## Regras do texto

- Português do jeito dele, direto. Proibido travessão e "etc".
- Título de item: o que a coisa faz, curto (até uns 45 caracteres).
- `txt`: até uns 110 caracteres; quando tem pedido, termina chamando a caixa ("É só pedir assim:").
- `pede`: frase que a pessoa copia e cola, com número e objeto concreto.
- Nunca inventar número nem prometer o que o Claude não faz sozinho. Se depende de
  conexão, dizer qual ("Conectado ao Metricool, ...").
- Pra gancho e estrutura dá pra apoiar nas skills `ig-carousel-planner` e
  `ig-caption-writer` do plugin instagram-skills, mas o visual é sempre este.

## Arquivos

- `modelo.html`: o design. Mudança de design se faz aqui (vale pra todos os próximos).
- `gerar.mjs`: gera os PNGs com o Chrome sem janela.
- `exemplo-dados.js`: o carrossel aprovado ("7 coisas que o Claude faz no seu Instagram"),
  que já está pronto em `Desktop\carrosseis\7-coisas-claude\`.
