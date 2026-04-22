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

    document.getElementById('convert-download-btn').addEventListener('click', () => {
        if (!currentConversionFile) return;
        
        const nameParts = currentConversionFile.name.split('.');
        let ext = nameParts.length > 1 ? nameParts.pop() : '';
        const base = nameParts.join('.');
        
        const activeTool = document.querySelector('#convert .tool-card.active-tool');
        if (activeTool) {
            const toolType = activeTool.getAttribute('data-type');
            if (toolType === 'pdf-img') ext = 'png';
            if (toolType === 'img-pdf' || toolType === 'doc-pdf') ext = 'pdf';
            if (toolType === 'pdf-doc') ext = 'doc';
        }
        
        const newName = `${base}_converted.${ext}`;
        
        const url = URL.createObjectURL(currentConversionFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

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

    document.getElementById('compress-download-btn').addEventListener('click', () => {
        if (!currentCompressionFile) return;

        const nameParts = currentCompressionFile.name.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : '';
        const base = nameParts.join('.');
        const newName = `${base}_compressed.${ext}`;

        const url = URL.createObjectURL(currentCompressionFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Reset UI state for next upload
        document.getElementById('compress-result').classList.add('hidden');
        document.getElementById('compress-status').classList.add('hidden');
        currentCompressionFile = null;
    });


    // ---- Invoice Tab Logic ----
    const invoiceNumInput = document.getElementById('invoice-num');
    const invoiceToInput = document.getElementById('invoice-to');
    const invoiceAddInput = document.getElementById('invoice-address');
    const invoiceTypeSelect = document.getElementById('invoice-type');
    
    // Live update preview
    invoiceNumInput.addEventListener('input', (e) => document.getElementById('prev-inv-num').innerText = e.target.value || 'INV-000');
    invoiceToInput.addEventListener('input', (e) => document.getElementById('prev-inv-to').innerText = e.target.value || 'Client Name');
    invoiceAddInput.addEventListener('input', (e) => document.getElementById('prev-inv-add').innerText = e.target.value || 'Client Address');
    
    invoiceTypeSelect.addEventListener('change', (e) => {
        const titles = { 'gst': 'GST INVOICE', 'simple': 'BILL', 'eway': 'E-WAY BILL' };
        document.getElementById('prev-inv-title').innerText = titles[e.target.value];
    });

    // Handle adding items dynamically
    const addItemBtn = document.getElementById('add-item-btn');
    const itemList = document.getElementById('invoice-items');
    
    addItemBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="text" class="item-desc" placeholder="Description" style="flex: 2;">
            <input type="number" class="item-qty" placeholder="Qty" value="1">
            <input type="number" class="item-price" placeholder="Price" value="0">
        `;
        itemList.appendChild(row);
        bindRowEvents(row);
    });

    function bindRowEvents(row) {
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => input.addEventListener('input', updateInvoiceTotals));
    }

    function updateInvoiceTotals() {
        const rows = document.querySelectorAll('#invoice-items .item-row');
        const prevBody = document.getElementById('prev-items-body');
        prevBody.innerHTML = ''; // clear preview items
        
        let totalAmount = 0;

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc').value || 'Item';
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const rowTotal = qty * price;
            
            totalAmount += rowTotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${desc}</td>
                <td class="text-right">${qty}</td>
                <td class="text-right">$${price.toFixed(2)}</td>
                <td class="text-right">$${rowTotal.toFixed(2)}</td>
            `;
            prevBody.appendChild(tr);
        });

        document.getElementById('prev-total-amt').innerText = `$${totalAmount.toFixed(2)}`;
    }

    // Bind initial row
    document.querySelectorAll('#invoice-items .item-row').forEach(bindRowEvents);

    // Save Template to LocalStorage
    document.getElementById('save-template-btn').addEventListener('click', () => {
        const templateData = {
            num: invoiceNumInput.value,
            to: invoiceToInput.value,
            address: invoiceAddInput.value,
            type: invoiceTypeSelect.value
        };
        localStorage.setItem('invoiceTemplate', JSON.stringify(templateData));
        alert('Template saved successfully!');
    });

    // Load template on init
    const savedTemplate = localStorage.getItem('invoiceTemplate');
    if (savedTemplate) {
        const data = JSON.parse(savedTemplate);
        invoiceNumInput.value = data.num || '';
        invoiceToInput.value = data.to || '';
        invoiceAddInput.value = data.address || '';
        invoiceTypeSelect.value = data.type || 'gst';
        // Trigger generic input event to update preview
        invoiceNumInput.dispatchEvent(new Event('input'));
        invoiceToInput.dispatchEvent(new Event('input'));
        invoiceAddInput.dispatchEvent(new Event('input'));
        invoiceTypeSelect.dispatchEvent(new Event('change'));
    }

    // Generate PDF export
    document.getElementById('generate-pdf-btn').addEventListener('click', () => {
         window.utils.generatePDF();
    });
});
