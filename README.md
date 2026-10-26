# MindMapper

Biblioteca para buscar, organizar e usar prompts, skills, plugins, conectores, MCP Servers, agentes, templates, comandos e workflows do **ChatGPT** e do **Claude**, com instalação direta no **Claude Code**.

- **Web** (`apps/web`): busca por intenção, ficha completa, edição com histórico, categorias, lixeira, favoritos e convidados.
- **MindMapper Local** (`apps/local`): o comando `mm` e um servidor MCP que instalam e removem, no Claude Code deste computador, os itens aprovados da biblioteca.
- **Core** (`packages/core`): regras compartilhadas, como a ficha, os manifestos de instalação e a sintaxe de cada plataforma.
- **Banco** (`supabase`): Postgres com regras de acesso (RLS), busca com sinônimos e versões.

## O que cada plataforma permite

| | Claude Code | ChatGPT (site e app) |
|---|---|---|
| Consultar e copiar | Sim | Sim |
| Instalar e remover pelo MindMapper | Sim: skills, comandos, plugins e MCP Servers | Não. O ChatGPT não tem API pública de instalação; a ficha traz o link e o passo a passo |
| Sintaxe exibida | `/comando` | `@App` |

## Acesso

- Existe um único **administrador**, que cria, edita, aprova e exclui.
- **Convidados** entram só com e-mail e senha criados pelo administrador em *Administração › Convidados*. A senha aparece uma única vez. Revogar apaga a conta na hora, e a sessão aberta cai no próximo clique.
- Convidados veem só o que está **aprovado** e fora da lixeira. Isso vale também para fichas, comandos e pacotes: a regra está no banco, não só na tela.
- O cadastro aberto está desligado.

## Rodar no seu computador (modo local, sem Docker)

Guia passo a passo para Windows e iPhone: [docs/windows.md](docs/windows.md).

```bash
pnpm install && pnpm build
node apps/local/dist/mm.mjs abrir --celular   # no Windows: dois cliques em MindMapper.cmd
```

O banco é o mesmo PostgreSQL das migrações, rodando dentro do Node (PGlite), e fica em `~/.mindmapper/local/dados`.
Um servidor em `127.0.0.1` atende no formato do Supabase (REST e login), então o site e o `mm` não mudam.
Ele escuta só neste computador; o celular fala com o site, nunca direto com o banco.

## Desenvolvimento com Supabase (Docker)

Requisitos: Node 20+, pnpm 10 e Docker.

```bash
pnpm install
pnpm db:start                      # sobe o Supabase local e aplica migrações e seeds
cp apps/web/.env.example apps/web/.env.local
# preencha a chave anon e a service_role com os valores que o comando acima imprimiu
SUPABASE_SERVICE_ROLE_KEY=... pnpm criar-admin voce@exemplo.com "Seu nome"
pnpm dev                           # http://localhost:3000
```

Verificações:

```bash
pnpm typecheck && pnpm lint && pnpm test   # tipos, lint, testes do core e do MindMapper Local
pnpm test:rls                              # regras de acesso contra o banco local
```

Os itens de exemplo (`supabase/seed.sample.sql`) aparecem com o selo **Exemplo ilustrativo** e ficam fora das estatísticas.

## MindMapper Local

```bash
pnpm --filter @mindmapper/local build
node apps/local/dist/mm.mjs ajuda
```

Uso típico:

```bash
mm configurar https://seu-projeto.supabase.co <chave anon>
mm entrar voce@exemplo.com
mm buscar transformar planilha em gráfico
mm instalar build-dashboard            # mostra o plano e pede confirmação
mm instalar build-dashboard --projeto  # só na pasta atual
mm instalados
mm remover build-dashboard             # vai para a lixeira do MindMapper
mm restaurar <id>
mm incluir ./minha-skill               # envia como rascunho (só admin)
```

Para usar de dentro do Claude Code, enquanto monta um comando:

```bash
claude mcp add --scope user mindmapper -- mm mcp
```

Regras de segurança:

- Só instala **pacote aprovado de recurso aprovado**, e valida o manifesto de novo no computador.
- Nunca executa texto livre da biblioteca. Usa os comandos oficiais (`claude plugin`, `claude mcp`) com argumentos fixos, sem shell, ou grava arquivos em `~/.claude/skills` e `~/.claude/commands`.
- Toda instalação mostra antes o que vai mudar. Não sobrescreve arquivo existente.
- Só remove o que ele mesmo instalou. Arquivos removidos vão para `~/.mindmapper/lixeira` e podem voltar com `mm restaurar`.
- Valores secretos de MCP Servers são pedidos no terminal e ficam só neste computador. Pelo servidor MCP, esses itens são recusados, para o segredo não passar pela conversa.
- A sessão fica em `~/.mindmapper/sessao.json`, legível só pelo seu usuário.

## Banco de dados

- As migrações são **só aditivas**: nenhuma recria tabelas nem apaga dados.
- Cada edição gera uma versão em `resource_versions`, e cada mudança de ficha cria uma nova versão da descrição. A anterior fica como "substituída".
- O conteúdo original e os campos gerados por regras ou IA ficam separados (`resources.conteudo` e `resource_descriptions`).

## Fases

1. **Fundação (este código):** biblioteca, busca, ficha, edição, categorias, convidados e MindMapper Local para o Claude Code.
2. Editor de tarefas e mapa mental.
3. Importação inteligente (PDF com OCR, DOCX, XLSX, TXT, MD, JSON), sempre com aprovação antes de salvar.
4. Descrição funcional por IA. Está desligada até você escolher o provedor.

Publicar exige criar um projeto no Supabase e uma hospedagem para a web, como a Vercel. São serviços externos e só serão contratados com a sua aprovação.
