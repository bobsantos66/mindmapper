@echo off
rem Abre o MindMapper neste computador e libera o acesso pelo iPhone na mesma rede Wi-Fi.
cd /d "%~dp0"
node apps\local\dist\mm.mjs abrir --celular %*
if errorlevel 1 pause
