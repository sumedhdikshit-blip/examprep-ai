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
            
            row.innerHTML = `
                <td style="font-weight: 500;">${escapeHTML(doc.filename)}</td>
                <td><span class="badge badge-${doc.file_type}">${doc.file_type.toUpperCase()}</span></td>
                <td style="color: var(--text-secondary);">${uploadDate}</td>
                <td><span class="badge badge-uploaded">${escapeHTML(doc.status)}</span></td>
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
