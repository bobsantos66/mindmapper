# Examples

Eleven scripts across verticals, each with its committed outputs. The tests regenerate every output and compare byte-for-byte, so what you read here is what the script produces.

| Script | Vertical | Presenter | Length | Shows |
|---|---|---|---|---|
| [skincare-serum](scripts/skincare-serum.json) | skincare | ai_generated | 30 s | AI presenter as demonstrator, split-screen application demo, label as proof |
| [meal-prep-app](scripts/meal-prep-app.json) | mobile app | none | 20 s | real screen recordings for software, generated kitchen b-roll |
| [kitchen-chopper](scripts/kitchen-chopper.json) | kitchen gadget | ai_generated | 30 s | overhead demo, real dishwasher footage as proof |
| [dog-dental-chews](scripts/dog-dental-chews.json) | pet care | real_person | 30 s | a real customer may testify: release, paid-partnership disclosure, b-roll labelled |
| [language-course](scripts/language-course.json) | online course | ai_generated | 45 s | contrarian hook, counts from the product as the only numbers |
| [b2b-invoicing](scripts/b2b-invoicing.json) | B2B SaaS | ai_generated | 30 s | objection hook, reminder schedule listed as a claim with evidence |
| [cleaning-spray](scripts/cleaning-spray.json) | home cleaning | none | 15 s | no voiceover; captions carry the ad |
| [running-shoes](scripts/running-shoes.json) | footwear | ai_generated | 30 s | a test the viewer can do now; no medical wording |
| [travel-esim](scripts/travel-esim.json) | travel | ai_generated | 30 s | no prices on screen; no logos in generated shots |
| [coffee-subscription](scripts/coffee-subscription.json) | food and drink | none | 20 s | comparison hook, observable demo (the bloom) instead of taste claims |
| [pet-camera](scripts/pet-camera.json) | consumer electronics | ai_generated | 30 s | generated "camera feed" without a timestamp, real device as proof |

Outputs: `rendered/<name>.md` (script sheet) and `prompts/<name>.txt` (first-frame, Kling and Veo 3 prompts per shot).

## Commands that produced them

```bash
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out examples/rendered/skincare-serum.md
python3 scripts/ugc_script.py prompts examples/scripts/skincare-serum.json --model all > examples/prompts/skincare-serum.txt
python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json
```

## The one that must fail

[`bad/fake-testimonial.json`](bad/fake-testimonial.json): an AI presenter saying "I've been using these for three years", "clinically proven" with no evidence, "as seen on TikTok", a 3-second hook, no proof beat, no AI label. `lint` reports 12 errors and 8 warnings; `tests/test_scripts.py` asserts the main ones and pins the summary line quoted in README to the real output.
