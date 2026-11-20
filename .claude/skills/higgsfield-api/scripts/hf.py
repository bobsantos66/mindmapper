#!/usr/bin/env python3
"""Cliente mínimo da API do Higgsfield (https://docs.higgsfield.ai).

Usa só a biblioteca padrão do Python. Lê as credenciais de variáveis de ambiente
e nunca as imprime.

Credenciais (uma das duas formas):
  HF_API_KEY_ID e HF_API_KEY_SECRET
  HF_KEY="<key_id>:<key_secret>"

Comandos:
  check                                  confere se as credenciais existem
  estimate <modelo> <json>               custo estimado em USD, sem gerar nada
  submit   <modelo> <json>               envia a geração (gasta créditos)
  status   <request_id>                  estado atual da geração
  wait     <request_id> [--out PASTA]    espera terminar e baixa os arquivos
  cancel   <request_id>                  cancela se ainda estiver na fila

<modelo> é o caminho do endpoint, por exemplo "higgsfield-ai/soul/v2/standard".
<json> é o corpo da requisição, inline ou "@arquivo.json".
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = "https://api.higgsfield.ai"
TERMINAL = {"completed", "failed", "nsfw", "canceled"}


def credentials():
    key_id = os.environ.get("HF_API_KEY_ID")
    secret = os.environ.get("HF_API_KEY_SECRET")
    if key_id and secret:
        return f"{key_id}:{secret}"
    combined = os.environ.get("HF_KEY")
    if combined and ":" in combined:
        return combined
    return None


def fail(msg, code=1):
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False))
    sys.exit(code)


def call(method, path, body=None, idempotency_key=None):
    cred = credentials()
    if not cred:
        fail("Credenciais ausentes: defina HF_API_KEY_ID e HF_API_KEY_SECRET (ou HF_KEY).")
    url = path if path.startswith("http") else f"{BASE}/{path.lstrip('/')}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Key {cred}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if idempotency_key:
        req.add_header("Idempotency-Key", idempotency_key)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        fail(f"HTTP {e.code} em {method} {path}: {detail}")
    except urllib.error.URLError as e:
        fail(f"Sem conexão com {BASE}: {e.reason}. O host api.higgsfield.ai precisa estar liberado na rede.")


def load_body(arg):
    if arg.startswith("@"):
        with open(arg[1:], encoding="utf-8") as f:
            return json.load(f)
    return json.loads(arg)


def download(url, out_dir, name):
    os.makedirs(out_dir, exist_ok=True)
    ext = os.path.splitext(url.split("?")[0])[1] or ".bin"
    dest = os.path.join(out_dir, name + ext)
    urllib.request.urlretrieve(url, dest)
    return dest


def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        print(__doc__)
        return
    cmd, args = argv[1], argv[2:]

    if cmd == "check":
        print(json.dumps({"ok": bool(credentials())}))
    elif cmd == "estimate" and len(args) == 2:
        print(json.dumps(call("POST", f"estimate/{args[0]}", load_body(args[1])), ensure_ascii=False))
    elif cmd == "submit" and len(args) == 2:
        key = str(uuid.uuid4())
        res = call("POST", args[0], load_body(args[1]), idempotency_key=key)
        res["idempotency_key"] = key
        print(json.dumps(res, ensure_ascii=False))
    elif cmd == "status" and len(args) == 1:
        print(json.dumps(call("GET", f"requests/{args[0]}/status"), ensure_ascii=False))
    elif cmd == "cancel" and len(args) == 1:
        print(json.dumps(call("POST", f"requests/{args[0]}/cancel"), ensure_ascii=False))
    elif cmd == "wait" and args:
        rid = args[0]
        out = args[args.index("--out") + 1] if "--out" in args else "higgsfield-output"
        delay, waited = 3, 0
        while True:
            res = call("GET", f"requests/{rid}/status")
            if res.get("status") in TERMINAL:
                break
            if waited > 1800:
                fail(f"Tempo esgotado esperando {rid}; última situação: {res.get('status')}")
            time.sleep(delay)
            waited += delay
            delay = min(delay * 2, 20)
        files = []
        if res.get("status") == "completed":
            urls = [i["url"] for i in res.get("images") or []]
            for k in ("video", "audio"):
                if isinstance(res.get(k), dict):
                    urls.append(res[k]["url"])
            urls += [a["url"] for a in res.get("audios") or []]
            for n, u in enumerate(urls, 1):
                files.append(download(u, out, f"{rid[:8]}-{n}"))
        res["downloaded"] = files
        print(json.dumps(res, ensure_ascii=False))
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main(sys.argv)
