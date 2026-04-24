/**
 * utils.js
 * Contains shared utility functions, mock conversion logic, and PDF generator.
 */

window.utils = {
    /**
     * Converts a number of bytes into a human readable string.
     */
    formatBytes: function(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    /**
     * Simulates a time-consuming process using a progress bar
     */
    simulateProcessing: function(progressBarElement, callback) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress > 100) progress = 100;
            
            progressBarElement.style.width = `${progress}%`;
            
            if (progress === 100) {
                clearInterval(interval);
                setTimeout(callback, 300); // Wait a tiny bit for the animation to finish
            }
        }, 300);
    },

    /**
     * Generates a PDF from the printable area
     * Relies on standard window.print() + CSS media print queries
     */
    generatePDF: function() {
        // Change document title temporarily so the default saved PDF name is nice
        const originalTitle = document.title;
        const invNum = document.getElementById('invoice-num')?.value || 'Invoice';
        document.title = `${invNum}_Export`;
        
        window.print();
        
        // Restore title
        document.title = originalTitle;
    },

    /**
     * Prepares UI for export by disabling inputs/visual aids
     */
    prepareForExport: function() {
        document.body.classList.add('exporting');
    },

    /**
     * Cleans up UI after export
     */
    cleanExport: function() {
        document.body.classList.remove('exporting');
    },

    /**
     * Triggers a dummy file download programmaticly
     */
    triggerDownload: function(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * PDF Export Helper for WYSIWYG
     * Temporarily flattens inputs and SVGs in-place to prevent blank pages or clipping,
     * then restores them after export.
     */
    exportCloneToPDF: function(elementId, filename, callback) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.classList.add('pdf-exporting', 'preview-mode');

        // Track replacements to restore them later
        const replacements = [];

        // 1. Flatten inputs, textareas, selects
        const inputs = element.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const div = document.createElement('div');
            const computedStyle = window.getComputedStyle(input);
            div.style.cssText = computedStyle.cssText;
            div.style.border = 'none';
            div.style.background = 'transparent';
            div.style.resize = 'none';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.style.overflow = 'hidden';
            div.style.display = 'block';
            div.classList.add('avoid-break');

            let val = input.value;
            if (input.tagName.toLowerCase() === 'select') {
                val = input.options[input.selectedIndex]?.text || '';
            }
            div.textContent = val;
            
            input.parentNode.replaceChild(div, input);
            replacements.push({ parent: div.parentNode, original: input, temp: div });
        });

        // 2. SVG to Image for Barcodes
        const svgs = element.querySelectorAll('svg');
        svgs.forEach(svg => {
            try {
                const svgData = new XMLSerializer().serializeToString(svg);
                const img = document.createElement('img');
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                img.style.width = svg.style.width || svg.getAttribute('width') || '100%';
                img.style.height = svg.style.height || svg.getAttribute('height') || 'auto';
                img.classList.add('avoid-break');
                
                svg.parentNode.replaceChild(img, svg);
                replacements.push({ parent: img.parentNode, original: svg, temp: img });
            } catch(e) {}
        });

        // 3. Fix width for A4 and add internal padding for PDF margins
        const savedWidth = element.style.width;
        const savedMaxWidth = element.style.maxWidth;
        const savedPadding = element.style.padding;
        element.style.width = '793px';
        element.style.maxWidth = '793px';
        element.style.padding = '30px 40px'; // Acts as PDF margin

        const opt = {
            margin:      0,
            filename:    filename,
            image:       { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale:       2,
                useCORS:     true,
                logging:     false,
                scrollX:     0,
                scrollY:     0
            },
            jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:   { mode: ['css', 'legacy'], avoid: ['tr', '.avoid-break'] }
        };

        const restoreOriginals = () => {
            // Restore all elements in reverse order
            for (let i = replacements.length - 1; i >= 0; i--) {
                const rep = replacements[i];
                if (rep.parent && rep.temp.parentNode === rep.parent) {
                    rep.parent.replaceChild(rep.original, rep.temp);
                }
            }
            element.style.width = savedWidth;
            element.style.maxWidth = savedMaxWidth;
            element.style.padding = savedPadding;
            element.classList.remove('pdf-exporting', 'preview-mode');
            if(callback) callback();
        };

        html2pdf().set(opt).from(element).save()
            .then(restoreOriginals)
            .catch((err) => {
                console.error('PDF error:', err);
                restoreOriginals();
            });
    }
};

// Global auto-resize logic for textareas
document.addEventListener('input', function(e) {
    if (e.target.tagName.toLowerCase() === 'textarea' && e.target.classList.contains('auto-resize')) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    }
});
