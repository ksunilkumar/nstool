document.addEventListener('DOMContentLoaded', () => {
    const addItemBtn = document.getElementById('sim-add-item-btn');
    const itemsBody = document.getElementById('sim-items-body');
    const printContainer = document.getElementById('printable-simple-invoice');
    
    // Toggles
    const toggleQr = document.getElementById('tgl-sim-qr');

    // Add Item Row
    function addRow(data = null) {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.innerHTML = `
            <td style="width: 50%;"><input type="text" class="item-desc full-width" placeholder="Description" value="${data ? data.desc : ''}"></td>
            <td style="width: 15%;"><input type="number" class="item-qty full-width" placeholder="Qty" value="${data ? data.qty : '1'}" min="1"></td>
            <td style="width: 20%;"><input type="number" class="item-rate full-width" placeholder="Rate" value="${data ? data.rate : '0'}" min="0"></td>
            <td style="width: 10%; font-weight: 600; text-align: right;" class="item-amount-display">₹0.00</td>
            <td style="width: 5%;"><button class="btn text-btn remove-btn" style="color: #ef4444; padding:0;">X</button></td>
        `;
        itemsBody.appendChild(tr);

        // Bind calculation events
        const qtyInp = tr.querySelector('.item-qty');
        const rateInp = tr.querySelector('.item-rate');
        const amtDisp = tr.querySelector('.item-amount-display');

        function calcRow() {
            const qty = parseFloat(qtyInp.value) || 0;
            const rate = parseFloat(rateInp.value) || 0;
            amtDisp.innerText = '₹' + (qty * rate).toFixed(2);
        }

        qtyInp.addEventListener('input', calcRow);
        rateInp.addEventListener('input', calcRow);
        calcRow();

        tr.querySelector('.remove-btn').addEventListener('click', () => {
            tr.remove();
        });
    }

    if (addItemBtn) addItemBtn.addEventListener('click', () => addRow());

    // Initialize with one row if empty
    if(itemsBody && itemsBody.children.length === 0) addRow();

    // Removed global input binding to prevent live updates

    function updatePreview() {
        if (!printContainer) return;

        // Collect Data
        const invNum = document.getElementById('sim-inv-num').value || 'INV-S01';
        const invDate = document.getElementById('sim-inv-date').value || new Date().toISOString().split('T')[0];
        const billerDetails = document.getElementById('sim-biller-details').value.replace(/\n/g, '<br>');
        const buyDetails = document.getElementById('sim-buy-details').value.replace(/\n/g, '<br>');
        
        // Calculate items
        const rows = document.querySelectorAll('#sim-items-body tr');
        let itemsHtml = '';
        let grandTotal = 0;

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc').value || '';
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const amt = qty * rate;
            
            if (desc || amt > 0) {
                grandTotal += amt;
                itemsHtml += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${desc}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${qty}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${rate.toFixed(2)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${amt.toFixed(2)}</td>
                    </tr>
                `;
            }
        });

        // Build HTML
        let html = `
            <div style="font-family: 'Inter', sans-serif; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
                    <div>
                        <h2 style="margin:0; font-size: 28px; color: #1e293b; font-weight: 700;">INVOICE</h2>
                        <p style="margin:5px 0 0; color: #64748b;">No: <strong>${invNum}</strong></p>
                        <p style="margin:0; color: #64748b;">Date: <strong>${invDate}</strong></p>
                    </div>
                    ${toggleQr.checked ? '<div style="text-align: right;"><div id="sim-qrcode" style="width: 80px; height: 80px; display: inline-block;"></div></div>' : ''}
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div style="width: 48%;">
                        <h4 style="margin:0 0 10px; color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">From</h4>
                        <p style="margin:0; font-size: 15px; color: #1e293b;">${billerDetails || 'Your Name/Company<br>Address'}</p>
                    </div>
                    <div style="width: 48%;">
                        <h4 style="margin:0 0 10px; color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Billed To</h4>
                        <p style="margin:0; font-size: 15px; color: #1e293b;">${buyDetails || 'Client Name<br>Address'}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="text-align:left; padding:12px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Description</th>
                            <th style="text-align:center; padding:12px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Qty</th>
                            <th style="text-align:right; padding:12px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Rate</th>
                            <th style="text-align:right; padding:12px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="4" style="text-align:center; padding: 20px;">No items</td></tr>'}
                    </tbody>
                </table>
                
                <div style="display: flex; justify-content: flex-end;">
                    <table style="width: 250px; border-collapse: collapse;">
                        <tr style="font-size: 1.2em; font-weight: 700; color: #0f172a;">
                            <td style="padding: 10px 5px;">Total:</td>
                            <td style="text-align:right; padding: 10px 5px; color: #3b82f6;">₹${grandTotal.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        printContainer.innerHTML = html;

        // Generate QR Code
        if(toggleQr.checked && window.barcodeUtils && invNum) {
            window.barcodeUtils.generateQR('sim-qrcode', `Invoice: ${invNum}\nTotal: ₹${grandTotal.toFixed(2)}\nDate: ${invDate}`);
        }
    }

    // Manual Preview Trigger
    const previewBtn = document.getElementById('sim-preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            updatePreview();
            
            // On mobile, scroll down to the preview section smoothly
            if (window.innerWidth <= 768) {
                document.getElementById('printable-simple-invoice').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Call once to render initial empty state
    setTimeout(updatePreview, 100);

    // Generate PDF via html2pdf
    const generateBtn = document.getElementById('sim-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const invNum = document.getElementById('sim-inv-num').value || 'SimpleInvoice';
            const element = document.getElementById('printable-simple-invoice');

            generateBtn.innerText = "Generating PDF...";
            generateBtn.disabled = true;

            const opt = {
                margin:       10,
                filename:     `${invNum}_Invoice.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                generateBtn.innerText = "Export Simple Invoice PDF";
                generateBtn.disabled = false;
            }).catch(err => {
                console.error("PDF Generation failed", err);
                alert("Failed to generate PDF. Please try again.");
                generateBtn.innerText = "Export Simple Invoice PDF";
                generateBtn.disabled = false;
            });
        });
    }
});
