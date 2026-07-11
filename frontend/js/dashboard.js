// Dashboard Controller for ExamPrep AI

document.addEventListener("DOMContentLoaded", () => {
    // 1. Force authorization check
    if (!checkAuthOrRedirect()) return;

    // Load initial data
    loadUserProfile();
    loadDocuments();

    // 2. Element references
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("file-input");
    const dropzone = document.getElementById("dropzone");
    const selectedFileDisplay = document.getElementById("selected-file-display");
    const selectedFilename = document.getElementById("selected-filename");
    const btnRemoveFile = document.getElementById("btn-remove-file");
    const btnUpload = document.getElementById("btn-upload");

    // Allowed extensions list (for frontend checks, though validated by backend as well)
    const allowedExtensions = [".pdf", ".md", ".docx", ".pptx"];

    // Helper: Reset file selection
    function resetFileSelection() {
        fileInput.value = "";
        selectedFileDisplay.style.display = "none";
        btnUpload.disabled = true;
    }

    // 3. File Input change listener
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        } else {
            resetFileSelection();
        }
    });

    // 4. Drag & Drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            fileInput.files = dt.files;
            handleFileSelect(file);
        }
    });

    // 5. File selection validation helper
    function handleFileSelect(file) {
        const filename = file.name;
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        
        if (!allowedExtensions.includes(ext)) {
            showToast(`Extension '${ext}' is not supported. Please select PDF, MD, DOCX, or PPTX.`, "error");
            resetFileSelection();
            return;
        }

        // Update selected display
        selectedFilename.innerText = filename;
        selectedFileDisplay.style.display = "flex";
        btnUpload.disabled = false;
    }

    // 6. Remove selected file
    btnRemoveFile.addEventListener("click", () => {
        resetFileSelection();
    });

    // 7. Form submission for Upload
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        btnUpload.disabled = true;
        btnUpload.innerText = "Uploading...";

        try {
            const response = await fetch(`${API_BASE_URL}/documents/upload`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders()
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Upload failed. Please try again.");
            }

            showToast(`Successfully uploaded ${data.filename}!`, "success");
            resetFileSelection();
            loadDocuments(); // Reload table
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btnUpload.innerText = "Upload Document";
            // Button state depends on if file is still selected
            btnUpload.disabled = !fileInput.files[0];
        }
    });

    // 8. Close chunks viewer event listener
    document.getElementById("btn-close-chunks").addEventListener("click", () => {
        window.closeChunksViewer();
    });
});

/**
 * Fetch and display user profile details
 */
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                ...getAuthHeaders()
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                logout();
                return;
            }
            throw new Error("Failed to load user profile");
        }

        const user = await response.json();
        document.getElementById("user-display-name").innerText = user.name;
    } catch (err) {
        showToast(err.message, "error");
        document.getElementById("user-display-name").innerText = "User";
    }
}

/**
 * Fetch and display all uploaded documents
 */
async function loadDocuments() {
    const table = document.getElementById("documents-table");
    const list = document.getElementById("documents-list");
    const emptyState = document.getElementById("documents-empty");

    try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
            headers: {
                ...getAuthHeaders()
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch documents");
        }

        const documents = await response.json();

        // Clear existing list
        list.innerHTML = "";

        if (documents.length === 0) {
            table.style.display = "none";
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";
        table.style.display = "table";

        documents.forEach(doc => {
            const row = document.createElement("tr");
            
            // Format date nicely
            const uploadDate = new Date(doc.upload_date).toLocaleString();
            
            let actionBtnHtml = '';
            if (doc.status === 'uploaded' || doc.status === 'extraction_failed') {
                actionBtnHtml = `<button class="btn btn-primary" onclick="processDocument(${doc.id}, this)" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; width: auto; margin: 0;">Process</button>`;
            } else if (doc.status === 'processing') {
                actionBtnHtml = `<button class="btn btn-secondary" disabled style="padding: 0.3rem 0.8rem; font-size: 0.8rem; width: auto; margin: 0;">Processing...</button>`;
            } else if (doc.status === 'chunked') {
                actionBtnHtml = `
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn btn-secondary" onclick="viewChunks(${doc.id}, '${escapeJS(doc.filename)}')" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; width: auto; margin: 0; background-color: var(--accent-light); color: #818cf8; border-color: var(--accent);">View Chunks</button>
                        <button class="btn btn-secondary" onclick="processDocument(${doc.id}, this)" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; width: auto; margin: 0; opacity: 0.7;">Reprocess</button>
                    </div>
                `;
            }

            // Status badges
            let badgeClass = 'badge-uploaded';
            if (doc.status === 'chunked') badgeClass = 'badge-chunked';
            if (doc.status === 'processing') badgeClass = 'badge-processing';
            if (doc.status === 'extraction_failed') badgeClass = 'badge-failed';
            
            let statusText = escapeHTML(doc.status.toUpperCase());
            if (doc.status === 'extraction_failed' && doc.error_message) {
                statusText = `<span title="${escapeHTML(doc.error_message)}">FAILED ⚠️</span>`;
            }
            
            row.innerHTML = `
                <td style="font-weight: 500;">${escapeHTML(doc.filename)}</td>
                <td><span class="badge badge-${doc.file_type}">${doc.file_type.toUpperCase()}</span></td>
                <td style="color: var(--text-secondary);">${uploadDate}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${actionBtnHtml}</td>
            `;
            
            list.appendChild(row);
        });

    } catch (err) {
        showToast(err.message, "error");
    }
}

/**
 * Simple HTML Escaper to prevent XSS
 */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/**
 * Escape single and double quotes for safe JS string interpolation
 */
function escapeJS(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Global actions exposed to the window context for onclick handlers
window.processDocument = async function(documentId, btnElement) {
    let originalHtml = "";
    if (btnElement) {
        btnElement.disabled = true;
        originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid currentColor; border-radius:50%; border-top-color:transparent; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span>Processing...`;
    }
    try {
        showToast("Processing document...", "info");
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/process`, {
            method: "POST",
            headers: {
                ...getAuthHeaders()
            }
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Processing failed.");
        }
        
        const doc = data.document;
        const chunksCount = data.chunks_count;
        
        if (doc.status === "extraction_failed") {
            showToast(`Extraction failed: ${doc.error_message}`, "error");
        } else {
            showToast(`Document processed successfully — ${chunksCount} chunks created!`, "success");
        }
        loadDocuments();
    } catch (err) {
        showToast(err.message, "error");
        loadDocuments();
    } finally {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHtml;
        }
    }
};

window.viewChunks = async function(documentId, filename) {
    const viewer = document.getElementById("chunks-viewer");
    const container = document.getElementById("chunks-list-container");
    const subtitle = document.getElementById("chunks-subtitle");
    
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/chunks`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Failed to fetch chunks.");
        }
        
        const chunks = await response.json();
        
        container.innerHTML = "";
        subtitle.innerText = `Viewing chunks for "${filename}" (${chunks.length} chunks found)`;
        viewer.style.display = "block";
        
        if (chunks.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No chunks generated for this document yet. Try processing it again.</div>`;
            return;
        }
        
        chunks.forEach(chunk => {
            const chunkDiv = document.createElement("div");
            chunkDiv.style.backgroundColor = "var(--bg-primary)";
            chunkDiv.style.border = "1px solid var(--border)";
            chunkDiv.style.borderRadius = "var(--radius-sm)";
            chunkDiv.style.padding = "1rem";
            chunkDiv.style.display = "flex";
            chunkDiv.style.flexDirection = "column";
            chunkDiv.style.gap = "0.5rem";
            
            const pageInfo = chunk.page_number !== null ? `Page / Slide ${chunk.page_number}` : 'N/A';
            
            chunkDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">
                    <span><strong>Chunk Index:</strong> ${chunk.chunk_index}</span>
                    <span><strong>Location:</strong> ${pageInfo}</span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-primary); white-space: pre-wrap; font-family: monospace; max-height: 150px; overflow-y: auto; padding-top: 0.25rem;">${escapeHTML(chunk.chunk_text)}</div>
            `;
            container.appendChild(chunkDiv);
        });
        
        // Scroll viewer into view smoothly
        viewer.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.closeChunksViewer = function() {
    document.getElementById("chunks-viewer").style.display = "none";
};
