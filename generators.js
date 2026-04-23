document.addEventListener('DOMContentLoaded', () => {
    // --- QR Code Generator ---
    const qrInput = document.getElementById('qr-input-text');
    const qrColorFg = document.getElementById('qr-color-fg');
    const qrColorBg = document.getElementById('qr-color-bg');
    const qrTitleInput = document.getElementById('qr-title');
    const qrLogoInput = document.getElementById('qr-logo-input');
    const qrCanvas = document.getElementById('qr-canvas');
    const qrRenderTitle = document.getElementById('qr-render-title');
    const qrDownloadBtn = document.getElementById('qr-download-png');

    let qrLogoDataUrl = null;

    function renderAdvancedQR() {
        if (!qrCanvas) return;
        
        const text = qrInput.value || 'https://example.com';
        const title = qrTitleInput.value;
        const colorDark = qrColorFg.value;
        const colorLight = qrColorBg.value;

        // Render Title
        if (title) {
            qrRenderTitle.innerText = title;
            qrRenderTitle.style.display = 'block';
        } else {
            qrRenderTitle.style.display = 'none';
        }

        // Use the utility to generate the QR on the canvas
        window.barcodeUtils.generateQR('qr-canvas', text, {
            width: 250,
            colorDark: colorDark,
            colorLight: colorLight,
            canvasElement: qrCanvas,
            logoDataUrl: qrLogoDataUrl
        });
    }

    // Bind QR Events
    if(qrInput) qrInput.addEventListener('input', renderAdvancedQR);
    if(qrColorFg) qrColorFg.addEventListener('input', renderAdvancedQR);
    if(qrColorBg) qrColorBg.addEventListener('input', renderAdvancedQR);
    if(qrTitleInput) qrTitleInput.addEventListener('input', renderAdvancedQR);

    if (qrLogoInput) {
        qrLogoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    qrLogoDataUrl = event.target.result;
                    renderAdvancedQR();
                };
                reader.readAsDataURL(file);
            } else {
                qrLogoDataUrl = null;
                renderAdvancedQR();
            }
        });
    }

    if (qrDownloadBtn) {
        qrDownloadBtn.addEventListener('click', () => {
            // We need to merge the canvas and the title into one image if a title exists
            const wrapper = document.getElementById('qr-render-wrapper');
            if(wrapper) {
                // simple hack: just download the canvas for now, as downloading the HTML wrapper requires html2canvas which isn't loaded.
                // we'll just download the QR canvas.
                const dataUrl = qrCanvas.toDataURL("image/png");
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = "custom_qr_code.png";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    // Initial QR Render
    setTimeout(renderAdvancedQR, 500);

    // --- Barcode Generator ---
    const bcFormat = document.getElementById('bc-format');
    const bcValue = document.getElementById('bc-value');
    const bcText = document.getElementById('bc-text');
    const bcWidth = document.getElementById('bc-width');
    const bcHeight = document.getElementById('bc-height');
    const bcSvg = document.getElementById('bc-svg');
    const bcDownloadBtn = document.getElementById('bc-download-png');

    function renderAdvancedBarcode() {
        if (!bcSvg) return;
        
        const format = bcFormat.value;
        const value = bcValue.value;
        const text = bcText.value;
        const width = parseFloat(bcWidth.value);
        const height = parseInt(bcHeight.value, 10);

        try {
            window.barcodeUtils.generateBarcode('bc-svg', value, {
                format: format,
                text: text,
                width: width,
                height: height
            });
        } catch (e) {
            // EAN/UPC fails if length is invalid. We just let it silently fail in the UI or show an error.
            console.log("Barcode format error:", e);
        }
    }

    // Bind Barcode Events
    if(bcFormat) bcFormat.addEventListener('change', renderAdvancedBarcode);
    if(bcValue) bcValue.addEventListener('input', renderAdvancedBarcode);
    if(bcText) bcText.addEventListener('input', renderAdvancedBarcode);
    if(bcWidth) bcWidth.addEventListener('input', renderAdvancedBarcode);
    if(bcHeight) bcHeight.addEventListener('input', renderAdvancedBarcode);

    if (bcDownloadBtn) {
        bcDownloadBtn.addEventListener('click', () => {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(bcSvg);
            
            // Add name spaces
            if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }
            
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = "barcode.svg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Initial Barcode Render
    setTimeout(renderAdvancedBarcode, 500);
});
