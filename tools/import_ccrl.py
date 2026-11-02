#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Importeur CCRL -> SupaChess : Stockfish vs Reckless.

Extrait depuis les archives CCRL (40/40 par moteur, .pgn.7z) uniquement les
victoires de Stockfish et de Reckless, verifie la legalite de chaque coup,
elimine les doublons et produit deux PGN distincts + stats + echantillons FEN.

Usage:
    py .\\tools\\import_ccrl.py --input .\\downloads --output .\\results
    py .\\tools\\import_ccrl.py --input .\\downloads --output .\\results --fen-count 20 --limit 500
"""

import argparse
import hashlib
import json
import sys
import tempfile
from pathlib import Path

import chess
import chess.pgn
import py7zr

ENGINES = {
    "stockfish": "stockfish",
    "reckless": "reckless",
}
MIN_PLIES = 10


def iter_pgn_files(source: Path, tmp_root: Path):
    """Yield (label, pgn_path) from .pgn files and .pgn.7z archives in source."""
    for path in sorted(source.iterdir()):
        if path.suffix == ".pgn":
            yield path.stem, path
        elif path.name.endswith(".pgn.7z"):
            out_dir = tmp_root / path.name.replace(".7z", "")
            out_dir.mkdir(parents=True, exist_ok=True)
            with py7zr.SevenZipFile(path, mode="r") as archive:
                archive.extractall(path=out_dir)
            for extracted in out_dir.rglob("*.pgn"):
                yield path.name, extracted


def game_key(game: chess.pgn.Game) -> str:
    moves = []
    board = game.board()
    for move in game.mainline_moves():
        moves.append(board.san(move))
        board.push(move)
    white = game.headers.get("White", "")
    black = game.headers.get("Black", "")
    date = game.headers.get("Date", "")
    site = game.headers.get("Site", "")
    digest = hashlib.sha1((" ".join(moves)).encode("utf-8")).hexdigest()[:16]
    return f"{white}|{black}|{date}|{site}|{digest}"


def evals_from_comments(game: chess.pgn.Game):
    """Extract centipawn values from CCRL commented PGNs.

    Comments look like {+0.34/24 11s} or {(San) -0.21/42 61s}: eval/depth/time
    from the moving side's perspective. Values are normalized to White's
    perspective (even plies keep the sign, odd plies negate it).
    """
    import re

    pattern = re.compile(r"([+-]?\d+(?:\.\d+)?|#[+-]?\d+)\s*/\s*\d+")
    values = []
    ply = 0
    node = game
    while node.variations:
        node = node.variation(0)
        comment = node.comment or ""
        match = pattern.search(comment.replace("(", " ").replace(")", " "))
        if not match:
            ply += 1
            continue
        token = match.group(1)
        try:
            if token.startswith("#"):
                digits = token[1:].lstrip("+-")
                cp = 0 if digits == "" else int(float(digits) * 100)
                cp = cp if token[1] != "-" else -cp
            else:
                cp = int(round(float(token) * 100))
        except ValueError:
            ply += 1
            continue
        values.append(cp if ply % 2 == 0 else -cp)
        ply += 1
    return values


def biggest_cp_drop(values):
    best = None
    for prev, cur in zip(values, values[1:]):
        drop = cur - prev
        if best is None or drop < best:
            best = drop
    return best


def main() -> int:
    parser = argparse.ArgumentParser(description="Import CCRL archives for SupaChess")
    parser.add_argument("--input", required=True, help="folder with .pgn.7z / .pgn archives")
    parser.add_argument("--output", required=True, help="folder for PGN results and stats")
    parser.add_argument("--fen-count", type=int, default=0, help="FEN samples per engine")
    parser.add_argument("--limit", type=int, default=0, help="max wins per engine (0 = no limit)")
    args = parser.parse_args()

    source = Path(args.input)
    output = Path(args.output)
    if not source.is_dir():
        print(f"ERR input folder not found: {source}")
        return 1
    output.mkdir(parents=True, exist_ok=True)

    stats = {
        "archives": [],
        "games_seen": 0,
        "illegal_or_invalid_skipped": 0,
        "short_skipped": 0,
        "duplicates_skipped": 0,
        "wins": {name: 0 for name in ENGINES},
        "head_to_head": {"stockfish_beats_reckless": 0, "reckless_beats_stockfish": 0},
        "cp_samples": {name: 0 for name in ENGINES},
    }
    seen = set()
    writers = {}
    for name in ENGINES:
        handle = (output / f"{name}_wins.pgn").open("w", encoding="utf-8", newline="\n")
        writers[name] = (handle, chess.pgn.FileExporter(handle))

    fen_samples = {name: [] for name in ENGINES}

    with tempfile.TemporaryDirectory() as tmp:
        tmp_root = Path(tmp)
        for label, pgn_path in iter_pgn_files(source, tmp_root):
            archive_stats = {"archive": label, "games": 0}
            with pgn_path.open(encoding="utf-8", errors="replace") as pgn_file:
                while True:
                    try:
                        game = chess.pgn.read_game(pgn_file)
                    except ValueError:
                        stats["illegal_or_invalid_skipped"] += 1
                        continue
                    if game is None:
                        break
                    stats["games_seen"] += 1
                    archive_stats["games"] += 1

                    white = game.headers.get("White", "")
                    black = game.headers.get("Black", "")
                    result = game.headers.get("Result", "")
                    low_white, low_black = white.lower(), black.lower()

                    winner = None
                    if result == "1-0" and any(e in low_white for e in ENGINES):
                        winner = ENGINES[[e for e in ENGINES if e in low_white][0]]
                    elif result == "0-1" and any(e in low_black for e in ENGINES):
                        winner = ENGINES[[e for e in ENGINES if e in low_black][0]]
                    if winner is None:
                        continue

                    plies = game.end().ply()
                    if plies < MIN_PLIES:
                        stats["short_skipped"] += 1
                        continue

                    key = game_key(game)
                    if key in seen:
                        stats["duplicates_skipped"] += 1
                        continue
                    seen.add(key)

                    if "stockfish" in low_white and "reckless" in low_black and result == "1-0":
                        stats["head_to_head"]["stockfish_beats_reckless"] += 1
                    elif "reckless" in low_white and "stockfish" in low_black and result == "0-1":
                        stats["head_to_head"]["reckless_beats_stockfish"] += 1

                    game.accept(writers[winner][1])
                    stats["wins"][winner] += 1

                    values = evals_from_comments(game)

                    if args.fen_count and len(fen_samples[winner]) < args.fen_count:
                        board = game.board()
                        fen_list = []
                        for move in game.mainline_moves():
                            board.push(move)
                            fen_list.append(board.fen())
                        fen_samples[winner].append({
                            "white": white,
                            "black": black,
                            "result": result,
                            "cp_white_perspective": values,
                            "fens": fen_list,
                        })

                    if values:
                        stats["cp_samples"][winner] += 1
                        drop = biggest_cp_drop(values)
                        if drop is not None and ("biggest_cp_swing" not in stats or drop < stats["biggest_cp_swing"]):
                            stats["biggest_cp_swing"] = drop
                            stats["biggest_cp_swing_game"] = f"{white} vs {black} ({result})"

            stats["archives"].append(archive_stats)
            print(f"OK {label}: {archive_stats['games']} games")

    for handle, _exporter in writers.values():
        handle.close()

    for name in ENGINES:
        if fen_samples[name]:
            (output / f"{name}_fen_samples.json").write_text(
                json.dumps(fen_samples[name], indent=1), encoding="utf-8"
            )
    (output / "stats.json").write_text(json.dumps(stats, indent=1), encoding="utf-8")

    print(json.dumps(stats, indent=1))
    if stats["wins"]["stockfish"] == 0 and stats["wins"]["reckless"] == 0:
        print("ERR no wins extracted")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
