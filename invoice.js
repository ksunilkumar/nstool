document.addEventListener('DOMContentLoaded', () => {
    // Basic Elements
    const sameShippingCheckbox = document.getElementById('gst-same-shipping');
    const shippingGroup = document.getElementById('gst-shipping-group');
    const addItemBtn = document.getElementById('gst-add-item-btn');
    const itemsBody = document.getElementById('gst-items-body');
    const taxTypeSelect = document.getElementById('gst-tax-type');
    const printContainer = document.getElementById('printable-gst-invoice');
    
    // Toggles
    const toggleBank = document.getElementById('tgl-bank');
    const toggleContact = document.getElementById('tgl-contact');
    const toggleNotes = document.getElementById('tgl-notes');
    const toggleSign = document.getElementById('tgl-sign');

    // Toggle Shipping Address
    sameShippingCheckbox.addEventListener('change', (e) => {
        if(e.target.checked) {
            shippingGroup.classList.add('hidden');
        } else {
            shippingGroup.classList.remove('hidden');
        }
        updatePreview();
    });

    // Add Item Row
    function addRow(data = null) {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.innerHTML = `
            <td><input type="text" class="item-name full-width" placeholder="Name" value="${data ? data.name : ''}"></td>
            <td><input type="text" class="item-hsn full-width" placeholder="HSN" value="${data ? data.hsn : ''}"></td>
            <td><input type="number" class="item-qty full-width" placeholder="Qty" value="${data ? data.qty : '1'}"></td>
            <td><input type="number" class="item-rate full-width" placeholder="Rate" value="${data ? data.rate : '0'}"></td>
            <td><input type="number" class="item-gst full-width" placeholder="%" value="${data ? data.gst : '18'}"></td>
            <td class="item-amt">0.00</td>
            <td><button class="btn text-btn remove-btn" style="color: #ef4444; padding:0;">X</button></td>
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

    addItemBtn.addEventListener('click', () => addRow());

    // Initialize with one row if empty
    if(itemsBody.children.length === 0) addRow();

    // Inputs binding
    const allInputs = document.querySelectorAll('#gst-form input:not(.item-row input), #gst-form textarea, #gst-form select');
    allInputs.forEach(inp => inp.addEventListener('input', updatePreview));

    function updatePreview() {
        // Collect Data
        const invNum = document.getElementById('gst-inv-num').value || 'INV-001';
        const invDate = document.getElementById('gst-inv-date').value;
        const supName = document.getElementById('gst-sup-name').value;
        const supGstin = document.getElementById('gst-sup-gstin').value;
        const supAddress = document.getElementById('gst-sup-address').value.replace(/\n/g, '<br>');
        
        const buyName = document.getElementById('gst-buy-name').value;
        const buyGstin = document.getElementById('gst-buy-gstin').value;
        const buyAddress = document.getElementById('gst-buy-address').value.replace(/\n/g, '<br>');
        
        const isSameShip = sameShippingCheckbox.checked;
        const shipAddress = isSameShip ? buyAddress : document.getElementById('gst-ship-address').value.replace(/\n/g, '<br>');

        const taxType = taxTypeSelect.value;
        
        // Calculate items
        const rows = document.querySelectorAll('#gst-items-body tr');
        let itemsHtml = '';
        let totalTaxable = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let grandTotal = 0;

        rows.forEach(row => {
            const name = row.querySelector('.item-name').value || '';
            const hsn = row.querySelector('.item-hsn').value || '';
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const gst = parseFloat(row.querySelector('.item-gst').value) || 0;
            
            const taxable = qty * rate;
            const taxAmt = (taxable * gst) / 100;
            const rowTotal = taxable + taxAmt;
            
            row.querySelector('.item-amt').innerText = rowTotal.toFixed(2);
            
            totalTaxable += taxable;
            if(taxType === 'igst') {
                totalIGST += taxAmt;
            } else {
                totalCGST += taxAmt / 2;
                totalSGST += taxAmt / 2;
            }
            grandTotal += rowTotal;

            itemsHtml += `
                <tr>
                    <td>${name}</td>
                    <td>${hsn}</td>
                    <td class="text-right">${qty}</td>
                    <td class="text-right">${rate.toFixed(2)}</td>
                    <td class="text-right">${taxable.toFixed(2)}</td>
                    <td class="text-right">${gst}%</td>
                    <td class="text-right">${taxType === 'igst' ? taxAmt.toFixed(2) : (taxAmt/2).toFixed(2)}</td>
                    ${taxType === 'cgst_sgst' ? `<td class="text-right">${(taxAmt/2).toFixed(2)}</td>` : ''}
                    <td class="text-right">${rowTotal.toFixed(2)}</td>
                </tr>
            `;
        });

        // Build HTML
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
                <div>
                    <h2 style="margin:0; font-size: 24px;">TAX INVOICE</h2>
                    <p style="margin:5px 0 0; color: #64748b;">Invoice No: <strong>${invNum}</strong></p>
                    <p style="margin:0; color: #64748b;">Date: <strong>${invDate || 'N/A'}</strong></p>
                </div>
                <div style="text-align: right;">
                    <svg id="gst-barcode"></svg>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="flex: 1; padding-right: 20px;">
                    <h4 style="margin:0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Supplier</h4>
                    <p style="margin:0;"><strong>${supName || 'Company Name'}</strong></p>
                    <p style="margin:5px 0; font-size: 0.9em; color: #475569;">${supAddress || 'Address'}</p>
                    <p style="margin:0; font-size: 0.9em;">GSTIN: <strong>${supGstin || 'N/A'}</strong></p>
                </div>
                <div style="flex: 1; padding-left: 20px;">
                    <h4 style="margin:0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Billed To</h4>
                    <p style="margin:0;"><strong>${buyName || 'Buyer Name'}</strong></p>
                    <p style="margin:5px 0; font-size: 0.9em; color: #475569;">${buyAddress || 'Address'}</p>
                    <p style="margin:0; font-size: 0.9em;">GSTIN: <strong>${buyGstin || 'N/A'}</strong></p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                        <th style="text-align:left; padding:8px;">Description</th>
                        <th style="text-align:left; padding:8px;">HSN/SAC</th>
                        <th style="text-align:right; padding:8px;">Qty</th>
                        <th style="text-align:right; padding:8px;">Rate</th>
                        <th style="text-align:right; padding:8px;">Taxable</th>
                        <th style="text-align:right; padding:8px;">GST%</th>
                        ${taxType === 'igst' ? `<th style="text-align:right; padding:8px;">IGST</th>` : `<th style="text-align:right; padding:8px;">CGST</th><th style="text-align:right; padding:8px;">SGST</th>`}
                        <th style="text-align:right; padding:8px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px;">No items</td></tr>'}
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                <table style="width: 300px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px;">Total Taxable:</td>
                        <td style="text-align:right; padding: 5px;">₹${totalTaxable.toFixed(2)}</td>
                    </tr>
                    ${taxType === 'igst' ? `
                    <tr>
                        <td style="padding: 5px;">IGST:</td>
                        <td style="text-align:right; padding: 5px;">₹${totalIGST.toFixed(2)}</td>
                    </tr>` : `
                    <tr>
                        <td style="padding: 5px;">CGST:</td>
                        <td style="text-align:right; padding: 5px;">₹${totalCGST.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;">SGST:</td>
                        <td style="text-align:right; padding: 5px;">₹${totalSGST.toFixed(2)}</td>
                    </tr>`}
                    <tr style="font-size: 1.1em; font-weight: bold; border-top: 1px solid #cbd5e1;">
                        <td style="padding: 10px 5px;">Grand Total:</td>
                        <td style="text-align:right; padding: 10px 5px;">₹${grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #475569;">
                <div style="flex: 2; padding-right: 20px;">
                    ${toggleBank.checked ? `
                    <div style="margin-bottom: 15px;">
                        <strong>Bank Details</strong><br>
                        Bank Name: Your Bank<br>
                        A/C No: 1234567890<br>
                        IFSC: ABCD0123456
                    </div>` : ''}
                    ${toggleNotes.checked ? `
                    <div>
                        <strong>Terms & Conditions</strong><br>
                        1. Goods once sold will not be taken back.<br>
                        2. Subject to local jurisdiction.
                    </div>` : ''}
                </div>
                <div style="flex: 1; text-align: center;">
                    ${toggleSign.checked ? `
                    <div style="margin-top: 40px; border-top: 1px solid #000; display: inline-block; padding-top: 5px;">
                        Authorized Signatory
                    </div>` : ''}
                </div>
            </div>
        `;

        printContainer.innerHTML = html;

        // Generate Barcode
        if(window.barcodeUtils && invNum) {
            window.barcodeUtils.generateBarcode('gst-barcode', invNum);
        }
    }

    // Call once to render initial state
    setTimeout(updatePreview, 100);

    // Save and Load
    document.getElementById('gst-save-template').addEventListener('click', () => {
        const data = {
            supName: document.getElementById('gst-sup-name').value,
            supGstin: document.getElementById('gst-sup-gstin').value,
            supAddress: document.getElementById('gst-sup-address').value,
            buyName: document.getElementById('gst-buy-name').value,
            buyGstin: document.getElementById('gst-buy-gstin').value,
            buyAddress: document.getElementById('gst-buy-address').value
        };
        localStorage.setItem('gstTemplate', JSON.stringify(data));
        alert('Supplier and Buyer details saved successfully!');
    });

    document.getElementById('gst-load-template').addEventListener('click', () => {
        const saved = localStorage.getItem('gstTemplate');
        if(saved) {
            const data = JSON.parse(saved);
            document.getElementById('gst-sup-name').value = data.supName || '';
            document.getElementById('gst-sup-gstin').value = data.supGstin || '';
            document.getElementById('gst-sup-address').value = data.supAddress || '';
            document.getElementById('gst-buy-name').value = data.buyName || '';
            document.getElementById('gst-buy-gstin').value = data.buyGstin || '';
            document.getElementById('gst-buy-address').value = data.buyAddress || '';
            updatePreview();
            alert('Template loaded!');
        } else {
            alert('No saved template found.');
        }
    });

    // Generate PDF via standard print mechanism
    document.getElementById('gst-generate-pdf').addEventListener('click', () => {
        const titleOrig = document.title;
        const invNum = document.getElementById('gst-inv-num').value || 'Invoice';
        document.title = `${invNum}_GST_Invoice`;
        window.print();
        document.title = titleOrig;
    });

});
