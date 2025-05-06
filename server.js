const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const port = process.env.PORT || 3001;

// 确保目录存在
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// 静态文件服务
app.use(express.static('public'));
app.use('/downloads', express.static('downloads'));

// 添加安全头部
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
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
                const inputPath = file.path;
                const outputFileName = `${Date.now()}-${path.parse(file.originalname).name}.${format}`;
                const outputPath = path.join(downloadsDir, outputFileName);

                console.log(`Converting ${file.originalname} to ${format}`);
                console.log(`Input path: ${inputPath}`);
                console.log(`Output path: ${outputPath}`);

                await new Promise((resolve, reject) => {
                    let command = ffmpeg(inputPath);

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
                        .save(outputPath);
                });

                results.push({
                    originalName: file.originalname,
                    downloadUrl: `/downloads/${outputFileName}`
                });

                // 清理上传的文件
                fs.unlink(inputPath, (err) => {
                    if (err) console.error('Error deleting input file:', err);
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

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Upload directory: ${uploadsDir}`);
    console.log(`Download directory: ${downloadsDir}`);
}); 