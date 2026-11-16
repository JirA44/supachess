#!/usr/bin/env python3
"""Build the pinned Berserk 14 single-thread WebAssembly engine for SupaChess Pages."""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request

COMMIT = "8ae895a6151695be4a50d4fb65b0c131659c513a"
NETWORK_NAME = "berserk-9b84c340af7e.nn"
NETWORK_SHA256 = "9b84c340af7e45f6e07f0046235ccb327f4ae0840c8ee2c4b97b99121e5c5084"
SOURCE_URL = f"https://codeload.github.com/jhonnold/berserk/tar.gz/{COMMIT}"
NETWORK_URL = f"https://github.com/jhonnold/berserk-networks/releases/download/networks/{NETWORK_NAME}"
SOURCES = "attacks.c bench.c berserk.c bits.c board.c eval.c history.c move.c movegen.c movepick.c perft.c random.c search.c see.c tb.c thread.c transposition.c uci.c util.c zobrist.c nn/accumulator.c nn/evaluate.c pyrrhic/tbprobe.c".split()


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "SupaChess-Berserk-build"})
    with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
        shutil.copyfileobj(response, output)


def replace_once(path: Path, before: str, after: str) -> None:
    text = path.read_text(encoding="utf-8")
    if text.count(before) != 1:
        raise RuntimeError(f"Expected one patch anchor in {path}")
    path.write_text(text.replace(before, after, 1), encoding="utf-8", newline="\n")


def patch_sources(root: Path) -> None:
    src = root / "src"
    replace_once(src / "berserk.c", "    UCILoop();", "#ifndef __EMSCRIPTEN__\n    UCILoop();\n#endif")

    thread = src / "thread.c"
    replace_once(thread, "void ThreadWaitUntilSleep(ThreadData* thread) {", "void ThreadWaitUntilSleep(ThreadData* thread) {\n#ifdef SUPACHESS_WASM_SINGLE\n  (void) thread;\n  Threads.searching = 0;\n  return;\n#endif")
    replace_once(thread, "void ThreadWait(ThreadData* thread, atomic_uchar* cond) {", "void ThreadWait(ThreadData* thread, atomic_uchar* cond) {\n#ifdef SUPACHESS_WASM_SINGLE\n  (void) thread;\n  (void) cond;\n  return;\n#endif")
    replace_once(thread, "void ThreadWake(ThreadData* thread, int action) {", "void ThreadWake(ThreadData* thread, int action) {\n#ifdef SUPACHESS_WASM_SINGLE\n  if (action == THREAD_RESUME) return;\n  thread->action = action;\n  if (action == THREAD_TT_CLEAR) TTClearPart(thread->idx);\n  else if (action == THREAD_SEARCH_CLEAR) SearchClearThread(thread);\n  else if (action == THREAD_SEARCH) MainSearch();\n  thread->action = THREAD_SLEEP;\n  if (thread->idx == 0) Threads.searching = 0;\n  return;\n#endif")
    replace_once(thread, "  ThreadIdle(thread);", "#ifndef SUPACHESS_WASM_SINGLE\n  ThreadIdle(thread);\n#endif")
    replace_once(thread, "void ThreadCreate(int i) {", "void ThreadCreate(int i) {\n#ifdef SUPACHESS_WASM_SINGLE\n  ThreadInit((void*) (intptr_t) i);\n  return;\n#endif")
    replace_once(thread, "  pthread_mutex_lock(&thread->mutex);\n  thread->action = THREAD_EXIT;", "#ifndef SUPACHESS_WASM_SINGLE\n  pthread_mutex_lock(&thread->mutex);\n  thread->action = THREAD_EXIT;")
    replace_once(thread, "  pthread_mutex_destroy(&thread->mutex);\n\n  AlignedFree(thread->accumulators);", "  pthread_mutex_destroy(&thread->mutex);\n#endif\n\n  AlignedFree(thread->accumulators);")
    replace_once(thread, "void ThreadsSetNumber(int n) {", "void ThreadsSetNumber(int n) {\n#ifdef SUPACHESS_WASM_SINGLE\n  if (n > 1) n = 1;\n#endif")

    uci = src / "uci.c"
    replace_once(uci, '#include "uci.h"', '#include "uci.h"\n#ifdef __EMSCRIPTEN__\n#include <emscripten/emscripten.h>\nstatic const char* SupaWasmUciInput;\n#endif')
    readline_before = "int ReadLine(char* in) {\n  if (fgets(in, 8192, stdin) == NULL)\n    return 0;\n\n  size_t c = strcspn(in, \"\\r\\n\");\n  if (c < strlen(in))\n    in[c] = '\\0';\n\n  return 1;\n}"
    readline_after = "int ReadLine(char* in) {\n#ifdef __EMSCRIPTEN__\n  if (!SupaWasmUciInput || !*SupaWasmUciInput) return 0;\n  size_t remaining = strcspn(SupaWasmUciInput, \"\\r\\n\");\n  if (remaining >= 8192) remaining = 8191;\n  memcpy(in, SupaWasmUciInput, remaining);\n  in[remaining] = '\\0';\n  SupaWasmUciInput += remaining;\n  SupaWasmUciInput += strspn(SupaWasmUciInput, \"\\r\\n\");\n  return 1;\n#else\n  if (fgets(in, 8192, stdin) == NULL)\n    return 0;\n\n  size_t c = strcspn(in, \"\\r\\n\");\n  if (c < strlen(in))\n    in[c] = '\\0';\n\n  return 1;\n#endif\n}\n\n#ifdef __EMSCRIPTEN__\nEMSCRIPTEN_KEEPALIVE void BerserkRunCommand(const char* commands) {\n  SupaWasmUciInput = commands;\n  UCILoop();\n  SupaWasmUciInput = NULL;\n}\n#endif"
    replace_once(uci, readline_before, readline_after)
    replace_once(uci, "  pthread_mutex_destroy(&Threads.lock);\n  ThreadsExit();", "  pthread_mutex_destroy(&Threads.lock);\n#ifndef __EMSCRIPTEN__\n  ThreadsExit();\n#endif")

    evaluate = src / "nn" / "evaluate.c"
    replace_once(evaluate, "INCBIN(Embed, EVALFILE);", "#ifndef __EMSCRIPTEN__\nINCBIN(Embed, EVALFILE);\n#endif")
    replace_once(evaluate, "  CopyData(EmbedData);", "  #ifdef __EMSCRIPTEN__\n  if (!LoadNetwork(EVALFILE)) {\n    fprintf(stderr, \"Unable to load Berserk NNUE network\\n\");\n    abort();\n  }\n  #else\n  CopyData(EmbedData);\n  #endif")

    endian = src / "pyrrhic" / "stdendian.h"
    replace_once(endian, "#endif\n\n/* Unknown */", "#endif\n\n#if defined(__EMSCRIPTEN__)\n#define _LITTLE_ENDIAN 1234\n#define _BIG_ENDIAN 4321\n#define _BYTE_ORDER _LITTLE_ENDIAN\n#define __ENDIAN_DEFINED 1\n#endif\n\n/* Unknown */")


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    out = repo / "vendor"
    emcc = os.environ.get("EMCC", "emcc")
    with tempfile.TemporaryDirectory(prefix="supachess-berserk-") as temporary:
        work = Path(temporary)
        archive = work / "source.tar.gz"
        download(SOURCE_URL, archive)
        with tarfile.open(archive, "r:gz") as bundle:
            bundle.extractall(work, filter="data")
        source_root = next(path for path in work.iterdir() if path.is_dir())
        patch_sources(source_root)

        network = source_root / "src" / NETWORK_NAME
        download(NETWORK_URL, network)
        digest = hashlib.sha256(network.read_bytes()).hexdigest()
        if digest != NETWORK_SHA256:
            raise RuntimeError(f"NNUE checksum mismatch: {digest}")

        stub = work / "pthread.h"
        stub.write_text("""#ifndef SUPACHESS_PTHREAD_STUB_H\n#define SUPACHESS_PTHREAD_STUB_H\n#include <stddef.h>\ntypedef int pthread_t; typedef int pthread_mutex_t; typedef int pthread_cond_t;\nstatic inline int pthread_mutex_init(pthread_mutex_t*m,const void*a){(void)m;(void)a;return 0;}\nstatic inline int pthread_mutex_destroy(pthread_mutex_t*m){(void)m;return 0;}\nstatic inline int pthread_mutex_lock(pthread_mutex_t*m){(void)m;return 0;}\nstatic inline int pthread_mutex_unlock(pthread_mutex_t*m){(void)m;return 0;}\nstatic inline int pthread_cond_init(pthread_cond_t*c,const void*a){(void)c;(void)a;return 0;}\nstatic inline int pthread_cond_destroy(pthread_cond_t*c){(void)c;return 0;}\nstatic inline int pthread_cond_signal(pthread_cond_t*c){(void)c;return 0;}\nstatic inline int pthread_cond_wait(pthread_cond_t*c,pthread_mutex_t*m){(void)c;(void)m;return 0;}\nstatic inline int pthread_create(pthread_t*t,const void*a,void*(*f)(void*),void*v){(void)t;(void)a;(void)f;(void)v;return 0;}\nstatic inline int pthread_join(pthread_t t,void**v){(void)t;(void)v;return 0;}\n#endif\n""", encoding="utf-8")
        command = [emcc, "-O3", "-flto", "-std=gnu11", "-DNDEBUG", '-DVERSION="14"', f'-DEVALFILE="{NETWORK_NAME}"', "-DSUPACHESS_WASM_SINGLE", "-I", str(work), *[str(source_root / "src" / item) for item in SOURCES], "-lm", "-sALLOW_MEMORY_GROWTH=1", "-sSTACK_SIZE=2097152", "-sENVIRONMENT=worker", "-sMODULARIZE=1", "-sEXPORT_NAME=createBerserkModule", "-sFORCE_FILESYSTEM=1", "-sNO_EXIT_RUNTIME=1", "-sEXPORTED_FUNCTIONS=['_main','_BerserkRunCommand']", "-sEXPORTED_RUNTIME_METHODS=['ccall']", "--preload-file", f"{network}@/{NETWORK_NAME}", "-o", str(out / "berserk-14.js")]
        out.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(command, cwd=source_root / "src", text=True, capture_output=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr[-7000:])
        result.check_returncode()
        shutil.copy2(source_root / "LICENSE", out / "LICENSE.Berserk-14.txt")


if __name__ == "__main__":
    main()
