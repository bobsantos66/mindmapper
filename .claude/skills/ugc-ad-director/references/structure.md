# Beat structure and timing

Every script follows the same five beats. The hook is fixed at two seconds regardless of length; the rest scales.

| Beat | Job | 15 s | 20 s | 30 s | 45 s | 60 s |
|---|---|---|---|---|---|---|
| hook | stop the thumb; name the viewer's situation or show the payoff | 0–2 | 0–2 | 0–2 | 0–2 | 0–2 |
| problem | the annoyance in the viewer's own words; no product yet | 2–4 | 2–6 | 2–7 | 2–10 | 2–12 |
| demo | the product doing the one thing, shown not described | 4–10 | 6–13 | 7–20 | 10–28 | 12–38 |
| proof | something checkable: label, spec, screen, real footage of the real product | 10–13 | 13–17 | 20–26 | 28–38 | 38–52 |
| cta | one instruction and one on-screen line; say the offer only if it is true today | 13–15 | 17–20 | 26–30 | 38–45 | 52–60 |

These are the splits used in `examples/` and by `ugc_script.py new`. They are a starting point, not a measured optimum: the repo makes no claim about retention curves. Move the boundaries, keep the order.

## Beat rules

**Hook (0–2 s).** One idea, ≤ 12 words, said and shown at once. The caption is the hook text (the sound is often off). Put the AI label on the same caption as a second line so it is on screen from frame one. Types that work with a demo-style presenter: pattern-interrupt, callout, contrarian, result-first, curiosity, comparison, objection, POV. Avoid: "stop scrolling", "you need this", anything that starts with the brand name.

**Problem.** Describe the annoyance, not the category. "A receipt that says you bought garlic twice" beats "meal planning is hard". No product in frame yet; the viewer should recognise themselves.

**Demo.** The longest beat. One action, filmed as if by the person doing it: hands, phone, counter. For software, a real screen recording; never a generated UI (it will show features that do not exist). For hardware, the generated shot must match the real product silhouette; attach product photos as reference frames.

**Proof.** Something a viewer could verify: the label, the spec on the box, a settings screen, real footage of the real product. This is where live footage belongs even in an otherwise generated ad. Not a testimonial, not a star rating, not "thousands of customers".

**CTA.** One verb. State the offer only if it is true on the day and will still be true when the ad runs; otherwise "link below". Put any disclosure the platform needs ("paid partnership") here if a real person presents.

## Presenter choice

| Presenter | Use when | Rules |
|---|---|---|
| `none` | the product demonstrates itself (cleaning, food, gadgets, apps) | hands only; captions carry the ad; cheapest to generate and nothing to disclose beyond the AI label |
| `ai_generated` | you need a face to deliver lines | fictional, described in `presenter.description`, never modelled on a real person; speaks as a demonstrator, never as a customer; AI label on screen |
| `real_person` | you have a real customer or creator with a signed release | first-person experience allowed; paid partnership disclosed in speech and on screen; generated b-roll labelled as b-roll |

## Caption rules

- ≤ 48 characters per line, two lines max, lower case reads as native UGC.
- Caption ≠ transcript. The caption is the one phrase to keep if the sound is off.
- The AI label is a caption line, not a watermark the platform may crop.

## Voiceover pace

`lint` warns above 3.5 words per second per shot. That is a ceiling for readable, conversational delivery chosen for this repo, not a researched optimum; tune it with `--max-wps`. Hooks run faster than the body; if a hook does not fit in two seconds at that pace, cut words, not seconds.
