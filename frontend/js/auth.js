// Auth Utilities for ExamPrep AI

const API_BASE_URL = ""; // Empty string for relative calls since frontend is mounted on the backend port

/**
 * Store JWT token in localStorage
 * @param {string} token 
 */
function setToken(token) {
    localStorage.setItem("examprep_jwt", token);
}

/**
 * Get JWT token from localStorage
 */
function getToken() {
    return localStorage.getItem("examprep_jwt");
}

/**
 * Remove token and redirect to login
 */
function logout() {
    localStorage.removeItem("examprep_jwt");
    showToast("Logged out successfully", "success");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 500);
}

/**
 * Generate authorization headers containing the Bearer token
 */
function getAuthHeaders() {
    const token = getToken();
    if (!token) return {};
    return {
        "Authorization": `Bearer ${token}`
    };
}

/**
 * Redirect to login page if user is not authenticated
 */
function checkAuthOrRedirect() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

/**
 * Toast Notification System
 * @param {string} message 
 * @param {'success' | 'error' | 'info'} type 
 */
function showToast(message, type = 'info') {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <span class="toast-close" style="cursor:pointer;font-weight:bold;margin-left:10px;">&times;</span>
    `;

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);

    // Close button click listener
    toast.querySelector(".toast-close").addEventListener("click", () => {
        clearTimeout(timer);
        toast.remove();
    });
}
