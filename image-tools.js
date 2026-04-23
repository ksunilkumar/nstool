document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('img-upload-area');
    const fileInput = document.getElementById('img-file-input');
    const targetFormatSelect = document.getElementById('img-target-format');
    const qualityInput = document.getElementById('img-quality');
    
    const previewCard = document.getElementById('img-preview-card');
    const placeholder = document.getElementById('img-placeholder');
    const resultContainer = document.getElementById('img-result-container');
    const previewElement = document.getElementById('img-preview-element');
    const sizeInfo = document.getElementById('img-size-info');
    const downloadBtn = document.getElementById('img-download-btn');

    let currentFile = null;
    let convertedBlobUrl = null;

    // Trigger file input
    if(uploadArea) {
        uploadArea.addEventListener('click', (e) => {
            if(e.target !== fileInput) fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    if(fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    if(targetFormatSelect) targetFormatSelect.addEventListener('change', () => processImage(currentFile));
    if(qualityInput) qualityInput.addEventListener('change', () => processImage(currentFile));

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (PNG, JPG, JPEG).');
            return;
        }
        currentFile = file;
        placeholder.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        processImage(file);
    }

    async function processImage(file) {
        if (!file) return;

        const targetFormat = targetFormatSelect.value;
        const quality = parseFloat(qualityInput.value);

        // Read image to draw on canvas
        const imgDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        const img = new Image();
        img.src = imgDataUrl;
        await new Promise((resolve) => img.onload = resolve);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // If converting to JPEG, add white background for transparency
        if (targetFormat === 'image/jpeg' || targetFormat === 'image/jpg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);

        // Convert canvas to target format
        const outputBlob = await new Promise((resolve) => {
            canvas.toBlob(resolve, targetFormat, quality);
        });

        if (convertedBlobUrl) URL.revokeObjectURL(convertedBlobUrl);
        convertedBlobUrl = URL.createObjectURL(outputBlob);

        // Display results
        previewElement.src = convertedBlobUrl;
        
        const originalSize = utils.formatBytes(file.size);
        const newSize = utils.formatBytes(outputBlob.size);
        const formatExt = targetFormat === 'image/jpeg' ? 'JPG' : 'PNG';
        
        sizeInfo.innerHTML = `Original: <strong>${originalSize}</strong> &nbsp;|&nbsp; New (${formatExt}): <strong>${newSize}</strong>`;

        // Configure download button
        downloadBtn.onclick = () => {
            const nameParts = file.name.split('.');
            nameParts.pop(); // remove old ext
            const baseName = nameParts.join('.');
            const newName = `${baseName}_converted.${formatExt.toLowerCase()}`;
            
            const a = document.createElement('a');
            a.href = convertedBlobUrl;
            a.download = newName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    }
});
