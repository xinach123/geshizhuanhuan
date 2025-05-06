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

    let selectedFiles = [];

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
        console.log('处理文件:', files); // 调试日志

        // 限制文件数量为10个
        if (files.length > 10) {
            alert('一次最多只能上传10个文件！');
            return;
        }

        // 过滤文件类型
        const validFiles = files.filter(file => {
            const isValid = file.type.match('video/.*') || file.type.match('image/gif');
            console.log('文件类型检查:', file.name, file.type, isValid); // 调试日志
            return isValid;
        });

        if (validFiles.length === 0) {
            alert('请选择视频或GIF文件！');
            return;
        }

        selectedFiles = validFiles;
        console.log('已选择文件:', selectedFiles); // 调试日志

        // 启用转换按钮
        convertBtn.disabled = false;
        console.log('转换按钮状态:', convertBtn.disabled); // 调试日志

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

    convertBtn.addEventListener('click', async () => {
        console.log('点击转换按钮'); // 调试日志
        if (selectedFiles.length === 0) {
            console.log('没有选择文件'); // 调试日志
            return;
        }

        convertBtn.disabled = true;
        progress.style.width = '0%';
        downloadSection.innerHTML = '';

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            formData.append('format', outputFormat.value);
            formData.append('quality', quality.value);
            formData.append('scale', scale.value);

            console.log('发送转换请求'); // 调试日志
            const response = await fetch('/convert-batch', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '转换失败');
            }

            const result = await response.json();
            console.log('转换结果:', result); // 调试日志
            
            if (result.errors && result.errors.length > 0) {
                const errorList = document.createElement('div');
                errorList.className = 'error-list';
                errorList.innerHTML = '<h3>转换失败的文件：</h3><ul>';
                result.errors.forEach(error => {
                    errorList.innerHTML += `<li>${error.fileName}: ${error.error}</li>`;
                });
                errorList.innerHTML += '</ul>';
                downloadSection.appendChild(errorList);
            }

            if (result.results && result.results.length > 0) {
                const successList = document.createElement('div');
                successList.className = 'success-list';
                successList.innerHTML = '<h3>转换成功的文件：</h3>';
                result.results.forEach(file => {
                    const link = document.createElement('a');
                    link.href = `data:${getMimeType(file.convertedName)};base64,${file.data}`;
                    link.className = 'download-btn';
                    link.textContent = `下载 ${file.convertedName}`;
                    link.download = file.convertedName;
                    successList.appendChild(link);
                });
                downloadSection.appendChild(successList);
            }
            
            progress.style.width = '100%';
        } catch (error) {
            console.error('转换错误:', error); // 调试日志
            alert('转换过程中发生错误：' + error.message);
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