---
task: diagnose()
responsavel: "@skillcp01"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: request
    tipo: string
    origem: User Input
    obrigatorio: true

Saida:
  - campo: diagnosis
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Request parsed and keywords extracted"
  - "[ ] Routing catalog consulted with scored results (27 domains, 32 agents)"
  - "[ ] Quick answer provided with specialist routing"
---

# Task: Diagnose Copywriting Request

**Task ID:** COPY-M-CHIEF-001
**Version:** 2.0.0
**Command:** `*diagnose`
**Orchestrator:** Copy Master Chief (skillcp01)
**Purpose:** Triage copywriting requests, provide quick answer, route to the best of 32 specialist agents across 27 domains.

---

## Overview

```
User Request -> Parse Keywords -> Match Routing Catalog -> Answer/Route -> Output
     |              |                    |                     |
     v              v                    v                     v
  Raw input   Extract intent     Score domains         Quick answer +
              + awareness      against 27 domains     specialist route
              level + medium    (32 agents)
```

---

## Inputs

| Field | Type | Source | Required | Validation |
|-------|------|--------|----------|------------|
| request | string | User prompt | Yes | Non-empty copywriting-related description |
| context | object | Session state | No | Project context, target audience, awareness level |
| medium | string | User prompt | No | headline, email, VSL, sales letter, ad, funnel, etc. |

---

## Preconditions

- Copy Master Squad is active with Copy Master Chief as entry agent
- Routing catalog loaded with all 27 domains
- All 32 specialist agents registered

---

## Execution Phases

### Phase 1: Analyze Request

1. Parse the user's request for copywriting intent
2. Extract primary keywords and intent
3. Identify the copy medium (headline, sales letter, email, VSL, ad, funnel, webinar, pitch, etc.)
4. Identify the awareness level if mentioned (unaware, problem-aware, solution-aware, product-aware, most-aware)
5. Note secondary domains (e.g., "email sequence for a health product" = email_sequence + financial_health_copy)

### Phase 2: Match Against Routing Catalog (27 Domains, 32 Agents)

| Domain | Keywords | Route To |
|--------|----------|----------|
| Headline | headline, subject line, hook, attention, awareness levels | skillcp13 / skillcp16 |
| Sales Letter | sales letter, long-form, direct mail, long copy | skillcp17 / skillcp22 |
| Email Sequence | email sequence, autoresponder, soap opera, nurture | skillcp03 / skillcp04 |
| VSL | VSL, video sales letter, video script, RMBC | skillcp32 / skillcp23 |
| Webinar Script | webinar, webinar script, perfect webinar, presentation | skillcp29 / skillcp33 |
| Pitch Deck | pitch, pitch deck, investor, STRONG method, frame control | skillcp24 |
| Offer Creation | offer, irresistible offer, guarantee, bonus, stack | skillcp09 / skillcp02 |
| Funnel Copy | funnel, landing page, opt-in, tripwire, upsell | skillcp29 / skillcp15 |
| Big Idea | big idea, campaign concept, unique mechanism, E5 | skillcp33 / skillcp13 |
| Bullet Points | bullets, fascinations, teasers, curiosity | skillcp16 / skillcp08 |
| Daily Emails | daily email, engagement, newsletter, anti-guru | skillcp04 / skillcp10 |
| Classic Mail | classic letter, direct mail, empathy letter, magalog | skillcp27 / skillcp18 |
| Financial Copy | financial copy, investment, portfolio, trading | skillcp08 / skillcp25 |
| Health Copy | health copy, supplement, wellness, fitness | skillcp25 / skillcp14 |
| Brand Copy | brand copy, premium, elegant, sophisticated | skillcp12 / skillcp11 |
| Ad Copy | ad copy, paid ads, Facebook ad, PPC, short copy | skillcp09 / skillcp15 |
| Launch Copy | launch, product launch, launch sequence, cart open | skillcp15 / skillcp29 |
| Personal Brand | personal brand, one-person business, creator, authority | skillcp10 / skillcp30 |
| Copy Review | copy review, critique, feedback, analyze, rewrite | skillcp01 / skillcp13 |
| Persuasion Psychology | persuasion, influence, psychology, triggers, compliance | skillcp26 / skillcp05 |
| Negotiation Copy | negotiation, objection handling, closing, tactical empathy | skillcp06 |
| SaaS Copy | SaaS, software, trial, onboarding, product-led | skillcp19 |
| Conversion Optimization | CRO, conversion rate, A/B test, page optimization | skillcp19 / skillcp20 |
| Belief Shifting | belief, paradigm, worldview, epiphany bridge | skillcp14 / skillcp33 |
| Story-Driven Sales | story, narrative, origin story, epiphany | skillcp17 / skillcp29 |
| Offer Architecture | value equation, Grand Slam offer, pricing, value stack | skillcp02 / skillcp09 |
| Scientific Advertising | testing, split test, metrics, data-driven copy | skillcp07 / skillcp21 |

**Scoring rules:**
- Count keyword matches per domain
- 2+ matches above others -> route to that domain's primary specialist
- Tie or cross-domain -> Copy Master Chief answers directly, suggest 2 specialists
- No clear match -> ask clarifying question about the medium and awareness level

### Phase 3a: Cross-Cutting Answer

If request is general or cross-domain:
- Synthesize answer drawing from multiple copywriting traditions
- Reference which specialists could add depth
- Provide actionable copywriting advice immediately

### Phase 3b: Domain-Specific Route

If request maps clearly to a domain:
1. **Quick answer first** (3-5 lines minimum + concrete example or framework reference)
2. **Route:** Name the specialist, explain their unique value, provide activation command
   - Example: "For VSL scripts, Stefan Georgi's RMBC method is the gold standard. Activate with `@copy-master:skillcp32`"

### Phase 4: Confidence Assessment

| Confidence | Criteria | Action |
|------------|----------|--------|
| HIGH | 3+ keyword matches in one domain | Route with confidence to primary specialist |
| MEDIUM | 1-2 matches or split across 2 domains | Answer + suggest 2 specialists |
| LOW | No clear match or ambiguous medium | Answer directly, ask clarifying question |

---

## Output Format

```markdown
## Diagnosis
**Category:** {domain | cross-cutting}
**Confidence:** {HIGH | MEDIUM | LOW}
**Specialist:** {Name} ({agent-id}) | Direct Answer

### Quick Answer
{3-10 line answer with concrete copywriting advice}

### Recommended Next Step
{Route instruction with activation command, or follow-up question}
```

---

## Veto Conditions

- NEVER route without providing a quick answer first
- NEVER route when confidence is LOW — answer directly and ask clarifying questions
- NEVER load a specialist agent file during diagnosis
- NEVER guess when the copy medium is ambiguous — ask the user
- NEVER assign awareness level without explicit signals from the request

---

## Completion Criteria

- [ ] Request parsed and keywords extracted
- [ ] Copy medium identified (or clarification requested)
- [ ] Routing catalog consulted with scored results (27 domains, 32 agents)
- [ ] Quick answer provided with actionable advice
- [ ] Specialist routing provided (if domain-specific)
- [ ] Confidence level stated
