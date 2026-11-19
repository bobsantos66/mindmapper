# Compliance guardrails

Drafting rules the skill follows and `lint` enforces where it can. This is a working checklist for ad drafts, not legal advice; policies change, so re-check each platform's current ad policy page before a campaign goes live. Dates below are when the rule was last checked while writing this file (2026-10-28).

## 1. Disclose AI-generated content

- Put a plain label in an on-screen caption from the first frame: `AI-generated ad` (or `AI-generated ad (b-roll)` when only some shots are generated). `lint` fails if `compliance.ai_label` is missing from every caption while any shot is generated.
- Switch on the platform's AI-content setting when uploading (`compliance.platform_toggle`). As checked in 2026: TikTok asks creators to label AI-generated content and applies its own AIGC labels; Meta applies "AI info" labels and requires disclosure for digitally created or altered realistic content in certain ad categories; YouTube requires disclosure of realistic altered or synthetic content. Each platform's wording and scope differ; read the live policy.
- EU: Regulation (EU) 2024/1689 (AI Act), Article 50, sets transparency obligations for AI-generated or manipulated content that resembles real people, places or events, with application dates from August 2026. If the ad runs in the EU, label it.
- Do not hide the label in a corner the platform UI covers; a caption line is safest.

## 2. Never fabricate testimonials

- An AI presenter is a demonstrator. It can show, explain, compare and ask. It cannot say "I've used this", "changed my life", "honest review", "not sponsored". `lint` fails these phrasings for `ai_generated` and `none` presenters.
- Star ratings, "thousands of happy customers", review screenshots and "verified buyer" wording are claims about real people; they need real sources and belong in `claims` with evidence, or stay out.
- US: the FTC's rule on fake reviews and testimonials, 16 CFR Part 465 (effective 21 October 2024), prohibits testimonials by people who do not exist or who did not use the product, including AI-generated ones. The FTC Endorsement Guides, 16 CFR Part 255 (revised 2023), require endorsements to reflect honest experience and material connections to be disclosed.
- A real customer or creator can testify: get a signed release, keep proof of purchase, and disclose the paid relationship in speech and on screen ("paid partnership").

## 3. Never impersonate real people, creators or brands

- `presenter.description` must describe a fictional person. Do not reference a real creator, actor, customer or employee, and do not use someone's photo as the image-to-video start frame without written consent for this use.
- No platform or third-party endorsement wording ("as seen on TikTok", "Instagram approved", "endorsed by"). `lint` fails these.
- Keep logos, flags, carrier names, airline liveries and competitor packaging out of generated shots; the default negative prompt covers `text, watermark, logos`.

## 4. Claims need evidence

- Anything that sounds measurable is a claim: "clinically", "proven", "guaranteed", "#1", "dermatologist-tested", percentages, "results in N days", "lose N". Each one goes in `claims` with where it is proven (a test report, the label, a spec sheet with a date). `lint` fails unlisted ones and warns on unlisted numbers.
- Health, weight, skin-condition, financial-return and "safe for" wording are regulated categories on every major ad platform; prefer observable demos ("the foam lifts the ring in one wipe") over outcome promises.
- Prices and offers: say them only if they are true on the day and for the run of the ad; otherwise "link below".
- Before/after: a split-screen that shows application is a demo; a split-screen that implies a result over time is a claim and needs a source.

## 5. Platform ad-policy notes (summary, verify before launch)

| Platform | What to check |
|---|---|
| TikTok Ads | AI-generated content disclosure; restricted categories (health, finance, supplements); no misleading "before/after"; branded content toggle for creator posts; ad length limits for the placement |
| Meta (Reels / Instagram / Facebook) | "AI info" labelling and disclosure rules for realistic generated content; personal attributes policy (do not imply the viewer has a condition); restricted categories; special ad categories |
| YouTube Shorts (Google Ads) | altered/synthetic content disclosure; misrepresentation policy; healthcare and medicines policy; Shorts length limits for the ad format |

## 6. Pre-flight checklist

- [ ] `python3 scripts/ugc_script.py lint script.json --strict` passes
- [ ] AI label visible in the first two seconds, not cropped by the platform UI
- [ ] Platform AI-content setting switched on at upload
- [ ] Presenter is fictional (or a real person with release and disclosure)
- [ ] Every entry in `claims` has a document behind it, dated
- [ ] No real logos, people or competitor products in generated shots
- [ ] Offer and price in the CTA are true for the run dates
- [ ] Policy pages of each target platform re-read this quarter
