#!/usr/bin/env python3
"""Busca na biblioteca de 703 prompts de vídeos feitos com Claude Opus 5.5.

Exemplos:
  python3 buscar.py --busca receita
  python3 buscar.py --categoria explainer --tag gsap --completos
  python3 buscar.py --slug ror-fly-880547          # mostra o prompt inteiro
  python3 buscar.py --aleatorio 3 --categoria 3d
"""
import argparse
import json
import random
import sys
from pathlib import Path

DADOS = Path(__file__).resolve().parent / "data" / "videos.json"
CATEGORIAS = {"motion": "Motion graphics", "3d": "Cenas 3D",
              "explainer": "Explicativos", "interactive": "Jogos e interativos"}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--busca", help="palavra(s) no título ou no prompt (todas precisam aparecer)")
    ap.add_argument("--categoria", choices=sorted(CATEGORIAS))
    ap.add_argument("--tag", action="append", default=[],
                    help="tecnologia: canvas, svg, threejs, shader, gsap, css, audio, playable, particles, pixel...")
    ap.add_argument("--completos", action="store_true", help="só prompts publicados por inteiro")
    ap.add_argument("--slug", help="mostra o prompt completo de um item")
    ap.add_argument("--aleatorio", type=int, help="sorteia N itens entre os filtrados")
    ap.add_argument("--limite", type=int, default=20)
    ap.add_argument("--stats", action="store_true", help="contagem por categoria e tag")
    a = ap.parse_args()

    dados = json.loads(DADOS.read_text(encoding="utf-8"))

    if a.slug:
        item = next((x for x in dados if x["slug"] == a.slug), None)
        if not item:
            sys.exit(f"slug não encontrado: {a.slug}")
        print(f"# {item['title']}\n")
        print(f"Autor: @{item['author']}  ({item['post_url']})")
        print(f"Categoria: {CATEGORIAS.get(item['category'], item['category'])}  |  Tags: {', '.join(item.get('tech_tags', []))}")
        if item.get("prompt_partial"):
            print("ATENÇÃO: o autor publicou só parte do prompt (ou apenas descreveu o resultado).")
        print("\n--- PROMPT ---\n")
        print(item["prompt"])
        return

    if a.stats:
        from collections import Counter
        print("Categorias:", dict(Counter(x["category"] for x in dados)))
        print("Tags:", Counter(t for x in dados for t in x.get("tech_tags", [])).most_common())
        print("Prompts completos:", sum(not x.get("prompt_partial") for x in dados), "de", len(dados))
        return

    termos = (a.busca or "").lower().split()
    res = []
    for x in dados:
        if a.categoria and x["category"] != a.categoria:
            continue
        if a.tag and not set(a.tag) <= set(x.get("tech_tags", [])):
            continue
        if a.completos and x.get("prompt_partial"):
            continue
        texto = (x["title"] + " " + x["prompt"]).lower()
        if any(t not in texto for t in termos):
            continue
        res.append(x)

    if a.aleatorio:
        res = random.sample(res, min(a.aleatorio, len(res)))
    print(f"{len(res)} resultado(s)" + (f", mostrando {a.limite}" if len(res) > a.limite else ""))
    for x in res[: a.limite]:
        parcial = " [parcial]" if x.get("prompt_partial") else ""
        print(f"- {x['slug']}  |  {x['title']}  |  {x['category']}  |  {', '.join(x.get('tech_tags', []))}{parcial}")


if __name__ == "__main__":
    main()
