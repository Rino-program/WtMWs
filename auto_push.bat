@echo off
chcp 65001
REM --- 設定ファイルで有効化を判定 ---
setlocal enabledelayedexpansion
set "config_file=auto_push_config.json"
set "run_flag=false"
for /f "usebackq tokens=*" %%A in (%config_file%) do (
    echo %%A | findstr /C:"\"auto_push\": true" >nul && set "run_flag=true"
)
if /i "!run_flag!"=="true" (
    git add .
    git commit -m "Auto commit"
    git push
) else (
    echo 自動コミット・プッシュは無効化されています。
)
pause
