@echo off
chcp 65001 >nul
echo Executando testes de unidade, integração e BDD...
call npm test
if errorlevel 1 (echo Houve falhas nos testes! & pause & exit /b 1)
echo Executando carga HTTP em bancos temporários...
call npm run load
pause
