---
task: diagnoseTrafficChallenge()
responsavel: "@skillt01"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: request
    tipo: string
    origem: User Input
    obrigatorio: true
  - campo: platform
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
  - "[ ] Quick answer provided with metric reference"
---

# Task: Diagnose Traffic Challenge

**Task ID:** TRAFFIC-CHIEF-001
**Version:** 1.0.0
**Command:** `*diagnose`
**Orchestrator:** Traffic Chief (skillt01)
**Purpose:** Triage paid traffic challenges, provide quick answer, route to platform expert or functional specialist.

---

## Overview

```
User Request → Parse Keywords → Match Routing Catalog → Answer/Route → Output
     │              │                    │                     │
     ▼              ▼                    ▼                     ▼
  Raw input   Extract platform     Score domains         Quick answer +
              + function +       against 17 domains     specialist route
              metrics context    + platform routing      (platform-aware)
```

---

## Inputs

| Field | Type | Source | Required | Validation |
|-------|------|--------|----------|------------|
| request | string | User prompt | Yes | Non-empty traffic/ads-related description |
| context | object | Session state | No | Ad account details, current metrics, budget |
| platform | string | User prompt | No | Facebook, Google, YouTube, TikTok, LinkedIn, cross-platform |

---

## Preconditions

- Traffic Masters is active with Traffic Chief as entry agent
- Routing catalog loaded from data/routing-catalog.yaml
- All 15 specialist agents registered in config.yaml
- Platform routing map available for platform-specific triage

---

## Execution Phases

### Phase 1: Analyze Request

1. Parse the user's traffic challenge
2. Extract primary keywords and intent
3. Identify the platform (Facebook/Meta, Google, YouTube, TikTok, LinkedIn, or cross-platform)
4. Identify the function (creative, scaling, tracking, auditing, budgeting, media buying)
5. Note key metrics mentioned (ROAS, CPA, CTR, CPM, spend level)

### Phase 2: Match Against Routing Catalog

| Domain | Keywords | Route To |
|--------|----------|----------|
| Facebook/Meta Strategy | Facebook ads, Meta ads, Instagram ads | skillt09 / skillt05 |
| Facebook Scaling | scale Facebook, increase spend, BPM method | skillt05 / skillt14 |
| YouTube Ads | YouTube ads, video ads, pre-roll, TrueView | skillt16 / skillt02 |
| Google Ads | Google Ads, PPC, Performance Max, search ads | skillt07 / skillt12 |
| High-ROI Facebook | high ROI, Give-Give-Give-Ask, relationship ads | skillt10 / skillt09 |
| Brazil/LATAM Traffic | Brazil, LATAM, Sobral method, Portuguese ads | skillt11 / skillt05 |
| Ad Creative | creative, ad creative, UGC, video creative | skillt02 / skillt04 |
| Media Buying | media buying, campaign setup, bidding, placement | skillt08 / skillt14 |
| Performance Analysis | analytics, reporting, metrics, ROAS, data | skillt12 / skillt03 |
| Creative Testing | A/B test, split test, creative fatigue, iteration | skillt04 / skillt02 |
| Campaign Scaling | scale campaigns, increase budget, lookalike | skillt15 / skillt05 |
| Tracking/Attribution | tracking, pixel, CAPI, attribution, iOS 14 | skillt13 / skillt12 |
| Ad Account Audit | audit, account health, waste, optimization | skillt03 / skillt12 |
| Budget Management | budget, ad spend, cost control, allocation | fiscal / skillt15 |
| Full-Funnel Strategy | full funnel, TOFU, MOFU, BOFU, customer journey | skillt14 / skillt09 |
| Perpetual Traffic | perpetual traffic, evergreen, always-on, sustainable | skillt14 / skillt09 |

**Platform shortcut routing:**
- Facebook/Meta mentioned --> skillt09, skillt05, skillt14 (narrow by function)
- YouTube mentioned --> skillt16
- Google mentioned --> skillt07
- TikTok mentioned --> skillt08, skillt02
- LinkedIn mentioned --> skillt08, skillt10
- Cross-platform / unclear --> skillt01 answers, suggest platform experts

**Scoring rules:**
- Count keyword matches per domain
- 2+ matches above others --> route to that domain's primary specialist
- Platform + function match --> route to platform expert first
- Tie or cross-platform --> Traffic Chief answers directly
- No clear match --> ask about platform, budget, and current metrics

### Phase 3a: Cross-Cutting Answer

If request is general or cross-platform:
- Provide platform-agnostic traffic advice
- Reference key metrics to evaluate (ROAS, CPA, CTR)
- Suggest platform-specific experts for deeper analysis

### Phase 3b: Domain-Specific Route

If request maps clearly to a domain:
1. **Quick answer first** (3-5 lines minimum + concrete metric benchmark or tactic)
2. **Route:** Name the specialist, explain their methodology, provide activation command
   - Example: "For scaling Facebook spend, Depesh Mandalia's BPM method is proven at scale. Activate with `@traffic-masters:skillt05`"

### Phase 4: Confidence Assessment

| Confidence | Criteria | Action |
|------------|----------|--------|
| HIGH | 3+ keyword matches + clear platform | Route with confidence to primary specialist |
| MEDIUM | 1-2 matches or unclear platform | Answer + suggest 2 specialists |
| LOW | No clear match or very vague | Answer directly, ask about platform and budget |

---

## Output Format

```markdown
## Diagnosis
**Category:** {domain | cross-platform}
**Confidence:** {HIGH | MEDIUM | LOW}
**Platform:** {Facebook | Google | YouTube | TikTok | LinkedIn | Cross-platform}
**Specialist:** {Name} ({agent-id}) | Direct Answer

### Quick Answer
{3-10 line answer with concrete traffic advice}

### Recommended Next Step
{Route instruction with activation command, or follow-up question}
```

---

## Veto Conditions

- NEVER route without providing a quick answer first
- NEVER route when confidence is LOW — answer directly and ask about platform + metrics
- NEVER load a specialist agent file during diagnosis
- NEVER assume a platform when not explicitly mentioned
- NEVER give advice without referencing specific metrics or benchmarks

---

## Completion Criteria

- [ ] Request parsed and keywords extracted
- [ ] Platform identified (or clarification requested)
- [ ] Routing catalog consulted with scored results
- [ ] Quick answer provided with metric reference
- [ ] Specialist routing provided (if domain-specific)
- [ ] Confidence level stated
