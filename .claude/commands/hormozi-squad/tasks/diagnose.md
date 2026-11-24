---
task: diagnoseBusinessChallenge()
responsavel: "@skilln01"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: request
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: revenue_stage
    tipo: string
    origem: User Input
    obrigatorio: false

Saida:
  - campo: diagnosis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Request parsed and keywords extracted"
  - "[ ] Routing catalog consulted with scored results"
  - "[ ] Quick answer provided with Hormozi framework reference"
---

# Task: Diagnose Business Challenge

**Task ID:** HORMOZI-CHIEF-001
**Version:** 1.0.0
**Command:** `*diagnose`
**Orchestrator:** Hormozi Chief (skilln01)
**Purpose:** Triage business challenges, provide quick answer using Hormozi frameworks, route to specialist.

---

## Overview

```
User Request → Parse Keywords → Match Routing Catalog → Answer/Route → Output
     │              │                    │                     │
     ▼              ▼                    ▼                     ▼
  Raw input   Extract business     Score domains         Quick answer +
              challenge type     against 15 domains     specialist route
              + stage + metric                          (Value Equation lens)
```

---

## Inputs

| Field | Type | Source | Required | Validation |
|-------|------|--------|----------|------------|
| request | string | User prompt | Yes | Non-empty business challenge description |
| context | object | Session state | No | Business stage, revenue, industry, current metrics |
| revenue_stage | string | User prompt | No | Pre-revenue, <$1M, $1-3M, $3-10M, $10M+ |

---

## Preconditions

- Hormozi Squad is active with Hormozi Chief as entry agent
- Routing catalog loaded from data/routing-catalog.yaml
- All 15 specialist agents registered in config.yaml
- Core formula context: Value = (Dream Outcome x Perceived Likelihood) / (Time Delay x Effort & Sacrifice)

---

## Execution Phases

### Phase 1: Analyze Request

1. Parse the user's business challenge
2. Extract primary keywords and intent
3. Identify the business function (offers, leads, pricing, sales, scaling, retention, etc.)
4. Identify the business stage if mentioned (pre-revenue, startup, growth, scale)
5. Note which part of the Value Equation is underperforming

### Phase 2: Match Against Routing Catalog

| Domain | Keywords | Route To |
|--------|----------|----------|
| Offer Creation | offer, grand slam, value stack, bonuses, guarantee | skilln12 / skilln13 |
| Lead Generation | leads, lead magnet, acquisition, outreach, traffic | skilln10 / skilln02 |
| Pricing Strategy | pricing, charge more, premium, margins, price point | skilln13 / skilln12 |
| Sales Copy | sales copy, landing page copy, ad text, write copy | skilln07 / skilln08 |
| Paid Ads | ads, paid ads, advertising, ad spend, media buying | skilln02 / skilln08 |
| Content Strategy | content, social media, organic, YouTube, posting | skilln06 / skilln08 |
| Hooks & Headlines | hooks, headlines, attention, scroll stopper, opening | skilln08 / skilln07 |
| Product Launch | launch, go to market, MVP, first customers | skilln09 / skilln12 |
| Sales Closing | close, sales call, objections, CLOSER, high ticket | skilln05 / skilln12 |
| Workshop Design | workshop, seminar, event, training, masterclass | skilln16 / skilln05 |
| Churn & Retention | churn, retention, cancel, LTV, keep customers | skilln14 / skilln15 |
| Business Scaling | scale, grow, $1M, $10M, $100M, expand, hire | skilln15 / skilln11 |
| Business Model | business model, recurring revenue, subscription, SaaS | skilln11 / skilln15 |
| Business Audit | audit, evaluate, diagnose, bottleneck, problems | skilln04 / skilln11 |
| General Strategy | strategy, advice, direction, next step, mentor | skilln03 / skilln01 |

**Scoring rules:**
- Count keyword matches per domain
- 2+ matches above others --> route to that domain's primary specialist
- Tie or cross-domain --> Hormozi Chief answers using Value Equation lens
- No clear match --> ask about business stage and primary bottleneck

### Phase 3a: Cross-Cutting Answer

If request is general or cross-domain:
- Apply the Value Equation to diagnose the core issue
- Identify which lever (Dream Outcome, Likelihood, Time Delay, Effort) needs work
- Reference which specialists could go deeper

### Phase 3b: Domain-Specific Route

If request maps clearly to a domain:
1. **Quick answer first** (3-5 lines minimum + Hormozi framework reference)
2. **Route:** Name the specialist, explain their unique value, provide activation command
   - Example: "Your offer needs the Grand Slam framework. Activate with `@hormozi-squad:skilln12`"

### Phase 4: Confidence Assessment

| Confidence | Criteria | Action |
|------------|----------|--------|
| HIGH | 3+ keyword matches in one domain | Route with confidence to primary specialist |
| MEDIUM | 1-2 matches or split across 2 domains | Answer + suggest 2 specialists |
| LOW | No clear match or vague request | Answer with Value Equation, ask clarifying question |

---

## Output Format

```markdown
## Diagnosis
**Category:** {domain | cross-cutting}
**Confidence:** {HIGH | MEDIUM | LOW}
**Specialist:** {Name} ({agent-id}) | Direct Answer

### Quick Answer
{3-10 line answer using Hormozi frameworks}

### Recommended Next Step
{Route instruction with activation command, or follow-up question}
```

---

## Veto Conditions

- NEVER route without providing a quick answer first
- NEVER route when confidence is LOW — answer using Value Equation and ask clarifying questions
- NEVER load a specialist agent file during diagnosis
- NEVER guess the business stage — ask if unclear
- NEVER give generic advice without referencing a specific Hormozi framework

---

## Completion Criteria

- [ ] Request parsed and keywords extracted
- [ ] Business challenge type identified
- [ ] Routing catalog consulted with scored results
- [ ] Quick answer provided with Hormozi framework reference
- [ ] Specialist routing provided (if domain-specific)
- [ ] Confidence level stated
