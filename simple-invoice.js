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
            <td style="width: 70%;"><input type="text" class="item-desc full-width" placeholder="Description" value="${data ? data.desc : ''}"></td>
            <td style="width: 25%;"><input type="number" class="item-amt full-width" placeholder="Amount" value="${data ? data.amt : '0'}"></td>
            <td style="width: 5%;"><button class="btn text-btn remove-btn" style="color: #ef4444; padding:0;">X</button></td>
        `;
        itemsBody.appendChild(tr);

        // Bind events
        tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updatePreview));
        tr.querySelector('.remove-btn').addEventListener('click', () => {
            tr.remove();
            updatePreview();
        });
        updatePreview();
    }

    if (addItemBtn) addItemBtn.addEventListener('click', () => addRow());

    // Initialize with one row if empty
    if(itemsBody && itemsBody.children.length === 0) addRow();

    // Inputs binding
    const allInputs = document.querySelectorAll('#simple-form input:not(.item-row input), #simple-form textarea');
    allInputs.forEach(inp => inp.addEventListener('input', updatePreview));

    function updatePreview() {
        if (!printContainer) return;

        // Collect Data
        const invNum = document.getElementById('sim-inv-num').value || 'INV-S01';
        const invDate = document.getElementById('sim-inv-date').value || new Date().toISOString().split('T')[0];
        const buyDetails = document.getElementById('sim-buy-details').value.replace(/\n/g, '<br>');
        
        // Calculate items
        const rows = document.querySelectorAll('#sim-items-body tr');
        let itemsHtml = '';
        let grandTotal = 0;

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc').value || '';
            const amt = parseFloat(row.querySelector('.item-amt').value) || 0;
            
            grandTotal += amt;

            itemsHtml += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${desc}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${amt.toFixed(2)}</td>
                </tr>
            `;
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
                
                <div style="margin-bottom: 30px;">
                    <h4 style="margin:0 0 10px; color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Billed To</h4>
                    <p style="margin:0; font-size: 16px; color: #1e293b;">${buyDetails || 'Client Name<br>Address'}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="text-align:left; padding:12px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Description</th>
                            <th style="text-align:right; padding:12px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="2" style="text-align:center; padding: 20px;">No items</td></tr>'}
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

    // Call once to render initial state
    setTimeout(updatePreview, 100);

    // Generate PDF via standard print mechanism
    const generateBtn = document.getElementById('sim-generate-pdf');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const titleOrig = document.title;
            const invNum = document.getElementById('sim-inv-num').value || 'SimpleInvoice';
            document.title = `${invNum}_Invoice`;
            window.print();
            document.title = titleOrig;
        });
    }
});
