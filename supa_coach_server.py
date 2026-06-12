#!/usr/bin/env python3
"""supa_coach_server.py — Serveur coach IA pour SupaChess (port 8778).

POST /coach  {fen, played_move, candidates:[{move, eval, pv, rank}]}
          -> {comments:{<move>:{pour:[...],contre:[...],resume}}, source:"supa/<modele>"}
GET  /health -> {ok:true, model:"..."}

Modèle: OpenRouter (.openrouter.trading de D:/Code/supa/models_config.json,
clé OPENROUTER_API_KEY de D:/Code/supa/.env). Fallback: Ollama local.
Cache mémoire par FEN. Aucune dépendance hors stdlib.
"""
import json
import os
import re
import sys
import threading
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8778
SUPA_DIR = r"D:\Code\supa"
MODELS_CONFIG = os.path.join(SUPA_DIR, "models_config.json")
ENV_FILE = os.path.join(SUPA_DIR, ".env")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen3:4b"
OPENROUTER_TIMEOUT = 60
OLLAMA_TIMEOUT = 120

_cache = {}
_cache_lock = threading.Lock()
_last_model_used = {"name": None}


def load_openrouter_config():
    """Retourne (models[], api_key). models = [trading, fast] (fallbacks)."""
    models, key = [], None
    try:
        with open(MODELS_CONFIG, encoding="utf-8") as f:
            cfg = json.load(f)
        orc = cfg.get("openrouter") or {}
        for k in ("trading", "fast"):
            m = orc.get(k)
            if m and m not in models:
                models.append(m)
    except (OSError, json.JSONDecodeError) as e:
        print(f"[supa-coach] models_config.json illisible: {e}", flush=True)
    try:
        with open(ENV_FILE, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    key = line.split("=", 1)[1].split("#")[0].strip().strip('"').strip("'")
                    break
    except OSError as e:
        print(f"[supa-coach] .env illisible: {e}", flush=True)
    return models, key


def build_prompt(payload):
    fen = payload.get("fen", "")
    played = payload.get("played_move", "")
    cands = payload.get("candidates", [])
    lines = []
    for c in cands:
        pv = c.get("pv", "")
        if isinstance(pv, list):
            pv = " ".join(pv[:10])
        lines.append(f"- {c.get('move')} (rang {c.get('rank')}, éval {c.get('eval')}, variante: {pv})")
    moves = [str(c.get("move")) for c in cands]
    schema = {m: {"pour": ["..."], "contre": ["..."], "resume": "..."} for m in moves[:1]}
    return (
        "Tu es Supa, coach d'échecs français, pédagogue et concis.\n"
        f"Position FEN: {fen}\n"
        f"Coup que l'élève voulait jouer: {played}\n"
        "Coups candidats analysés par Stockfish (éval côté joueur au trait):\n"
        + "\n".join(lines)
        + "\n\nPour CHAQUE coup candidat, donne 1 à 3 arguments POUR, 1 à 3 arguments CONTRE "
        "(courts, concrets, en français, basés sur les variantes et évals fournies), et un résumé d'une phrase.\n"
        "Réponds UNIQUEMENT avec un objet JSON strict de la forme:\n"
        '{"comments": {' + ", ".join(f'"{m}": {{"pour": ["..."], "contre": ["..."], "resume": "..."}}' for m in moves) + "}}\n"
        "Pas de texte hors du JSON. Clés = exactement les coups listés."
    )


def build_review_prompt(payload):
    """Prompt pour le bilan pédagogique d'une partie complète (POST /review)."""
    moves = payload.get("moves", [])
    lines = []
    for m in moves:
        tag = m.get("tag") or ""
        prefix = f"{m.get('n')}{'...' if m.get('color') == 'b' else '.'}"
        lines.append(f"{prefix} {m.get('san')} {tag} (perte {m.get('delta')})")
    return (
        "Tu es Supa, coach d'échecs français, pédagogue et concret.\n"
        "Voici une partie analysée par Stockfish. Pour chaque coup: perte d'éval en pions "
        "vs le meilleur coup (?! = imprécision >=0.3, ? = erreur >=0.6, ?? = gaffe >=2.0).\n"
        f"Blancs: {payload.get('white', '?')} — précision {payload.get('accuracy_w')}%\n"
        f"Noirs: {payload.get('black', '?')} — précision {payload.get('accuracy_b')}%\n"
        f"Résultat: {payload.get('result', '*')}\n"
        "Coups:\n" + "\n".join(lines) +
        "\n\nDonne un bilan pédagogique en français pour le joueur: exactement 3 points forts, "
        "3 erreurs récurrentes et 3 conseils de progression (courts, concrets, cite des coups précis).\n"
        'Réponds UNIQUEMENT en JSON strict de la forme: {"report": {"points_forts": ["...", "...", "..."], '
        '"erreurs": ["...", "...", "..."], "conseils": ["...", "...", "..."]}}\n'
        "Pas de texte hors du JSON."
    )


def extract_json(text, key="comments"):
    """Extrait le premier objet JSON équilibré contenant `key` (tolérant au raisonnement)."""
    if not text:
        return None
    # retirer un éventuel bloc <think>
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    for start in range(len(text)):
        if text[start] != "{":
            continue
        depth = 0
        in_str = False
        esc = False
        for i in range(start, len(text)):
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
            elif ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    try:
                        obj = json.loads(text[start:i + 1])
                        if isinstance(obj, dict) and key in obj:
                            return obj
                        break
                    except json.JSONDecodeError:
                        break
        # continuer à chercher l'objet suivant
    return None


def call_openrouter(prompt, model, key):
    body = json.dumps({
        "model": model,
        "max_tokens": 16000,  # modèle raisonnant: large budget
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    req = urllib.request.Request(OPENROUTER_URL, data=body, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8777",
        "X-Title": "SupaChess Coach",
    })
    with urllib.request.urlopen(req, timeout=OPENROUTER_TIMEOUT) as r:
        data = json.loads(r.read().decode("utf-8", "replace"))
    if "choices" not in data:
        raise RuntimeError(f"OpenRouter erreur: {json.dumps(data)[:200]}")
    msg = data["choices"][0]["message"]
    content = msg.get("content") or ""
    if not content.strip() and msg.get("reasoning"):
        content = msg["reasoning"]
    return content


def call_ollama(prompt):
    body = json.dumps({
        "model": OLLAMA_MODEL,
        "stream": False,
        "think": False,  # qwen3: désactive le raisonnement (sinon content vide)
        "messages": [{"role": "user", "content": prompt}],
        "options": {"num_predict": 4000},
    }).encode()
    req = urllib.request.Request(OLLAMA_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT) as r:
        data = json.loads(r.read().decode("utf-8", "replace"))
    msg = data.get("message") or {}
    return msg.get("content") or msg.get("thinking") or ""


def llm_json(prompt, json_key):
    """Routage LLM commun (/coach et /review): OpenRouter puis fallback Ollama.
    Retourne (valeur_de_json_key | None, source)."""
    models, key = load_openrouter_config()
    if models and key:
        for model in models:
            try:
                text = call_openrouter(prompt, model, key)
                obj = extract_json(text, json_key)
                if obj:
                    _last_model_used["name"] = model
                    return obj[json_key], f"supa/{model}"
                print(f"[supa-coach] OpenRouter {model}: pas de JSON exploitable", flush=True)
            except (urllib.error.URLError, TimeoutError, KeyError, OSError, RuntimeError) as e:
                print(f"[supa-coach] OpenRouter {model} échec: {e}", flush=True)
    else:
        print("[supa-coach] OpenRouter non configuré (modèle ou clé manquant)", flush=True)
    # Fallback Ollama
    try:
        text = call_ollama(prompt)
        obj = extract_json(text, json_key)
        if obj:
            _last_model_used["name"] = f"ollama/{OLLAMA_MODEL}"
            return obj[json_key], f"supa/ollama-{OLLAMA_MODEL}"
        print("[supa-coach] Ollama: pas de JSON exploitable", flush=True)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"[supa-coach] Ollama échec: {e}", flush=True)
    return None, "none"


def generate_comments(payload):
    """Retourne (comments|None, source)."""
    return llm_json(build_prompt(payload), "comments")


def generate_review(payload):
    """Retourne (report|None, source)."""
    return llm_json(build_review_prompt(payload), "report")


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(200, {"ok": True})

    def do_GET(self):
        if self.path.startswith("/health"):
            models, key = load_openrouter_config()
            self._send(200, {
                "ok": True,
                "model": _last_model_used["name"] or (models[0] if models else f"ollama/{OLLAMA_MODEL}"),
                "openrouter_configured": bool(models and key),
            })
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path not in ("/coach", "/review"):
            self._send(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, json.JSONDecodeError) as e:
            self._send(400, {"error": f"JSON invalide: {e}"})
            return
        if self.path == "/review":
            self._handle_review(payload)
            return
        fen = payload.get("fen")
        if not fen or not isinstance(payload.get("candidates"), list):
            self._send(400, {"error": "champs requis: fen, candidates[]"})
            return
        cache_key = fen
        with _cache_lock:
            if cache_key in _cache:
                self._send(200, _cache[cache_key])
                return
        comments, source = generate_comments(payload)
        resp = {"comments": comments, "source": source}
        if comments is not None:
            with _cache_lock:
                _cache[cache_key] = resp
        self._send(200, resp)

    def _handle_review(self, payload):
        """POST /review {white, black, result, accuracy_w, accuracy_b, moves:[{n,color,san,delta,tag}]}
        -> {report:{points_forts,erreurs,conseils}|None, source}"""
        moves = payload.get("moves")
        if not isinstance(moves, list) or not moves:
            self._send(400, {"error": "champs requis: moves[] (liste non vide)"})
            return
        cache_key = "review:" + json.dumps(moves, sort_keys=True, ensure_ascii=False)
        with _cache_lock:
            if cache_key in _cache:
                self._send(200, _cache[cache_key])
                return
        report, source = generate_review(payload)
        resp = {"report": report, "source": source}
        if report is not None:
            with _cache_lock:
                _cache[cache_key] = resp
        self._send(200, resp)

    def log_message(self, fmt, *args):
        print(f"[supa-coach] {self.address_string()} {fmt % args}", flush=True)


def main():
    models, key = load_openrouter_config()
    print(f"[supa-coach] port {PORT} — OpenRouter modèles={models or 'N/A'} clé={'OK' if key else 'MANQUANTE'} — fallback Ollama {OLLAMA_MODEL}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
