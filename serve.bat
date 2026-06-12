@echo off
cd /d "%~dp0"
echo SupaChess sur http://localhost:8777 (coach IA Supa sur :8778)
start "supa-coach" python supa_coach_server.py
python -m http.server 8777
