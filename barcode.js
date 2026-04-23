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
                new QRCode(container, {
                    text:            text,
                    width:           options.width  || 80,
                    height:          options.height || 80,
                    colorDark:       options.colorDark  || '#000000',
                    colorLight:      options.colorLight || '#ffffff',
                    correctLevel:    QRCode.CorrectLevel.M
                });
            } catch (e) {
                console.warn('QR generation failed:', e.message);
            }
        }
    }
};
