#!/usr/bin/env python3
"""Offline PGN benchmark analysis. No games are fabricated or played by this script.

Requires python-chess: python -m pip install python-chess
Manifest CSV columns: level,game_id,player_color,pgn_file
One row per authenticated game. Levels 1..8, colors w/b.
"""
import argparse
import csv
import hashlib
import json
import math
import platform
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def wilson(wins, draws, losses, z=1.959963984540054):
    n = wins + draws + losses
    if n == 0:
        return {"score": None, "score_ci95": [None, None]}
    # Fractional WDL scores: use a bounded-outcome Hoeffding CI for reliability.
    score = (wins + draws / 2) / n
    half = math.sqrt(math.log(40) / (2*n))
    # Also report Wilson for the Bernoulli win rate separately.
    p = wins/n
    den = 1 + z*z/n
    centre = (p + z*z/(2*n))/den
    radius = z*math.sqrt((p*(1-p)+z*z/(4*n))/n)/den
    return {"score": score, "score_ci95": [max(0,score-half), min(1,score+half)],
            "win_rate":p,"win_rate_wilson95":[max(0,centre-radius),min(1,centre+radius)]}


def parse_games(manifest, base, require_complete=True):
    import chess
    import chess.pgn
    by_level = defaultdict(list)
    ids = set()
    for row in csv.DictReader(manifest.open(encoding="utf-8-sig",newline="")):
        level=int(row["level"])
        game_id=row["game_id"].strip()
        color=row["player_color"].strip().lower()
        if level not in range(1,9) or color not in ("w","b") or not game_id:
            raise ValueError("Invalid level, color or game ID")
        if game_id in ids: raise ValueError("Duplicate game ID: "+game_id)
        ids.add(game_id)
        relative=Path(row["pgn_file"])
        target=(base/relative).resolve()
        if target != base.resolve() and base.resolve() not in target.parents:
            raise ValueError("PGN outside the benchmark directory")
        with target.open(encoding="utf-8") as fh:
            game=chess.pgn.read_game(fh)
            if not game or chess.pgn.read_game(fh) or game.errors:
                raise ValueError("Exactly one valid game per PGN: "+str(target))
        if game.headers.get("Result") not in ("1-0","0-1","1/2-1/2"):
            raise ValueError("Game is unfinished or lacks result: "+game_id)
        expected=game.headers.get("SupaChessLevel")
        if expected and int(expected)!=level:
            raise ValueError("Game level conflicts with PGN: "+game_id)
        result=game.headers["Result"]
        outcome="D" if result=="1/2-1/2" else (
            "W" if (result=="1-0")== (color=="w") else "L")
        by_level[level].append({"game_id":game_id,"pgn":str(target),
                                 "color":color,"outcome":outcome,
                                 "sha256":hashlib.sha256(target.read_bytes()).hexdigest()})
    if require_complete:
        for level in range(1,9):
            if len(by_level[level])!=100:
                raise ValueError("Level %d: expected exactly 100 authenticated games, got %d" %
                                 (level,len(by_level[level])))
            whites=sum(x["color"]=="w" for x in by_level[level])
            if whites != 50:
                raise ValueError("Level %d: expected 50 white and 50 black games" % level)
    return by_level


def acpl_for_game(pgn_file, color, engine, limit):
    """Fair ACPL: best-before minus actual-after, both from the player's POV.
    Mate scores excluded; ACPL is not comparable without identical hardware/options.
    """
    import chess.pgn
    import chess
    with open(pgn_file,encoding="utf-8") as f: game=chess.pgn.read_game(f)
    board=game.board()
    losses=[]
    for move in game.mainline_moves():
        mover=board.turn
        score_before=None
        if mover==(color=="w"):
            info=engine.analyse(board,limit)
            score_before=info["score"].pov(mover).score(mate_score=None)
        board.push(move)
        if score_before is not None and not board.is_game_over():
            info=engine.analyse(board,limit)
            score_after=info["score"].pov(mover).score(mate_score=None)
            if score_after is not None:
                losses.append(max(0,score_before-score_after))
    return {"acpl":statistics.mean(losses) if losses else None,"eligible_moves":len(losses)}


def main():
    p=argparse.ArgumentParser(description="SupaChess Lichess 1-8 benchmark reporting")
    p.add_argument("--manifest",type=Path,required=True)
    p.add_argument("--pgn-root",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--uci",type=Path,help="Path to pinned UCI engine for ACPL")
    p.add_argument("--depth",type=int,default=18)
    p.add_argument("--threads",type=int,default=1)
    p.add_argument("--hash-mb",type=int,default=64)
    p.add_argument("--allow-incomplete",action="store_true")
    args=p.parse_args()
    rows=parse_games(args.manifest,args.pgn_root,not args.allow_incomplete)
    engine=None
    meta={"created_at_utc":datetime.now(timezone.utc).isoformat(),
          "python":platform.python_version(),"os":platform.platform(),
          "hardware":platform.processor(),"time_control":"180+2",
          "games_per_level_target":100,"colors_per_level_target":{"w":50,"b":50},
          "source":"user-supplied PGNs (not generated games)",
          "rating_system":"not FIDE, not engine Elo"}
    if args.uci:
        import chess.engine
        if args.depth < 1: raise ValueError("Invalid depth")
        engine=chess.engine.SimpleEngine.popen_uci(str(args.uci))
        engine.configure({"Threads":args.threads,"Hash":args.hash_mb})
        meta["analysis_engine"]=engine.id
        meta["engine_sha256"]=hashlib.sha256(args.uci.read_bytes()).hexdigest()
        meta["analysis_depth"]=args.depth
        meta["analysis_threads"]=args.threads
        meta["analysis_hash_mb"]=args.hash_mb
    output=[]
    try:
        for level in range(1,9):
            group=rows[level]
            w=sum(x["outcome"]=="W" for x in group)
            d=sum(x["outcome"]=="D" for x in group)
            l=sum(x["outcome"]=="L" for x in group)
            result={"level":level,"n":len(group),"wins":w,"draws":d,"losses":l,
                    "statistics":wilson(w,d,l),"games":group}
            if engine and group:
                import chess.engine
                vals=[acpl_for_game(x["pgn"],x["color"],engine,
                       chess.engine.Limit(depth=args.depth)) for x in group]
                weighted=sum(z["acpl"]*z["eligible_moves"] for z in vals if z["acpl"] is not None)
                count=sum(z["eligible_moves"] for z in vals)
                result["acpl_cp"]=weighted/count if count else None
                result["acpl_valid_moves"]=count
            output.append(result)
    finally:
        if engine:engine.quit()
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps({"manifest":meta,"levels":output},
                                   ensure_ascii=False,indent=2),encoding="utf-8")
    print("Wrote",args.out,"— actual imported games:",sum(len(v) for v in rows.values()))


if __name__=="__main__":
    main()
