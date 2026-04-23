document.addEventListener('DOMContentLoaded', () => {
    const itemsBody     = document.getElementById('gst-wysiwyg-items-body');
    const addRowBtn     = document.getElementById('gst-add-line-btn');
    const taxTypeSelect = document.getElementById('gst-tax-type');

    // Summary <span> elements — always visible, never disabled
    const taxableDisplay = document.getElementById('gst-taxable-display');
    const cgstDisplay    = document.getElementById('gst-cgst-display');
    const sgstDisplay    = document.getElementById('gst-sgst-display');
    const igstDisplay    = document.getElementById('gst-igst-display');
    const totalDisplay   = document.getElementById('gst-total-display');

    const cgstRow = document.getElementById('gst-cgst-row');
    const sgstRow = document.getElementById('gst-sgst-row');
    const igstRow = document.getElementById('gst-igst-row');

    // Date default
    const invDateInput = document.getElementById('gst-inv-date');
    if (invDateInput) invDateInput.value = new Date().toISOString().split('T')[0];

    // ---- Calculation Engine ----
    function calculateGST() {
        if (!itemsBody) return;
        let totalTaxable = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
        const isIgst = taxTypeSelect?.value === 'igst';

        if (cgstRow) cgstRow.style.display = isIgst ? 'none' : 'table-row';
        if (sgstRow) sgstRow.style.display = isIgst ? 'none' : 'table-row';
        if (igstRow) igstRow.style.display = isIgst ? 'table-row' : 'none';

        itemsBody.querySelectorAll('tr').forEach(row => {
            const qty        = parseFloat(row.querySelector('.item-qty')?.value)  || 0;
            const rate       = parseFloat(row.querySelector('.item-rate')?.value) || 0;
            const gstPercent = parseFloat(row.querySelector('.item-gst')?.value)  || 0;
            const taxable    = qty * rate;
            const taxAmt     = (taxable * gstPercent) / 100;
            const rowTotal   = taxable + taxAmt;
            const amtEl      = row.querySelector('.item-amt-display');
            if (amtEl) amtEl.textContent = rowTotal.toFixed(2);
            totalTaxable += taxable;
            if (isIgst) totalIgst += taxAmt;
            else { totalCgst += taxAmt / 2; totalSgst += taxAmt / 2; }
        });

        const grandTotal = totalTaxable + totalIgst + totalCgst + totalSgst;
        if (taxableDisplay) taxableDisplay.textContent = totalTaxable.toFixed(2);
        if (cgstDisplay)    cgstDisplay.textContent    = totalCgst.toFixed(2);
        if (sgstDisplay)    sgstDisplay.textContent    = totalSgst.toFixed(2);
        if (igstDisplay)    igstDisplay.textContent    = totalIgst.toFixed(2);
        if (totalDisplay)   totalDisplay.textContent   = grandTotal.toFixed(2);

        // Barcode
        const invNum = document.getElementById('gst-inv-num')?.value || 'INV-001';
        if (window.barcodeUtils && invNum) {
            try { window.barcodeUtils.generateBarcode('gst-barcode', invNum); } catch(e) {}
        }
    }

    // ---- Add Item Row ----
    function addGstRow() {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding:8px;"><input type="text" class="inline-input" style="width:100%;box-sizing:border-box;" placeholder="Item Description"></td>
            <td style="padding:8px;"><input type="text" class="inline-input" style="width:100%;box-sizing:border-box;text-align:center;" placeholder="HSN/SAC"></td>
            <td style="padding:8px;"><input type="number" class="inline-input item-qty" style="width:100%;box-sizing:border-box;text-align:center;" value="1" min="1"></td>
            <td style="padding:8px;"><input type="number" class="inline-input item-rate" style="width:100%;box-sizing:border-box;text-align:center;" value="0" min="0"></td>
            <td style="padding:8px;"><input type="number" class="inline-input item-gst" style="width:100%;box-sizing:border-box;text-align:center;" value="18" min="0"></td>
            <td style="padding:8px;text-align:right;font-weight:600;"><span class="item-amt-display">0.00</span></td>
            <td style="padding:8px;text-align:center;" class="no-print"><button class="btn text-btn remove-row-btn" style="color:#ef4444;padding:0;">🗑️</button></td>
        `;
        itemsBody.appendChild(tr);
        tr.querySelectorAll('input').forEach(i => i.addEventListener('input', calculateGST));
        tr.querySelector('.remove-row-btn').addEventListener('click', () => { tr.remove(); calculateGST(); });
        calculateGST();
    }

    if (addRowBtn) addRowBtn.addEventListener('click', addGstRow);
    if (itemsBody && itemsBody.children.length === 0) { addGstRow(); addGstRow(); }
    if (taxTypeSelect) taxTypeSelect.addEventListener('change', calculateGST);

    // ---- Preview Toggle ----
    const previewBtn = document.getElementById('gst-preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const container = document.getElementById('printable-gst-invoice');
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
    const generateBtn = document.getElementById('gst-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const element = document.getElementById('printable-gst-invoice');
            const invNum  = document.getElementById('gst-inv-num')?.value || 'Invoice';
            generateBtn.innerText = 'Generating PDF...';
            generateBtn.disabled = true;

            element.classList.add('preview-mode', 'pdf-exporting');
            const origWidth = element.style.width;
            element.style.width = '794px';

            const opt = {
                margin:      [10, 10, 10, 10],
                filename:    `${invNum}_GST_Invoice.pdf`,
                image:       { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                element.style.width = origWidth;
                element.classList.remove('preview-mode', 'pdf-exporting');
                generateBtn.innerText = 'Export Invoice as PDF';
                generateBtn.disabled = false;
            }).catch(err => {
                console.error('PDF error:', err);
                alert('Failed to generate PDF. Please try again.');
                element.style.width = origWidth;
                element.classList.remove('preview-mode', 'pdf-exporting');
                generateBtn.innerText = 'Export Invoice as PDF';
                generateBtn.disabled = false;
            });
        });
    }
});
