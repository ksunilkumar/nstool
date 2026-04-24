/**
 * invoice.js
 * WYSIWYG GST Invoice — Live GST calculation, Preview toggle, A4 PDF export
 */
document.addEventListener('DOMContentLoaded', () => {

    const itemsBody     = document.getElementById('gst-wysiwyg-items-body');
    const addRowBtn     = document.getElementById('gst-add-line-btn');
    const taxTypeSelect = document.getElementById('gst-tax-type');

    // Tax summary <span> elements (always visible, no disabled inputs)
    const taxableDisplay = document.getElementById('gst-taxable-display');
    const cgstDisplay    = document.getElementById('gst-cgst-display');
    const sgstDisplay    = document.getElementById('gst-sgst-display');
    const igstDisplay    = document.getElementById('gst-igst-display');
    const totalDisplay   = document.getElementById('gst-total-display');

    const cgstRow = document.getElementById('gst-cgst-row');
    const sgstRow = document.getElementById('gst-sgst-row');
    const igstRow = document.getElementById('gst-igst-row');

    // Set today's date
    const invDateInput = document.getElementById('gst-inv-date');
    if (invDateInput) invDateInput.value = new Date().toISOString().split('T')[0];

    // ---- GST Calculation Engine ----
    function calculateGST() {
        if (!itemsBody) return;
        let totalTaxable = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
        const isIgst = taxTypeSelect?.value === 'igst';

        // Toggle CGST/SGST vs IGST rows
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

        // Refresh barcode
        const invNum = document.getElementById('gst-inv-num')?.value || 'INV-001';
        if (window.barcodeUtils) {
            try { window.barcodeUtils.generateBarcode('gst-barcode', invNum); } catch(e) {}
        }
    }

    // ---- Add Item Row ----
    function addGstRow() {
        if (!itemsBody) return;
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding:6px 8px;">
                <textarea class="inline-textarea auto-resize" style="width:100%;box-sizing:border-box;overflow:hidden;" rows="1" placeholder="Item description"></textarea>
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
            const c  = document.getElementById('printable-gst-invoice');
            const on = c.classList.toggle('preview-mode');
            previewBtn.textContent = on ? 'Exit Preview' : 'Toggle Preview';
        });
    }

    // ---- PDF Export (A4-accurate) ----
    const generateBtn = document.getElementById('gst-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', exportPDF);
    }

    function exportPDF() {
        const invNum  = document.getElementById('gst-inv-num')?.value || 'GST_Invoice';
        const btn     = document.getElementById('gst-generate-pdf');

        if (btn) {
            btn.textContent = 'Generating…';
            btn.disabled    = true;
        }

        if (window.utils && window.utils.exportCloneToPDF) {
            window.utils.exportCloneToPDF('printable-gst-invoice', `${invNum}_GST_Invoice.pdf`, () => {
                if (btn) {
                    btn.textContent = 'Export Invoice as PDF';
                    btn.disabled = false;
                }
            });
        }
    }
});
