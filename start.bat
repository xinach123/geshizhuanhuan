@echo off
echo 正在启动视频转换工具...

:: 检查FFmpeg
if not exist "C:\ffmpeg\bin\ffmpeg.exe" (
    echo 错误：未找到FFmpeg
    echo 请确保FFmpeg已正确安装在C:\ffmpeg\bin目录下
    pause
    exit /b
)

:: 启动服务器
start http://localhost:3001
node server.js 