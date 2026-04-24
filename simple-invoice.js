/**
 * simple-invoice.js
 * WYSIWYG Simple Invoice — Live calculation, Preview toggle, A4 PDF export
 */
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
                logoUploadBox.querySelector('span').style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // ---- Add Custom Meta Rows ----
    const addMetaBtn = document.getElementById('sim-add-meta-btn');
    const metaBody   = document.getElementById('sim-meta-body');
    if (addMetaBtn && metaBody) {
        addMetaBtn.addEventListener('click', () => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:right;font-weight:600;width:50%;padding:5px;">
                    <input type="text" class="inline-input" style="text-align:right;font-weight:600;width:100%;" value="Custom Field">
                </td>
                <td style="padding:5px;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <input type="text" class="inline-input" style="flex:1;" placeholder="Value">
                        <button class="btn text-btn remove-meta-btn no-print" style="color:#ef4444;padding:0;min-width:24px;">✕</button>
                    </div>
                </td>
            `;
            metaBody.appendChild(tr);
            tr.querySelector('.remove-meta-btn').addEventListener('click', () => tr.remove());
        });
    }

    // ---- Item Table ----
    const itemsBody  = document.getElementById('sim-wysiwyg-items-body');
    const addLineBtn = document.getElementById('sim-add-line-btn');
    const paidToggle = document.getElementById('sim-paid-toggle');
    const paidInput  = document.getElementById('sim-paid-input');

    function calculateTotals() {
        let total = 0;
        itemsBody?.querySelectorAll('.item-row').forEach(row => {
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
        if (!itemsBody) return;
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.style.cssText = 'border-bottom:1px solid #e2e8f0;';
        tr.innerHTML = `
            <td style="padding:6px 8px;">
                <input type="text" class="inline-input" style="width:100%;box-sizing:border-box;" placeholder="Item description">
            </td>
            <td style="padding:6px 8px;">
                <input type="number" class="inline-input item-qty" style="width:100%;box-sizing:border-box;text-align:center;" value="1" min="1">
            </td>
            <td style="padding:6px 8px;">
                <input type="number" class="inline-input item-rate" style="width:100%;box-sizing:border-box;text-align:right;" value="0.00" min="0" step="0.01">
            </td>
            <td class="amt-col" style="padding:6px 8px;white-space:nowrap;">
                <input type="text" class="inline-input item-amt-display" style="width:100%;box-sizing:border-box;text-align:right;font-weight:600;background:transparent;white-space:nowrap;" value="0.00" readonly tabindex="-1">
            </td>
            <td style="padding:6px 4px;text-align:center;" class="no-print">
                <button class="btn text-btn remove-row-btn" style="color:#ef4444;padding:0;font-size:1rem;">✕</button>
            </td>
        `;
        itemsBody.appendChild(tr);
        tr.querySelector('.item-qty').addEventListener('input', calculateTotals);
        tr.querySelector('.item-rate').addEventListener('input', calculateTotals);
        tr.querySelector('.remove-row-btn').addEventListener('click', () => { tr.remove(); calculateTotals(); });
        calculateTotals();
    }

    if (addLineBtn) addLineBtn.addEventListener('click', addRow);
    if (itemsBody && itemsBody.children.length === 0) { addRow(); addRow(); }

    // Paid Amount toggle
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

    // ---- Preview Toggle ----
    const previewBtn = document.getElementById('sim-preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const c = document.getElementById('printable-simple-invoice');
            const on = c.classList.toggle('preview-mode');
            previewBtn.textContent = on ? 'Exit Preview' : 'Toggle Preview';
        });
    }

    // ---- PDF Export (A4-accurate) ----
    const generateBtn = document.getElementById('sim-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', exportPDF);
    }

    function exportPDF() {
        const btn = document.getElementById('sim-generate-pdf');
        if (btn) {
            btn.textContent = 'Generating…';
            btn.disabled = true;
        }

        if (window.utils && window.utils.exportCloneToPDF) {
            window.utils.exportCloneToPDF('printable-simple-invoice', 'Simple_Invoice.pdf', () => {
                if (btn) {
                    btn.textContent = 'Export Invoice as PDF';
                    btn.disabled = false;
                }
            });
        }
    }
});
