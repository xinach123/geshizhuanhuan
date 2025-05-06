@echo off
echo 正在检查系统环境...

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 未检测到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b
)

:: 检查FFmpeg
if not exist "C:\ffmpeg\bin\ffmpeg.exe" (
    echo 未检测到FFmpeg，请先安装FFmpeg
    echo 下载地址：https://www.gyan.dev/ffmpeg/builds/
    echo 请将FFmpeg解压到C:\ffmpeg目录
    pause
    exit /b
)

:: 安装依赖
echo 正在安装项目依赖...
call npm install

:: 创建必要的目录
if not exist "uploads" mkdir uploads
if not exist "downloads" mkdir downloads

echo 安装完成！
echo 使用 node server.js 启动服务器
pause 