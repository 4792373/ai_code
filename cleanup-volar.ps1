# 清理 Volar 扩展脚本

Write-Host "开始清理 Volar 扩展..." -ForegroundColor Green

# 1. 卸载所有 Volar 相关扩展
Write-Host "`n步骤 1: 卸载 Volar 扩展..." -ForegroundColor Yellow
$volarExtensions = @(
    "vue.volar",
    "vue.vscode-typescript-vue-plugin",
    "johnsoncodehk.volar",
    "johnsoncodehk.vscode-typescript-vue-plugin"
)

foreach ($ext in $volarExtensions) {
    Write-Host "尝试卸载: $ext"
    code --uninstall-extension $ext 2>$null
}

# 2. 查找并列出扩展文件夹
Write-Host "`n步骤 2: 查找 Volar 扩展文件夹..." -ForegroundColor Yellow
$extensionsPath = "$env:USERPROFILE\.vscode\extensions"

if (Test-Path $extensionsPath) {
    $volarFolders = Get-ChildItem -Path $extensionsPath -Directory | Where-Object { 
        $_.Name -like "*volar*" -or 
        $_.Name -like "*vue.vscode-typescript-vue-plugin*" 
    }
    
    if ($volarFolders) {
        Write-Host "找到以下 Volar 相关文件夹:" -ForegroundColor Cyan
        foreach ($folder in $volarFolders) {
            Write-Host "  - $($folder.Name)" -ForegroundColor White
        }
        
        Write-Host "`n是否要删除这些文件夹? (Y/N)" -ForegroundColor Yellow
        $response = Read-Host
        
        if ($response -eq "Y" -or $response -eq "y") {
            foreach ($folder in $volarFolders) {
                Write-Host "删除: $($folder.FullName)"
                Remove-Item -Path $folder.FullName -Recurse -Force -ErrorAction SilentlyContinue
            }
            Write-Host "删除完成!" -ForegroundColor Green
        }
    } else {
        Write-Host "未找到 Volar 扩展文件夹" -ForegroundColor Green
    }
}

# 3. 安装 Vetur
Write-Host "`n步骤 3: 安装 Vetur 扩展..." -ForegroundColor Yellow
code --install-extension octref.vetur

Write-Host "`n清理完成! 请重启 VSCode。" -ForegroundColor Green
Write-Host "重启后，Volar 错误应该消失，Vue 文件将由 Vetur 处理。" -ForegroundColor Cyan
