@echo off
echo ========================================
echo 修复 Volar 扩展问题
echo ========================================
echo.

echo 步骤 1: 卸载所有 Vue 相关扩展...
call code --uninstall-extension octref.vetur
call code --uninstall-extension vue.volar
call code --uninstall-extension vue.vscode-typescript-vue-plugin
call code --uninstall-extension johnsoncodehk.volar
call code --uninstall-extension johnsoncodehk.vscode-typescript-vue-plugin

echo.
echo 步骤 2: 清理扩展缓存...
if exist "%USERPROFILE%\.vscode\extensions" (
    echo 查找 Volar 和 Vetur 扩展文件夹...
    for /d %%i in ("%USERPROFILE%\.vscode\extensions\*volar*") do (
        echo 删除: %%i
        rmdir /s /q "%%i"
    )
    for /d %%i in ("%USERPROFILE%\.vscode\extensions\*vetur*") do (
        echo 删除: %%i
        rmdir /s /q "%%i"
    )
    for /d %%i in ("%USERPROFILE%\.vscode\extensions\*vue*") do (
        echo 删除: %%i
        rmdir /s /q "%%i"
    )
)

echo.
echo 步骤 3: 安装最新版 Volar 扩展...
call code --install-extension Vue.volar
call code --install-extension Vue.vscode-typescript-vue-plugin

echo.
echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 请按照以下步骤操作：
echo 1. 完全关闭 Kiro/VSCode（不是重新加载窗口）
echo 2. 重新打开 Kiro
echo 3. 打开任意 .vue 文件
echo 4. 按 Ctrl+Shift+P，输入 "TypeScript: Restart TS Server"
echo.
pause
