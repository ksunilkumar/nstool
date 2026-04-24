// barcode.js — Utility functions for generating barcodes and QR codes

window.barcodeUtils = {

    /**
     * Generate a barcode inside an SVG element using JsBarcode
     */
    generateBarcode: function(elementId, text, options = {}) {
        if (!text || !window.JsBarcode) return;
        try {
            JsBarcode('#' + elementId, text, {
                format:       options.format       || 'CODE128',
                displayValue: options.displayValue !== undefined ? options.displayValue : true,
                text:         options.text         || undefined,
                height:       options.height       || 40,
                width:        options.width        || 1.5,
                margin:       0,
                fontSize:     13,
                font:         'Inter'
            });
        } catch (e) {
            console.warn('Barcode generation failed:', e.message);
        }
    },

    /**
     * Generate a QR code inside a container div using qrcodejs library.
     * qrcodejs exposes: new QRCode(element, { text, width, height, ... })
     */
    generateQR: function(elementId, text, options = {}) {
        if (!text) return;

        const container = document.getElementById(elementId);
        if (!container) return;

        // Clear previous QR
        container.innerHTML = '';

        // Use qrcodejs (window.QRCode constructor-based API)
        if (window.QRCode) {
            try {
                // qrcodejs throws error on empty string, fallback to space
                const qrText = text || " ";
                new QRCode(container, {
                    text:            qrText,
                    width:           options.width  || 250,
                    height:          options.height || 250,
                    colorDark:       options.colorDark  || '#000000',
                    colorLight:      options.colorLight || '#ffffff',
                    correctLevel:    QRCode.CorrectLevel.H
                });

                // Add logo if provided
                if (options.logoDataUrl) {
                    setTimeout(() => {
                        const canvas = container.querySelector('canvas');
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            img.onload = () => {
                                const size = options.width || 250;
                                const logoSize = size * 0.25; // 25% of QR code
                                const x = (size - logoSize) / 2;
                                const y = (size - logoSize) / 2;
                                ctx.drawImage(img, x, y, logoSize, logoSize);
                            };
                            img.src = options.logoDataUrl;
                        }
                    }, 100); // Give time for qrcodejs to render the canvas
                }
            } catch (e) {
                console.warn('QR generation failed:', e.message);
            }
        }
    }
};
