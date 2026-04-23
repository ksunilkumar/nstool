// barcode.js
// Utility functions for generating barcodes and QR codes

window.barcodeUtils = {
    /**
     * Generate a barcode inside an SVG element
     */
    generateBarcode: function(elementId, text, options = {}) {
        if (!text || !window.JsBarcode) return;
        try {
            const format = options.format || "CODE128";
            const width = options.width || 1.5;
            const height = options.height || 40;
            const displayValue = options.displayValue !== undefined ? options.displayValue : true;
            const customText = options.text || undefined;

            JsBarcode("#" + elementId, text, {
                format: format,
                displayValue: displayValue,
                text: customText,
                height: height,
                width: width,
                margin: 0,
                fontSize: 14,
                font: "Inter"
            });
        } catch (e) {
            console.error("Barcode generation failed", e);
        }
    },
    
    /**
     * Generate a QR code inside a container div/span, or draw it on a specific canvas
     */
    generateQR: function(elementId, text, options = {}) {
        if (!text || !window.QRCode) return;
        
        const width = options.width || 80;
        const colorDark = options.colorDark || '#000000';
        const colorLight = options.colorLight || '#ffffff';
        const canvasElement = options.canvasElement || null;
        
        try {
            if (canvasElement) {
                // Draw directly to the provided canvas
                QRCode.toCanvas(canvasElement, text, { 
                    width: width, 
                    margin: 1, 
                    color: { dark: colorDark, light: colorLight } 
                }, function (err) {
                    if (err) throw err;
                    if (options.logoDataUrl) {
                        window.barcodeUtils._addLogoToCanvas(canvasElement, options.logoDataUrl);
                    }
                });
            } else {
                // Create a new canvas inside the container (used by invoices)
                const container = document.getElementById(elementId);
                if (!container) return;
                container.innerHTML = ""; 
                
                QRCode.toCanvas(text, { width: width, margin: 0, color: { dark: '#000000', light: '#ffffff' } }, function (err, canvas) {
                    if (err) throw err;
                    container.appendChild(canvas);
                });
            }
        } catch (e) {
            console.error("QR generation failed", e);
        }
    },

    /**
     * Helper to draw a logo in the center of a QR Code canvas
     */
    _addLogoToCanvas: function(canvas, logoDataUrl) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = logoDataUrl;
        img.onload = () => {
            // Draw logo at 20% of the canvas size
            const logoSize = canvas.width * 0.2;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            
            // Add a small white background behind the logo for readability
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4);
            
            ctx.drawImage(img, x, y, logoSize, logoSize);
        };
    }
};
