document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.querySelector('.drop-zone');
    const convertBtn = document.getElementById('convertBtn');
    const outputFormat = document.getElementById('outputFormat');
    const quality = document.getElementById('quality');
    const scale = document.getElementById('scale');
    const qualityValue = document.getElementById('qualityValue');
    const scaleValue = document.getElementById('scaleValue');
    const preview = document.getElementById('preview');
    const progress = document.querySelector('.progress');
    const downloadSection = document.querySelector('.download-section');
    const statusDiv = document.getElementById('status');

    let selectedFiles = [];
    let ffmpeg = null;

    // 初始化 FFmpeg
    async function initFFmpeg() {
        if (!ffmpeg) {
            const { createFFmpeg, fetchFile } = FFmpeg;
            ffmpeg = createFFmpeg({ log: true });
            await ffmpeg.load();
        }
        return ffmpeg;
    }

    // 转换文件
    async function convertFile(file, format) {
        try {
            const ffmpeg = await initFFmpeg();
            const inputFileName = file.name;
            const outputFileName = `${Date.now()}-${file.name.split('.')[0]}.${format}`;

            // 写入文件到 FFmpeg 虚拟文件系统
            ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

            // 执行转换
            let command = [];
            switch (format) {
                case 'gif':
                    command = [
                        '-i', inputFileName,
                        '-vf', `fps=10,scale=${scale.value}%:-1:flags=lanczos`,
                        '-f', 'gif',
                        outputFileName
                    ];
                    break;
                case 'mp4':
                    command = [
                        '-i', inputFileName,
                        '-c:v', 'libx264',
                        '-c:a', 'aac',
                        '-preset', 'medium',
                        '-crf', `${Math.floor((100 - quality.value) / 2)}`,
                        '-vf', `scale=${scale.value}%:-1`,
                        outputFileName
                    ];
                    break;
                case 'webm':
                    command = [
                        '-i', inputFileName,
                        '-c:v', 'libvpx-vp9',
                        '-c:a', 'libopus',
                        '-crf', `${Math.floor((100 - quality.value) / 2)}`,
                        '-b:v', '0',
                        '-vf', `scale=${scale.value}%:-1`,
                        outputFileName
                    ];
                    break;
            }

            await ffmpeg.run(...command);

            // 读取转换后的文件
            const data = ffmpeg.FS('readFile', outputFileName);

            // 清理文件
            ffmpeg.FS('unlink', inputFileName);
            ffmpeg.FS('unlink', outputFileName);

            // 创建下载链接
            const blob = new Blob([data.buffer], { type: getMimeType(outputFileName) });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.className = 'download-btn';
            a.textContent = `下载 ${outputFileName}`;
            a.download = outputFileName;
            downloadSection.appendChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('转换错误:', error);
            throw error;
        }
    }

    // 更新滑块值显示
    quality.addEventListener('input', () => {
        qualityValue.textContent = `${quality.value}%`;
    });

    scale.addEventListener('input', () => {
        scaleValue.textContent = `${scale.value}%`;
    });

    // 拖放功能
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#2980b9';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    });

    function handleFiles(files) {
        // 限制文件数量为10个
        if (files.length > 10) {
            alert('一次最多只能上传10个文件！');
            return;
        }

        // 过滤文件类型
        const validFiles = files.filter(file => {
            return file.type.match('video/.*') || file.type.match('image/gif');
        });

        if (validFiles.length === 0) {
            alert('请选择视频或GIF文件！');
            return;
        }

        selectedFiles = validFiles;

        // 启用转换按钮
        convertBtn.disabled = false;

        // 显示文件列表
        preview.innerHTML = '<h3>已选择的文件：</h3>';
        const fileList = document.createElement('ul');
        validFiles.forEach(file => {
            const li = document.createElement('li');
            li.textContent = `${file.name} (${formatFileSize(file.size)})`;
            fileList.appendChild(li);
        });
        preview.appendChild(fileList);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 处理转换按钮点击
    convertBtn.addEventListener('click', async function() {
        if (selectedFiles.length === 0) {
            alert('请选择文件');
            return;
        }

        try {
            convertBtn.disabled = true;
            progress.style.width = '0%';
            downloadSection.innerHTML = '';
            statusDiv.textContent = '正在转换...';

            const totalFiles = selectedFiles.length;
            let completedFiles = 0;

            for (let file of selectedFiles) {
                statusDiv.textContent = `正在转换 ${file.name}...`;
                await convertFile(file, outputFormat.value);
                completedFiles++;
                progress.style.width = `${(completedFiles / totalFiles) * 100}%`;
            }

            statusDiv.textContent = '转换完成！';
        } catch (error) {
            console.error('转换错误:', error);
            statusDiv.textContent = `转换失败: ${error.message}`;
        } finally {
            convertBtn.disabled = false;
        }
    });

    function getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'gif': 'image/gif',
            'mp4': 'video/mp4',
            'webm': 'video/webm'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}); 