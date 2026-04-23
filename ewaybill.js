/**
 * ewaybill.js
 * WYSIWYG E-Way Bill — Live GST calculation, Preview toggle, A4 PDF export
 */
document.addEventListener('DOMContentLoaded', () => {

    const itemsBody     = document.getElementById('ewb-items-body');
    const addRowBtn     = document.getElementById('ewb-add-line-btn');
    const taxTypeSelect = document.getElementById('ewb-tax-type');

    // Summary <span> elements
    const taxableDisplay = document.getElementById('ewb-taxable-display');
    const cgstDisplay    = document.getElementById('ewb-cgst-display');
    const sgstDisplay    = document.getElementById('ewb-sgst-display');
    const igstDisplay    = document.getElementById('ewb-igst-display');
    const totalDisplay   = document.getElementById('ewb-total-display');

    const cgstRow = document.getElementById('ewb-cgst-row');
    const sgstRow = document.getElementById('ewb-sgst-row');
    const igstRow = document.getElementById('ewb-igst-row');

    // Set today's date
    const dateInput = document.getElementById('ewb-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    // ---- Calculation Engine ----
    function calculateEwb() {
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

            const amtEl = row.querySelector('.item-amt-display');
            if (amtEl) amtEl.textContent = '₹' + rowTotal.toFixed(2);

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

        // Barcode + QR
        const ewbNum = document.getElementById('ewb-num')?.value || 'EWB-001';
        if (window.barcodeUtils && ewbNum) {
            try { window.barcodeUtils.generateBarcode('ewb-barcode', ewbNum); } catch(e) {}
            try { window.barcodeUtils.generateQR('ewb-qrcode', ewbNum); } catch(e) {}
        }
    }

    // ---- Add Item Row ----
    function addEwbRow() {
        if (!itemsBody) return;
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding:6px 8px;">
                <input type="text" class="inline-input" style="width:100%;box-sizing:border-box;" placeholder="Item description">
            </td>
            <td style="padding:6px 4px;">
                <input type="text" class="inline-input" style="width:100%;box-sizing:border-box;text-align:center;" placeholder="HSN">
            </td>
            <td style="padding:6px 4px;">
                <input type="number" class="inline-input item-qty" style="width:100%;box-sizing:border-box;text-align:center;" value="1" min="1">
            </td>
            <td style="padding:6px 4px;">
                <input type="number" class="inline-input item-rate" style="width:100%;box-sizing:border-box;text-align:right;" value="0" min="0" step="0.01">
            </td>
            <td style="padding:6px 4px;">
                <input type="number" class="inline-input item-gst" style="width:100%;box-sizing:border-box;text-align:center;" value="18" min="0">
            </td>
            <td class="amt-col" style="padding:6px 8px;text-align:right;font-weight:600;white-space:nowrap;">
                <span class="item-amt-display">₹0.00</span>
            </td>
            <td style="padding:6px 4px;text-align:center;" class="no-print">
                <button class="btn text-btn remove-row-btn" style="color:#ef4444;padding:0;font-size:1rem;">✕</button>
            </td>
        `;
        itemsBody.appendChild(tr);
        tr.querySelectorAll('input').forEach(i => i.addEventListener('input', calculateEwb));
        tr.querySelector('.remove-row-btn').addEventListener('click', () => { tr.remove(); calculateEwb(); });
        calculateEwb();
    }

    if (addRowBtn) addRowBtn.addEventListener('click', addEwbRow);
    if (itemsBody && itemsBody.children.length === 0) { addEwbRow(); addEwbRow(); }
    if (taxTypeSelect) taxTypeSelect.addEventListener('change', calculateEwb);

    // Bind all panel inputs for live barcode/QR update on any field change
    setTimeout(() => {
        document.querySelectorAll('#eway-bill-panel input, #eway-bill-panel select')
            .forEach(el => el.addEventListener('input', calculateEwb));
        calculateEwb();
    }, 300);

    // ---- Preview Toggle ----
    const previewBtn = document.getElementById('ewb-preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const c  = document.getElementById('printable-eway-bill');
            const on = c.classList.toggle('preview-mode');
            previewBtn.textContent = on ? 'Exit Preview' : 'Toggle Preview';
        });
    }

    // ---- PDF Export (A4-accurate) ----
    const generateBtn = document.getElementById('ewb-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', exportPDF);
    }

    function exportPDF() {
        const element = document.getElementById('printable-eway-bill');
        const ewbNum  = document.getElementById('ewb-num')?.value || 'EWayBill';
        const btn     = document.getElementById('ewb-generate-pdf');

        btn.textContent = 'Generating…';
        btn.disabled    = true;

        element.classList.add('pdf-exporting', 'preview-mode');

        const savedWidth    = element.style.width;
        const savedMaxWidth = element.style.maxWidth;
        const savedPadding  = element.style.padding;
        element.style.width    = '793px';
        element.style.maxWidth = '793px';
        element.style.padding  = '20px 30px';

        const opt = {
            margin:      0,
            filename:    `${ewbNum}_EWay_Bill.pdf`,
            image:       { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale:       2,
                useCORS:     true,
                logging:     false,
                scrollX:     0,
                scrollY:     0
            },
            jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save()
            .then(() => restore(element, btn, savedWidth, savedMaxWidth, savedPadding, 'Export E-Way Bill PDF'))
            .catch((err) => {
                console.error('PDF error:', err);
                restore(element, btn, savedWidth, savedMaxWidth, savedPadding, 'Export E-Way Bill PDF');
            });
    }

    function restore(el, btn, w, mw, p, label) {
        el.style.width    = w;
        el.style.maxWidth = mw;
        el.style.padding  = p;
        el.classList.remove('pdf-exporting', 'preview-mode');
        btn.textContent = label;
        btn.disabled    = false;
    }
});
