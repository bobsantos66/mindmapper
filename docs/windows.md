# MindMapper no Windows (modo local)

A plataforma inteira roda no seu computador: sem Docker, sem nuvem e sem conta em serviço externo.
O iPhone acessa pelo Safari quando está na mesma rede Wi-Fi e o computador está ligado com o MindMapper aberto.

## 1. Instalar uma vez

1. Instale o **Node.js 22 LTS** em <https://nodejs.org> (botão "LTS", instalação padrão).
2. Abra o **Prompt de Comando** e ative o pnpm, que vem junto com o Node:
   ```
   corepack enable
   ```
   Se o Windows recusar por permissão, abra o Prompt de Comando como administrador só para este comando.
3. Baixe o MindMapper do GitHub: na página do repositório, **Code › Download ZIP**, e extraia numa pasta fixa,
   por exemplo `C:\MindMapper`. (Quem usa Git pode clonar no lugar do ZIP.)
4. No Prompt de Comando, dentro dessa pasta:
   ```
   cd C:\MindMapper
   pnpm install
   pnpm build
   ```
   Leva alguns minutos na primeira vez.

## 2. Abrir

Dê dois cliques em **`MindMapper.cmd`**, na pasta do MindMapper.

- Na primeira vez, a janela pede seu nome, um e-mail (só serve de login, nada é enviado) e uma senha de no mínimo 10 caracteres.
  Esse é o acesso de administrador.
- O navegador abre em `http://localhost:3000`.
- A janela mostra também o endereço para o iPhone, como `http://192.168.0.15:3000`.
- Se o Windows perguntar sobre o firewall, permita só em **Redes privadas**.
  Em redes públicas (café, hotel) o acesso de fora fica bloqueado.
- Para fechar, aperte **Ctrl+C** na janela. Fechar no X também encerra, mas pode não dar tempo de gravar o backup final.

## 3. Usar no iPhone

1. Com o MindMapper aberto no computador, conecte o iPhone ao mesmo Wi-Fi.
2. No Safari, digite o endereço que a janela mostrou (ex.: `http://192.168.0.15:3000`) e entre com o seu login.
3. Opcional: **Compartilhar › Adicionar à Tela de Início** cria um ícone como se fosse um app.

O endereço pode mudar se o roteador der outro número ao computador. A janela sempre mostra o atual.
Fora de casa o iPhone não alcança o computador; isso exigiria publicar a plataforma, o que fica para quando você decidir.

## 4. Backup no Google Drive

O banco fica em `C:\Users\<você>\.mindmapper\local\dados`, **fora** do Drive: sincronizar a pasta de um banco aberto corrompe os arquivos.
O Drive recebe cópias completas.

1. Instale o **Google Drive para computador** e crie uma pasta, por exemplo `G:\Meu Drive\MindMapper Backups`.
2. Na pasta do MindMapper:
   ```
   mm backup-pasta "G:\Meu Drive\MindMapper Backups"
   ```
3. Pronto: o MindMapper grava um backup ao abrir, a cada 6 horas e ao fechar. Ficam os 30 mais recentes.
   Só os arquivos `MindMapper-backup-*.tar.gz` são apagados na rotação; nada mais na pasta é tocado.

Restaurar (com o MindMapper fechado):
```
mm restaurar-backup "G:\Meu Drive\MindMapper Backups\MindMapper-backup-2026-10-26-180000.tar.gz"
```
O banco atual não é apagado: vai para uma pasta `dados-antes-de-restaurar-<data>` ao lado, para você poder voltar.

Para levar tudo para outro computador: instale como no passo 1, rode `mm restaurar-backup` com o último backup e abra.

## 5. Importar a biblioteca

Com o MindMapper aberto, em outra janela do Prompt de Comando, na pasta do MindMapper:
```
mm importar "C:\caminho\mindmapper_biblioteca_organizada.json"
```
Os itens entram **em revisão**, com o registro original guardado. Use `--simular` para ver o resultado antes.

## 6. Claude Code

O `mm abrir` já liga o comando `mm` e o servidor MCP a este banco. Depois de abrir:
```
mm entrar seu@email.com
mm buscar revisar ortografia
claude mcp add --scope user mindmapper -- node C:\MindMapper\apps\local\dist\mm.mjs mcp
```

## Atualizar

Baixe a versão nova por cima da pasta (ou `git pull`) e rode `pnpm install` e `pnpm build` de novo.
Os seus dados ficam em `.mindmapper\local` e não são tocados; ao abrir, o banco recebe as mudanças novas sem perder nada.

## Problemas comuns

| Mensagem | O que fazer |
|---|---|
| `O site ainda não foi preparado` | Rode `pnpm build` na pasta do MindMapper. |
| `O MindMapper já está aberto em ...` | Já existe uma janela aberta; use-a ou feche-a. |
| `A porta 3000 pode estar em uso` | `node apps\local\dist\mm.mjs abrir --celular --porta 3001` |
| O iPhone não abre o endereço | Confira se está no mesmo Wi-Fi e se o firewall permitiu "Redes privadas". |
