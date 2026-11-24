# Squads Agência

Índice dos squads e skills da agência instalados neste repositório.

- **Squads** (agentes no formato AIOS) ficam em [`.claude/commands/`](../.claude/commands/). Cada arquivo vira um comando com o caminho da pasta: `/<squad>:agents:<id>` ativa um agente (ex.: `/design-squad:agents:skilld01`) e `/<squad>:tasks:<tarefa>` roda uma tarefa (ex.: `/design-squad:tasks:diagnose`).
- **Skills** ficam em [`.claude/skills/`](../.claude/skills/) e o Claude carrega sozinho quando o pedido combina com a descrição (ou chame por `/<nome>`).

## Squads (`.claude/commands/`)

| Squad | Agentes | Foco |
|---|---|---|
| [advisory-board](../.claude/commands/advisory-board/) | 11 | Conselho estratégico (Dalio, Munger, Naval, Thiel, Hoffman, Sinek…) |
| [brand-squad](../.claude/commands/brand-squad/) | 15 | Estratégia de marca (10 pensadores de branding + especialistas) |
| [c-level-squad](../.claude/commands/c-level-squad/) | 6 | C-suite virtual: CEO, COO, CMO, CTO, CIO, CAIO |
| [copy-master](../.claude/commands/copy-master/) | 33 | Copywriting 2.0: 32 mestres + orquestrador |
| [copy-squad](../.claude/commands/copy-squad/) | 23 | Copywriting: 22 copywriters + orquestrador |
| [cybersecurity](../.claude/commands/cybersecurity/) | 15 | Pentest, red/blue team, AppSec, resposta a incidentes |
| [data-squad](../.claude/commands/data-squad/) | 7 | Analytics, CLV, growth, comunidade, customer success |
| [design-squad](../.claude/commands/design-squad/) | 8 | Design systems, UX, UI, visual (skilld01–skilld08) |
| [hormozi-squad](../.claude/commands/hormozi-squad/) | 16 | Frameworks de Alex Hormozi: ofertas, leads, pricing, vendas |
| [movement](../.claude/commands/movement/) | 7 | Construção de movimentos, manifestos, identidade |
| [storytelling](../.claude/commands/storytelling/) | 12 | Storytelling: mitologia, roteiro, pitch, narrativa |
| [traffic-masters](../.claude/commands/traffic-masters/) | 16 | Tráfego pago: Meta, YouTube, Google Ads, escala |
| [claude-code-mastery](../.claude/commands/claude-code-mastery/) | 8 | Hooks, skills, subagentes, MCP, plugins do Claude Code |
| [AIOX](../.claude/commands/AIOX/) | 12 | Agentes do framework AIOX ⚠️ |
| [synapse](../.claude/commands/synapse/) | — | Gerenciador de domínios/regras SYNAPSE ⚠️ |

⚠️ **AIOX** e **synapse** são atalhos que apontam para arquivos do framework AIOS/AIOX (`.aiox-core/`, `.claude/skills/AIOX/…`) que **não vieram no pacote**. Partes deles (e algumas tarefas do claude-code-mastery) só funcionam por completo com o framework instalado.

## Skills (`.claude/skills/`)

| Skill | O que faz |
|---|---|
| skillct01 | Carrossel de Instagram pronto (PNGs 1080×1350 + legenda) |
| skillct02 | Prompts detalhados de imagem/vídeo IA (personagem JPV) |
| skillct15 | Marketing de influenciadores e creators |
| skilld24 | Design e motion no estilo Apple, para web |
| skilld25 | Interfaces iOS/macOS seguindo o HIG da Apple |
| skilld26 | Frontend de alta qualidade visual |
| skille36–skille46 | Pacote "Replica": mapear, planejar, redesenhar, renomear, construir, testar, comparar, publicar e lançar um app inspirado em outro, com código e marca próprios |
| skilln48 | "Gêmeo": instala o negócio da pessoa no Claude + mapa do negócio em HTML |
| skilln49 | Copy de landing page de vendas em 15 blocos |
| skilln50 | Diagnóstico de negócio guiado com relatório HTML |
