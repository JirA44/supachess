@echo off
cd /d "%~dp0"
echo SupaChess sur http://localhost:8777 (coach IA Supa sur :8778 via PM2 supachess-coach)
rem Le serveur coach est gere par PM2 (supachess-coach) - ne le lancer ici que s'il est absent
netstat -ano | findstr ":8778 .*LISTENING" >nul 2>&1
if errorlevel 1 start "supa-coach" python supa_coach_server.py
python -m http.server 8777
