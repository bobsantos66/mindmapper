# Squads Agência

Pasta com os squads da agência (pacotes de agentes no formato Synkra AIOS) a serem instalados.

Cada squad fica numa subpasta própria, com o conteúdo original do pacote:

```
squads-agencia/
└── <nome-do-squad>/
    ├── squad.yaml      # manifesto (agentes, tarefas, workflows)
    ├── README.md
    ├── agents/
    ├── tasks/
    ├── workflows/
    ├── checklists/
    ├── config/
    └── data/
```

> Os pacotes estão no formato AIOS (`squad.yaml` + `agents/*.md`), sem `SKILL.md`.
> Para usar no Claude Code, cada squad precisa ser convertido em skill(s) em `.claude/skills/`.

## Squads

| Squad | Pasta | Agentes | Descrição |
|---|---|---|---|
| Design Squad | [`design-squad/`](design-squad/) | skilld01–skilld08 | Design systems, UX, UI e visual. Coordenador + 3 especialistas de referência (Brad Frost, Dan Mall, Dave Malouf) + 4 especialistas de execução. |
