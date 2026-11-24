---
task: diagnose()
responsavel: "@skilln34"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: query
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: diagnosis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Query parsed with intent and domain classification"
  - "[ ] Quick answer provided"
  - "[ ] Route executed or direct answer given"
---

# Task: Diagnose — Data Squad

## Metadata

| Field         | Value                                              |
|---------------|----------------------------------------------------|
| Task ID       | `data-squad:diagnose`                              |
| Command       | `@data-squad diagnose "{query}"`                   |
| Orchestrator  | `skilln34`                                       |
| Purpose       | Parse the user's request, provide a quick answer, and route to the best data expert |

## Inputs

| Input        | Source       | Required | Description                              |
|--------------|-------------|----------|------------------------------------------|
| `query`      | User prompt | Yes      | The user's question or request           |
| `context`    | Session     | No       | Previous conversation context            |
| `domain_hint`| User/Auto   | No       | Suggested domain (analytics, growth, etc.) |

## Preconditions

- Squad config loaded (`config/config.yaml`)
- Routing catalog available (`data/routing-catalog.yaml`)
- At least one specialist agent definition exists in `agents/`

## Phases

### Phase 1: Parse (skilln34)

1. Read the user's query and extract:
   - **Intent**: What the user wants to accomplish
   - **Domain keywords**: Match against routing catalog keywords
   - **Data maturity**: Where the user is (no data, basic analytics, advanced)
   - **Complexity**: Simple (direct answer) vs Complex (needs specialist)

2. Classify the query type:
   - `question` — Needs an informational answer
   - `analysis` — Needs data analysis or interpretation
   - `strategy` — Needs a growth/retention/community plan
   - `framework` — Needs a specific expert's framework applied
   - `troubleshoot` — Needs to diagnose a metric problem

### Phase 2: Match Routing

1. Load `data/routing-catalog.yaml`
2. Score each domain against extracted keywords
3. Identify:
   - **Primary agent**: Best match (highest keyword overlap)
   - **Secondary agent**: Backup or complementary perspective
   - **Confidence level**: HIGH (>= 3 keyword matches), MEDIUM (2 matches), LOW (0-1 matches)

4. Expert selection guide:
   | Problem Area              | Primary Agent     | Secondary Agent  |
   |---------------------------|-------------------|------------------|
   | Web/marketing analytics   | skilln35   | skilln39       |
   | Customer value/segmentation | skilln38     | skilln37       |
   | Growth/acquisition        | skilln39        | skilln35  |
   | Audience/content          | skilln40           | skilln36     |
   | Retention/churn           | skilln37        | skilln38      |
   | Community                 | skilln36      | skilln37       |

### Phase 3: Answer

1. **Always provide a quick answer first** — 2-4 sentences that directly address the query
2. Include:
   - Direct response to the question
   - Which expert's framework is most relevant
   - What deeper value the specialist would provide

### Phase 4: Route (if needed)

1. If confidence is HIGH or MEDIUM:
   - Announce the routing target: "Routing to @{agent} for deeper analysis"
   - Pass context: original query + parsed intent + domain classification
2. If confidence is LOW:
   - Do NOT route — answer directly as skilln34
   - Offer the user a choice of experts if the query is ambiguous

## Output Format

```yaml
diagnosis:
  query_summary: "{1-line summary}"
  intent: "{question|analysis|strategy|framework|troubleshoot}"
  domain: "{analytics|clv|growth|audience|community|retention}"
  quick_answer: |
    {2-4 sentence direct answer}
  routing:
    confidence: "{HIGH|MEDIUM|LOW}"
    primary_agent: "{agent-id}"
    secondary_agent: "{agent-id}"
    reason: "{why this expert is the best match}"
  routed: {true|false}
```

## Veto Rules

1. **NEVER route without providing a quick answer first** — The user must always get immediate value
2. **NEVER route on LOW confidence** — Answer directly and offer choices instead
3. **NEVER route to more than one agent simultaneously** — Pick the best expert
4. **NEVER recommend a framework without naming the expert** — Attribution matters
5. **NEVER guess at data the user hasn't provided** — Ask for specifics first

## Completion Criteria

- [ ] Query parsed with intent and domain classification
- [ ] Routing catalog consulted and confidence scored
- [ ] Quick answer provided (mandatory, regardless of routing)
- [ ] Route executed if confidence >= MEDIUM, or direct answer if LOW
- [ ] Output format matches the schema above
