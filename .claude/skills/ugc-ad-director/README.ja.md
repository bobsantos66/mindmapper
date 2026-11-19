<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="ugc-ad-director by UniqAI" src="assets/banner.svg" width="1280" height="320">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-d1fe17?style=flat-square&labelColor=0d0f12)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-d1fe17?style=flat-square&labelColor=0d0f12)](#インストール)
[![Cursor](https://img.shields.io/badge/Cursor-rules-d1fe17?style=flat-square&labelColor=0d0f12)](#インストール)
[![Codex](https://img.shields.io/badge/Codex-AGENTS.md-d1fe17?style=flat-square&labelColor=0d0f12)](#インストール)
[![By UniqAI](https://img.shields.io/badge/made_by-UniqAI-fdfc07?style=flat-square&labelColor=0d0f12)](https://uniqai.app/?utm_source=github&utm_medium=readme-ja&utm_campaign=ugc-ad-director)

**AI UGC広告の台本：2秒フック、ショットリスト、テロップ、Kling / Veo プロンプト、コンプライアンスの lint。**

[クイックスタート](#クイックスタート) · [仕組み](#仕組み) · [例](#例) · [インストール](#インストール) · [FAQ](#faq)

</div>

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · 日本語 · [한국어](README.ko.md)

# ugc-ad-director：AI UGC広告の台本と動画プロンプト

AI UGC広告は、プロンプトではなく台本から始まります。このスキルは商品ブリーフを TikTok / Reels / Shorts 向けの広告台本に変換します。最初の2秒以内に入るフック、時間付きの5つのビート（hook → problem → demo → proof → CTA）、ショットリスト、画面上のテロップ、ナレーション、そしてショットごとの画像モデル用・Kling 用・セリフ付き Veo 3 用のプロンプトが揃います。標準ライブラリのみの Python スクリプトが結果を lint し、出してはいけないものを拒否します。顧客のように語る AI プレゼンター、出典のない "clinically proven"（臨床的に証明済み）、AI ラベルの欠落などです。

下書きはしますが、捏造はしません。プレゼンターは架空のデモンストレーターであり、すべての主張には根拠が必要で、`AI-generated ad` ラベルは最初のフレームからテロップとして入ります。倫理は脚注ではなく lint の中にあります。

| **2.0秒までにフック** | **ショットごと、モデルごとのプロンプト** | **ビルドを落とすコンプライアンス** |
|:---|:---|:---|
| 最大12語。音声とテロップで同時に出し、カテゴリ別のフックライブラリから選びます。 | 画像から動画用のファーストフレーム、Kling のクリッププロンプト、セリフ付きの Veo 3 プロンプト。ショット間でプレゼンターの記述を統一します。 | 偽の体験談、プラットフォームによる推奨、根拠のない主張、AI ラベルの欠落は警告ではなくエラーです。 |

## クイックスタート

```bash
git clone https://github.com/uniqaiapp/ugc-ad-director && cd ugc-ad-director
python3 scripts/ugc_script.py lint examples/scripts/skincare-serum.json
python3 scripts/ugc_script.py render examples/scripts/skincare-serum.json --out serum.md
```

最初のコマンドは `ok, 0 errors, 0 warnings` と出力します。2つ目は、タイムライン表、ナレーション、テロップ、ショットプロンプト、主張、コンプライアンスチェックリストを含む台本シートを書き出します。エージェント上では「<商品 URL> の30秒 UGC広告を書いて」と言えば、スキルがあなたのブリーフから同じものを作ります。

## デモ

<img alt="ugc-ad-director demo: lint rejects a fake-testimonial script, then renders a clean one" src="assets/demo.svg" width="820">

## 仕組み

1. **ブリーフ → 事実。** URL か一行のテキストから、商品がすることを1つ、対象者、取り除く不満、確認できるもの（ラベル、スペック、画面）を抽出します。それ以外は入れません。"revolutionary" は事実ではありません。
2. **フックが先。** アイデアは1つ、12語以内、2.0秒までに届けます。音が消されていることが多いので、テロップとナレーションは同時に出します。[`references/hook-library.md`](references/hook-library.md) にカテゴリ別・タイプ別（呼びかけ、逆張り、結果先出し、比較、視聴者がその場で試せるテスト）のフックと、避けるべきフックの一覧があります。
3. **時間付きの5ビート。** hook（フック）→ problem（問題）→ demo（デモ）→ proof（証拠）→ cta を、15、20、30、45、60秒に合わせて配分します（[`references/structure.md`](references/structure.md)）。demo が最も長く、1つの動作を見せます。proof は確認できるもの、できれば実物の実写映像か実際の画面録画で、他が生成であっても構いません。
4. **ショット → プロンプト。** 各ショットは `subject`、`action`、`camera`、`setting`、`lighting`、`negative`、`audio` を持ちます。`scripts/ugc_script.py prompts` がそれらを、ファーストフレーム用の静止画、Kling のクリッププロンプト（5秒または10秒、ネガティブプロンプト、スローモーションなし）、セリフを `Dialogue` として入れた Veo 3 プロンプトとして出力します（[`references/model-prompts.md`](references/model-prompts.md)）。
5. **lint。** タイムラインが連続して `duration_s` で終わること、フックは2秒以内、ビートが順番どおり、テロップは1行48文字以内、ショットごとのナレーション速度、生成ショットすべてにプロンプトがあること、AI プレゼンターでの一人称の顧客表現はエラー、"proven"、"guaranteed"、"#1"、パーセント表記、"results in N days" は根拠付きで `claims` に置くこと、AI ラベルがテロップに含まれること。全リストは [`references/script-format.md`](references/script-format.md) にあります。

```
brief ──▶ hook ──▶ beats + timings ──▶ shots ──▶ script.json
                                                   │
                     lint (structure + compliance) ◀┘──▶ render (.md sheet) ──▶ prompts (image / kling / veo3)
```

この README が引用する数字はすべて `python3 scripts/ugc_script.py stats examples/scripts/skincare-serum.json` の出力です。6ショット、フックは2秒で終了、30秒でナレーション75語（2.5語/秒）、テロップ7行、最長41文字、生成ショット5つ、根拠付きの主張2つ。ビートの配分と3.5語/秒という速度の上限は実運用のデフォルト値であって測定された最適値ではなく、このリポジトリはリテンションやコンバージョンについて何も主張しません。

## 例

[`examples/`](examples/README.md) に業種をまたいだ11本の台本があります。スキンケア、献立アプリ、キッチン用品、犬用おやつ（リリース同意済みの実在顧客）、語学コース、B2B 請求書、ナレーションなしの洗剤スプレー、ランニングシューズ、旅行用 eSIM、コーヒーのサブスク、ペットカメラ。レンダリング済みのシートとプロンプトファイルはすべてコミット済みで、テストがバイト単位で再現します。

<details>
<summary><b>ブリーフ → 台本の最初の10秒（skincare-serum）</b></summary>

**変換前**（ブリーフ）

```text
Dewline Barrier Serum: fragrance-free hydrating serum with ceramides and 2% niacinamide.
Audience: women 22-35 with dry, flaky skin under makeup. 30 s, AI presenter.
```

**変換後**（`examples/rendered/skincare-serum.md` のタイムライン最初の3行）

```text
| # | Time | Beat | Visual | Caption | Voiceover | Source |
|---|---|---|---|---|---|---|
| 1 | 0s–2s | hook | Close-up of a fingertip dragging foundation across dry, flaky cheek; product in the mirror | Your foundation isn't the problem. / AI-generated ad | Your foundation isn't the problem. | image-to-video |
| 2 | 2s–7s | problem | Presenter to camera, towel on hair, holding up a flaky makeup sponge | dry skin + makeup = cake | Dry skin drinks the water out of your makeup, so it cakes by lunch. | image-to-video |
| 3 | 7s–15s | demo | Two drops of serum pressed into the cheek with two fingers; skin goes from matte-flaky to even | two drops, press, don't rub | Two drops. Press it in with two fingers, don't rub. Ceramides fill the cracks, niacinamide calms the red. | image-to-video |
```

ショット2の Veo 3 プロンプト（`examples/prompts/skincare-serum.txt` より）：

```text
fictional woman in her late twenties, towel wrapped on her head, no makeup, holding a makeup sponge toward the lens, small bathroom, white tiles.
Action: she talks to the camera and tilts the sponge to show dried foundation on it.
Camera: handheld selfie, eye level, slight sway.
Lighting: window daylight, no ring light.
Dialogue (on camera, natural pace): "Dry skin drinks the water out of your makeup, so it cakes by lunch."
Audio: room tone, faint bathroom echo.
Style: candid bathroom phone video, soft window light, visible pores and skin texture.
No subtitles, no captions, no logos in frame.
```

</details>

<details>
<summary><b>lint が拒否するもの（examples/bad/fake-testimonial.json）</b></summary>

```text
error   hook: hook is 18 words; keep it under 13 so it lands inside 2 s
error   shot 1: hook shot ends at 3s; it must end by 2s
error   beats: missing beat(s): proof
error   shot 1: prompt is missing 'camera'
error   shot 1: reads as a first-person customer testimonial but the presenter is 'ai_generated': rewrite as a demo or a sourced claim
error   shot 2: reads as a first-person customer testimonial but the presenter is 'ai_generated': rewrite as a demo or a sourced claim
error   shot 3: implies a platform or third-party endorsement; remove it
error   claim 1: 'clinically proven' has no evidence; add a source, a test or remove the claim
error   shot 3: 'guaranteed' is a claim; list it under 'claims' with evidence or drop it
error   shot 3: 'doctor recommended' is a claim; list it under 'claims' with evidence or drop it
error   shot 4: '50%' is a claim; list it under 'claims' with evidence or drop it
error   compliance: ai_label is empty but the ad contains AI-generated footage or an AI presenter
examples/bad/fake-testimonial.json: failed, 12 errors, 8 warnings
```

8つの警告（テロップの長さ、速度、未登録の数値、プラットフォームのトグル未設定、プレゼンターの記述なし）はここでは省略しています。`python3 scripts/ugc_script.py lint examples/bad/fake-testimonial.json` を実行するとすべて表示されます。

</details>

<details>
<summary><b>新しい台本を始める</b></summary>

```bash
python3 scripts/ugc_script.py new --vertical pets --product "Bitewell Chews" --duration 30 --presenter none > chews.json
# fill in visuals, captions, voiceover, prompts, claims; then
python3 scripts/ugc_script.py lint chews.json --strict
python3 scripts/ugc_script.py prompts chews.json --model veo3
```

</details>

プロンプトをレンダリングする場所について。開始フレームとテキストを受け付ける画像から動画のツールならどれでも使えます。私たちは [UniqAI の画像から動画ページ](https://uniqai.app/video/image-to-video?utm_source=github&utm_medium=readme-ja&utm_campaign=ugc-ad-director)を使っています。商品写真がクリップのファーストフレームになり、ここで提供している Kling と Veo 3 のフォーマットは、そこで使っているものと同じです。

## インストール

指示ファイルを読むエージェントならどれでも動きます。お使いのものを選んでください。Python 3.9 以上、インストールするパッケージはありません。

<details open>
<summary><b>Claude Code</b></summary>

```bash
# user-level
git clone https://github.com/uniqaiapp/ugc-ad-director ~/.claude/skills/ugc-ad-director
# or project-level
git clone https://github.com/uniqaiapp/ugc-ad-director .claude/skills/ugc-ad-director
```

その後、任意のセッションで `/ugc-ad-director` と入力するか、作りたい広告を説明するだけで、スキルの `description` がトリガーになります。クローンすれば、スキルが必要とする `scripts/` と `references/` も一緒に入ります。

</details>

<details>
<summary><b>Cursor</b></summary>

[`SKILL.md`](SKILL.md)、`scripts/`、`references/`、[`.cursor/rules/ugc-ad-director.mdc`](.cursor/rules/ugc-ad-director.mdc) をプロジェクトにコピーします。ルールファイルがスキルを埋め込んでいます。

</details>

<details>
<summary><b>Codex / AGENTS.md を読むエージェント</b></summary>

`SKILL.md`、`scripts/`、`references/` を `.agents/skills/ugc-ad-director/` にコピーし、[`codex/INSTRUCTIONS.md`](codex/INSTRUCTIONS.md) のスニペットを自分の `AGENTS.md` に追加します。このリポジトリの [`AGENTS.md`](AGENTS.md) が汎用版です。

</details>

<details>
<summary><b>プレーンなプロンプトとして</b></summary>

[`SKILL.md`](SKILL.md) をどのモデルのシステムプロンプトにも貼れます。コンテキストに余裕があれば `references/structure.md` と `references/compliance.md` も一緒に。フロントマター以外にエージェント固有の構文はありません。lint には引き続き Python が必要です。

</details>

<details>
<summary><b>エージェントなしで</b></summary>

```bash
python3 scripts/ugc_script.py --help
```

`lint`、`render`、`prompts`、`stats`、`new` は、どの台本 JSON に対しても単体で動きます。

</details>

## FAQ

<details>
<summary><b>AI プレゼンターに「この商品が大好き」と言わせてもよいですか</b></summary>

いいえ。AI プレゼンターはデモンストレーターです。見せる、説明する、比較する、問いかける。"I've been using this"（ずっと使っています）、"changed my life"（人生が変わりました）、"honest review"（正直レビュー）、"not sponsored"（案件ではありません）は一人称の顧客体験であり、生成された、あるいは存在しないプレゼンターがそれを言えば捏造された体験談です。lint はこれらを拒否します。署名済みのリリースがある実在の顧客なら言えます。`examples/scripts/dog-dental-chews.json` を参照してください。

</details>

<details>
<summary><b>本当に AI 生成だとラベルを付けないといけませんか</b></summary>

このスキルは最初のフレームから `AI-generated ad` をテロップに入れ、プラットフォームの AI コンテンツ設定をオンにすることを前提にしています。TikTok、Meta、YouTube にはそれぞれリアルな生成コンテンツの開示ルールがあり、偽のレビューと体験談に関する FTC の規則は AI 生成の人物にも及び、EU AI 法の透明性条項は2026年8月から適用されます。詳細と日付は [`references/compliance.md`](references/compliance.md) にあります。公開前に最新のポリシーページを読んでください。このリポジトリは要約であって、引用ではありません。

</details>

<details>
<summary><b>プロンプトはどのモデル向けですか</b></summary>

生成ショットごとに3つの出力があります。ファーストフレーム用の静止画（任意の画像モデル）、Kling 形式のクリッププロンプト（5秒または10秒、ネガティブプロンプト）、セリフを dialogue として入れて環境音の行を加えた Veo 3 形式のプロンプト。クリップ長と音声対応はリリースごとに変わります。パターンは [`references/model-prompts.md`](references/model-prompts.md) にあり、Runway、Wan、Seedance にも簡単に合わせられます。

</details>

<details>
<summary><b>lint で広告がコンプライアンスに適合していると証明できますか</b></summary>

いいえ。lint が捕まえるのは既知のミスです。タイミング、速度、テロップの長さ、英語の体験談や主張の言い回し、ラベルの欠落、推奨の表現。根拠が本物かどうかの確認、他言語の読み取り、先週変わったプラットフォームのポリシーの把握はできません。明らかなミスを不可能にし、残りを見えるようにするものです。

</details>

<details>
<summary><b>なぜテキストの台本ではなく JSON なのですか</b></summary>

タイミング、テロップ、主張、プロンプトを相互に照合する必要があり、ドキュメント内の表は lint できないからです。JSON がソースで、`render` が読みやすいシートを出します。

</details>

## 関連リポジトリ

- [video-director](https://github.com/uniqaiapp/video-director)：一行のアイデアを AI動画モデル（Kling、Veo、Sora など）向けのショット単位のプロンプトに変換。カメラ、ライティング、モーションの語彙付き。広告に UGC ではなくシネマティックなショットが必要なときに。
- [awesome-ai-video-prompts](https://github.com/uniqaiapp/awesome-ai-video-prompts)：AI動画モデル向けの厳選・分類済みプロンプト集。生成に使った設定付き。
- [no-plastic](https://github.com/uniqaiapp/no-plastic)：自然に見える AI ポートレートのためのプロンプトルールとチェッカー。プレゼンターのファーストフレームに適用してください。
- [ai-video-pricing](https://github.com/uniqaiapp/ai-video-pricing)：AI動画生成の料金表を手作業で確認したもの。秒単価とクリップ単価。ショットリストの予算組みに。

## コントリビュート

Issue と Pull Request を歓迎します。変更は小さく保ち、PR の説明に変換前後の例を添えてください。
ローカルでのチェック（`python3 tests/run.py`、依存なし）は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

コードと例は [MIT](LICENSE) © UniqAI。`references/` は CC BY 4.0 です。

---

<div align="center">

<sub>開発：<a href="https://uniqai.app/?utm_source=github&utm_medium=readme-ja&utm_campaign=ugc-ad-director">UniqAI</a> — Kling 3.0、Veo 3、Flux、Nano Banana、GPT-5/Claude/Gemini/Grok を1つのアプリで。自分たちの広告の下書きも、このスキルで書いています。</sub>

</div>
