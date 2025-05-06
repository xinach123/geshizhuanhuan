const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3001;

// 设置文件大小限制
const maxFileSize = 100 * 1024 * 1024; // 100MB

// 确保必要的目录存在
const uploadDir = path.join(__dirname, 'uploads');
const downloadDir = path.join(__dirname, 'downloads');

[uploadDir, downloadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: maxFileSize
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

// 批量转换接口
app.post('/convert-batch', upload.array('files', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    const format = req.body.format || 'gif';
    const quality = req.body.quality || 80;
    const scale = req.body.scale || 1;

    const results = [];
    const errors = [];

    for (const file of req.files) {
        try {
            console.log('处理文件:', file.originalname);
            console.log('文件路径:', file.path);
            console.log('文件大小:', file.size);

            // 检查输入文件是否存在
            if (!fs.existsSync(file.path)) {
                throw new Error('输入文件不存在');
            }

            const outputFileName = `${Date.now()}-${path.parse(file.originalname).name}.${format}`;
            const outputPath = path.join(downloadDir, outputFileName);

            console.log('输出路径:', outputPath);

            // 构建FFmpeg命令
            let ffmpegCommand;
            
            if (format === 'gif') {
                // 使用高质量GIF转换命令
                ffmpegCommand = `ffmpeg -y -i "${file.path}" -vf "fps=15,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -f gif "${outputPath}"`;
            } else if (format === 'mp4') {
                // 使用更可靠的MP4转换命令
                ffmpegCommand = `ffmpeg -y -i "${file.path}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "${outputPath}"`;
            } else {
                // 使用更可靠的WebM转换命令
                ffmpegCommand = `ffmpeg -y -i "${file.path}" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus "${outputPath}"`;
            }

            console.log('执行命令:', ffmpegCommand);

            // 执行转换
            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`转换错误: ${error}`);
                        console.error('错误输出:', stderr);
                        reject(error);
                        return;
                    }
                    console.log('转换成功:', stdout);
                    resolve();
                });
            });

            // 等待一小段时间确保文件写入完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 检查输出文件是否存在
            if (!fs.existsSync(outputPath)) {
                throw new Error('输出文件未生成');
            }

            // 检查输出文件大小
            const stats = fs.statSync(outputPath);
            console.log('输出文件大小:', stats.size);

            if (stats.size === 0) {
                throw new Error('输出文件大小为0');
            }

            // 清理上传的文件
            fs.unlinkSync(file.path);

            results.push({
                name: outputFileName,
                downloadUrl: `/downloads/${outputFileName}`
            });
        } catch (error) {
            console.error(`处理文件 ${file.originalname} 时出错:`, error);
            errors.push({
                name: file.originalname,
                error: error.message
            });
        }
    }

    res.json({
        success: true,
        files: results,
        errors: errors
    });
});

// 定期清理临时文件
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时

    [uploadDir, downloadDir].forEach(dir => {
        fs.readdir(dir, (err, files) => {
            if (err) return;
            files.forEach(file => {
                const filePath = path.join(dir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    if (now - stats.mtimeMs > maxAge) {
                        fs.unlink(filePath, () => {});
                    }
                });
            });
        });
    });
}, 60 * 60 * 1000); // 每小时检查一次

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 