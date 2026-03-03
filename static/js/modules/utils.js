/**
 * Módulo de utilidades comunes
 * Contiene funciones helper y utilidades reutilizables
 */

/**
 * Obtiene el valor de una cookie por su nombre
 * @param {string} name - Nombre de la cookie
 * @returns {string|null} - Valor de la cookie o null
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Devuelve contenido HTML estilizado para ciertos valores de celda
 * @param {string|number} value - Valor a estilizar
 * @returns {string} - Contenido HTML estilizado o valor original
 */
function getStyledContent(value) {
    const s = String(value ?? '').trim().toLowerCase();
    if (s === 'ok' || s === 'finalizado') return `<span class="badge badge-ok">${value}</span>`;
    if (s === 'suspendido') return `<span class="badge bg-warning text-dark">${value}</span>`;
    if (s.includes('pendiente')) return `<span class="badge bg-danger">${value}</span>`;
    if (s.includes('en curso')) return `<span class="badge badge-en-curso">${value}</span>`;
    if (s.includes('mitigar')) return `<span class="badge bg-danger">${value}</span>`;
    if (s.includes('cancelado')) return `<span class="badge bg-secondary">${value}</span>`;
    return value;
}

/**
 * Ajusta automáticamente la altura de un textarea
 * @param {HTMLTextAreaElement} textarea - Elemento textarea a redimensionar
 */
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

/**
 * Hace un modal arrastrable por su cabecera
 * @param {HTMLElement} modalElement - Elemento del modal
 */
function makeModalDraggable(modalElement) {
    const modalDialog = modalElement.querySelector('.modal-dialog');
    const modalHeader = modalElement.querySelector('.modal-header');

    if (!modalHeader) return;

    let isDragging = false;
    let initialMouseX, initialMouseY, initialModalX, initialModalY;

    modalHeader.style.cursor = 'move';

    modalHeader.addEventListener('mousedown', function(e) {
        // Evitar el arrastre desde elementos interactivos en el encabezado
        if (e.target.closest('button, a, input, select, textarea') || e.target.tagName === 'H5') {
            return;
        }
        // Evitar arrastre si el modal está maximizado
        if (modalDialog.classList.contains('modal-fullscreen')) {
            return;
        }
        e.preventDefault();

        isDragging = true;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        const rect = modalDialog.getBoundingClientRect();

        // Cambiar a posicionamiento absoluto para mover el diálogo
        modalDialog.style.position = 'absolute';
        modalDialog.style.margin = '0';

        // Establecer la posición inicial
        if (!modalDialog.style.top || modalDialog.style.top === 'auto') {
            modalDialog.style.top = `${rect.top}px`;
            modalDialog.style.left = `${rect.left}px`;
        }

        initialModalX = parseFloat(modalDialog.style.left);
        initialModalY = parseFloat(modalDialog.style.top);
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();

        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;

        modalDialog.style.left = `${initialModalX + dx}px`;
        modalDialog.style.top = `${initialModalY + dy}px`;
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Cuando el modal se oculta, restablecer su estilo
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalDialog.style.position = '';
        modalDialog.style.top = '';
        modalDialog.style.left = '';
        modalDialog.style.margin = '';
    });
}

/**
 * Mostrar notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (info, success, error)
 */
function showToast(message, type = 'info') {
    // Crear contenedor de toast si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }

    // Crear elemento toast
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);

    // Mostrar toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Eliminar elemento toast cuando se oculte
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

/**
 * Generar ID único
 * @returns {string} - ID único
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatear fecha
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato deseado
 * @returns {string} - Fecha formateada
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes);
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitizar entrada HTML
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Debounce function - limita la ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones para uso global
window.UtilsModule = {
    getCookie,
    getStyledContent,
    autoResizeTextarea,
    makeModalDraggable,
    showToast,
    generateUniqueId,
    formatDate,
    isValidEmail,
    escapeHtml,
    debounce
};
