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
        const invNum = document.getElementById('invoice-num').value || 'Invoice';
        document.title = `${invNum}_Export`;
        
        window.print();
        
        // Restore title
        document.title = originalTitle;
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
    }
};
