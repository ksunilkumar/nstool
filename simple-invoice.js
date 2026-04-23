document.addEventListener('DOMContentLoaded', () => {
    // ---- Elements ----
    const logoUploadBox = document.getElementById('logo-upload-box');
    const logoInput = document.getElementById('sim-logo-input');
    const logoPreview = document.getElementById('sim-logo-preview');
    
    const itemsBody = document.getElementById('sim-wysiwyg-items-body');
    const addLineBtn = document.getElementById('sim-add-line-btn');
    
    const totalDisplay = document.getElementById('sim-total-display');
    const balanceDisplay = document.getElementById('sim-balance-display');
    const paidToggle = document.getElementById('sim-paid-toggle');
    const paidInput = document.getElementById('sim-paid-input');

    const addMetaBtn = document.getElementById('sim-add-meta-btn');
    const metaBody = document.getElementById('sim-meta-body');

    // ---- Logo Upload ----
    if (logoUploadBox && logoInput) {
        logoUploadBox.addEventListener('click', () => {
            logoInput.click();
        });

        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    logoPreview.src = e.target.result;
                    logoPreview.style.display = 'block';
                    // Hide the placeholder text
                    logoUploadBox.querySelector('span').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ---- Meta Info Adding ----
    if (addMetaBtn && metaBody) {
        addMetaBtn.addEventListener('click', () => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: right; font-weight: 600; padding: 5px;"><input type="text" class="inline-input" style="text-align: right; font-weight: 600; width: 100%;" placeholder="Custom Field" value="Custom Field"></td>
                <td style="padding: 5px; border: 1px solid transparent;" class="border-hover">
                    <div style="display: flex; align-items: center; width: 100%;">
                        <input type="text" class="inline-input" style="text-align: right; flex: 1;" placeholder="Value">
                        <button class="btn text-btn remove-meta-btn no-print" style="color: #ef4444; padding:0 0 0 5px; margin-left: auto;">🗑️</button>
                    </div>
                </td>
            `;
            metaBody.appendChild(tr);

            tr.querySelector('.remove-meta-btn').addEventListener('click', () => {
                tr.remove();
            });
        });
    }

    // ---- Items Table Logic ----
    function calculateTotals() {
        let total = 0;
        const rows = document.querySelectorAll('.item-row');
        
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const amt = qty * rate;
            
            row.querySelector('.item-amt-display').value = amt;
            total += amt;
        });

        totalDisplay.innerText = total;
        
        let paid = 0;
        if (paidToggle && paidToggle.checked) {
            paid = parseFloat(paidInput.value) || 0;
        }
        
        balanceDisplay.innerText = total - paid;
    }

    function addRow() {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding: 10px;"><input type="text" class="inline-input" style="width:100%; text-align: left; box-sizing: border-box;" placeholder="Description"></td>
            <td style="padding: 10px;"><input type="number" class="inline-input item-qty" style="width:100%; text-align: center; box-sizing: border-box;" value="1" min="1"></td>
            <td style="padding: 10px;"><input type="number" class="inline-input item-rate" style="width:100%; text-align: center; box-sizing: border-box;" value="0" min="0"></td>
            <td style="padding: 10px;"><input type="text" class="inline-input item-amt-display" style="width:100%; text-align: center; font-weight: 600; box-sizing: border-box;" value="0" disabled></td>
            <td style="padding: 10px; text-align: center;" class="no-print"><button class="btn text-btn remove-row-btn" style="color: #ef4444; padding:0;">🗑️</button></td>
        `;
        itemsBody.appendChild(tr);

        // Bind events
        const qtyInp = tr.querySelector('.item-qty');
        const rateInp = tr.querySelector('.item-rate');
        
        qtyInp.addEventListener('input', calculateTotals);
        rateInp.addEventListener('input', calculateTotals);

        tr.querySelector('.remove-row-btn').addEventListener('click', () => {
            tr.remove();
            calculateTotals();
        });

        calculateTotals();
    }

    if (addLineBtn) {
        addLineBtn.addEventListener('click', addRow);
    }

    // Initialize with two rows like the mock
    if (itemsBody) {
        addRow();
        addRow();
    }

    // ---- Summary Logic ----
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
    if (dateInput) {
        dateInput.value = new Date().toLocaleDateString();
    }

    // ---- PDF Generation ----
    const generateBtn = document.getElementById('sim-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const element = document.getElementById('printable-simple-invoice');
            
            generateBtn.innerText = "Generating PDF...";
            generateBtn.disabled = true;

            // Add exporting class to hide UI elements
            element.classList.add('pdf-exporting');

            const opt = {
                margin:       [10, 10, 10, 10], // top, left, bottom, right
                filename:     `Invoice.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                // Remove exporting class
                element.classList.remove('pdf-exporting');
                generateBtn.innerText = "Export Invoice as PDF";
                generateBtn.disabled = false;
            }).catch(err => {
                console.error("PDF Generation failed", err);
                alert("Failed to generate PDF. Please try again.");
                element.classList.remove('pdf-exporting');
                generateBtn.innerText = "Export Invoice as PDF";
                generateBtn.disabled = false;
            });
        });
    }
});
