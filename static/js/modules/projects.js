/**
 * Módulo de gestión de proyectos
 * Contiene todas las funciones relacionadas con la gestión de proyectos
 */

// Variables globales para proyectos
let allProjects = [];
let allColumns = [];
let currentVisibleProjectIds = [];
let currentDetailProjectId = null;
let currentPage = 1;
const projectsPerPage = 10;

/**
 * Obtener todos los proyectos desde la API
 */
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        allProjects = await response.json();

        if (allProjects.length > 0) {
            // Obtiene los nombres de las columnas del primer proyecto
            allColumns = Object.keys(allProjects[0]);
            // Asegura que la columna 'Computo' exista, ya que es un campo especial
            if (!allColumns.includes('Computo')) {
                allColumns.push('Computo');
            }
            // Llena el selector de años y renderiza el gráfico con el año actual
            populateYearSelector();
            renderChart(yearSelector.value);
        }
        // Renderiza la tabla de proyectos
        renderTable();
    } catch (error) {
        console.error("Error fetching projects:", error);
        const tableBody = document.getElementById('projects-table-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + 1}" class="text-center text-danger">Error al cargar los proyectos. Revisa la consola del navegador (F12) para más detalles.</td></tr>`;
        }
    }
}

/**
 * Renderizar tabla de proyectos con filtros y paginación
 */
function renderTable() {
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Obtiene los valores actuales de los filtros
    const yearSelector = document.getElementById('year-selector');
    const searchInput = document.getElementById('searchInput');
    const selectedYear = parseInt(yearSelector?.value, 10);
    const searchTerm = searchInput?.value.toLowerCase();

    let projectsToDisplay = [...allProjects];

    // Aplica filtro de año
    if (selectedYear) {
        projectsToDisplay = projectsToDisplay.filter(p => p.Start && new Date(p.Start).getFullYear() === selectedYear);
    }

    // Actualiza los contadores de "Finalizados", "No Finalizados" y "Cerrados"
    const finishedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'finalizado').length;
    const notFinishedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'en curso').length;
    const closedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'cerrado').length;

    const finishedCountEl = document.getElementById('finished-count');
    const notFinishedCountEl = document.getElementById('not-finished-count');
    const closedCountEl = document.getElementById('closed-count');

    if (finishedCountEl) finishedCountEl.textContent = finishedCount;
    if (notFinishedCountEl) notFinishedCountEl.textContent = notFinishedCount;
    if (closedCountEl) closedCountEl.textContent = closedCount;

    // Aplica filtro de búsqueda
    if (searchTerm) {
        projectsToDisplay = projectsToDisplay.filter(project =>
            Object.values(project).some(value => String(value).toLowerCase().includes(searchTerm))
        );
    }

    // Ordenar por ID de proyecto (menor a mayor)
    projectsToDisplay.sort((a, b) => {
        const idA = Number(a['Id Project']) || 0;
        const idB = Number(b['Id Project']) || 0;
        return idA - idB;
    });

    // Renderiza los controles de paginación
    renderPagination(projectsToDisplay);

    // Obtiene la porción de proyectos para la página actual
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const paginatedProjects = projectsToDisplay.slice(startIndex, endIndex);

    currentVisibleProjectIds = projectsToDisplay.map(p => p['Id Project']);

    if (paginatedProjects.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + 1}" class="text-center">No hay proyectos para mostrar.</td></tr>`;
        return;
    }

    // Construye y añade las filas de la tabla
    paginatedProjects.forEach(project => {
        const tr = document.createElement('tr');
        tr.dataset.id = project['Id Project'];
        let cells = '';

        const visibleColumns = ['Id Project', 'Project', 'Estado', 'Fase', 'Start', 'Finish', 'RF'];

        visibleColumns.forEach(col => {
            let value = project[col] ?? '-';
            let cellContent = getStyledContent(value);
            // Si la fecha de fin es anterior a hoy, la resalta en rojo
            if (col === 'Finish' && value !== '-' && cellContent === value) {
                const today = new Date();
                today.setHours(0,0,0,0);
                if (new Date(value) < today) cellContent = `<span class="overdue">${value}</span>`;
            }
            cells += `<td>${cellContent}</td>`;
        });

        cells += `<td><span title="Ver Detalles" onclick="openDetailsModal(${project['Id Project']})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill text-info action-icons" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg></span><span title="Editar" onclick="openEditModal(${project['Id Project']})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square text-primary action-icons" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.813z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg></span></td>`;
        tr.innerHTML = cells;
        tableBody.appendChild(tr);
    });
}

/**
 * Renderizar controles de paginación
 */
function renderPagination(filteredProjects) {
    const totalProjects = filteredProjects.length;
    const totalPages = Math.ceil(totalProjects / projectsPerPage);
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
    }

    if (totalPages === 0) {
        if (pageInfo) pageInfo.textContent = 'Página 0 de 0';
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
    } else {
        if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    }
}

/**
 * Rellenar selector de años
 */
function populateYearSelector() {
    const yearSelector = document.getElementById('year-selector');
    if (!yearSelector) return;

    // Guardar el valor seleccionado actualmente para restaurarlo si es posible
    const currentSelection = yearSelector.value;

    // Extraer años evitando problemas de zona horaria
    const years = [...new Set(allProjects.map(p => {
        return p.Start ? parseInt(String(p.Start).substring(0, 4), 10) : null;
    }))].filter(y => y).sort((a, b) => b - a);

    yearSelector.innerHTML = '<option value="">Todos</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    // Restaurar la selección si el año aún existe en la lista
    if (currentSelection && years.includes(parseInt(currentSelection))) {
        yearSelector.value = currentSelection;
    }
}

/**
 * Configurar y rellenar formulario del modal para agregar o editar proyecto
 */
function setupModalForm(project = {}) {
    const isEdit = project && project['Id Project'];

    console.log('=== DEBUG SETUP MODAL FORM ===');
    console.log('isEdit:', isEdit);
    console.log('Proyecto:', project);
    console.log('Base de Datos:', project['Base de Datos']);
    console.log('Balanceo:', project['Balanceo']);
    console.log('=== FIN DEBUG SETUP MODAL FORM ===');

    const projectModalLabel = document.getElementById('projectModalLabel');
    const backToDetailsBtn = document.getElementById('backToDetailsBtn');
    const faseSection = document.getElementById('fase-control-section');

    if (projectModalLabel) {
        projectModalLabel.textContent = isEdit ? `Editar Proyecto: ${project.Project}` : 'Agregar Nuevo Proyecto';
    }

    if (backToDetailsBtn) {
        backToDetailsBtn.style.display = isEdit ? 'inline-block' : 'none';
    }

    if (faseSection) {
        faseSection.style.display = isEdit ? 'block' : 'none';
        if (!isEdit) {
            const faseSelect = document.getElementById('faseSelect');
            const faseDate = document.getElementById('faseDate');
            if (faseSelect) faseSelect.value = '';
            if (faseDate) faseDate.value = '';
        }
    }

    const formContainer = document.querySelector('#projectForm .row');
    if (!formContainer) return;

    formContainer.innerHTML = ''; // Limpiar contenido anterior

    const fieldGroups = {
        'Detalles del Proyecto': ['Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO', 'CAMBIO'],
        'Detalles de Cómputo': ['CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'DOMINIO', 'SERVICIO', 'Base de Datos', 'Balanceo', 'Computo'],
        'Requisitos para Paso a Operación': ['WINDOWS LICENCIA ACTIVADA', 'NTP', 'Antivirus', 'SCAN', 'CONFIG BACKUP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)']
    };

    console.log('=== DEBUG FIELD GROUPS EN SETUP ===');
    console.log('fieldGroups:', fieldGroups);
    console.log('=== FIN DEBUG FIELD GROUPS EN SETUP ===');

    const addProjectFields = ['Id Project', 'Project', 'Estado', 'Start', 'Finish', 'RF', 'CONTACTO', 'OBSERVACIONES'];
    const editExcludeFields = ['% Complete', 'Unnamed: 22', 'External Costs'];
    const masterFieldOrder = [
        'Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO', 'CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'WINDOWS LICENCIA ACTIVADA', 'DOMINIO', 'NTP', 'Antivirus', 'SCAN', 'Base de Datos', 'Balanceo', 'Backup', 'PLATAFORMA BACKUP', 'CONFIG BACKUP', 'PROVEEDOR', 'COMUNIDAD SNMP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)', 'RT', 'SERVICIO', 'CAMBIO', 'Computo'
    ];

    console.log('=== DEBUG MASTER FIELD ORDER ===');
    console.log('masterFieldOrder incluye Base de Datos:', masterFieldOrder.includes('Base de Datos'));
    console.log('masterFieldOrder incluye Balanceo:', masterFieldOrder.includes('Balanceo'));
    console.log('=== FIN DEBUG MASTER FIELD ORDER ===');

    const generateFieldHtml = (col, proj) => {
        const dataKey = col === 'CAMBIO' ? 'CAMBIO PASO OPERACIÓN (OLA)' : col;
        const value = proj[dataKey] ?? '';
        let fieldHtml = '';

        const colClass = (col === 'Computo' || col === 'OBSERVACIONES') ? 'col-12' : 'col-md-6';
        const dateColumns = ['Start', 'Finish'];

        if (isEdit && col === 'Estado') {
            const options = { 'En Curso': 'En Curso', 'Finalizado': 'Finalizado', 'Cerrado': 'Cerrado', 'Suspendido': 'Suspendido' };
            let currentStatus = 'En Curso';
            const lowerCaseValue = String(value).trim().toLowerCase();
            if (lowerCaseValue === 'finalizado') currentStatus = 'Finalizado';
            else if (lowerCaseValue === 'cerrado') currentStatus = 'Cerrado';
            else if (lowerCaseValue === 'suspendido') currentStatus = 'Suspendido';

            fieldHtml += `<div class="${colClass} mb-3"><label for="field-${col}" class="form-label">${col.toUpperCase()}</label><select class="form-select" id="field-${col}" name="${col}">`;
            for (const optValue in options) {
                fieldHtml += `<option value="${optValue}" ${currentStatus === optValue ? 'selected' : ''}>${options[optValue]}</option>`;
            }
            fieldHtml += `</select></div>`;
        } else if (col === 'Computo' || col === 'OBSERVACIONES') {
            fieldHtml = `<div class="col-12 mb-3"><label for="field-${col}" class="form-label">${col.toUpperCase()}</label><textarea class="form-control" id="field-${col}" name="${col}" rows="4">${value}</textarea></div>`;
        } else if (col === 'CONTACTO') {
            // Special handling for CONTACTO field - dropdown with add button
            fieldHtml = `<div class="col-md-6 mb-3">
                <label for="field-${col}" class="form-label">CONTACTO</label>
                <div class="d-flex gap-2">
                    <select class="form-select" id="field-${col}" name="${dataKey}">
                        <option value="">Seleccionar contacto...</option>
                    </select>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="add-contact-btn" title="Agregar nuevo contacto">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
                <small class="text-muted">Selecciona un contacto existente o agrega uno nuevo con el botón +</small>
            </div>`;
            // Load contacts for dropdown and set selected value if exists
            const contactoId = proj['CONTACTO_ID'] || null;
            if (window.ContactsModule) {
                window.ContactsModule.loadContactsForDropdown(contactoId);
            }
        } else {
            const isDate = dateColumns.includes(col);
            const isReadOnly = (isEdit && col === 'Id Project') || (!isEdit && col === 'Estado');
            const inputType = isDate ? 'date' : 'text';
            const formValue = inputType === 'date' && value ? value.split('T')[0] : value;

            // Para el modo de agregar, establecer el valor por defecto de 'Estado'
            let finalValue = formValue;
            if (!isEdit && col === 'Estado') {
                finalValue = 'En Curso';
            }

            fieldHtml = `<div class="${colClass} mb-3"><label for="field-${col}" class="form-label">${col.toUpperCase()}</label><input type="${inputType}" class="form-control" id="field-${col}" name="${dataKey}" value="${finalValue}" ${isReadOnly ? 'readonly' : ''}></div>`;
        }
        return fieldHtml;
    };

    let accordionHtml = '<div class="accordion" id="editAccordion">';
    Object.entries(fieldGroups).forEach(([groupName, fields], index) => {
        // Si no estamos en modo de edición, y el grupo actual no es "Detalles del Proyecto", lo saltamos
        if (!isEdit && groupName !== 'Detalles del Proyecto') {
            return;
        }

        const accordionId = `edit-collapse-${index}`;
        const headerId = `edit-header-${index}`;
        accordionHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${accordionId}" aria-expanded="true" aria-controls="${accordionId}">${groupName}</button>
                </h2>
                <div id="${accordionId}" class="accordion-collapse collapse show" aria-labelledby="${headerId}">
                    <div class="accordion-body"><div class="row">`;

        fields.forEach(col => {
            console.log(`--- SETUP Procesando campo: ${col} ---`);
            console.log(`isEdit: ${isEdit}`);
            console.log(`masterFieldOrder.includes(col): ${masterFieldOrder.includes(col)}`);
            console.log(`addProjectFields.includes(col): ${addProjectFields.includes(col)}`);
            console.log(`editExcludeFields.includes(col): ${editExcludeFields.includes(col)}`);

            if ((isEdit && masterFieldOrder.includes(col)) || (!isEdit && addProjectFields.includes(col))) {
               if (!editExcludeFields.includes(col)) {
                   console.log(`✅ SETUP Generando HTML para campo: ${col}`);
                   accordionHtml += generateFieldHtml(col, project);
               } else {
                   console.log(`❌ SETUP Campo excluido: ${col}`);
               }
            } else {
                console.log(`❌ SETUP Campo no cumple condiciones: ${col}`);
            }
        });

        accordionHtml += `</div></div></div></div>`;
    });
    accordionHtml += '</div>';
    formContainer.innerHTML = accordionHtml;

    // Auto-resize textareas when modal is shown
    const projectModalEl = document.getElementById('projectModal');
    if (projectModalEl) {
        projectModalEl.addEventListener('shown.bs.modal', () => {
            formContainer.querySelectorAll('textarea').forEach(autoResizeTextarea);
        }, { once: true });
    }

    // Listener para auto-actualizar fase cuando Estado cambia a "Cerrado"
    const estadoField = document.getElementById('field-Estado');
    if (estadoField) {
        estadoField.addEventListener('change', function() {
            if (this.value.toLowerCase() === 'cerrado') {
                // Auto-llenar fase con "CIERRE" y fecha actual
                const faseSelect = document.getElementById('faseSelect');
                const faseDate = document.getElementById('faseDate');
                if (faseSelect) faseSelect.value = 'CIERRE';
                if (faseDate) {
                    const today = new Date().toISOString().split('T')[0];
                    faseDate.value = today;
                }
            }
        });
    }
}

/**
 * Mostrar detalles de un proyecto específico en el modal
 */
function showProjectDetails(projectId) {
    currentDetailProjectId = projectId;
    const project = allProjects.find(p => p['Id Project'] === projectId);
    if (!project) {
        console.error('Project not found for ID:', projectId);
        return;
    }

    // Debug: Verificar los campos para este proyecto específico
    console.log('=== DEBUG SHOW PROJECT DETAILS ===');
    console.log('Proyecto seleccionado ID:', projectId);
    console.log('Proyecto completo:', project);
    console.log('Base de Datos:', project['Base de Datos']);
    console.log('Balanceo:', project['Balanceo']);
    console.log('=== FIN DEBUG ===');

    const detailsModalLabel = document.getElementById('detailsModalLabel');
    const editFromDetailsBtn = document.getElementById('editFromDetailsBtn');
    const detailsBody = document.getElementById('detailsModalBody');

    if (detailsModalLabel) {
        detailsModalLabel.textContent = `ID ${project['Id Project']} - ${project.Project}`;
    }
    if (editFromDetailsBtn) {
        editFromDetailsBtn.dataset.projectId = projectId;
    }

    if (!detailsBody) return;

    const fieldGroups = {
        'Detalles del Proyecto': ['Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO', 'CAMBIO'],
        'Detalles de Cómputo': ['CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'DOMINIO', 'SERVICIO', 'Base de Datos', 'Balanceo', 'Computo'],
        'Requisitos para Paso a Operación': ['WINDOWS LICENCIA ACTIVADA', 'NTP', 'Antivirus', 'SCAN', 'CONFIG BACKUP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)']
    };

    console.log('=== DEBUG FIELD GROUPS ===');
    console.log('fieldGroups:', fieldGroups);
    console.log('=== FIN DEBUG FIELD GROUPS ===');

    let detailsHtml = '<div class="accordion" id="detailsAccordion">';

    Object.entries(fieldGroups).forEach(([groupName, fields], index) => {
        console.log(`=== PROCESANDO GRUPO: ${groupName} ===`);
        console.log('Campos en este grupo:', fields);

        const accordionId = `details-collapse-${index}`;
        const headerId = `details-header-${index}`;

        detailsHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${accordionId}" aria-expanded="true" aria-controls="${accordionId}">
                        ${groupName}
                    </button>
                </h2>
                <div id="${accordionId}" class="accordion-collapse collapse show" aria-labelledby="${headerId}">
                    <div class="accordion-body"><div class="row">`;

        fields.forEach(col => {
            const dataKey = col === 'CAMBIO' ? 'CAMBIO PASO OPERACIÓN (OLA)' : col;

            console.log(`--- Procesando campo: ${col} ---`);
            console.log(`dataKey: ${dataKey}`);
            console.log(`project.hasOwnProperty(dataKey): ${project.hasOwnProperty(dataKey)}`);
            console.log(`Valor del campo: ${project[dataKey]}`);
            console.log(`Condición especial: ${col === 'Base de Datos' || col === 'Balanceo'}`);

            if (col === 'CONTACTO') {
                // Special handling for CONTACTO field - use direct contact info from project
                const contactoInfo = project['CONTACTO'] || 'Sin contacto asignado';
                const contactoId = project['CONTACTO_ID'] || null;

                detailsHtml += `
                    <div class="col-md-6 mb-2">
                        <span class="detail-label">CONTACTO:</span>
                        <div class="d-flex align-items-center gap-2">
                            <span>${contactoInfo}</span>
                            ${contactoId ? `
                                <div class="d-flex gap-1">
                                    <!-- Teams and Email buttons will be added here -->
                                </div>
                            ` : ''}
                        </div>
                    </div>`;

                // If there's a contact ID, load contact buttons asynchronously
                if (contactoId) {
                    loadContactButtons(project['Id Project'], contactoId);
                }
            } else if (project.hasOwnProperty(dataKey) || col === 'Base de Datos' || col === 'Balanceo') {
                console.log(`✅ Entrando a la condición para mostrar campo: ${col}`);

                if (col === 'Computo') {
                    const computoValue = project[col] ?? '';
                    console.log(`Generando HTML para Computo: ${computoValue}`);
                    detailsHtml += `
                        <div class="col-12 mt-2">
                            <label class="form-label detail-label">${col.toUpperCase()}:</label>
                            <textarea class="form-control" rows="4" readonly>${computoValue}</textarea>
                        </div>`;
                } else if (col === 'OBSERVACIONES') {
                    console.log('Generando HTML para OBSERVACIONES');
                    detailsHtml += `
                        <div class="col-md-6 mb-2">
                            <span class="detail-label">${col.toUpperCase()}:</span>
                            <button class="btn-ai-note" onclick="openObservacionesModal(${project['Id Project']})" title="Ver Observaciones">
                                <i class="bi bi-journal-text"></i>
                            </button>
                        </div>`;
                } else {
                    const value = project[dataKey] ?? '';
                    let displayValue = getStyledContent(value);
                    console.log(`Generando HTML para campo ${col}: valor=${value}, displayValue=${displayValue}`);
                    detailsHtml += `<div class="col-md-6 mb-2"><span class="detail-label">${col.replace(/_/g, ' ').toUpperCase()}:</span> ${displayValue}</div>`;
                }
            } else {
                console.log(`❌ No se cumple condición para campo: ${col}`);
            }
        });

        detailsHtml += `</div></div></div></div>`;
    });

    detailsHtml += '</div>';
    detailsBody.innerHTML = detailsHtml;

    updateNavButtons();
}

/**
 * Cargar botones de contacto (Teams, Email) para un proyecto específico
 */
async function loadContactButtons(projectId, contactId) {
    try {
        const response = await fetch('/api/contacts');
        const contacts = await response.json();
        const contact = contacts.find(c => c.id == contactId);

        if (contact && contact.correo) {
            // Find the buttons container in the details modal
            const buttonsContainer = document.querySelector(`#detailsModalBody .d-flex.gap-1`);

            if (buttonsContainer) {
                buttonsContainer.innerHTML = `
                    <a href="msteams:/l/chat/0/0?users=${contact.correo}" class="btn btn-sm btn-outline-primary" title="Chatear en Teams con ${contact.nombre}">
                        <i class="bi bi-microsoft-teams"></i>
                    </a>
                    <a href="mailto:${contact.correo}" class="btn btn-sm btn-outline-secondary" title="Enviar email a ${contact.nombre}">
                        <i class="bi bi-envelope"></i>
                    </a>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading contact buttons:', error);
    }
}

/**
 * Habilitar o deshabilitar botones de navegación en modal de detalles
 */
function updateNavButtons() {
    const currentIndex = currentVisibleProjectIds.indexOf(currentDetailProjectId);
    const prevBtn = document.getElementById('prevProjectBtn');
    const nextBtn = document.getElementById('nextProjectBtn');

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= currentVisibleProjectIds.length - 1;
}

/**
 * Abrir modal de detalles para un proyecto específico
 */
function openDetailsModal(projectId) {
    showProjectDetails(projectId);
    const detailsModalEl = document.getElementById('detailsModal');
    if (detailsModalEl) {
        const detailsModal = new bootstrap.Modal(detailsModalEl);
        detailsModal.show();

        // Auto-resize textareas cuando el modal sea visible
        detailsModalEl.addEventListener('shown.bs.modal', () => {
            detailsModalEl.querySelectorAll('textarea').forEach(autoResizeTextarea);
        }, { once: true });
    }
}

/**
 * Abrir modal de edición para un proyecto específico
 */
function openEditModal(projectId) {
    const project = allProjects.find(p => p['Id Project'] === projectId);
    if (project) {
        setupModalForm(project);
        const projectModalEl = document.getElementById('projectModal');
        if (projectModalEl) {
            const projectModal = new bootstrap.Modal(projectModalEl);
            projectModal.show();
        }
    }
}

/**
 * Guardar proyecto (nuevo o edición)
 */
async function saveProject() {
    const form = document.getElementById('projectForm');
    if (!form) return;

    const formData = new FormData(form);
    const data = {};

    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    const isEdit = data['Id Project'] && !isNaN(data['Id Project']);
    const url = isEdit ? `/api/projects/${data['Id Project']}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await fetchProjects();
            const projectModalEl = document.getElementById('projectModal');
            if (projectModalEl) {
                const projectModal = bootstrap.Modal.getInstance(projectModalEl);
                if (projectModal) projectModal.hide();
            }
            showToast(isEdit ? 'Proyecto actualizado exitosamente' : 'Proyecto agregado exitosamente', 'success');
        } else {
            throw new Error('Error al guardar el proyecto');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Error al guardar el proyecto: ' + error.message, 'error');
    }
}

// Exportar funciones para uso global
window.ProjectsModule = {
    fetchProjects,
    renderTable,
    renderPagination,
    populateYearSelector,
    setupModalForm,
    showProjectDetails,
    loadContactButtons,
    updateNavButtons,
    openDetailsModal,
    openEditModal,
    saveProject
};
