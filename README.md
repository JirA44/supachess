# SupaChess — Chess analysis and learning

[![Live site](https://img.shields.io/badge/live-supachess-4fd964?style=flat-square&logo=github)](https://jira44.github.io/supachess/)
[![Tests](https://img.shields.io/badge/tests-npm%20test-8a8f98?style=flat-square)](https://github.com/JirA44/supachess/actions)
[![License: ISC](https://img.shields.io/badge/license-ISC-9aa0b8?style=flat-square)](LICENSE)
[![Engine](https://img.shields.io/badge/engine-Stockfish%2019%20(WASM)-c58f6b?style=flat-square)](vendor/)

**Live site:** <https://jira44.github.io/supachess/>

## What is it for, and why use it?

SupaChess is a static chess site that helps a player understand a finished game and turn recurring mistakes into focused practice. A local Stockfish evaluation tells you how a position changed; the teaching layer explains *why* a move lost centipowns and links the position back to the board.

Everything runs in the browser: games, reviews, lessons and corpus analysis are computed locally with chess.js and a WebAssembly Stockfish build. No game data is uploaded to a server.

## Modules

| Page | Module | What it does |
| --- | --- | --- |
| [`index.html`](index.html) | Play & review | Play against Stockfish, review a game move by move, inspect centipawn losses and build a correction queue. |
| [`book-lessons.html`](book-lessons.html) | Academy | Guided lessons: recall the principle, find the move, verify the engine line, unlock the exercise. |
| [`noboardchess.html`](noboardchess.html) | Blind chess | Play without a board: write your moves, track the piece inventory, hear the score, compare with Stockfish. |
| [`champion-metrics.html`](champion-metrics.html) | Champion metrics | Measure accuracy and ACPL on your own PGN corpus, group results by time control, compare published reference points. |
| [`leaderboards.html`](leaderboards.html) | Leaderboards | Internal Elo per game mode, cached locally with an offline fallback to local engine standings. |
| [`learn-moves.html`](learn-moves.html) | Material & calculation | Train piece counting and move calculation with guided exercises. |
| [`learn-progressive.html`](learn-progressive.html) | Progressive path | Anticipate the opponent threat, calculate the best reply, verify before moving. |

## Daily routine and anti-blunder shield

Two training tools live on the play page (`index.html`), both computed and stored locally:

- **Routine du Jour (45 min)** — three 15-minute steps (one curriculum lesson picked from the date, a fixed lot of 50 tactical puzzles, then a slow game against Stockfish at 10+5 or 15+10 that is analysed for its two worst moments). A local streak counts consecutive completed days and resets as soon as one day is missed. See [`docs/ROUTINE_DU_JOUR.md`](docs/ROUTINE_DU_JOUR.md) for the full French documentation.
- **Bouclier Anti-Gaffe** — off by default. When enabled on a training game, it blocks a move that leaves one of your pieces attacked and undefended, or that allows mate in one, and shows a short *Échecs / Prises / Menaces* reminder. The geometric check ignores pinned pieces, so it is a teaching aid, not a proof. Games that use it are tagged "with aids" and never feed the leaderboards.

The clock settings also gained a Fischer increment (none, +5 s, +10 s) added after each move played.

```bash
npm test                        # 171 automated checks (node:test)
npm run test:routine-browser    # Playwright check of the routine panel and the shield in a real game
```

## Getting started

```bash
npm install       # chess.js and Playwright (browser download can be skipped)
npm test          # 138+ automated checks (node:test)
npm run test:lessons-alignment   # lesson QCM / expected-move alignment
```

Serve the folder with any static server, for example:

```bash
npx serve .
```

## Repository layout

- `index.html`, `book-lessons.html`, `noboardchess.html`, `champion-metrics.html`, `leaderboards.html`, `learn-*.html` — static pages.
- `js/` — browser modules (board, engine wrapper, lessons, review, profile, leaderboards).
- `css/` — stylesheets.
- `vendor/` — pinned chess.js and Stockfish WebAssembly builds.
- `test/` and `tests/` — automated checks (`node --test` plus Playwright specs).
- `scripts/` — maintenance scripts (lesson alignment, asset builds).
- `docs/` — project documentation.
- `sitemap.xml`, `robots.txt` — deployment metadata for GitHub Pages.

## Limits and honesty rules

- Engine analysis depends on the Stockfish version, the search depth and the time per position; it is never a proof of playing strength.
- Internal Elo values are indicative SupaChess ratings, **not** FIDE ratings. Accuracy and ACPL have no official conversion to Elo.
- Published reference tables state their own sample, method and limits on the page.
- The site is French-first; engine lessons accept French notation (C, F, T, D, R) and always display international notation.

## License

ISC. See the repository metadata for details.
