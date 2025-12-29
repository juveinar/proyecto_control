/**
 * Obtiene el valor de una cookie por su nombre. Esencial para la protección CSRF de Django.
 * @param {string} name - El nombre de la cookie a obtener (ej. 'csrftoken').
 * @returns {string|null} - El valor de la cookie o null si no se encuentra.
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
const csrftoken = getCookie('csrftoken');

/**
 * Evento principal que se dispara cuando el contenido del DOM ha sido completamente cargado y parseado.
 * Todo el código de la aplicación se ejecuta dentro de este listener para asegurar que todos los
 * elementos HTML estén disponibles para ser manipulados por JavaScript.
 */
document.addEventListener('DOMContentLoaded', function () {

    /**
     * Función que permite que un modal de Bootstrap sea arrastrable por su cabecera.
     * @param {HTMLElement} modalElement - El elemento del DOM que representa al modal.
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
            e.preventDefault();

            isDragging = true;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;

            const rect = modalDialog.getBoundingClientRect();

            // Necesitamos cambiar a posicionamiento absoluto para mover el diálogo
            modalDialog.style.position = 'absolute';
            modalDialog.style.margin = 0; // Deshabilitar el margen automático de bootstrap

            // Establecer la posición inicial desde getBoundingClientRect
            // Esto solo necesita hacerse una vez
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

        // Cuando el modal se oculta, necesitamos restablecer su estilo
        // para que Bootstrap pueda reposicionarlo correctamente la próxima vez que se muestre.
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalDialog.style.position = '';
            modalDialog.style.top = '';
            modalDialog.style.left = '';
            modalDialog.style.margin = '';
        });
    }

        // =================================================================================
        // INICIALIZACIÓN DE VARIABLES Y CONSTANTES GLOBALES
        // =================================================================================
        const tableBody = document.getElementById('projects-table-body');
        const projectModalEl = document.getElementById('projectModal');
        const detailsModalEl = document.getElementById('detailsModal');
        const projectModal = new bootstrap.Modal(projectModalEl);
        const detailsModal = new bootstrap.Modal(detailsModalEl);

        makeModalDraggable(projectModalEl);
        makeModalDraggable(detailsModalEl);

        // Elementos de la interfaz de usuario para filtros y búsqueda
        const yearSelector = document.getElementById('year-selector');
        const searchInput = document.getElementById('searchInput');
        const notFinishedFilterSwitch = document.getElementById('notFinishedFilterSwitch');
        let projectsChart = null;
        let currentStatusFilter = 'not-finished'; // 'not-finished', 'finished', o null (todos)

        // Variables de estado para gestionar los datos y la paginación
        let allProjects = [];
        let allColumns = [];
        let currentVisibleProjectIds = [];
        let currentDetailProjectId = null;
        let selectedMonth = null;       // Almacena el mes seleccionado en el gráfico para filtrar la tabla.
        let selectedBarIndex = -1;      // Índice de la barra seleccionada en el gráfico.
        let originalBarColors = [];     // Almacena los colores originales de las barras del gráfico.
        let currentPage = 1;
        const projectsPerPage = 10;

        // Configuración de columnas para la tabla y los modales
        const visibleColumns = ['Id Project', 'Project', 'Estado', 'Fase', 'Start', 'Finish', 'RF'];
        const dateColumns = ['Start', 'Finish'];
const detailColumns = [
    'CONTACTO',
    'CANTIDAD MAQUINAS',
    'COD SERV_HOSTNAME',
    'PLATAFORMA',
    'SO',
    'WINDOWS LICENCIA ACTIVADA',
    'SCAN',
    'DOMINIO',
    'NTP',
    'Antivirus',
    'Base de Datos',
    'Balanceo',
    'Backup',
    'PLATAFORMA BACKUP',
    'CONFIG BACKUP',
    'PROVEEDOR',
    'COMUNIDAD SNMP',
    'MONITOREO NAGIOS',
    'MONITOREO ELASTIC',
    'UCMDB',
    'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)',
    'RT',
    'SERVICIO',
    'OBSERVACIONES',
    'CAMBIO PASO OPERACIÓN (OLA)',
    'Computo'
];
        const addProjectFields = ['Id Project', 'Project', 'Estado', 'Start', 'Finish', 'RF', 'CONTACTO', 'OBSERVACIONES'];
        const editExcludeFields = ['% Complete', 'Unnamed: 22', 'External Costs'];
        const masterFieldOrder = [
            'Id Project',
            'Project',
            'RF',
            'Estado',
            'Start',
            'Finish',
            'OBSERVACIONES',
            'CONTACTO',
            'CANTIDAD MAQUINAS',
            'COD SERV_HOSTNAME',
            'PLATAFORMA',
            'SO',
            'WINDOWS LICENCIA ACTIVADA',
            'DOMINIO',
            'NTP',
            'Antivirus',
            'SCAN',
            'Base de Datos',
            'Balanceo',
            'Backup',
            'PLATAFORMA BACKUP',
            'CONFIG BACKUP',
            'PROVEEDOR',
            'COMUNIDAD SNMP',
            'MONITOREO NAGIOS',
            'MONITOREO ELASTIC',
            'UCMDB',
            'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)',
            'RT',
            'SERVICIO',
            'CAMBIO PASO OPERACIÓN (OLA)',
            'Computo'
        ];

        // =================================================================================
        // FUNCIONES PRINCIPALES DE DATOS Y RENDERIZADO
        // =================================================================================

        /**
         * Obtiene todos los proyectos desde la API, los almacena en la variable `allProjects`
         * y dispara el renderizado inicial de la tabla y el gráfico.
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
                tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + 1}" class="text-center text-danger">Error al cargar los proyectos. Revisa la consola del navegador (F12) para más detalles.</td></tr>`;
            }
        }

        /**
         * Rellena el selector de años `<select>` con los años únicos extraídos de los
         * datos de los proyectos.
         */
        function populateYearSelector() {
            const years = [...new Set(allProjects.map(p => p.Start ? new Date(p.Start).getFullYear() : null))]
                .filter(y => y).sort((a, b) => b - a);
            yearSelector.innerHTML = '<option value="">Todos</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

            // No seleccionar automáticamente el año actual, dejar "Todos" por defecto
            // Esto permite ver todos los proyectos sin filtrar por año
            // const currentYear = new Date().getFullYear();
            // if (years.includes(currentYear)) {
            //     yearSelector.value = currentYear;
            // }
        }

        /**
         * Renderiza el gráfico de barras de "Proyectos Iniciados por Mes" usando Chart.js.
         * Obtiene los datos de la API de estadísticas.
         * @param {string|number} year - El año para el cual se deben obtener las estadísticas.
         */
        async function renderChart(year) {
            try {
                const url = year ? `/api/projects/stats?year=${year}` : '/api/projects/stats';
                const response = await fetch(url);
                const stats = await response.json();
                const ctx = document.getElementById('projectsChart').getContext('2d');
                if (projectsChart) { projectsChart.destroy(); }

                // Crea un gradiente de color para las barras del gráfico
                const gradient = ctx.createLinearGradient(0, ctx.canvas.height, 0, 0);
                gradient.addColorStop(0, 'rgba(88, 86, 214, 0.8)');
                gradient.addColorStop(0.25, 'rgba(0, 212, 255, 0.8)');
                gradient.addColorStop(0.5, 'rgba(0, 255, 196, 0.8)');
                gradient.addColorStop(0.75, 'rgba(255, 222, 0, 0.8)');

                // Guardar los colores originales para poder restaurarlos
                originalBarColors = Array(stats.labels.length).fill(gradient);

                projectsChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: stats.labels,
                        datasets: [{
                            label: 'Proyectos Iniciados',
                            data: stats.data,
                            backgroundColor: [...originalBarColors], // Usar una copia
                            borderColor: 'rgba(0, 170, 255, 1)',
                            borderWidth: 1,
                            borderRadius: 4,
                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        responsive: true,
                        layout: {
                            padding: {
                                bottom: 10
                            }
                        },
                        onClick: (event, elements) => {
                            if (elements.length > 0) {
                                const chartElement = elements[0];
                                const dataset = projectsChart.data.datasets[0]; // El único dataset que tenemos

                                // Restaurar el color de la barra previamente seleccionada
                                if (selectedBarIndex !== -1) {
                                    dataset.backgroundColor[selectedBarIndex] = originalBarColors[selectedBarIndex];
                                }

                                const monthIndex = chartElement.index;
                                selectedBarIndex = monthIndex;
                                dataset.backgroundColor[monthIndex] = '#ffde00'; // Color de resaltado amarillo
                                projectsChart.update();

                                // Filtra la tabla por el mes seleccionado y muestra el botón para limpiar el filtro
                                selectedMonth = monthIndex + 1; // Enero es 1, Febrero 2, etc.
                                renderTable();
                                document.getElementById('clearMonthFilterBtn').style.display = 'inline-block';
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#000',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                callbacks: {
                                    title: function(tooltipItems) {
                                        const dataIndex = tooltipItems[0].dataIndex;
                                        return stats.full_labels[dataIndex];
                                    }
                                }
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#00aaff', stepSize: 1 }, grid: { color: 'rgba(0, 170, 255, 0.1)' } },
                            x: { ticks: { color: '#00aaff', autoSkip: false, font: { size: 10 } }, grid: { display: false } }
                        }
                    }
                });
            } catch (error) {
                console.error("Error rendering chart:", error);
            }
        }

        /**
         * Devuelve contenido HTML estilizado (badges) para ciertos valores de celda.
         * @param {string|number} value - El valor de la celda a estilizar.
         * @returns {string} - El contenido HTML estilizado o el valor original.
         */
        function getStyledContent(value) {
            const s = String(value ?? '').trim().toLowerCase();
            if (s === 'finalizado') return `<span class="badge badge-ok">${value}</span>`;
            if (s === 'suspendido') return `<span class="badge bg-warning text-dark">${value}</span>`;
            if (s.includes('pendiente')) return `<span class="badge bg-danger">${value}</span>`;
            if (s.includes('en curso')) return `<span class="badge badge-en-curso">${value}</span>`;
            if (s.includes('mitigar')) return `<span class="badge bg-danger">${value}</span>`;
            if (s.includes('cancelado')) return `<span class="badge bg-secondary">${value}</span>`;
            return value;
        }

        /**
         * Renderiza la tabla de proyectos. Aplica los filtros activos (año, mes, búsqueda, no finalizados),
         * gestiona la paginación y actualiza los contadores de proyectos.
         */
        function renderTable() {
            tableBody.innerHTML = '';

            // Obtiene los valores actuales de los filtros
            const selectedYear = parseInt(yearSelector.value, 10);
            const searchTerm = searchInput.value.toLowerCase();

            let projectsToDisplay = [...allProjects];

            // Aplica filtro de año
            if (selectedYear) {
                projectsToDisplay = projectsToDisplay.filter(p => p.Start && new Date(p.Start).getFullYear() === selectedYear);
            }

            // Aplicar filtro de mes si está seleccionado
            if (selectedMonth) {
                projectsToDisplay = projectsToDisplay.filter(p => p.Start && (new Date(p.Start).getMonth() + 1) === selectedMonth);
            }

            // Actualiza los contadores de "Finalizados" y "No Finalizados"
            const finishedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'finalizado').length;
            const notFinishedCount = projectsToDisplay.length - finishedCount;
            document.getElementById('finished-count').textContent = finishedCount;
            document.getElementById('not-finished-count').textContent = notFinishedCount;

            // Sincronizar el estado del checkbox con el filtro actual
            notFinishedFilterSwitch.checked = currentStatusFilter === 'not-finished';

            // Aplica filtro de "No Finalizados"
            if (currentStatusFilter === 'not-finished') {
                projectsToDisplay = projectsToDisplay.filter(p => !p.Estado || String(p.Estado).trim().toLowerCase() !== 'finalizado');
            }

            // Aplica filtro de "Finalizados"
            if (currentStatusFilter === 'finished') {
                projectsToDisplay = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'finalizado');
            }

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
                visibleColumns.forEach(col => {
                    let value = project[col] ?? '-';
                    let cellContent = getStyledContent(value);
                    // Si la fecha de fin es anterior a hoy, la resalta en rojo
                    if (col === 'Finish' && value !== '-' && cellContent === value) {
                        const today = new Date(); today.setHours(0,0,0,0);
                        if (new Date(value) < today) cellContent = `<span class="overdue">${value}</span>`;
                    }
                    cells += `<td>${cellContent}</td>`;
                });
                cells += `<td><span title="Ver Detalles" onclick="openDetailsModal(${project['Id Project']})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill text-info action-icons" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg></span><span title="Editar" onclick="openEditModal(${project['Id Project']})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square text-primary action-icons" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.813z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg></span></td>`;
                tr.innerHTML = cells;
                tableBody.appendChild(tr);
            });
        }

        /**
         *
         * Muestra u oculta los controles de paginación y actualiza su estado.
         * @param {Array} filteredProjects - La lista de proyectos después de aplicar filtros.
         */
        function renderPagination(filteredProjects) {
            const totalProjects = filteredProjects.length;
            const totalPages = Math.ceil(totalProjects / projectsPerPage);
            const pageInfo = document.getElementById('page-info');
            const prevBtn = document.getElementById('prev-page-btn');
            const nextBtn = document.getElementById('next-page-btn');

            document.getElementById('pagination-container').style.display = 'flex';

            if (totalPages === 0) {
                pageInfo.textContent = 'Página 0 de 0';
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            } else {
                pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage === totalPages;
            }
        }

        /**
         * Configura y rellena el formulario del modal para agregar o editar un proyecto.
         * @param {object} [project={}] - El objeto del proyecto a editar. Si está vacío, se configura para agregar uno nuevo.
         */
        function setupModalForm(project = {}) {
            const isEdit = project && project['Id Project'];
            document.getElementById('projectModalLabel').textContent = isEdit ? `Editar Proyecto: ${project.Project}` : 'Agregar Nuevo Proyecto';
            document.getElementById('backToDetailsBtn').style.display = isEdit ? 'inline-block' : 'none';

            const faseSection = document.getElementById('fase-control-section');
            if (isEdit) {
                faseSection.style.display = 'block';
            } else {
                faseSection.style.display = 'none';
                document.getElementById('faseSelect').value = '';
                document.getElementById('faseDate').value = '';
            }

            const formContainer = document.querySelector('#projectForm .row');
            formContainer.innerHTML = ''; // Limpiar contenido anterior

            const fieldGroups = {
                'Detalles del Proyecto': ['Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO'],
                'Detalles de Cómputo': ['CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'DOMINIO', 'SERVICIO', 'Computo'],
                'Requisitos para Paso a Operación': ['WINDOWS LICENCIA ACTIVADA', 'NTP', 'Antivirus', 'SCAN', 'CONFIG BACKUP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)']
            };

            const checklistFields = new Set(fieldGroups['Requisitos para Paso a Operación']);
            const checklistOptions = ['Pendiente', 'En Curso', 'OK', 'N/A'];

            const generateFieldHtml = (col, proj) => {
                const value = proj[col] ?? '';
                let fieldHtml = '';

                // Determinar el contenedor y la clase de columna. 'Computo' y 'OBSERVACIONES' ocupan todo el ancho.
                const colClass = (col === 'Computo' || col === 'OBSERVACIONES') ? 'col-12' : 'col-md-6';

                if (isEdit && col === 'Estado') {
                    fieldHtml += `<div class="${colClass} mb-3"><label for="field-${col}" class="form-label">${col.toUpperCase()}</label><select class="form-select" id="field-${col}" name="${col}">`;
                    const options = { 'En Curso': 'En Curso', 'Finalizado': 'Finalizado', 'Cerrado': 'Cerrado', 'Suspendido': 'Suspendido' };
                    let currentStatus = 'En Curso';
                    const lowerCaseValue = String(value).trim().toLowerCase();
                    if (lowerCaseValue === 'finalizado') {
                        currentStatus = 'Finalizado';
                    } else if (lowerCaseValue === 'cerrado') {
                        currentStatus = 'Cerrado';
                    } else if (lowerCaseValue === 'suspendido') {
                        currentStatus = 'Suspendido';
                    }
                    for (const optValue in options) {
                        fieldHtml += `<option value="${optValue}" ${currentStatus === optValue ? 'selected' : ''}>${options[optValue]}</option>`;
                    }
                    fieldHtml += `</select></div>`;
                } else if (isEdit && checklistFields.has(col)) {
                    fieldHtml += `<div class="${colClass} mb-3"><label for="field-${col}" class="form-label">${col.replace(/_/g, ' ')}</label>`;
                    fieldHtml += `<select class="form-select" id="field-${col}" name="${col}">`;
                    checklistOptions.forEach(option => {
                        fieldHtml += `<option value="${option}" ${String(value).trim().toLowerCase() === option.toLowerCase() ? 'selected' : ''}>${option}</option>`;
                    });
                    fieldHtml += `</select></div>`;
                } else if (col === 'Computo' || col === 'OBSERVACIONES') {
                    fieldHtml = `<div class="col-12 mb-3"><label for="field-${col}" class="form-label">${col.toUpperCase()}</label><textarea class="form-control" id="field-${col}" name="${col}" rows="4">${value}</textarea></div>`;
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

                fieldHtml = `<div class="${colClass} mb-3"><label for="field-${col}" class="form-label">${col.toUpperCase()}</label><input type="${inputType}" class="form-control" id="field-${col}" name="${col}" value="${finalValue}" ${isReadOnly ? 'readonly' : ''}></div>`;
                }
                return fieldHtml;
            };

            let accordionHtml = '<div class="accordion" id="editAccordion">';
            Object.entries(fieldGroups).forEach(([groupName, fields], index) => {
                // Si no estamos en modo de edición (es decir, agregando un nuevo proyecto),
                // y el grupo actual no es "Detalles del Proyecto", lo saltamos.
                if (!isEdit && groupName !== 'Detalles del Proyecto') {
                    return; // Esto continúa con la siguiente iteración del bucle.
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
                    if ((isEdit && masterFieldOrder.includes(col)) || (!isEdit && addProjectFields.includes(col))) {
                       if (!editExcludeFields.includes(col)) {
                           accordionHtml += generateFieldHtml(col, project);
                       }
                    }
                });

                accordionHtml += `</div></div></div></div>`;
            });
            accordionHtml += '</div>';
            formContainer.innerHTML = accordionHtml;

            projectModal._element.addEventListener('shown.bs.modal', () => {
                formContainer.querySelectorAll('textarea').forEach(autoResizeTextarea);
            }, { once: true });
        }

        /**
         * Habilita o deshabilita los botones de navegación "Anterior" y "Siguiente"
         * en el modal de detalles.
         */
        function updateNavButtons() {
            const currentIndex = currentVisibleProjectIds.indexOf(currentDetailProjectId);
            document.getElementById('prevProjectBtn').disabled = currentIndex <= 0;
            document.getElementById('nextProjectBtn').disabled = currentIndex >= currentVisibleProjectIds.length - 1;
        }

        /**
         * Muestra los detalles de un proyecto específico en el modal de detalles.
         * @param {number} projectId - El ID del proyecto a mostrar.
         */
        function showProjectDetails(projectId) {
            currentDetailProjectId = projectId;
            const project = allProjects.find(p => p['Id Project'] === projectId);
            if (!project) return;

            document.getElementById('detailsModalLabel').textContent = `ID ${project['Id Project']} - ${project.Project}`;
            document.getElementById('editFromDetailsBtn').dataset.projectId = projectId;
            const detailsBody = document.getElementById('detailsModalBody');

            const fieldGroups = {
                'Detalles del Proyecto': ['Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO'],
                'Detalles de Cómputo': ['CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'DOMINIO', 'SERVICIO', 'Computo'],
                'Requisitos para Paso a Operación': ['WINDOWS LICENCIA ACTIVADA', 'NTP', 'Antivirus', 'SCAN', 'CONFIG BACKUP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)']
            };

            let detailsHtml = '<div class="accordion" id="detailsAccordion">';

            Object.entries(fieldGroups).forEach(([groupName, fields], index) => {
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
                    if (project.hasOwnProperty(col)) {
                        if (col === 'Computo') {
                            const computoValue = project[col] ?? '';
                            detailsHtml += `
                                <div class="col-12 mt-2">
                                    <label class="form-label detail-label">${col.toUpperCase()}:</label>
                                    <textarea class="form-control" rows="4" readonly>${computoValue}</textarea>
                                </div>`;
                        } else {
                            const value = project[col] ?? '';
                            let displayValue = getStyledContent(value);
                            detailsHtml += `<div class="col-md-6 mb-2"><span class="detail-label">${col.replace(/_/g, ' ').toUpperCase()}:</span> ${displayValue}</div>`;
                        }
                    }
                });

                detailsHtml += `</div></div></div></div>`;
            });

            detailsHtml += '</div>';
            detailsBody.innerHTML = detailsHtml;

            updateNavButtons();
        }

        /**
         * Ajusta automáticamente la altura de un elemento textarea para que se ajuste a su contenido.
         * @param {HTMLTextAreaElement} textarea - El elemento textarea a redimensionar.
         */
        function autoResizeTextarea(textarea) {
            if (!textarea) return;
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        }

        // =================================================================================
        // EVENT LISTENERS Y FUNCIONES EXPUESTAS GLOBALMENTE
        // =================================================================================

        // Función para actualizar el estado de un proyecto a través de la API
        window.updateProjectStatus = async (projectId, fieldName, newStatus) => {
            if (!confirm(`¿Estás seguro de que quieres cambiar el estado de "${fieldName}" a "${newStatus}" para el proyecto ID ${projectId}?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/projects/${projectId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ field_name: fieldName, new_status: newStatus })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al actualizar el estado del proyecto.');
                }

                // Actualizar los datos y re-renderizar las tablas
                await fetchProjects();
                displayAllPendientes();
                alert('Estado del proyecto actualizado correctamente.');

            } catch (error) {
                console.error("Error updating project status:", error);
                alert(`Error al actualizar el estado del proyecto: ${error.message}`);
            }
        };

        // Expone funciones en el objeto `window` para que puedan ser llamadas desde el HTML (onclick).

        // Abre el modal de detalles para un proyecto específico.
        window.openDetailsModal = (projectId) => {
            showProjectDetails(projectId);
            detailsModal.show();
            // Usar el evento 'shown' para redimensionar los textareas DESPUÉS de que el modal sea visible
            detailsModalEl.addEventListener('shown.bs.modal', () => {
                detailsModalEl.querySelectorAll('textarea').forEach(autoResizeTextarea);
            }, { once: true });
        };

        // Abre el modal de edición para un proyecto específico.
        window.openEditModal = (projectId) => {
            const project = allProjects.find(p => p['Id Project'] === projectId);
            setupModalForm(project);
            projectModal.show();
        };

        // Botón para agregar un nuevo proyecto.
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            setupModalForm();
            projectModal.show();
        });

        // Botón "Editar" dentro del modal de detalles.
        document.getElementById('editFromDetailsBtn').addEventListener('click', function() {
            const projectId = parseFloat(this.dataset.projectId);
            if (projectId) {
                detailsModal.hide();
                setTimeout(() => { openEditModal(projectId); }, 150);
            }
        });

        // Botón "Ver Detalles" dentro del modal de edición.
        document.getElementById('backToDetailsBtn').addEventListener('click', function() {
            const idField = document.getElementById('field-Id Project');
            const projectId = idField ? parseFloat(idField.value) : null;
            if (projectId) {
                projectModal.hide();
                setTimeout(() => { openDetailsModal(projectId); }, 150);
            }
        });

        // Botones de navegación "Anterior" y "Siguiente" en el modal de detalles.
        document.getElementById('prevProjectBtn').addEventListener('click', () => {
            const currentIndex = currentVisibleProjectIds.indexOf(currentDetailProjectId);
            if (currentIndex > 0) {
                showProjectDetails(currentVisibleProjectIds[currentIndex - 1]);
            }
        });

        document.getElementById('nextProjectBtn').addEventListener('click', () => {
            const currentIndex = currentVisibleProjectIds.indexOf(currentDetailProjectId);
            if (currentIndex < currentVisibleProjectIds.length - 1) {
                showProjectDetails(currentVisibleProjectIds[currentIndex + 1]);
            }
        });

        // Botón "Guardar" en el modal de agregar/editar.
document.getElementById('saveProjectBtn').addEventListener('click', async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto

    const form = document.getElementById('projectForm');
    const idField = document.getElementById('field-Id Project');
    const projectId = idField ? parseFloat(idField.value) : null;

    if (!projectId) {
        alert('El campo "Id Project" es obligatorio y debe ser un número.');
        return;
    }

    const isEdit = idField.hasAttribute('readonly');

    // Usar FormData para serializar correctamente todo el formulario
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Convertir el Id de proyecto a número
    if (data['Id Project']) {
        data['Id Project'] = parseFloat(data['Id Project']);
    }

    // Si es un nuevo proyecto, agregar la fase de Despliegue automáticamente
    if (!isEdit) {
        data.fase = 'Despliegue';
        data.fase_date = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }

    try {
        const response = await fetch(isEdit ? `/api/projects/${projectId}` : '/api/projects', {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to save project');
        }

        // Si la operación es exitosa, preparamos la transición al modal de detalles.
        // Usamos el evento 'hidden.bs.modal' para asegurar que el modal de edición se
        // haya cerrado completamente antes de abrir el de detalles.
        if (isEdit) {
            projectModalEl.addEventListener('hidden.bs.modal', async () => {
                await fetchProjects(); // Actualizar datos
                displayAllPendientes(); // Actualizar pendientes
                openDetailsModal(projectId); // Abrir detalles
            }, { once: true });
        } else {
             await fetchProjects();
             displayAllPendientes();
        }

        projectModal.hide();

    } catch (error) {
        console.error("Error saving project:", error);
        alert(`Error al guardar el proyecto: ${error.message}`);
    }
});

        // Doble clic en una fila de la tabla para abrir los detalles.
        tableBody.addEventListener('dblclick', function(event) {
            const row = event.target.closest('tr');
            if (row && row.dataset.id) {
                const projectId = parseFloat(row.dataset.id);
                if (!isNaN(projectId)) {
                    openDetailsModal(projectId);
                }
            }
        });

        // Doble clic en una fila de la tabla de pendientes para abrir los detalles.
        document.getElementById('pendientes-table-body').addEventListener('dblclick', function(event) {
            const row = event.target.closest('tr');
            if (row && row.dataset.id) {
                const projectId = parseFloat(row.dataset.id);
                if (!isNaN(projectId)) {
                    // Reutilizamos la función existente para abrir el modal de detalles
                    openDetailsModal(projectId);
                }
            }
        });

        /**
         * Busca y muestra los campos "pendientes" de todos los proyectos no finalizados en la tabla inferior.
         * Un campo se considera "pendiente" si su valor es "Pendiente".
         */
        function displayAllPendientes() {
            const pendientesTableBody = document.getElementById('pendientes-table-body');
            const pendientesTitle = document.getElementById('pendientes-title');
            pendientesTableBody.innerHTML = '';
            pendientesTitle.textContent = 'Resumen de Pendientes';

            // Filtrar proyectos que no están finalizados (FINALIZADO !== 'OK')
            const notFinishedProjects = allProjects.filter(p => !p.Estado || String(p.Estado).trim().toLowerCase() !== 'finalizado');

            if (notFinishedProjects.length > 0) {
                // Definir campos a excluir de la detección de pendientes/en curso
                const excludedKeysForPendientesCheck = new Set([
                    'Id Project', 'Project', 'Estado', 'Start', 'Finish', 'RF', 'Computo',
                    '% Complete', 'Unnamed: 22', 'Budget', 'Baseline Start', 'Baseline Finish', 'External Costs',
                    'RESUELVE POR NOMBRE', 'FGN 172.22.16.93'
                ]);

                // 1. Detectar dinámicamente todas las columnas que tienen al menos un "Pendiente" o "En curso"
                // y filtrar los proyectos que realmente tienen estos estados.
                const fieldsWithPendientes = new Set();
                const projectsWithRelevantPendientes = []; // Almacenará solo los proyectos que tienen pendientes/en curso

                notFinishedProjects.forEach(project => {
                    let hasRelevantStatus = false;
                    for (const key in project) {
                        // Omitir columnas excluidas
                        if (excludedKeysForPendientesCheck.has(key)) continue;

                        const normalizedValue = String(project[key] ?? '').trim().toLowerCase();
                        if (normalizedValue === 'pendiente' || normalizedValue === 'en curso') {
                            fieldsWithPendientes.add(key);
                            hasRelevantStatus = true; // Marcar el proyecto como relevante
                        }
                    }
                    if (hasRelevantStatus) {
                        projectsWithRelevantPendientes.push(project);
                    }
                });

                // Si no hay proyectos con estados "Pendiente" o "En curso", mostrar un mensaje y salir.
                if (projectsWithRelevantPendientes.length === 0) {
                    const pendientesTableHeader = document.querySelector('#pendientes-table-container thead tr');
                    pendientesTableHeader.innerHTML = '<th>Proyecto</th>'; // Restablecer encabezado
                    pendientesTableBody.innerHTML = `<tr><td colspan="1" class="text-center">No se encontraron proyectos con pendientes o en curso.</td></tr>`;
                    return;
                }

                // Función para normalizar los nombres de las columnas y agruparlas
                const getColumnTitle = (field) => {
                    if (field.startsWith('UCMDB Triara')) {
                        return 'UCMDB';
                    }
                    if (field === 'CAMBIO PASO OPERACIÓN (OLA)') {
                        return 'Cambio';
                    }
                    return field;
                };

                // Agrupar los campos originales bajo un título de columna normalizado
                const groupedFields = {};
                fieldsWithPendientes.forEach(field => {
                    const title = getColumnTitle(field);
                    if (!groupedFields[title]) {
                        groupedFields[title] = [];
                    }
                    groupedFields[title].push(field);
                });

                const displayColumns = Object.keys(groupedFields).sort();

                // 2. Generar el encabezado de la tabla dinámicamente con los títulos normalizados
                const pendientesTableHeader = document.querySelector('#pendientes-table-container thead tr');
                pendientesTableHeader.innerHTML = '<th>Proyecto</th>' +
                                                  displayColumns.map(title => `<th>${title}</th>`).join('');

                // 3. Llenar el cuerpo de la tabla
                projectsWithRelevantPendientes.forEach(project => { // Usar la lista filtrada
                    const tr = document.createElement('tr');
                    tr.dataset.id = project['Id Project']; // Asignar el ID del proyecto a la fila
                    let rowHtml = `<td><span class="project-name-link">${project.Project}</span></td>`; // Nombre del proyecto

                    displayColumns.forEach(title => {
                        const originalFields = groupedFields[title];
                        let cellContent = '';
                        // Comprobar si alguna de las columnas originales para este título tiene un estado relevante
                        for (const field of originalFields) {
                            const fieldValue = String(project[field] ?? '').trim().toLowerCase();
                            if (fieldValue === 'pendiente') {
                                cellContent = `<td class="text-center"><i class="bi bi-exclamation-triangle-fill icon-pendiente"></i></td>`;
                                break; // Encontramos un pendiente, no necesitamos seguir buscando
                            } else if (fieldValue === 'en curso') {
                                cellContent = `<td class="text-center"><i class="bi bi-clock-fill icon-en-curso"></i></td>`;
                                // No rompemos el bucle, por si hay un "pendiente" que tiene más prioridad
                            }
                        }
                        rowHtml += cellContent || '<td></td>'; // Añadir el contenido o una celda vacía
                    });
                    tr.innerHTML = rowHtml;
                    pendientesTableBody.appendChild(tr);
                });
            } else {
                const pendientesTableHeader = document.querySelector('#pendientes-table-container thead tr');
                pendientesTableHeader.innerHTML = '<th>Proyecto</th>'; // Restablecer encabezado si no hay proyectos
                pendientesTableBody.innerHTML = `<tr><td colspan="1" class="text-center">No se encontraron proyectos activos con pendientes.</td></tr>`;
            }
        }

        // Listeners para los filtros que recargan la tabla y el gráfico.
        yearSelector.addEventListener('change', (event) => {
            currentPage = 1;
            selectedMonth = null; // Limpiar filtro de mes al cambiar de año
            document.getElementById('clearMonthFilterBtn').style.display = 'none';
            renderTable();
            renderChart(event.target.value);
        });

        searchInput.addEventListener('input', () => { currentPage = 1; renderTable(); });

        fetchProjects().then(() => {
            displayAllPendientes(); // Carga inicial de todos los pendientes.
        }); // Carga inicial de los datos.

        // Botón para limpiar el filtro de mes aplicado desde el gráfico.
        document.getElementById('clearMonthFilterBtn').addEventListener('click', () => {
            currentPage = 1;
            selectedMonth = null;
            // Restaurar el color de la barra en el gráfico
            if (selectedBarIndex !== -1 && projectsChart) {
                projectsChart.data.datasets[0].backgroundColor[selectedBarIndex] = originalBarColors[selectedBarIndex];
                projectsChart.update();
                selectedBarIndex = -1;
            }
            renderTable();
            document.getElementById('clearMonthFilterBtn').style.display = 'none';
        });

        // Listeners para los botones de paginación.
        document.getElementById('prev-page-btn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
        document.getElementById('next-page-btn').addEventListener('click', () => {
            currentPage++;
            renderTable();
        });

        // Listeners para los botones de filtro de estado (tarjetas)
        const finishedCard = document.querySelector('.stat-card.finished');
        const notFinishedCard = document.querySelector('.stat-card.not-finished');

        function updateActiveCard() {
            finishedCard.classList.remove('active');
            notFinishedCard.classList.remove('active');
            if (currentStatusFilter === 'finished') {
                finishedCard.classList.add('active');
            } else if (currentStatusFilter === 'not-finished') {
                notFinishedCard.classList.add('active');
            }
        }

        finishedCard.addEventListener('click', () => {
            currentPage = 1;
            currentStatusFilter = currentStatusFilter === 'finished' ? null : 'finished';
            updateActiveCard();
            renderTable();
        });

        notFinishedCard.addEventListener('click', () => {
            currentPage = 1;
            currentStatusFilter = currentStatusFilter === 'not-finished' ? null : 'not-finished';
            updateActiveCard();
            renderTable();
        });

        // Listener para el nuevo checkbox de filtro
        notFinishedFilterSwitch.addEventListener('change', () => {
            currentPage = 1;
            currentStatusFilter = notFinishedFilterSwitch.checked ? 'not-finished' : null;
            updateActiveCard();
            renderTable();
        });
        // =================================================================================
        // LÓGICA DEL WIDGET DE EVENTOS
        // =================================================================================
        const eventWidget = document.getElementById('event-widget');
        const eventWidgetHeader = document.getElementById('event-widget-header');
        const eventToggleBtn = document.getElementById('event-toggle-btn');
        const nextEventContent = document.getElementById('next-event-content');
        const eventModalEl = document.getElementById('eventModal');
        const eventModal = new bootstrap.Modal(eventModalEl);
        makeModalDraggable(eventModalEl);
        let allEvents = [];
        let currentEventIndex = -1;
        let homeEventIndex = -1;
        let currentEditingEvent = null;

        /**
         * Muestra los detalles de un evento en el widget.
         * @param {number} index - El índice del evento en el array `allEvents`.
         */
        function displayEvent(index) {
            const homeBtn = document.getElementById('home-event-btn');
            if (index >= 0 && index < allEvents.length) {
                currentEventIndex = index;
                const event = allEvents[index];
                const startDate = new Date(event['Fecha de Inicio']);
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

                // Resalta la fecha si el evento está a menos de 24 horas y añade una clase de advertencia al botón principal.
                const now = new Date();
                const diffHours = (startDate - now) / (1000 * 60 * 60);
                let startDateClass = '';
                if (diffHours > 0 && diffHours <= 24) {
                    startDateClass = 'overdue'; // Reutilizamos la clase 'overdue' para el resaltado color #ff4d8a
                    eventToggleBtn.classList.add('warning');
                } else {
                    eventToggleBtn.classList.remove('warning');
                }

                nextEventContent.innerHTML = `
                    <h5>${event.Titulo}</h5>
                    <p><strong>Inicio:</strong> <span class="${startDateClass}">${startDate.toLocaleDateString('es-ES', options)}</span></p>
                    <p><strong>Lugar:</strong> ${event.Ubicacion || 'N/A'}</p>
                    ${event.Descripcion ? `<p><strong>Desc:</strong> ${event.Descripcion}</p>` : ''}
                `;
                // Asigna los eventos de clic para los botones de editar y eliminar.
                document.getElementById('delete-event-btn').onclick = () => deleteEvent(event);
                document.getElementById('edit-event-btn').onclick = () => editEvent(event);

                if (index === homeEventIndex) {
                    homeBtn.classList.add('active');
                } else {
                    homeBtn.classList.remove('active');
                }
            } else {
                nextEventContent.innerHTML = '<p>No hay eventos para mostrar.</p>';
                homeBtn.classList.remove('active');
            }
        }

        /**
         * Obtiene todos los eventos de la API, los ordena y muestra el próximo evento futuro.
         */
        async function fetchAllEvents() {
            try {
                const response = await fetch('/api/events');
                if (!response.ok) {
                    nextEventContent.innerHTML = '<p>No hay eventos próximos.</p>';
                    return;
                }
                allEvents = await response.json();

                // Ordena los eventos por fecha de inicio.
                allEvents.sort((a, b) => new Date(a['Fecha de Inicio']) - new Date(b['Fecha de Inicio']));

                // Encuentra el índice del próximo evento futuro.
                const now = new Date();
                homeEventIndex = allEvents.findIndex(event => new Date(event['Fecha de Inicio']) > now);

                // Si no hay eventos futuros, muestra el último evento pasado.
                if (homeEventIndex === -1 && allEvents.length > 0) {
                    homeEventIndex = allEvents.length - 1;
                }

                displayEvent(homeEventIndex);
                updateActiveCard(); // Asegura que la tarjeta activa se muestre al cargar
            } catch (error) {
                console.error("Error fetching events:", error);
                nextEventContent.innerHTML = '<p>Error al cargar eventos.</p>';
            }
        }

        // Funciones de navegación para el widget de eventos.
        function showNextEvent() {
            if (currentEventIndex < allEvents.length - 1) {
                displayEvent(currentEventIndex + 1);
            }
        }
        function showPreviousEvent() {
            if (currentEventIndex > 0) {
                displayEvent(currentEventIndex - 1);
            }
        }
        function showFirstEvent() {
            if (homeEventIndex !== -1) {
                displayEvent(homeEventIndex);
            } else {
                fetchAllEvents();
            }
        }

        /**
         * Elimina un evento.
         * @param {object} event - El objeto del evento a eliminar.
         */
        window.deleteEvent = async (event) => {
            if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${event.Titulo}"?`)) return;

            try {
                const response = await fetch(`/api/events/${event.id}`, { method: 'DELETE', headers: { 'X-CSRFToken': csrftoken } });
                if (!response.ok) throw new Error('Failed to delete event');
                fetchAllEvents(); // Actualizar los eventos
            } catch (error) {
                console.error("Error deleting event:", error);
                alert('Error al eliminar el evento.');
            }
        };

        /**
         * Edita un evento existente usando una serie de `prompt`.
         * @param {object} event - El objeto del evento a editar.
         */
        window.editEvent = async (event) => {
            if (!event) return;
            currentEditingEvent = event;
            // Preparar datos para los inputs del modal
            const startDate = event['Fecha de Inicio'] ? new Date(event['Fecha de Inicio']) : null;
            const endDate = event['Fecha de Fin'] ? new Date(event['Fecha de Fin']) : null;
            const toLocalInputValue = (d) => {
                if (!d) return '';
                const pad = (num) => num.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            document.getElementById('eventModalLabel').textContent = 'Editar Evento';
            document.getElementById('event-title').value = event.Titulo || '';
            document.getElementById('event-start').value = toLocalInputValue(startDate);
            document.getElementById('event-end').value = toLocalInputValue(endDate);
            document.getElementById('event-location').value = event['Ubicacion'] || '';
            document.getElementById('event-description').value = event['Descripcion'] || '';
            const hiddenIdInput = document.getElementById('event-id');
            if (hiddenIdInput) hiddenIdInput.value = event.id;

            eventModal.show();
        };

        // Botón para agregar un nuevo evento: abre el modal vacío
        document.getElementById('add-event-btn').addEventListener('click', () => {
            currentEditingEvent = null;
            document.getElementById('eventModalLabel').textContent = 'Nuevo Evento';
            document.getElementById('eventForm').reset();
            const hiddenIdInput = document.getElementById('event-id');
            if (hiddenIdInput) hiddenIdInput.value = '';
            eventModal.show();
        });

        // Guardar evento (nuevo o edición)
        document.getElementById('saveEventBtn').addEventListener('click', async () => {
            const titleInput = document.getElementById('event-title');
            const startInput = document.getElementById('event-start');
            const endInput = document.getElementById('event-end');
            const locationInput = document.getElementById('event-location');
            const descriptionInput = document.getElementById('event-description');
            const hiddenIdInput = document.getElementById('event-id');

            if (!titleInput.value.trim() || !startInput.value) {
                alert('Título y fecha de inicio son obligatorios.');
                return;
            }

            const toIsoStringLocal = (value) => {
                if (!value) return null;
                // value es "YYYY-MM-DDTHH:MM"
                const d = new Date(value);
                return d.toISOString();
            };

            const payload = {
                "Titulo": titleInput.value.trim(),
                "Fecha de Inicio": toIsoStringLocal(startInput.value),
                "Fecha de Fin": endInput.value ? toIsoStringLocal(endInput.value) : null,
                "Ubicacion": locationInput.value.trim(),
                "Descripcion": descriptionInput.value.trim()
            };

            const eventId = hiddenIdInput && hiddenIdInput.value ? hiddenIdInput.value : null;
            const isEditEvent = !!eventId;
            const url = isEditEvent ? `/api/events/${eventId}` : '/api/events';
            const method = isEditEvent ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error(isEditEvent ? 'Failed to update event' : 'Failed to add event');
                }
                await fetchAllEvents();
                if (homeEventIndex !== -1) {
                    displayEvent(homeEventIndex);
                }
                eventModal.hide();
            } catch (error) {
                console.error(isEditEvent ? "Error updating event:" : "Error adding event:", error);
                alert(isEditEvent ? 'Error al actualizar el evento.' : 'Error al agregar el evento.');
            }
        });

        // Listeners para los botones de navegación del widget de eventos.
        document.getElementById('next-event-btn').addEventListener('click', showNextEvent);
        document.getElementById('prev-event-btn').addEventListener('click', showPreviousEvent);
        document.getElementById('home-event-btn').addEventListener('click', showFirstEvent);

        // Muestra el widget al hacer clic en el botón de toggle.
        eventToggleBtn.addEventListener('click', () => {
            eventWidget.classList.add('visible');
        });

        // Cierra el widget si se hace clic fuera de él.
        document.addEventListener('click', (event) => {
            const isClickInsideWidget = eventWidget.contains(event.target);
            const isClickOnToggleBtn = eventToggleBtn.contains(event.target);

            if (!isClickInsideWidget && !isClickOnToggleBtn && eventWidget.classList.contains('visible')) {
                eventWidget.classList.remove('visible');
            }
        });

        fetchAllEvents();

        // ===================== Generar Informe con IA (widget de progreso flotante) =====================
        const generarInformeLink = document.getElementById('generarInformeIaLink');
        const informeProgressWidget = document.getElementById('informe-progress-widget');
        const informeProgressBar = document.getElementById('informeProgressBar');
        const informeProgressStatus = document.getElementById('informeProgressStatus');

        if (generarInformeLink && informeProgressWidget) {
            generarInformeLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const href = generarInformeLink.href;

                // Mostrar el widget
                informeProgressWidget.classList.add('visible');
                if (informeProgressBar) { informeProgressBar.style.width = '0%'; informeProgressBar.textContent = '0%'; }
                if (informeProgressStatus) { informeProgressStatus.textContent = 'Preparando generación...'; }

                // Simulación de progreso visual mientras se espera la respuesta
                let progress = 0;
                const progressInterval = setInterval(() => {
                    // Avanza lentamente hasta 90% mientras esperamos la respuesta
                    if (progress < 90) progress += Math.floor(Math.random() * 6) + 1; // +1..+6
                    if (progress > 90) progress = 90;
                    if (informeProgressBar) {
                        informeProgressBar.style.width = progress + '%';
                        informeProgressBar.textContent = progress + '%';
                    }
                }, 800);

                // AbortController para cancelar la petición si tarda demasiado
                const controller = new AbortController();
                const fetchTimeoutMs = 60 * 1000; // 60s
                const fetchTimeout = setTimeout(() => {
                    try { controller.abort(); } catch (e) {}
                }, fetchTimeoutMs);

                try {
                    const sep = href.includes('?') ? '&' : '?';
                    const res = await fetch(href + sep + 'xhr=1', {
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        signal: controller.signal
                    });
                    clearInterval(progressInterval);
                    clearTimeout(fetchTimeout);

                    if (!res.ok) {
                        if (informeProgressStatus) informeProgressStatus.textContent = `Error: ${res.status}`;
                        if (informeProgressBar) {
                            informeProgressBar.style.width = '100%';
                            informeProgressBar.textContent = 'Error';
                            informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                            informeProgressBar.style.backgroundColor = '#dc3545';
                        }
                        return;
                    }

                    // Intentar parsear JSON de forma segura. Si falla, mostrar contenido en nueva pestaña para debug.
                    let data = null;
                    const rawText = await res.text();
                    try {
                        data = JSON.parse(rawText);
                    } catch (err) {
                        console.error('Respuesta no es JSON:', err, rawText);
                        // Mostrar el HTML/texto crudo en nueva pestaña para debugging
                        try {
                            const debugBlob = new Blob([rawText], { type: 'text/html; charset=utf-8' });
                            const debugUrl = URL.createObjectURL(debugBlob);
                            window.open(debugUrl, '_blank');
                            setTimeout(() => { try { URL.revokeObjectURL(debugUrl); } catch(e){} }, 30000);
                        } catch (e) {
                            console.error('No se pudo abrir debug blob:', e);
                        }
                        if (informeProgressStatus) informeProgressStatus.textContent = 'Respuesta inválida del servidor (ver nueva pestaña)';
                        if (informeProgressBar) {
                            informeProgressBar.style.width = '100%';
                            informeProgressBar.textContent = 'Error';
                            informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                            informeProgressBar.style.backgroundColor = '#dc3545';
                        }
                        return;
                    }
                    if (!data || !data.success) {
                        if (informeProgressStatus) informeProgressStatus.textContent = data && data.message ? data.message : 'No se pudo generar el informe.';
                        if (informeProgressBar) {
                            informeProgressBar.style.width = '100%';
                            informeProgressBar.textContent = 'Error';
                            informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                            informeProgressBar.style.backgroundColor = '#dc3545';
                        }
                        return;
                    }

                    // Mostrar progreso final
                    if (informeProgressBar) {
                        informeProgressBar.style.width = '100%';
                        informeProgressBar.textContent = '100%';
                        informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                        informeProgressBar.style.backgroundColor = '#28a745';
                    }
                    if (informeProgressStatus) informeProgressStatus.textContent = 'Informe generado. Descargando...';

                    // Crear un blob con el HTML (inserta <base> para resolver rutas relativas) y abrirlo en una nueva pestaña
                    if (data.html) {
                        try {
                            let html = data.html;
                            // Si no existe ya una etiqueta <base>, la insertamos dentro de <head>
                            if (!/\<base\s/i.test(html)) {
                                html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}<base href="${window.location.origin}/">`);
                            }
                            const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
                            const blobUrl = URL.createObjectURL(blob);
                            window.open(blobUrl, '_blank');
                            if (informeProgressStatus) informeProgressStatus.textContent = 'Informe abierto en nueva pestaña.';

                            // Ocultar el widget después de un par de segundos
                            setTimeout(() => {
                                informeProgressWidget.classList.remove('visible');
                            }, 2000);

                            // Liberar el blob url eventualmente
                            setTimeout(() => { try { URL.revokeObjectURL(blobUrl); } catch(e){} }, 30000);
                        } catch (err) {
                            console.error('Error al abrir el informe en nueva pestaña:', err);
                            window.location.href = href;
                        }
                    } else {
                        // Fallback si no hay HTML, simplemente redirigir
                        window.location.href = href;
                    }
                } catch (error) {
                    clearInterval(progressInterval);
                    if (informeProgressStatus) informeProgressStatus.textContent = 'Error. Revisa la consola.';
                    if (informeProgressBar) {
                        informeProgressBar.style.width = '100%';
                        informeProgressBar.textContent = 'Error';
                        informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                        informeProgressBar.style.backgroundColor = '#dc3545';
                    }
                    console.error('Error generando informe IA:', error);
                }
            });
        }

});
