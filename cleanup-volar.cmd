@echo off
echo Cleaning up Volar extensions...

echo.
echo Step 1: Uninstalling Volar extensions...
call code --uninstall-extension vue.volar
call code --uninstall-extension vue.vscode-typescript-vue-plugin
call code --uninstall-extension johnsoncodehk.volar
call code --uninstall-extension johnsoncodehk.vscode-typescript-vue-plugin

echo.
echo Step 2: Installing Vetur...
call code --install-extension octref.vetur

echo.
echo Done! Please restart VSCode.
pause
