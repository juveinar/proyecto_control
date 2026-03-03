/**
 * Módulo de gestión de observaciones
 * Contiene todas las funciones relacionadas con la gestión de observaciones de proyectos
 */

// Variables globales para observaciones
let currentObservacionesId = null;
let originalObservacionesContent = '';
let autoSaveInterval = null;

/**
 * Abrir modal de observaciones para un proyecto específico
 * @param {number} projectId - ID del proyecto
 */
function openObservacionesModal(projectId) {
    const project = window.ProjectsModule ? 
        window.ProjectsModule.allProjects?.find(p => p['Id Project'] === projectId) : null;
    
    if (project) {
        currentObservacionesId = projectId;
        originalObservacionesContent = project['OBSERVACIONES'] || '';
        
        const textarea = document.getElementById('observacionesContent');
        const modalTitle = document.getElementById('observacionesModalLabel');
        
        if (modalTitle) {
            // Actualiza el título del modal para incluir el nombre del proyecto
            modalTitle.innerHTML = `<i class="bi bi-journal-text me-2"></i>Observaciones - ${project.Project || 'Sin Título'}`;
        }
        
        if (textarea) {
            textarea.value = originalObservacionesContent;
        }

        const observacionesModalEl = document.getElementById('observacionesModal');
        if (observacionesModalEl) {
            const observacionesModal = new bootstrap.Modal(observacionesModalEl);
            observacionesModal.show();
        }

        // Resetear la búsqueda al abrir el modal
        const notepadSearchBar = document.getElementById('notepad-search-bar');
        const notepadSearchInput = document.getElementById('notepad-search-input');
        
        if (notepadSearchBar) {
            notepadSearchBar.classList.remove('visible');
        }
        if (notepadSearchInput) {
            notepadSearchInput.value = '';
            performSearch();
        }

        // Iniciar autoguardado cada 30 segundos
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        autoSaveInterval = setInterval(() => {
            const currentContent = textarea ? textarea.value : '';
            // Solo guardar si hay cambios respecto a lo último guardado
            if (currentContent !== originalObservacionesContent) {
                saveObservaciones(true); // true = modo silencioso
            }
        }, 30000);
    }
}

/**
 * Guardar cambios en observaciones
 * @param {boolean} silent - Si es modo silencioso (sin alertas)
 */
async function saveObservaciones(silent = false) {
    const textarea = document.getElementById('observacionesContent');
    if (!textarea) return false;

    const newContent = textarea.value;

    try {
        const response = await fetch(`/api/projects/${currentObservacionesId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ "OBSERVACIONES": newContent })
        });

        if (!response.ok) {
            throw new Error('Error al guardar observaciones');
        }

        // Actualizar datos locales
        if (window.ProjectsModule && window.ProjectsModule.allProjects) {
            const project = window.ProjectsModule.allProjects.find(p => p['Id Project'] === currentObservacionesId);
            if (project) {
                project['OBSERVACIONES'] = newContent;
            }
        }

        // Actualizar referencia original para evitar alerta al cerrar
        originalObservacionesContent = newContent;

        if (!silent && window.UtilsModule) {
            // La alerta de confirmación fue eliminada para una experiencia más fluida
            window.UtilsModule.showToast('Observaciones guardadas exitosamente', 'success');
        } else if (!silent) {
            console.log('Autoguardado de observaciones realizado.');
        }
        return true;
    } catch (error) {
        console.error(error);
        if (!silent && window.UtilsModule) {
            window.UtilsModule.showToast('Error al guardar: ' + error.message, 'error');
        }
        return false;
    }
}

/**
 * Realizar búsqueda en el contenido de observaciones
 */
function performSearch() {
    const notepadSearchInput = document.getElementById('notepad-search-input');
    const notepadTextarea = document.getElementById('observacionesContent');
    const notepadMatchCounter = document.getElementById('notepad-match-counter');
    
    if (!notepadTextarea) return;

    const searchTerm = notepadSearchInput ? notepadSearchInput.value : '';
    const content = notepadTextarea.value;
    
    // Resetear variables de búsqueda
    window.searchMatches = window.searchMatches || [];
    let currentMatchIndex = window.currentMatchIndex || -1;

    if (!searchTerm) {
        if (notepadMatchCounter) {
            notepadMatchCounter.textContent = '0/0';
        }
        return;
    }

    const regex = new RegExp(searchTerm, 'gi'); // g for global, i for case-insensitive
    let match;
    while ((match = regex.exec(content)) !== null) {
        window.searchMatches.push(match.index);
    }

    if (window.searchMatches.length > 0) {
        currentMatchIndex = 0;
        highlightMatch(currentMatchIndex, false); // Pasamos 'false' para no robar el foco
    } else {
        if (notepadMatchCounter) {
            notepadMatchCounter.textContent = '0/0';
        }
    }
}

/**
 * Resaltar coincidencia en el texto
 * @param {number} index - Índice de la coincidencia a resaltar
 * @param {boolean} setFocus - Si debe establecer el foco
 */
function highlightMatch(index, setFocus = true) {
    const notepadTextarea = document.getElementById('observacionesContent');
    if (!notepadTextarea || index < 0 || index >= (window.searchMatches || []).length) return;

    const start = window.searchMatches[index];
    const end = start + (document.getElementById('notepad-search-input')?.value || '').length;

    if (setFocus) {
        notepadTextarea.focus();
        notepadTextarea.setSelectionRange(start, end);
    }
}

/**
 * Navegar a la siguiente coincidencia
 */
function goToNextMatch() {
    const matches = window.searchMatches || [];
    let currentIndex = window.currentMatchIndex || -1;
    
    if (currentIndex < matches.length - 1) {
        currentIndex++;
    }
    
    window.currentMatchIndex = currentIndex;
    highlightMatch(currentIndex);
}

/**
 * Navegar a la coincidencia anterior
 */
function goToPreviousMatch() {
    const matches = window.searchMatches || [];
    let currentIndex = window.currentMatchIndex || -1;
    
    if (currentIndex > 0) {
        currentIndex--;
    }
    
    window.currentMatchIndex = currentIndex;
    highlightMatch(currentIndex);
}

/**
 * Reemplazar texto en la coincidencia actual
 */
function replaceMatch() {
    const notepadTextarea = document.getElementById('observacionesContent');
    const notepadSearchInput = document.getElementById('notepad-search-input');
    const notepadReplaceInput = document.getElementById('notepad-replace-input');
    
    if (!notepadTextarea || !notepadSearchInput || !notepadReplaceInput) return;
    
    const searchTerm = notepadSearchInput.value;
    const replaceTerm = notepadReplaceInput.value;
    const matches = window.searchMatches || [];
    let currentIndex = window.currentMatchIndex || -1;
    
    if (!searchTerm || !replaceTerm || currentIndex < 0 || currentIndex >= matches.length) return;
    
    const start = matches[currentIndex];
    const end = start + searchTerm.length;
    
    // Reemplazar el texto
    const content = notepadTextarea.value;
    const newContent = content.substring(0, start) + replaceTerm + content.substring(end);
    notepadTextarea.value = newContent;
    
    // Actualizar matches
    performSearch();
    
    // Mover al siguiente match
    goToNextMatch();
}

/**
 * Reemplazar todas las coincidencias
 */
function replaceAllMatches() {
    const notepadTextarea = document.getElementById('observacionesContent');
    const notepadSearchInput = document.getElementById('notepad-search-input');
    const notepadReplaceInput = document.getElementById('notepad-replace-input');
    
    if (!notepadTextarea || !notepadSearchInput || !notepadReplaceInput) return;
    
    const searchTerm = notepadSearchInput.value;
    const replaceTerm = notepadReplaceInput.value;
    
    if (!searchTerm || !replaceTerm) return;
    
    // Reemplazar globalmente
    const regex = new RegExp(searchTerm, 'gi');
    const content = notepadTextarea.value;
    const newContent = content.replace(regex, replaceTerm);
    notepadTextarea.value = newContent;
    
    // Actualizar búsqueda
    performSearch();
}

// Exportar funciones para uso global
window.ObservacionesModule = {
    openObservacionesModal,
    saveObservaciones,
    performSearch,
    highlightMatch,
    goToNextMatch,
    goToPreviousMatch,
    replaceMatch,
    replaceAllMatches
};
