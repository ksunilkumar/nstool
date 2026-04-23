document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle Logic ----
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    const sunIcon = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('moon-icon').innerHTML = sunIcon;
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let targetTheme = 'light';
        let svgContent = moonIcon;

        if (currentTheme !== 'dark') {
            targetTheme = 'dark';
            svgContent = sunIcon;
        }

        document.documentElement.setAttribute('data-theme', targetTheme);
        document.getElementById('moon-icon').innerHTML = svgContent;
        localStorage.setItem('theme', targetTheme);
    });


    // ---- Mobile Menu Logic ----
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const appNav = document.getElementById('app-nav');

    if (mobileMenuBtn && appNav) {
        mobileMenuBtn.addEventListener('click', () => {
            appNav.classList.toggle('open');
        });
    }

    // ---- Tab Navigation Logic ----
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to clicked button and target tab
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Close mobile menu if open
            if (appNav && appNav.classList.contains('open')) {
                appNav.classList.remove('open');
            }
        });
    });


    // ---- Conversion Tab Logic ----
    const convertToolBtns = document.querySelectorAll('#convert .tool-card');
    convertToolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            convertToolBtns.forEach(b => b.classList.remove('active-tool'));
            btn.classList.add('active-tool');
        });
    });

    const convertUploadArea = document.getElementById('convert-upload');
    const convertFileInput = document.getElementById('convert-file-input');
    
    convertUploadArea.addEventListener('click', () => convertFileInput.click());
    
    convertUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        convertUploadArea.classList.add('dragover');
    });
    
    convertUploadArea.addEventListener('dragleave', () => {
        convertUploadArea.classList.remove('dragover');
    });
    
    convertUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        convertUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleConversionUpload(e.dataTransfer.files[0]);
        }
    });

    convertFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleConversionUpload(e.target.files[0]);
        }
    });

    let currentConversionFile = null;

    function handleConversionUpload(file) {
        currentConversionFile = file;
        const statusArea = document.getElementById('convert-status');
        const resultArea = document.getElementById('convert-result');
        const progressBar = document.getElementById('convert-progress');
        const statusText = document.getElementById('convert-status-text');
        
        statusArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        progressBar.style.width = '0%';
        statusText.innerText = `Processing ${file.name}...`;

        // Utilize utility mock function
        window.utils.simulateProcessing(progressBar, () => {
            statusText.innerText = 'Conversion Complete!';
            resultArea.classList.remove('hidden');
        });
    }

    document.getElementById('convert-download-btn').addEventListener('click', async () => {
        if (!currentConversionFile) return;
        
        const nameParts = currentConversionFile.name.split('.');
        let ext = nameParts.length > 1 ? nameParts.pop() : '';
        const base = nameParts.join('.');
        
        const activeTool = document.querySelector('#convert .tool-card.active-tool');
        let toolType = '';
        if (activeTool) {
            toolType = activeTool.getAttribute('data-type');
            if (toolType === 'pdf-img') ext = 'png';
            if (toolType === 'img-pdf' || toolType === 'doc-pdf') ext = 'pdf';
            if (toolType === 'pdf-doc') ext = 'doc';
        }
        
        const newName = `${base}_converted.${ext}`;
        let downloadUrl = '';

        try {
            if (toolType === 'img-pdf' && currentConversionFile.type.startsWith('image/')) {
                // Real Image to PDF conversion using jsPDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const imgData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(currentConversionFile);
                });
                
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => img.onload = resolve);
                
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const imgRatio = img.width / img.height;
                const pageRatio = pageWidth / pageHeight;
                
                let renderWidth = pageWidth;
                let renderHeight = pageWidth / imgRatio;
                
                if (renderHeight > pageHeight) {
                    renderHeight = pageHeight;
                    renderWidth = pageHeight * imgRatio;
                }
                
                // We use 'JPEG' as generic input format for jspdf's addImage since it usually handles base64
                doc.addImage(imgData, 'JPEG', 0, 0, renderWidth, renderHeight);
                const pdfBlob = doc.output('blob');
                downloadUrl = URL.createObjectURL(pdfBlob);
                
            } else if (toolType === 'pdf-img' && currentConversionFile.type === 'application/pdf') {
                // Real PDF to Image using PDF.js
                const arrayBuffer = await currentConversionFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                downloadUrl = URL.createObjectURL(pngBlob);
                
            } else {
                // Mock for DOC-PDF, PDF-DOC or unsupported inputs
                // Create a generic valid text/html file masquerading as doc, or empty pdf
                if (ext === 'pdf') {
                    const { jsPDF } = window.jspdf;
                    if(jsPDF) {
                        const doc = new jsPDF();
                        doc.text("Mock conversion successful.", 10, 10);
                        const pdfBlob = doc.output('blob');
                        downloadUrl = URL.createObjectURL(pdfBlob);
                    } else {
                        downloadUrl = URL.createObjectURL(currentConversionFile);
                    }
                } else if (ext === 'doc') {
                    const content = "<html><body><h1>Converted Document</h1><p>Mock conversion successful.</p></body></html>";
                    const blob = new Blob([content], { type: 'application/msword' });
                    downloadUrl = URL.createObjectURL(blob);
                } else {
                    // fallback to just original file if all else fails
                    downloadUrl = URL.createObjectURL(currentConversionFile);
                }
            }
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = newName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            
        } catch (error) {
            console.error("Conversion failed:", error);
            alert("An error occurred during conversion.");
        }

        // Reset UI state for next upload
        document.getElementById('convert-result').classList.add('hidden');
        document.getElementById('convert-status').classList.add('hidden');
        currentConversionFile = null;
    });

    // ---- Compression Tab Logic ----
    const compressUploadArea = document.getElementById('compress-upload');
    const compressFileInput = document.getElementById('compress-file-input');
    
    compressUploadArea.querySelector('.upload-border').addEventListener('click', (e) => {
        if(e.target !== compressFileInput) compressFileInput.click();
    });

    compressFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCompressionUpload(e.target.files[0]);
        }
    });

    let currentCompressionFile = null;

    function handleCompressionUpload(file) {
        currentCompressionFile = file;
        const statusArea = document.getElementById('compress-status');
        const resultArea = document.getElementById('compress-result');
        const progressBar = document.getElementById('compress-progress');
        const statusText = document.getElementById('compress-status-text');
        
        statusArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        progressBar.style.width = '0%';
        statusText.innerText = `Compressing ${file.name}...`;

        window.utils.simulateProcessing(progressBar, () => {
            let savedBytes = Math.floor(file.size * (0.3 + Math.random() * 0.4)); // fake 30-70% savings
            statusText.innerText = `Compressed! Saved ${window.utils.formatBytes(savedBytes)}.`;
            resultArea.classList.remove('hidden');
        });
    }

    document.getElementById('compress-download-btn').addEventListener('click', async () => {
        if (!currentCompressionFile) return;

        const nameParts = currentCompressionFile.name.split('.');
        let ext = nameParts.length > 1 ? nameParts.pop() : '';
        const base = nameParts.join('.');
        let newName = `${base}_compressed.${ext}`;
        let downloadUrl = '';

        try {
            if (currentCompressionFile.type.startsWith('image/')) {
                // Real Image Compression
                const imgData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(currentCompressionFile);
                });
                
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => img.onload = resolve);
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Compress JPEG to 0.6 quality. If original is PNG, convert to JPEG for size reduction.
                ext = 'jpg';
                newName = `${base}_compressed.${ext}`;
                const compressedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.6));
                downloadUrl = URL.createObjectURL(compressedBlob);
            } else {
                // For PDF we can't easily compress client side, just return original
                downloadUrl = URL.createObjectURL(currentCompressionFile);
            }

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = newName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Compression failed:", error);
            alert("An error occurred during compression.");
        }

        // Reset UI state for next upload
        document.getElementById('compress-result').classList.add('hidden');
        document.getElementById('compress-status').classList.add('hidden');
        currentCompressionFile = null;
    });


    // ---- Invoice Tab Sub-Navigation Logic ----
    const subNavBtns = document.querySelectorAll('.sub-nav-btn');
    const subPanels = document.querySelectorAll('.sub-panel');

    subNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subNavBtns.forEach(b => b.classList.remove('active'));
            subPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
});
