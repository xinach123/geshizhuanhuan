@echo off
echo 正在部署视频转换工具...

:: 检查环境
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未找到Node.js
    pause
    exit /b
)

if not exist "C:\ffmpeg\bin\ffmpeg.exe" (
    echo 错误：未找到FFmpeg
    pause
    exit /b
)

:: 安装PM2（用于进程管理）
echo 正在安装PM2...
call npm install -g pm2

:: 安装项目依赖
echo 正在安装项目依赖...
call npm install

:: 创建必要的目录
if not exist "uploads" mkdir uploads
if not exist "downloads" mkdir downloads

:: 启动服务
echo 正在启动服务...
call pm2 start server.js --name "video-converter"

echo 部署完成！
echo 服务已启动，可以通过以下地址访问：
echo http://localhost:3001
echo.
echo 使用以下命令管理服务：
echo pm2 stop video-converter    - 停止服务
echo pm2 restart video-converter - 重启服务
echo pm2 logs video-converter    - 查看日志
pause 