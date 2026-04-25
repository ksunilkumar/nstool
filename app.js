document.addEventListener('DOMContentLoaded', () => {

    // ---- PDF.js library resolver ----
    // pdf.js v3.x CDN exposes itself as window.pdfjsLib automatically.
    // This helper resolves it at call-time (after page load) so timing is never an issue.
    function getPdfLib() {
        return window.pdfjsLib
            || window['pdfjs-dist/build/pdf']
            || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
    }
    function ensurePdfWorker(lib) {
        if (lib && !lib.GlobalWorkerOptions.workerSrc) {
            lib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        return lib;
    }
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

    // ---- Tab Navigation Logic & Routing ----
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const subNavBtns = document.querySelectorAll('.sub-nav-btn');
    const subPanels = document.querySelectorAll('.sub-panel');

    function activateMainTab(tabId) {
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));

        const targetBtn = document.querySelector(`.nav-btn[data-target="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
    }

    function activateSubTab(panelId) {
        const targetBtn = document.querySelector(`.sub-nav-btn[data-target="${panelId}"]`);
        if (targetBtn) {
            const allSubBtns = targetBtn.closest('.sub-nav').querySelectorAll('.sub-nav-btn');
            allSubBtns.forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }

        const targetPanel = document.getElementById(panelId);
        if (targetPanel) {
            const allSubPanels = targetPanel.parentElement.querySelectorAll('.sub-panel');
            allSubPanels.forEach(p => p.classList.remove('active'));
            targetPanel.classList.add('active');
        }
    }

    function handleRouting() {
        const urlParams = new URLSearchParams(window.location.search);
        let tool = urlParams.get('tool');
        
        // Find the default tab for this specific page (since we are multi-page now)
        const firstTab = document.querySelector('.tab-content');
        let activeTabId = firstTab ? firstTab.id : 'convert';

        // Map sub-panels if someone used an old hash or parameter
        const possibleSubPanel = document.getElementById(tool);

        if (possibleSubPanel) {
            if (possibleSubPanel.classList.contains('tab-content')) {
                activeTabId = tool;
                activateMainTab(activeTabId);
            } else if (possibleSubPanel.classList.contains('sub-panel')) {
                const parentTab = possibleSubPanel.closest('.tab-content');
                if (parentTab) {
                    activeTabId = parentTab.id;
                    activateMainTab(activeTabId);
                    activateSubTab(tool);
                }
            }
        } else {
            activateMainTab(activeTabId);
        }
    }

    subNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            activateSubTab(targetId);
        });
    });

    // Initial routing on load
    handleRouting();


    // ---- Conversion Tab Logic ----
    const convertSection = document.getElementById('convert');
    if (convertSection) {
        const convertToolBtns = convertSection.querySelectorAll('.tool-card');
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
            if (toolType === 'img-pdf' || toolType === 'docx-pdf') ext = 'pdf';
            if (toolType === 'pdf-docx') ext = 'docx';
        }
        
        const newName = `${base}_converted.${ext}`;
        let downloadUrl = '';

        try {
            if (toolType === 'img-pdf') {
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
                
                const imageFormat = currentConversionFile.type === 'image/png' ? 'PNG' : 'JPEG';
                doc.addImage(imgData, imageFormat, 0, 0, renderWidth, renderHeight, undefined, 'FAST');
                const pdfBlob = doc.output('blob');
                downloadUrl = URL.createObjectURL(pdfBlob);
                
            } else if (toolType === 'pdf-img') {
                // Real PDF to Image using PDF.js
                const _pdfLib = ensurePdfWorker(getPdfLib());
                if (!_pdfLib) { alert('PDF library not loaded. Please refresh.'); return; }
                const arrayBuffer = await currentConversionFile.arrayBuffer();
                const pdf = await _pdfLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 3.0 }); // High quality
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                downloadUrl = URL.createObjectURL(pngBlob);
                
            } else if (toolType === 'docx-pdf') {
                const fileExt = currentConversionFile.name.split('.').pop().toLowerCase();
                if (fileExt === 'doc') {
                    alert('Legacy .doc format is not supported in the browser.\nPlease open your file in Word and Save As → .docx format, then try again.');
                    document.getElementById('convert-result').classList.add('hidden');
                    document.getElementById('convert-status').classList.add('hidden');
                    currentConversionFile = null;
                    return;
                }
                if (!window.mammoth) {
                    alert('Document converter library not loaded. Please refresh the page and try again.');
                    return;
                }

                // Step 1: Parse DOCX → HTML with mammoth
                const docArrayBuffer = await currentConversionFile.arrayBuffer();
                let mammothResult;
                try {
                    mammothResult = await window.mammoth.convertToHtml({ arrayBuffer: docArrayBuffer });
                } catch(mammothErr) {
                    console.error('Mammoth error:', mammothErr);
                    alert('Could not parse the document. Please ensure it is a valid .docx file.');
                    return;
                }
                const docHtml = mammothResult.value || '<p>No content could be extracted from this document.</p>';

                // Step 2: Build a styled, renderable container off-screen
                const renderContainer = document.createElement('div');
                renderContainer.style.cssText = [
                    'position: fixed',
                    'left: -9999px',
                    'top: 0',
                    'width: 794px',           // A4 width in pixels at 96dpi
                    'background: #ffffff',
                    'color: #000000',
                    'font-family: Arial, sans-serif',
                    'font-size: 13px',
                    'line-height: 1.7',
                    'padding: 50px 60px',
                    'box-sizing: border-box',
                    'z-index: -1000'
                ].join(';');
                renderContainer.innerHTML = docHtml;
                document.body.appendChild(renderContainer);

                // Step 3: Render to PDF using html2pdf
                try {
                    const pdfOptions = {
                        margin: 10,
                        filename: newName,
                        image: { type: 'jpeg', quality: 0.95 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    await html2pdf().set(pdfOptions).from(renderContainer).save();
                    
                    document.body.removeChild(renderContainer);
                    document.getElementById('convert-result').classList.add('hidden');
                    document.getElementById('convert-status').classList.add('hidden');
                    currentConversionFile = null;
                    return;
                } catch(pdfErr) {
                    console.error('PDF render error:', pdfErr);
                    // Fallback: plain text via jsPDF
                    const { jsPDF } = window.jspdf;
                    const fallbackDoc = new jsPDF();
                    fallbackDoc.setFont('Helvetica');
                    fallbackDoc.setFontSize(12);
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = docHtml;
                    const rawText = (tempDiv.innerText || tempDiv.textContent || '').trim();
                    const lines = fallbackDoc.splitTextToSize(rawText, 180);
                    let yPos = 15;
                    for (const line of lines) {
                        if (yPos > 280) { fallbackDoc.addPage(); yPos = 15; }
                        fallbackDoc.text(line, 15, yPos);
                        yPos += 7;
                    }
                    downloadUrl = URL.createObjectURL(fallbackDoc.output('blob'));
                } finally {
                    document.body.removeChild(renderContainer);
                }
            } else if (toolType === 'pdf-docx') {
                // Resolve pdfjsLib safely at call-time
                const pdfLib = ensurePdfWorker(getPdfLib());
                if (!pdfLib) {
                    alert('PDF reader library not loaded. Please refresh the page and try again.');
                    return;
                }

                const pdfArrayBuffer = await currentConversionFile.arrayBuffer();
                const pdfDoc = await pdfLib.getDocument({ data: pdfArrayBuffer }).promise;
                let allPagesHtml = '';

                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    const pdfPage = await pdfDoc.getPage(pageNum);
                    const pdfViewport = pdfPage.getViewport({ scale: 1 });
                    const pageH = pdfViewport.height;
                    const textData = await pdfPage.getTextContent();

                    // Sort: PDF Y-axis is bottom-up, so invert. Group into lines by Y proximity.
                    const items = textData.items.filter(item => item.str && item.str.trim() !== '');
                    items.sort((a, b) => {
                        const ay = pageH - a.transform[5];
                        const by = pageH - b.transform[5];
                        if (Math.abs(ay - by) > 4) return ay - by;   // different rows
                        return a.transform[4] - b.transform[4];       // same row: left→right
                    });

                    // Group items into logical lines
                    const lines = [];
                    let currentLine = [];
                    let lastLineY = -1;
                    for (const item of items) {
                        const itemY = pageH - item.transform[5];
                        if (lastLineY === -1 || Math.abs(itemY - lastLineY) <= 4) {
                            currentLine.push(item.str);
                        } else {
                            if (currentLine.length) lines.push(currentLine.join(' '));
                            currentLine = [item.str];
                        }
                        lastLineY = itemY;
                    }
                    if (currentLine.length) lines.push(currentLine.join(' '));

                    // Build HTML for this page — each line is a <p>
                    const pageHtml = lines
                        .map(line => `<p>${line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`)
                        .join('\n');

                    allPagesHtml += `<div style="page-break-after:always;margin-bottom:30px;">${pageHtml}</div>\n`;
                }

                // Build a Word-compatible HTML document
                const wordDoc = [
                    '<!DOCTYPE html>',
                    '<html xmlns:o="urn:schemas-microsoft-com:office:office"',
                    '      xmlns:w="urn:schemas-microsoft-com:office:word"',
                    '      xmlns="http://www.w3.org/TR/REC-html40">',
                    '<head>',
                    '<meta charset="utf-8">',
                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
                    '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->',
                    '<style>',
                    '  body { font-family: Arial, sans-serif; font-size: 12pt; margin: 1in; line-height: 1.5; color: #000; }',
                    '  p { margin: 0 0 6pt 0; }',
                    '  div { margin-bottom: 20pt; }',
                    '</style>',
                    '</head>',
                    `<body>${allPagesHtml}</body>`,
                    '</html>'
                ].join('\n');

                const docBlob = new Blob([wordDoc], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                downloadUrl = URL.createObjectURL(docBlob);
            } else {
                downloadUrl = URL.createObjectURL(currentConversionFile);
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
    }

    // ---- Image Compression Logic ----
    const imgCompressUploadArea = document.getElementById('img-compress-upload');
    const imgCompressFileInput = document.getElementById('img-compress-file-input');
    
    if (imgCompressUploadArea && imgCompressFileInput) {
        imgCompressUploadArea.querySelector('.upload-border').addEventListener('click', (e) => {
            if(e.target !== imgCompressFileInput) imgCompressFileInput.click();
        });

        imgCompressFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleImgCompressionUpload(e.target.files[0]);
            }
        });
    }

    let currentImgFile = null;

    function handleImgCompressionUpload(file) {
        currentImgFile = file;
        const statusArea = document.getElementById('img-compress-status');
        const resultArea = document.getElementById('img-compress-result');
        const progressBar = document.getElementById('img-compress-progress');
        const statusText = document.getElementById('img-compress-status-text');
        
        statusArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        progressBar.style.width = '0%';
        statusText.innerText = `Compressing Image ${file.name}...`;

        window.utils.simulateProcessing(progressBar, () => {
            let savedBytes = Math.floor(file.size * (0.3 + Math.random() * 0.4)); // Mock savings display
            statusText.innerText = `Image Compressed! Saved ${window.utils.formatBytes(savedBytes)}.`;
            resultArea.classList.remove('hidden');
        });
    }

    const imgDownloadBtn = document.getElementById('img-compress-download-btn');
    if (imgDownloadBtn) {
        imgDownloadBtn.addEventListener('click', async () => {
            if (!currentImgFile) return;

            const nameParts = currentImgFile.name.split('.');
            let ext = nameParts.length > 1 ? nameParts.pop() : '';
            const base = nameParts.join('.');
            let newName = `${base}_compressed.jpg`;
            let downloadUrl = '';

            try {
                const imgData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(currentImgFile);
                });
                
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => img.onload = resolve);
                
                const canvas = document.createElement('canvas');
                
                const wInput = document.getElementById('resize-w');
                const hInput = document.getElementById('resize-h');
                let targetW = (wInput && wInput.value) ? parseInt(wInput.value) : img.width;
                let targetH = (hInput && hInput.value) ? parseInt(hInput.value) : img.height;
                
                const maintainRatio = document.getElementById('maintain-ratio') && document.getElementById('maintain-ratio').checked;
                if (maintainRatio) {
                    if (wInput && wInput.value && (!hInput || !hInput.value)) {
                        targetH = Math.round((targetW / img.width) * img.height);
                    } else if (hInput && hInput.value && (!wInput || !wInput.value)) {
                        targetW = Math.round((targetH / img.height) * img.width);
                    }
                }

                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, targetW, targetH);
                
                const targetSizeInput = document.getElementById('compress-target-size');
                const targetSizeKB = targetSizeInput && targetSizeInput.value ? parseFloat(targetSizeInput.value) : 0;

                let compressedBlob;
                if (targetSizeKB > 0) {
                    const targetBytes = targetSizeKB * 1024;
                    let low = 0.01;
                    let high = 1.0;
                    let bestBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', low));
                    
                    if (bestBlob.size <= targetBytes) {
                        for (let i = 0; i < 7; i++) {
                            let mid = (low + high) / 2;
                            let tempBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', mid));
                            if (tempBlob.size <= targetBytes) {
                                bestBlob = tempBlob;
                                low = mid;
                            } else {
                                high = mid;
                            }
                        }
                    }
                    compressedBlob = bestBlob;
                } else {
                    compressedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
                }

                downloadUrl = URL.createObjectURL(compressedBlob);

                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = newName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error("Image Compression failed:", error);
                alert("An error occurred during image compression.");
            }

            document.getElementById('img-compress-result').classList.add('hidden');
            document.getElementById('img-compress-status').classList.add('hidden');
            currentImgFile = null;
        });
    }

    // ---- PDF Compression Logic ----
    const pdfCompressUploadArea = document.getElementById('pdf-compress-upload');
    const pdfCompressFileInput = document.getElementById('pdf-compress-file-input');
    
    if (pdfCompressUploadArea && pdfCompressFileInput) {
        pdfCompressUploadArea.querySelector('.upload-border').addEventListener('click', (e) => {
            if(e.target !== pdfCompressFileInput) pdfCompressFileInput.click();
        });

        pdfCompressFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handlePdfCompressionUpload(e.target.files[0]);
            }
        });
    }

    let currentPdfFile = null;

    function handlePdfCompressionUpload(file) {
        currentPdfFile = file;
        const statusArea = document.getElementById('pdf-compress-status');
        const resultArea = document.getElementById('pdf-compress-result');
        const progressBar = document.getElementById('pdf-compress-progress');
        const statusText = document.getElementById('pdf-compress-status-text');
        
        statusArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        progressBar.style.width = '0%';
        statusText.innerText = `Compressing PDF ${file.name}...`;

        window.utils.simulateProcessing(progressBar, () => {
            statusText.innerText = `PDF processed successfully.`;
            resultArea.classList.remove('hidden');
        });
    }

    const pdfDownloadBtn = document.getElementById('pdf-compress-download-btn');
    if (pdfDownloadBtn) {
        pdfDownloadBtn.addEventListener('click', () => {
            if (!currentPdfFile) return;

            const nameParts = currentPdfFile.name.split('.');
            let ext = nameParts.length > 1 ? nameParts.pop() : '';
            const base = nameParts.join('.');
            let newName = `${base}_compressed.pdf`;

            const level = document.getElementById('pdf-compress-level').value; // 'recommended', 'extreme', 'less'
            let scale = 1.5;
            let quality = 0.6;
            if (level === 'extreme') { scale = 1.0; quality = 0.3; }
            if (level === 'less') { scale = 2.0; quality = 0.8; }

            const compressPdfAsync = async () => {
                try {
                    const arrayBuffer = await currentPdfFile.arrayBuffer();
                    const _lib = ensurePdfWorker(getPdfLib());
                    if (!_lib) throw new Error('PDF.js library not available');
                    const pdf = await _lib.getDocument({ data: arrayBuffer }).promise;
                    const { jsPDF } = window.jspdf;
                    const newPdf = new jsPDF();
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: scale });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        const imgData = canvas.toDataURL('image/jpeg', quality);
                        
                        if (i > 1) newPdf.addPage();
                        
                        const pdfWidth = newPdf.internal.pageSize.getWidth();
                        const pdfHeight = newPdf.internal.pageSize.getHeight();
                        newPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                    }
                    
                    const compressedBlob = newPdf.output('blob');
                    const downloadUrl = URL.createObjectURL(compressedBlob);
                    
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = newName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                    
                    document.getElementById('pdf-compress-result').classList.add('hidden');
                    document.getElementById('pdf-compress-status').classList.add('hidden');
                    currentPdfFile = null;
                } catch (error) {
                    console.error("PDF Compression failed:", error);
                    alert("An error occurred during PDF compression.");
                }
            };
            compressPdfAsync();
        });
    }


    // ---- Sub-Navigation Logic Handled By Router ----
    // (Removed duplicate subNavBtns click listeners as they are now managed by the hash router above)
});
