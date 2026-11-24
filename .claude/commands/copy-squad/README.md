# Copy Squad

Elite squad of 23 copywriting agents — 22 legendary copywriters + 1 orchestrator (Copy Chief).

## Quick Start

```
@skillcp34     # Activate the orchestrator
*diagnose       # Triage your copywriting request
*full-copy-project  # End-to-end copy project workflow
```

## Tier Architecture

| Tier | Name | Agents | Focus |
|------|------|--------|-------|
| **0** | Orchestration | skillcp34 | Routes demands, reviews output, mediates |
| **1A** | Direct Response Legends | skillcp46, skillcp43, skillcp37, skillcp45, skillcp52, skillcp49, skillcp47 | Long-form, print, mail |
| **1B** | Modern Copy & Funnels | skillcp39, skillcp44, skillcp53, skillcp56, skillcp55, skillcp50, skillcp54 | VSLs, funnels, webinars, launches |
| **1C** | Email & Relationship | skillcp36, skillcp35, skillcp40 | Email sequences, daily emails, nurture |
| **1D** | Offers & Sales Pages | skillcp48, skillcp42, skillcp38, skillcp51, skillcp41 | Offer architecture, print ads, financial/health |

## Routing Matrix

The Copy Chief automatically routes your request to the best specialist:

| Request Type | Primary | Secondary |
|-------------|---------|-----------|
| Headline | skillcp43 | skillcp46 |
| Sales letter / long-form | skillcp46 | skillcp49 |
| Email sequence | skillcp35 | skillcp36 |
| VSL / video sales letter | skillcp55 | skillcp50 |
| Webinar script | skillcp53 | skillcp56 |
| Offer creation | skillcp39 | skillcp48 |
| Funnel copy | skillcp53 | skillcp44 |
| Big idea / campaign concept | skillcp56 | skillcp43 |
| Bullet points / fascinations | skillcp45 | skillcp38 |
| Daily emails / engagement | skillcp36 | skillcp40 |
| Classic sales letter / mail | skillcp52 | skillcp47 |
| Financial / health copy | skillcp38 | skillcp51 |
| Brand / premium copy | skillcp42 | skillcp41 |
| Ad copy / paid ads | skillcp39 | skillcp44 |
| Launch copy | skillcp44 | skillcp53 |
| Personal brand copy | skillcp40 | skillcp54 |
| Copy review / critique | skillcp34 | skillcp43 |

## Components

- **23 agents** — 1 orchestrator + 22 specialists
- **13 tasks** — write-headline, write-sales-letter, write-vsl-script, write-email-sequence, write-ad-copy, write-landing-page, write-bullets, create-funnel-copy, create-offer, analyze-copy, critique-copy, diagnose, review
- **2 workflows** — full-copy-project, copy-review-cycle
- **1 checklist** — output-quality (quality gate for deliverables)
- **2 data files** — routing-catalog, copy-frameworks

## Workflows

### Full Copy Project (`*full-copy-project`)
End-to-end: brief > diagnose > assign specialist > write > review > deliver.

### Copy Review Cycle (`*copy-review-cycle`)
Iterative write-critique-revise loop (max 3 iterations).

## Requirements

- AIOS >= 4.0.0
