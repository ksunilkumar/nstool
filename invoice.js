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
    const toggleSup = document.getElementById('tgl-gst-sup');
    const toggleBuy = document.getElementById('tgl-gst-buy');
    const toggleItems = document.getElementById('tgl-gst-items');
    const toggleQr = document.getElementById('tgl-gst-qr');

    // Toggle Shipping Address
    sameShippingCheckbox.addEventListener('change', (e) => {
        if(e.target.checked) {
            shippingGroup.classList.add('hidden');
        } else {
            shippingGroup.classList.remove('hidden');
        }
    });

    // Toggle Additional Sections visibility
    function toggleSection(checkbox, sectionId) {
        if (!checkbox) return;
        checkbox.addEventListener('change', (e) => {
            const el = document.getElementById(sectionId);
            if(el) {
                if(e.target.checked) el.classList.remove('hidden');
                else el.classList.add('hidden');
            }
        });
    }
    toggleSection(toggleBank, 'section-bank-details');
    toggleSection(toggleContact, 'section-contact-details');
    toggleSection(toggleNotes, 'section-notes-details');
    toggleSection(toggleSign, 'section-sign-details');

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

        // Removed live input binding to prevent auto-updating
        tr.querySelector('.remove-btn').addEventListener('click', () => {
            tr.remove();
        });
    }

    if (addItemBtn) addItemBtn.addEventListener('click', () => addRow());

    // Initialize with one row if empty
    if(itemsBody && itemsBody.children.length === 0) addRow();

    // Removed global input binding

    function updatePreview() {
        if (!printContainer) return;
        
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
        
        // Collect Additional Details
        const bankName = document.getElementById('gst-bank-name')?.value || 'Your Bank Name';
        const bankAcc = document.getElementById('gst-bank-acc')?.value || '1234567890';
        const bankIfsc = document.getElementById('gst-bank-ifsc')?.value || 'ABCD0123456';
        const bankBranch = document.getElementById('gst-bank-branch')?.value || 'Main Branch';
        
        const contactEmail = document.getElementById('gst-contact-email')?.value || 'contact@example.com';
        const contactPhone = document.getElementById('gst-contact-phone')?.value || '+91 9876543210';
        
        const notesText = document.getElementById('gst-notes-text')?.value.replace(/\n/g, '<br>') || '1. Goods once sold will not be taken back.<br>2. Subject to local jurisdiction.';
        const signName = document.getElementById('gst-sign-name')?.value || 'Authorized Signatory';
        
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
            <div style="font-family: 'Inter', sans-serif; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
                    <div>
                        <h2 style="margin:0; font-size: 24px; color: #1e293b; font-weight: 700;">TAX INVOICE</h2>
                        <p style="margin:5px 0 0; color: #64748b;">Invoice No: <strong>${invNum}</strong></p>
                        <p style="margin:0; color: #64748b;">Date: <strong>${invDate || 'N/A'}</strong></p>
                    </div>
                    <div style="text-align: right; min-height: 50px;">
                        ${toggleQr.checked ? '<div id="gst-qrcode" style="width: 80px; height: 80px; display: inline-block;"></div>' : ''}
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px;">
                    ${toggleSup.checked ? `
                    <div style="flex: 1; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="margin:0 0 10px; color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Supplier</h4>
                        <p style="margin:0; font-size: 15px; color: #1e293b; font-weight: 600;">${supName || 'Company Name'}</p>
                        <p style="margin:5px 0; font-size: 13px; color: #475569;">${supAddress || 'Address'}</p>
                        <p style="margin:0; font-size: 13px;">GSTIN: <strong>${supGstin || 'N/A'}</strong></p>
                    </div>` : '<div style="flex: 1;"></div>'}
                    
                    ${toggleBuy.checked ? `
                    <div style="flex: 1; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="margin:0 0 10px; color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Billed To</h4>
                        <p style="margin:0; font-size: 15px; color: #1e293b; font-weight: 600;">${buyName || 'Buyer Name'}</p>
                        <p style="margin:5px 0; font-size: 13px; color: #475569;">${buyAddress || 'Address'}</p>
                        <p style="margin:0; font-size: 13px;">GSTIN: <strong>${buyGstin || 'N/A'}</strong></p>
                    </div>` : '<div style="flex: 1;"></div>'}
                </div>

                ${toggleItems.checked ? `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                            <th style="text-align:left; padding:10px;">Description</th>
                            <th style="text-align:left; padding:10px;">HSN/SAC</th>
                            <th style="text-align:right; padding:10px;">Qty</th>
                            <th style="text-align:right; padding:10px;">Rate</th>
                            <th style="text-align:right; padding:10px;">Taxable</th>
                            <th style="text-align:right; padding:10px;">GST%</th>
                            ${taxType === 'igst' ? `<th style="text-align:right; padding:10px;">IGST</th>` : `<th style="text-align:right; padding:10px;">CGST</th><th style="text-align:right; padding:10px;">SGST</th>`}
                            <th style="text-align:right; padding:10px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px;">No items</td></tr>'}
                    </tbody>
                </table>
                
                <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                    <table style="width: 300px; border-collapse: collapse; font-size: 0.95em;">
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
                        <tr style="font-size: 1.1em; font-weight: 700; border-top: 1px solid #cbd5e1; color: #0f172a;">
                            <td style="padding: 10px 5px;">Grand Total:</td>
                            <td style="text-align:right; padding: 10px 5px; color: #3b82f6;">₹${grandTotal.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>` : ''}

                <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #475569;">
                    <div style="flex: 2; padding-right: 20px;">
                        ${toggleBank.checked ? `
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Bank Details</strong><br>
                            Bank Name: ${bankName}<br>
                            A/C No: ${bankAcc}<br>
                            IFSC: ${bankIfsc}<br>
                            Branch: ${bankBranch}
                        </div>` : ''}
                        
                        ${toggleContact.checked ? `
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Contact Details</strong><br>
                            Email: ${contactEmail}<br>
                            Phone: ${contactPhone}
                        </div>` : ''}

                        ${toggleNotes.checked ? `
                        <div>
                            <strong style="color: #1e293b;">Terms & Conditions</strong><br>
                            ${notesText}
                        </div>` : ''}
                    </div>
                    <div style="flex: 1; text-align: center; display: flex; align-items: flex-end; justify-content: center;">
                        ${toggleSign.checked ? `
                        <div style="margin-top: 40px; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 5px; width: 150px;">
                            ${signName}
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;

        printContainer.innerHTML = html;

        // Generate Barcode/QR
        if(toggleQr.checked && window.barcodeUtils && invNum) {
            // we use QR for visual modern touch
            window.barcodeUtils.generateQR('gst-qrcode', `GST Invoice: ${invNum}\nTotal: ₹${grandTotal.toFixed(2)}`);
        }
    }

    // Call once to render initial empty state
    setTimeout(updatePreview, 100);

    // Manual Preview Binding
    const previewBtn = document.getElementById('gst-preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            updatePreview();
            
            if (window.innerWidth <= 768) {
                document.getElementById('printable-gst-invoice').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

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

    // Generate PDF via html2pdf
    const genPdfBtn = document.getElementById('gst-generate-pdf');
    if(genPdfBtn) {
        genPdfBtn.addEventListener('click', () => {
            const invNum = document.getElementById('gst-inv-num').value || 'Invoice';
            const element = document.getElementById('printable-gst-invoice');
            
            genPdfBtn.innerText = "Generating PDF...";
            genPdfBtn.disabled = true;

            const opt = {
                margin:       10,
                filename:     `${invNum}_GST_Invoice.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                genPdfBtn.innerText = "Export as PDF";
                genPdfBtn.disabled = false;
            }).catch(err => {
                console.error("PDF Generation failed", err);
                alert("Failed to generate PDF. Please try again.");
                genPdfBtn.innerText = "Export as PDF";
                genPdfBtn.disabled = false;
            });
        });
    }
});
