# 视频格式转换工具

一个简单易用的视频格式转换工具，支持批量转换视频文件为GIF、MP4和WebM格式。

## 功能特点

- 支持批量转换（最多10个文件）
- 支持拖拽上传
- 支持多种输出格式（GIF、MP4、WebM）
- 高质量GIF输出
- 可调节输出质量和缩放比例
- 实时显示转换进度
- 支持批量下载

## 系统要求

- Windows 10 或更高版本
- Node.js 14.0 或更高版本
- FFmpeg 7.0 或更高版本

## 安装步骤

1. 安装 FFmpeg
   - 下载 FFmpeg: https://www.gyan.dev/ffmpeg/builds/
   - 解压到 C:\ffmpeg
   - 确保 C:\ffmpeg\bin 目录下有 ffmpeg.exe

2. 安装 Node.js
   - 下载 Node.js: https://nodejs.org/
   - 运行安装程序，按提示完成安装

3. 安装项目依赖
   ```bash
   npm install
   ```

## 使用方法

1. 启动服务器
   ```bash
   node server.js
   ```

2. 打开浏览器访问
   ```
   http://localhost:3001
   ```

3. 使用说明
   - 点击"选择文件"或将文件拖入上传区域
   - 选择输出格式
   - 调整质量和缩放比例
   - 点击"开始转换"
   - 等待转换完成后下载文件

## 注意事项

- 确保有足够的磁盘空间
- 转换大文件时可能需要较长时间
- 建议使用现代浏览器（Chrome、Firefox、Edge等）

## 常见问题

1. 如果提示"FFmpeg未找到"
   - 检查 FFmpeg 是否正确安装在 C:\ffmpeg\bin 目录下
   - 确保 ffmpeg.exe 文件存在

2. 如果端口被占用
   - 修改 server.js 中的 port 变量为其他端口号
   - 或关闭占用端口的其他程序

3. 如果上传失败
   - 检查文件大小是否超过限制
   - 确保文件格式正确（支持MP4和GIF）

## 技术支持

如有问题，请提交 Issue 或联系开发者。 