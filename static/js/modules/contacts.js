/**
 * Módulo de gestión de contactos
 * Contiene todas las funciones relacionadas con la gestión de contactos
 */

// Variables globales para contactos
let allContacts = [];
let currentEditingContactId = null;
let contactsCurrentPage = 1;
const contactsPerPage = 10;

/**
 * Función para cargar contactos en el selector desplegable
 * @param {number|null} selectedContactId - ID del contacto a seleccionar
 */
async function loadContactsForDropdown(selectedContactId = null) {
    try {
        const response = await fetch('/api/contacts/simple');
        const contacts = await response.json();
        
        const contactSelect = document.getElementById('field-CONTACTO');
        if (contactSelect) {
            // Limpiar opciones existentes excepto la primera
            contactSelect.innerHTML = '<option value="">Seleccionar contacto...</option>';
            
            // Eliminar duplicados basados en el nombre (case-insensitive)
            const uniqueContacts = contacts.filter((contact, index, self) => 
                self.findIndex(c => c.nombre.toLowerCase() === contact.nombre.toLowerCase()) === index
            );
            
            // Agregar contactos únicos al selector
            uniqueContacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.id;
                option.textContent = contact.nombre;
                if (contact.correo) {
                    option.textContent += ` (${contact.correo})`;
                }
                // Seleccionar si coincide con el valor
                if (selectedContactId && (contact.id == selectedContactId || contact.nombre === selectedContactId)) {
                    option.selected = true;
                }
                contactSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

/**
 * Obtener todos los contactos desde la API
 */
async function fetchAllContacts() {
    console.log('fetchAllContacts called');
    try {
        console.log('Fetching contacts from /api/contacts...');
        const response = await fetch('/api/contacts');
        console.log('Response status:', response.status);

        if (!response.ok) {
            console.error('Response not OK:', response.status);
            const emptyMessage = document.getElementById('contacts-empty-message');
            if (emptyMessage) {
                emptyMessage.textContent = 'Error al cargar contactos.';
                emptyMessage.style.display = 'block';
                const tableBody = document.getElementById('contacts-table-body');
                if (tableBody) {
                    const tableResponsive = tableBody.closest('.table-responsive');
                    if (tableResponsive) tableResponsive.style.display = 'none';
                }
            }
            return;
        }

        console.log('Parsing JSON response...');
        const rawContacts = await response.json();
        console.log('Raw contacts loaded:', rawContacts.length, 'items');

        // Group contacts by email or name to deduplicate and aggregate projects with their IDs
        const grouped = {};
        rawContacts.forEach(contact => {
            const key = contact.correo || contact.nombre;
            if (!key) return; // Skip contacts without a key

            if (!grouped[key]) {
                grouped[key] = {
                    ...contact,
                    proyectos: [] // Array of {id, nombre}
                };
            }
            const projectId = contact.proyecto_id;
            const projectName = contact.proyecto_nombre;

            if (projectId && projectName) {
                // Avoid duplicating projects
                if (!grouped[key].proyectos.some(p => p.id === projectId)) {
                    grouped[key].proyectos.push({ id: projectId, nombre: projectName });
                }
            }
        });
        allContacts = Object.values(grouped);
        console.log('Grouped contacts:', allContacts.length, 'items');

        // Update original contacts copy for search functionality
        window.originalAllContacts = [...allContacts];

        if (allContacts.length > 0) {
            console.log('First contact sample (grouped):', allContacts[0]);
        }

        // Reset to first page when loading new data
        contactsCurrentPage = 1;
        console.log('Calling renderContacts...');
        renderContacts();
    } catch (error) {
        console.error("Error fetching contacts:", error);
        const emptyMessage = document.getElementById('contacts-empty-message');
        if (emptyMessage) {
            emptyMessage.textContent = 'Error al cargar contactos.';
            emptyMessage.style.display = 'block';
            const tableBody = document.getElementById('contacts-table-body');
            if (tableBody) {
                const tableResponsive = tableBody.closest('.table-responsive');
                if (tableResponsive) tableResponsive.style.display = 'none';
            }
        }
    }
}

/**
 * Renderizar tabla de contactos con paginación
 */
function renderContacts() {
    console.log('renderContacts called, allContacts.length:', allContacts.length);

    const contactsTableBody = document.getElementById('contacts-table-body');
    const contactsEmptyMessage = document.getElementById('contacts-empty-message');

    if (!contactsTableBody) {
        console.error('contactsTableBody element not found!');
        return;
    }

    if (!contactsEmptyMessage) {
        console.error('contactsEmptyMessage element not found!');
        return;
    }

    if (allContacts.length === 0) {
        console.log('No contacts to display');
        contactsTableBody.innerHTML = '';
        contactsEmptyMessage.textContent = 'No hay contactos guardados.';
        contactsEmptyMessage.style.display = 'block';
        const tableResponsive = contactsTableBody.closest('.table-responsive');
        if (tableResponsive) tableResponsive.style.display = 'none';

        // Hide pagination
        const paginationDiv = document.getElementById('contacts-pagination');
        if (paginationDiv) paginationDiv.style.display = 'none';
        return;
    }

    console.log('Rendering contacts table with pagination...');
    contactsEmptyMessage.style.display = 'none';
    const tableResponsive = contactsTableBody.closest('.table-responsive');
    if (tableResponsive) tableResponsive.style.display = 'block';

    // Calculate pagination
    const totalPages = Math.ceil(allContacts.length / contactsPerPage);
    const startIndex = (contactsCurrentPage - 1) * contactsPerPage;
    const endIndex = Math.min(startIndex + contactsPerPage, allContacts.length);
    const paginatedContacts = allContacts.slice(startIndex, endIndex);

    console.log(`Showing page ${contactsCurrentPage} of ${totalPages}, contacts ${startIndex + 1}-${endIndex} of ${allContacts.length}`);

    const tableHTML = paginatedContacts.map(contact => {
        // Ensure data-contact-id is available for edit/delete functionality
        const contactId = contact.id || contact.Id_Project || contact.id_project;
        const projectsHtml = contact.proyectos && contact.proyectos.length > 0
            ? contact.proyectos.map(p => `<a href="#" onclick="openDetailsModal(${p.id}); return false;">${p.nombre}</a>`).join(', ')
            : 'Sin proyecto asignado';
        return `
        <div class="contact-list-item" data-contact-id="${contactId}">
            <div class="contact-info">
                <div><strong>${contact.nombre}</strong></div>
                <div class="small text-muted">${contact.correo || ''}</div>
                <div class="small text-muted">${contact.cargo || ''}${contact.cargo && contact.area ? ' / ' : ''}${contact.area || ''}</div>
                <div class="small">${projectsHtml}</div>
            </div>
            <div class="contact-actions d-flex gap-1">
                ${contact.correo ? `
                    <a href="msteams:/l/chat/0/0?users=${contact.correo}" class="btn btn-sm btn-outline-primary" title="Chatear en Teams"><i class="bi bi-microsoft-teams"></i></a>
                    <a href="mailto:${contact.correo}" class="btn btn-sm btn-outline-primary" title="Enviar Correo"><i class="bi bi-envelope-fill"></i></a>
                ` : ''}
                <button class="btn btn-sm btn-outline-secondary btn-edit-contact" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete-contact" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
            </div>
        </div>
    `;
    }).join('');

    console.log('Setting table HTML...');
    contactsTableBody.innerHTML = tableHTML;

    // Update pagination controls
    updateContactsPagination(startIndex + 1, endIndex, allContacts.length, totalPages);

    console.log('Table rendered successfully');
}

/**
 * Actualizar controles de paginación para contactos
 */
function updateContactsPagination(start, end, total, totalPages) {
    const paginationDiv = document.getElementById('contacts-pagination');
    const startSpan = document.getElementById('contacts-start');
    const endSpan = document.getElementById('contacts-end');
    const totalSpan = document.getElementById('contacts-total');
    const navUl = document.getElementById('contacts-pagination-nav');

    if (!paginationDiv || !startSpan || !endSpan || !totalSpan || !navUl) {
        console.error('Pagination elements not found');
        return;
    }

    // Update info text
    startSpan.textContent = start;
    endSpan.textContent = end;
    totalSpan.textContent = total;

    // Generate pagination buttons
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${contactsCurrentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${contactsCurrentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, contactsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === contactsCurrentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${contactsCurrentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${contactsCurrentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    navUl.innerHTML = paginationHTML;
    paginationDiv.style.display = 'flex';

    // Add click handler for pagination links
    navUl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to document click handler

        const pageLink = e.target.closest('.page-link');
        if (!pageLink || pageLink.classList.contains('disabled')) return;

        const page = parseInt(pageLink.dataset.page);
        console.log('Pagination clicked:', page, 'Current page:', contactsCurrentPage);

        if (page && page !== contactsCurrentPage && page >= 1 && page <= totalPages) {
            contactsCurrentPage = page;
            console.log('Changing to page:', page);
            renderContacts();
        }
    });
}

/**
 * Filtrar contactos basado en término de búsqueda
 * @param {string} searchTerm - Término de búsqueda
 */
function filterContacts(searchTerm) {
    const paginationControls = document.getElementById('contacts-pagination');
    const emptyMessage = document.getElementById('contacts-empty-message');

    // Normalize search term: remove accents, convert to lowercase, trim
    const normalizedSearchTerm = searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .trim();

    // Store original contacts if not already stored
    if (!window.originalAllContacts) {
        window.originalAllContacts = [...allContacts];
    }

    if (normalizedSearchTerm === '') {
        // If search is empty, restore all contacts
        allContacts = [...window.originalAllContacts];
        contactsCurrentPage = 1;
        renderContacts();

        // Show pagination for all contacts
        const totalPages = Math.ceil(allContacts.length / contactsPerPage);
        if (paginationControls) {
            paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
        }

        // Hide empty message
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
    } else {
        // Search through all original contacts
        const filteredContacts = window.originalAllContacts.filter(contact => {
            // Get all searchable fields from contact
            const searchableText = [
                contact.nombre || '',
                contact.telefono || '',
                contact.correo || '',
                contact.cargo || '',
                contact.area || '',
                contact.proyecto_nombre || '',
                (contact.proyecto && contact.proyecto.project) || ''
            ].join(' ').toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''); // Remove accents

            // More flexible search: check if any word of search term matches
            const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0);

            if (searchWords.length === 0) return true;

            // Check if ALL search words are found (AND logic)
            let isVisible = searchWords.every(word => searchableText.includes(word));

            // If no results with AND, try OR logic (any word matches)
            if (!isVisible && searchWords.length > 1) {
                isVisible = searchWords.some(word => searchableText.includes(word));
            }

            return isVisible;
        });

        // Update allContacts with filtered results and render
        allContacts = filteredContacts;
        contactsCurrentPage = 1;
        renderContacts();

        // Hide pagination during search
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }

        // Show empty message if no results
        if (emptyMessage) {
            if (filteredContacts.length === 0) {
                emptyMessage.textContent = `No se encontraron contactos con "${searchTerm}"`;
                emptyMessage.style.display = 'block';
            } else {
                emptyMessage.style.display = 'none';
            }
        }
    }
}

/**
 * Guardar contacto (nuevo o edición)
 */
async function saveContact() {
    console.log('=== SAVING CONTACT ===');
    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('Contact form not found');
        return;
    }

    if (!form.checkValidity()) {
        console.log('Form validation failed');
        form.reportValidity();
        return;
    }

    const nombreElement = document.getElementById('contact-nombre');
    const correoElement = document.getElementById('contact-correo');
    const telefonoElement = document.getElementById('contact-telefono');
    const cargoElement = document.getElementById('contact-cargo');
    const areaElement = document.getElementById('contact-area');
    const notasElement = document.getElementById('contact-notas');
    const proyectoElement = document.getElementById('contact-proyecto');

    const payload = {
        nombre: nombreElement ? nombreElement.value : '',
        telefono: telefonoElement ? telefonoElement.value : null,
        correo: correoElement ? correoElement.value : null,
        cargo: cargoElement ? cargoElement.value : null,
        area: areaElement ? areaElement.value : null,
        notas: notasElement ? notasElement.value : null,
        proyecto_id: proyectoElement && proyectoElement.value ? parseInt(proyectoElement.value) : null,
    };

    console.log('Form data being sent:', payload);
    console.log('Current editing contact ID:', currentEditingContactId);

    const isEdit = !!currentEditingContactId;
    const url = isEdit ? `/api/contacts/${currentEditingContactId}` : '/api/contacts';
    const method = isEdit ? 'PUT' : 'POST';

    console.log(`Making ${method} request to: ${url}`);
    console.log('Request payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`No se pudo guardar el contacto. Status: ${response.status}, Error: ${errorText}`);
        }

        const responseData = await response.json();
        console.log('Success response:', responseData);

        // Save current state before refreshing
        const searchInput = document.getElementById('contacts-search-input');
        const currentSearch = searchInput ? searchInput.value : '';
        const currentPageBeforeSave = contactsCurrentPage;

        console.log('Saving state before refresh:', {
            search: currentSearch,
            page: currentPageBeforeSave
        });

        await fetchAllContacts();
        const contactModal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        if (contactModal) contactModal.hide();

        // Restore state after refresh
        if (currentSearch) {
            // If there was a search, restore it
            console.log('Restoring search:', currentSearch);
            if (searchInput) {
                searchInput.value = currentSearch;
                filterContacts(currentSearch);
            }
        } else {
            // If no search, restore the page
            console.log('Restoring page:', currentPageBeforeSave);
            contactsCurrentPage = currentPageBeforeSave;
            renderContacts();
        }

        // Show success message
        const successMsg = isEdit ? 'Contacto actualizado exitosamente' : 'Contacto agregado exitosamente';
        showToast(successMsg, 'success');

    } catch (error) {
        console.error("Error saving contact:", error);
        showToast(`Error al guardar: ${error.message}`, 'error');
    }
}

/**
 * Eliminar contacto
 * @param {number} contactId - ID del contacto a eliminar
 */
async function deleteContact(contactId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) return;

    try {
        // Save current state before refreshing
        const searchInput = document.getElementById('contacts-search-input');
        const currentSearch = searchInput ? searchInput.value : '';
        const currentPageBeforeDelete = contactsCurrentPage;

        console.log('Saving state before delete:', {
            search: currentSearch,
            page: currentPageBeforeDelete
        });

        const response = await fetch(`/api/contacts/${contactId}`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });

        if (!response.ok && response.status !== 204) {
            throw new Error('No se pudo eliminar el contacto.');
        }

        await fetchAllContacts();

        // Restore state after refresh
        if (currentSearch) {
            // If there was a search, restore it
            console.log('Restoring search after delete:', currentSearch);
            if (searchInput) {
                searchInput.value = currentSearch;
                filterContacts(currentSearch);
            }
        } else {
            // If no search, restore page (adjust if needed)
            console.log('Restoring page after delete:', currentPageBeforeDelete);
            const totalPages = Math.ceil(allContacts.length / contactsPerPage);
            contactsCurrentPage = Math.min(currentPageBeforeDelete, totalPages);
            renderContacts();
        }

        showToast('Contacto eliminado exitosamente', 'success');

    } catch (error) {
        console.error("Error deleting contact:", error);
        showToast(`Error al eliminar: ${error.message}`, 'error');
    }
}

/**
 * Abrir modal de contacto (nuevo o edición)
 * @param {Object|null} contact - Datos del contacto a editar, null para nuevo
 */
function openContactModal(contact = null) {
    console.log('Opening contact modal for:', contact);

    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('Contact form not found');
        return;
    }

    // Load projects dropdown if not already loaded
    const select = document.getElementById('contact-proyecto');
    if (select && select.children.length <= 1) {
        loadProjectsDropdown();
    }

    // Show modal first
    const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
    contactModal.show();

    // Wait for modal to be fully visible
    setTimeout(() => {
        if (contact) {
            console.log('Edit mode - contact:', contact);
            currentEditingContactId = contact.id;

            // Update modal title
            const modalTitle = document.getElementById('contactModalLabel');
            if (modalTitle) {
                modalTitle.textContent = 'Editar Contacto';
            }

            // Set all field values
            const fields = [
                { id: 'contact-id', value: contact.id },
                { id: 'contact-nombre', value: contact.nombre || '' },
                { id: 'contact-telefono', value: contact.telefono || '' },
                { id: 'contact-correo', value: contact.correo || '' },
                { id: 'contact-cargo', value: contact.cargo || '' },
                { id: 'contact-area', value: contact.area || '' },
                { id: 'contact-notas', value: contact.notas || '' },
                { id: 'contact-proyecto', value: contact.proyecto_id || '' }
            ];

            fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = field.value;

                    // For selects, handle option selection with debugging
                    if (element.tagName === 'SELECT' && field.value) {
                        console.log(`Setting project select to value: ${field.value}`);
                        setTimeout(() => {
                            const option = element.querySelector(`option[value="${field.value}"]`);
                            console.log(`Found option for value ${field.value}:`, !!option);
                            if (option) {
                                option.selected = true;
                                console.log(`Project selected: ${option.textContent}`);
                            } else {
                                console.log(`No option found for value ${field.value}`);
                                console.log('Available options:', Array.from(element.options).map(opt => ({value: opt.value, text: opt.textContent})));
                            }
                        }, 200);
                    }
                } else {
                    console.log(`Field element not found: ${field.id}`);
                }
            });

        } else {
            console.log('Add mode - clearing form');
            currentEditingContactId = null;

            // Clear all form fields
            const fieldsToClear = [
                'contact-id',
                'contact-nombre',
                'contact-telefono',
                'contact-correo',
                'contact-cargo',
                'contact-area',
                'contact-notas',
                'contact-proyecto'
            ];

            fieldsToClear.forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = '';
                    console.log(`Cleared field: ${fieldId}`);
                } else {
                    console.log(`Field not found for clearing: ${fieldId}`);
                }
            });

            // Update modal title
            const modalTitle = document.getElementById('contactModalLabel');
            if (modalTitle) {
                modalTitle.textContent = 'Agregar Nuevo Contacto';
            }
        }

    }, 300);
}

/**
 * Cargar proyectos en el selector desplegable del modal de contacto
 */
async function loadProjectsDropdown() {
    console.log('=== LOADING PROJECTS DROPDOWN ===');
    try {
        console.log('Fetching projects from /api/projects...');
        const response = await fetch('/api/projects');
        console.log('Projects API response status:', response.status);

        if (!response.ok) {
            console.error('Failed to load projects, status:', response.status);
            return;
        }

        const projects = await response.json();
        console.log('Projects data received:', projects.length, 'items');

        const select = document.getElementById('contact-proyecto');
        console.log('Projects select element found:', !!select);

        if (!select) {
            console.error('Projects select not found');
            return;
        }

        console.log('Current select options before clearing:', select.children.length);
        console.log('Current select HTML:', select.innerHTML);

        // Clear existing options except first one
        select.innerHTML = '<option value="">Seleccionar proyecto</option>';
        console.log('Select cleared');

        // Add projects to dropdown
        projects.forEach((project, index) => {
            console.log(`Adding project ${index}:`, project);
            console.log(`Project ID fields:`, {
                id_project: project.id_project,
                id: project.id,
                Id_Project: project.Id_Project,
                ID_Project: project.ID_Project
            });

            const option = document.createElement('option');
            // Try different possible ID field names
            const projectId = project.id_project || project.id || project.Id_Project || project.ID_Project || project['id_project'] || project['Id Project'];
            console.log(`Using project ID: ${projectId} for project: ${project.project || project.Project}`);

            option.value = projectId;
            option.textContent = project.project || project.Project || `Project ${index}`;
            select.appendChild(option);
        });

        console.log(`Loaded ${projects.length} projects in dropdown`);
        console.log('Final select options count:', select.children.length);

    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Exportar funciones para uso global
window.ContactsModule = {
    loadContactsForDropdown,
    fetchAllContacts,
    renderContacts,
    filterContacts,
    saveContact,
    deleteContact,
    openContactModal,
    loadProjectsDropdown
};
