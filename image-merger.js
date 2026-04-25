document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('img-merge-upload');
    const fileInput = document.getElementById('img-merge-input');
    const directionSelect = document.getElementById('img-merge-direction');
    const previewContainer = document.getElementById('img-merge-preview-container');
    const canvas = document.getElementById('img-merge-canvas');
    const downloadBtn = document.getElementById('img-merge-btn');

    let imagesData = [];
    let mergedBlobUrl = null;

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
                handleFiles(e.dataTransfer.files);
            }
        });
    }

    if(fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });
    }

    if(directionSelect) {
        directionSelect.addEventListener('change', () => {
            if (imagesData.length > 0) {
                renderMergedImage();
            }
        });
    }

    async function handleFiles(files) {
        // Reset state when new files are selected
        imagesData = [];
        
        for (let file of Array.from(files)) {
            if (file.type.startsWith('image/')) {
                const imgDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });

                const img = new Image();
                img.src = imgDataUrl;
                await new Promise((resolve) => img.onload = resolve);
                
                imagesData.push(img);
            }
        }

        if (imagesData.length > 0) {
            if(previewContainer) previewContainer.classList.remove('hidden');
            const actions = document.getElementById('img-merge-actions');
            if(actions) actions.classList.remove('hidden');
            renderMergedImage();
        }
    }

    function renderMergedImage() {
        if (!imagesData.length || !canvas) return;

        const direction = directionSelect.value;
        const ctx = canvas.getContext('2d');
        
        let totalWidth = 0;
        let totalHeight = 0;

        if (direction === 'horizontal') {
            totalHeight = Math.max(...imagesData.map(img => img.height));
            totalWidth = imagesData.reduce((sum, img) => sum + img.width, 0);
        } else {
            totalWidth = Math.max(...imagesData.map(img => img.width));
            totalHeight = imagesData.reduce((sum, img) => sum + img.height, 0);
        }

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        // Fill background with white just in case of transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        let currentX = 0;
        let currentY = 0;

        imagesData.forEach(img => {
            ctx.drawImage(img, currentX, currentY);
            if (direction === 'horizontal') {
                currentX += img.width;
            } else {
                currentY += img.height;
            }
        });

        // Generate download Blob URL
        canvas.toBlob((blob) => {
            if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
            mergedBlobUrl = URL.createObjectURL(blob);
            
            // Re-bind download button
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = mergedBlobUrl;
                a.download = `Merged_Images_${new Date().getTime()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        }, 'image/png');
    }
});
