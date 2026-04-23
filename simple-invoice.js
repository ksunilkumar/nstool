document.addEventListener('DOMContentLoaded', () => {
    // ---- Logo Upload ----
    const logoUploadBox = document.getElementById('logo-upload-box');
    const logoInput     = document.getElementById('sim-logo-input');
    const logoPreview   = document.getElementById('sim-logo-preview');

    if (logoUploadBox && logoInput) {
        logoUploadBox.addEventListener('click', () => logoInput.click());
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                logoPreview.src = ev.target.result;
                logoPreview.style.display = 'block';
                const span = logoUploadBox.querySelector('span');
                if (span) span.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // ---- Meta Row Adding ----
    const addMetaBtn = document.getElementById('sim-add-meta-btn');
    const metaBody   = document.getElementById('sim-meta-body');
    if (addMetaBtn && metaBody) {
        addMetaBtn.addEventListener('click', () => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:right;font-weight:600;width:50%;padding:5px;"><input type="text" class="inline-input" style="text-align:right;font-weight:600;width:100%;" value="Custom Field"></td>
                <td style="padding:5px;">
                    <div style="display:flex;align-items:center;width:100%;">
                        <input type="text" class="inline-input" style="text-align:right;flex:1;" placeholder="Value">
                        <button class="btn text-btn remove-meta-btn no-print" style="color:#ef4444;padding:0 0 0 5px;margin-left:auto;">🗑️</button>
                    </div>
                </td>
            `;
            metaBody.appendChild(tr);
            tr.querySelector('.remove-meta-btn').addEventListener('click', () => tr.remove());
        });
    }

    // ---- Items Table ----
    const itemsBody    = document.getElementById('sim-wysiwyg-items-body');
    const addLineBtn   = document.getElementById('sim-add-line-btn');
    const totalDisplay = document.getElementById('sim-total-display');
    const balanceDisplay = document.getElementById('sim-balance-display');
    const paidToggle   = document.getElementById('sim-paid-toggle');
    const paidInput    = document.getElementById('sim-paid-input');

    function calculateTotals() {
        let total = 0;
        document.querySelectorAll('#sim-wysiwyg-items-body .item-row').forEach(row => {
            const qty  = parseFloat(row.querySelector('.item-qty')?.value)  || 0;
            const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
            const amt  = qty * rate;
            const amtEl = row.querySelector('.item-amt-display');
            if (amtEl) amtEl.value = amt.toFixed(2);
            total += amt;
        });
        const totalSpan = document.getElementById('sim-total-display');
        if (totalSpan) totalSpan.textContent = total.toFixed(2);
        const paid = (paidToggle?.checked) ? (parseFloat(paidInput?.value) || 0) : 0;
        const balSpan = document.getElementById('sim-balance-display');
        if (balSpan) balSpan.textContent = (total - paid).toFixed(2);
    }

    function addRow() {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding:8px;"><input type="text" class="inline-input" style="width:100%;box-sizing:border-box;" placeholder="Description"></td>
            <td style="padding:8px;"><input type="number" class="inline-input item-qty"  style="width:100%;box-sizing:border-box;text-align:center;" value="1" min="1"></td>
            <td style="padding:8px;"><input type="number" class="inline-input item-rate" style="width:100%;box-sizing:border-box;text-align:center;" value="0" min="0"></td>
            <td style="padding:8px;"><input type="text"   class="inline-input item-amt-display" style="width:100%;box-sizing:border-box;text-align:right;font-weight:600;" value="0.00" readonly></td>
            <td style="padding:8px;text-align:center;" class="no-print"><button class="btn text-btn remove-row-btn" style="color:#ef4444;padding:0;">🗑️</button></td>
        `;
        itemsBody.appendChild(tr);
        tr.querySelector('.item-qty').addEventListener('input',  calculateTotals);
        tr.querySelector('.item-rate').addEventListener('input', calculateTotals);
        tr.querySelector('.remove-row-btn').addEventListener('click', () => { tr.remove(); calculateTotals(); });
        calculateTotals();
    }

    if (addLineBtn) addLineBtn.addEventListener('click', addRow);
    if (itemsBody && itemsBody.children.length === 0) { addRow(); addRow(); }

    if (paidToggle && paidInput) {
        paidToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                paidInput.style.display = 'block';
                paidInput.disabled = false;
            } else {
                paidInput.style.display = 'none';
                paidInput.disabled = true;
                paidInput.value = '0';
            }
            calculateTotals();
        });
        paidInput.addEventListener('input', calculateTotals);
    }

    // ---- Date Default ----
    const dateInput = document.getElementById('sim-current-date-input');
    if (dateInput) dateInput.value = new Date().toLocaleDateString('en-IN');

    // ---- Preview Mode Toggle ----
    const previewBtn = document.getElementById('sim-preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const container = document.getElementById('printable-simple-invoice');
            container.classList.toggle('preview-mode');
            if (container.classList.contains('preview-mode')) {
                previewBtn.innerText = 'Exit Preview';
                previewBtn.classList.replace('secondary', 'primary');
            } else {
                previewBtn.innerText = 'Toggle Preview';
                previewBtn.classList.replace('primary', 'secondary');
            }
        });
    }

    // ---- PDF Export ----
    const generateBtn = document.getElementById('sim-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const element = document.getElementById('printable-simple-invoice');
            generateBtn.innerText = 'Generating PDF...';
            generateBtn.disabled = true;

            // Apply clean state
            element.classList.add('preview-mode', 'pdf-exporting');

            // Save original styles
            const origWidth = element.style.width;
            const origMaxWidth = element.style.maxWidth;
            element.style.width = '794px';
            element.style.maxWidth = '794px';

            const opt = {
                margin:      [10, 10, 10, 10],
                filename:    'Simple_Invoice.pdf',
                image:       { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                element.style.width = origWidth;
                element.style.maxWidth = origMaxWidth;
                element.classList.remove('preview-mode', 'pdf-exporting');
                generateBtn.innerText = 'Export Invoice as PDF';
                generateBtn.disabled = false;
            }).catch(err => {
                console.error('PDF error:', err);
                alert('Failed to generate PDF. Please try again.');
                element.style.width = origWidth;
                element.style.maxWidth = origMaxWidth;
                element.classList.remove('preview-mode', 'pdf-exporting');
                generateBtn.innerText = 'Export Invoice as PDF';
                generateBtn.disabled = false;
            });
        });
    }
});
