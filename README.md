# SupaChess — analyse et apprentissage des échecs / Chess Analysis and Learning

## Français — présentation

Ce dépôt rassemble le site SupaChess et des outils d’analyse de parties : revue des coups, évaluation en centipions, détection de points à travailler et boucle d’apprentissage. Il s’appuie notamment sur chess.js et Stockfish ; les tests ciblent les angles morts, les centipions et les rapports de revue.

### À quoi ça sert, et pourquoi ?

Le but est d’aider un joueur à comprendre une partie et à transformer les erreurs récurrentes en exercices ciblés. Une évaluation moteur donne un indice sur la position, mais l’explication pédagogique et le retour à la position sont nécessaires pour comprendre la cause d’une perte de centipions.

### Exemples d’utilisation

- Parcourir une partie coup par coup et repérer les moments où l’évaluation change.
- Examiner si un coup a laissé une pièce en prise ou manqué une tactique.
- Utiliser le rapport de revue pour choisir un thème d’entraînement.
- Lancer les tests automatisés avec `npm test` après avoir installé les dépendances.

Les analyses de moteur dépendent de la version et de la profondeur de Stockfish ; elles ne constituent pas, à elles seules, une preuve de niveau ou de progression.

## English — overview

This repository contains the SupaChess website and chess-analysis tools for reviewing moves, evaluating centipawn changes, identifying training themes and supporting a learning loop. It uses chess.js and Stockfish; tests cover blind spots, centipawn changes and review reports.

### What is it for, and why use it?

The goal is to help players understand a game and turn recurring mistakes into focused practice. Engine evaluations can indicate how a position changed, while explanations and links back to the board help the player understand why.

### Examples

- Review a game move by move and find positions where the evaluation changes.
- Check whether a move left a piece en prise or missed a tactic.
- Use a review report to choose a topic for the next practice session.
- Run the automated checks with `npm test` after installing dependencies.

Engine analysis depends on the Stockfish version and search depth; it is not by itself proof of playing strength or improvement.

## Organisation

- `index.html`, `js/`, `css/` : interface web ;
- `supa_coach_server.py` : service d’analyse associé ;
- `docs/` : documentation du projet ;
- `test/` et `tests/` : tests automatisés.

Pour connaître les prérequis et le démarrage de chaque composant, consulter les fichiers du dépôt et les guides dans `docs/`.
