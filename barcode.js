// barcode.js
// Utility functions for generating barcodes and QR codes

window.barcodeUtils = {
    /**
     * Generate a barcode inside an SVG element
     * @param {string} elementId - ID of the <svg> element
     * @param {string} text - Text to encode
     */
    generateBarcode: function(elementId, text) {
        if (!text || !window.JsBarcode) return;
        try {
            JsBarcode("#" + elementId, text, {
                format: "CODE128",
                displayValue: true,
                height: 40,
                width: 1.5,
                margin: 0,
                fontSize: 12
            });
        } catch (e) {
            console.error("Barcode generation failed", e);
        }
    },
    
    /**
     * Generate a QR code inside a container div/span
     * @param {string} elementId - ID of the container element
     * @param {string} text - Text to encode
     */
    generateQR: function(elementId, text) {
        if (!text || !window.QRCode) return;
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = ""; // clear previous
        
        try {
            QRCode.toCanvas(text, { width: 80, margin: 0, color: { dark: '#000000', light: '#ffffff' } }, function (err, canvas) {
                if (err) throw err;
                container.appendChild(canvas);
            });
        } catch (e) {
            console.error("QR generation failed", e);
        }
    }
};
