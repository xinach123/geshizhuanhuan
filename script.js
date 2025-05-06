document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const convertBtn = document.getElementById('convertBtn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const scaleSlider = document.getElementById('scale');
    const scaleValue = document.getElementById('scaleValue');
    const previewSection = document.getElementById('previewSection');
    const progressBar = document.getElementById('progress');
    const downloadSection = document.getElementById('downloadSection');

    let selectedFiles = [];

    // 更新质量显示
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = `${qualitySlider.value}%`;
    });

    // 更新缩放比例显示
    scaleSlider.addEventListener('input', () => {
        scaleValue.textContent = scaleSlider.value;
    });

    // 处理文件选择
    const handleFiles = (files) => {
        selectedFiles = Array.from(files).slice(0, 10); // 限制最多10个文件
        previewSection.innerHTML = '';
        
        selectedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            `;
            previewSection.appendChild(fileItem);
        });

        convertBtn.disabled = selectedFiles.length === 0;
    };

    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 文件输入变化事件
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 拖放事件处理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 转换按钮点击事件
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        convertBtn.disabled = true;
        progressBar.style.width = '0%';
        downloadSection.innerHTML = '';

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        formData.append('format', document.getElementById('outputFormat').value);
        formData.append('quality', qualitySlider.value);
        formData.append('scale', scaleSlider.value);

        try {
            const response = await fetch('/convert-batch', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('转换失败');
            }

            const result = await response.json();
            
            if (result.success) {
                result.files.forEach(file => {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = file.downloadUrl;
                    downloadLink.className = 'download-btn';
                    downloadLink.textContent = `下载 ${file.name}`;
                    downloadLink.download = file.name;
                    downloadSection.appendChild(downloadLink);
                });
            } else {
                alert('转换过程中出现错误：' + result.error);
            }
        } catch (error) {
            alert('转换失败：' + error.message);
        } finally {
            convertBtn.disabled = false;
        }
    });
}); 