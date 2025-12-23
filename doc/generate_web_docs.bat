@echo off
cd /d %~dp0
echo Generando documentacion para Web...
doxygen Doxyfile.WEB
echo Abriendo documentacion...
start WEB\html\index.html
pause