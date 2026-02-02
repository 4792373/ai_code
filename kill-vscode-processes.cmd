@echo off
echo Killing all VSCode processes...

taskkill /F /IM Code.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul

echo Done! All VSCode processes have been terminated.
echo You can now restart VSCode.
pause
