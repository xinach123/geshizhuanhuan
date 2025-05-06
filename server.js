const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const port = process.env.PORT || 3001;

// 配置内存存储
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 添加安全头部
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// 转换API
app.post('/convert-batch', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const format = req.body.format || 'gif';
        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                console.log(`Processing ${file.originalname} to ${format}`);

                // 使用内存中的文件数据
                const inputBuffer = file.buffer;
                const outputFileName = `${Date.now()}-${path.parse(file.originalname).name}.${format}`;

                // 创建临时文件路径
                const tempInputPath = `/tmp/${file.originalname}`;
                const tempOutputPath = `/tmp/${outputFileName}`;

                // 写入临时文件
                require('fs').writeFileSync(tempInputPath, inputBuffer);

                await new Promise((resolve, reject) => {
                    let command = ffmpeg(tempInputPath);

                    switch (format) {
                        case 'gif':
                            command = command
                                .fps(10)
                                .size('320x?')
                                .videoFilters('scale=320:-1:flags=lanczos');
                            break;
                        case 'mp4':
                            command = command
                                .videoCodec('libx264')
                                .audioCodec('aac')
                                .outputOptions('-preset', 'medium')
                                .outputOptions('-crf', '23');
                            break;
                        case 'webm':
                            command = command
                                .videoCodec('libvpx-vp9')
                                .audioCodec('libopus')
                                .outputOptions('-crf', '30')
                                .outputOptions('-b:v', '0');
                            break;
                    }

                    command
                        .on('start', (commandLine) => {
                            console.log('FFmpeg command:', commandLine);
                        })
                        .on('error', (err) => {
                            console.error('FFmpeg error:', err);
                            reject(err);
                        })
                        .on('end', () => {
                            console.log('Conversion completed');
                            resolve();
                        })
                        .save(tempOutputPath);
                });

                // 读取转换后的文件
                const outputBuffer = require('fs').readFileSync(tempOutputPath);

                // 清理临时文件
                require('fs').unlinkSync(tempInputPath);
                require('fs').unlinkSync(tempOutputPath);

                // 将转换后的文件作为 base64 返回
                results.push({
                    originalName: file.originalname,
                    convertedName: outputFileName,
                    data: outputBuffer.toString('base64')
                });

            } catch (err) {
                console.error(`Error processing ${file.originalname}:`, err);
                errors.push({
                    fileName: file.originalname,
                    error: err.message
                });
            }
        }

        res.json({
            success: true,
            results,
            errors
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({
            error: '服务器错误',
            details: err.message
        });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 处理所有其他路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 导出 app 而不是直接启动服务器
module.exports = app; 