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
        // 限制文件数量为10个
        if (files.length > 10) {
            alert('一次最多只能上传10个文件！');
            return;
        }

        // 过滤文件类型
        const validFiles = files.filter(file => 
            file.type.match('video/mp4') || file.type.match('image/gif')
        );

        if (validFiles.length === 0) {
            alert('请选择MP4或GIF文件！');
            return;
        }

        selectedFiles = validFiles;
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

    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

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

            const response = await fetch('/convert-batch', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('转换失败');

            const result = await response.json();
            
            if (result.errors && result.errors.length > 0) {
                const errorList = document.createElement('div');
                errorList.className = 'error-list';
                errorList.innerHTML = '<h3>转换失败的文件：</h3><ul>';
                result.errors.forEach(error => {
                    errorList.innerHTML += `<li>${error.name}: ${error.error}</li>`;
                });
                errorList.innerHTML += '</ul>';
                downloadSection.appendChild(errorList);
            }

            if (result.files && result.files.length > 0) {
                const successList = document.createElement('div');
                successList.className = 'success-list';
                successList.innerHTML = '<h3>转换成功的文件：</h3>';
                result.files.forEach(file => {
                    const link = document.createElement('a');
                    link.href = file.downloadUrl;
                    link.className = 'download-btn';
                    link.textContent = `下载 ${file.name}`;
                    link.download = file.name;
                    successList.appendChild(link);
                });
                downloadSection.appendChild(successList);
            }
            
            progress.style.width = '100%';
        } catch (error) {
            alert('转换过程中发生错误：' + error.message);
        } finally {
            convertBtn.disabled = false;
        }
    });
}); 