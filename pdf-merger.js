document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('pdf-merge-upload');
    const fileInput = document.getElementById('pdf-merge-input');
    const mergeList = document.getElementById('pdf-merge-list');
    const actionContainer = document.getElementById('pdf-merge-actions');
    const mergeBtn = document.getElementById('pdf-merge-btn');

    let pdfFiles = [];

    // Trigger file input
    if(uploadArea) {
        uploadArea.addEventListener('click', (e) => {
            if(e.target !== fileInput) fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        });
    }

    if(fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });
    }

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf') {
                // Add an ID for tracking
                const id = 'pdf_' + Math.random().toString(36).substr(2, 9);
                pdfFiles.push({ id, file });
                renderList();
            }
        });
    }

    function renderList() {
        mergeList.innerHTML = '';
        if (pdfFiles.length > 0) {
            actionContainer.classList.remove('hidden');
        } else {
            actionContainer.classList.add('hidden');
        }

        pdfFiles.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'sortable-item';
            li.draggable = true;
            li.dataset.id = item.id;
            li.dataset.index = index;

            li.innerHTML = `
                <span class="drag-handle">☰</span>
                <span class="file-name">${item.file.name}</span>
                <button class="remove-btn" data-id="${item.id}">X</button>
            `;
            
            // Drag and drop sorting events
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragenter', handleDragEnter);
            li.addEventListener('dragleave', handleDragLeave);

            // Remove event
            li.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                pdfFiles = pdfFiles.filter(f => f.id !== item.id);
                renderList();
            });

            mergeList.appendChild(li);
        });
    }

    let dragSrcEl = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.style.opacity = '0.4';
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); 
        }
        e.dataTransfer.dropEffect = 'move';  
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); 
        }
        
        if (dragSrcEl !== this) {
            // Swap array elements
            const srcIndex = parseInt(dragSrcEl.dataset.index);
            const tgtIndex = parseInt(this.dataset.index);
            
            const temp = pdfFiles[srcIndex];
            pdfFiles[srcIndex] = pdfFiles[tgtIndex];
            pdfFiles[tgtIndex] = temp;
            
            renderList();
        }
        return false;
    }

    if(mergeBtn) {
        mergeBtn.addEventListener('click', async () => {
            if (pdfFiles.length < 2) {
                alert("Please add at least 2 PDFs to merge.");
                return;
            }

            if (!window.PDFLib) {
                alert("PDF library is not loaded properly. Please check your connection.");
                return;
            }

            mergeBtn.innerText = "Merging...";
            mergeBtn.disabled = true;

            try {
                const { PDFDocument } = window.PDFLib;
                const mergedPdf = await PDFDocument.create();

                for (let item of pdfFiles) {
                    const arrayBuffer = await item.file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const mergedPdfFile = await mergedPdf.save();
                const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `Merged_Document_${new Date().getTime()}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
            } catch (error) {
                console.error("Error merging PDFs:", error);
                alert("An error occurred while merging the PDFs.");
            } finally {
                mergeBtn.innerText = "Merge PDFs";
                mergeBtn.disabled = false;
            }
        });
    }
});
