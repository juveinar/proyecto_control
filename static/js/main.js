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
            // Evitar arrastre si el modal está maximizado (clase de Bootstrap)
            if (modalDialog.classList.contains('modal-fullscreen')) {
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
        const pendientesTableBody = document.getElementById('pendientes-table-body');
        const projectModalEl = document.getElementById('projectModal');
        const detailsModalEl = document.getElementById('detailsModal');
        const projectModal = new bootstrap.Modal(projectModalEl);
        const detailsModal = new bootstrap.Modal(detailsModalEl);
        const observacionesModalEl = document.getElementById('observacionesModal');
        const observacionesModal = new bootstrap.Modal(observacionesModalEl);

        // Elementos de la barra de búsqueda del bloc de notas
        const notepadSearchBar = document.getElementById('notepad-search-bar');
        const notepadSearchInput = document.getElementById('notepad-search-input');
        const notepadReplaceInput = document.getElementById('notepad-replace-input');
        const notepadMatchCounter = document.getElementById('notepad-match-counter');
        const notepadTextarea = document.getElementById('observacionesContent');

        makeModalDraggable(projectModalEl);
        makeModalDraggable(detailsModalEl);
        makeModalDraggable(observacionesModalEl);

        // Elementos de la interfaz de usuario para filtros y búsqueda
        const yearSelector = document.getElementById('year-selector');
        const searchInput = document.getElementById('searchInput');
        const notFinishedFilterSwitch = document.getElementById('notFinishedFilterSwitch');
        let projectsChart = null;
        let currentStatusFilter = 'not-finished'; // 'not-finished', 'finished', 'closed', o null (todos)

        // Variables de estado para gestionar los datos y la paginación
        let allProjects = [];
        let allColumns = [];
        let currentVisibleProjectIds = [];
        let currentDetailProjectId = null;
        let currentObservacionesId = null;
        let originalObservacionesContent = '';
        // Estado de la búsqueda en el bloc de notas
        let searchMatches = [];
        let currentMatchIndex = -1;
        let autoSaveInterval = null;
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
    'CAMBIO',
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
            'CAMBIO',
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

        // ========================
        // Menú contextual rápido para cambiar estado (click derecho)
        // ========================
        // Crear contenedor del menú si no existe
        let quickStatusMenu = document.getElementById('quick-status-menu');
        if (!quickStatusMenu) {
            quickStatusMenu = document.createElement('div');
            quickStatusMenu.id = 'quick-status-menu';
            quickStatusMenu.style.position = 'absolute';
            quickStatusMenu.style.zIndex = 9999;
            quickStatusMenu.style.padding = '6px';
            quickStatusMenu.style.borderRadius = '6px';
            quickStatusMenu.style.background = 'var(--ai-surface)';
            quickStatusMenu.style.color = 'var(--ai-text)';
            quickStatusMenu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
            quickStatusMenu.style.display = 'none';
            quickStatusMenu.style.minWidth = '120px';
            quickStatusMenu.innerHTML = `
                <div class="d-flex justify-content-between" style="gap:8px">
                    <button class="quick-status-btn" data-status="En Curso" title="En Curso"><i class="bi bi-clock-fill" style="color:#ffde00;font-size:16px"></i></button>
                    <button class="quick-status-btn" data-status="Pendiente" title="Pendiente"><i class="bi bi-exclamation-triangle-fill" style="color:#ff4d8a;font-size:16px"></i></button>
                    <button class="quick-status-btn" data-status="OK" title="OK"><i class="bi bi-check-circle-fill" style="color:#00ffc4;font-size:16px"></i></button>
                    <button class="quick-status-btn" data-status="N/A" title="N/A"><i class="bi bi-dash-circle-fill" style="color:var(--ai-secondary);font-size:16px"></i></button>
                </div>
            `;
            document.body.appendChild(quickStatusMenu);
        }

        let lastContextTarget = null;
        let suppressDocumentClick = false;

        // Mostrar menú contextual al hacer click derecho o click izquierdo sobre una celda relevante
        const resolvePendienteTarget = (elem) => {
            if (!elem) return null;
            const bySpan = elem.closest('.pendiente-cell');
            if (bySpan) return bySpan;
            const td = elem.closest('td');
            if (td) return td.querySelector('.pendiente-cell');
            return null;
        };

        const showQuickMenu = (e, targetElem) => {
            e.preventDefault();
            // Evitar que el click burbujee hasta el document y cierre el menú inmediatamente
            if (e.stopPropagation) e.stopPropagation();
            const target = resolvePendienteTarget(targetElem || e.target);
            if (!target) return;
            lastContextTarget = target;
            quickStatusMenu.style.left = `${e.pageX}px`;
            quickStatusMenu.style.top = `${e.pageY}px`;
            quickStatusMenu.style.display = 'block';
            // Evitar que el siguiente click global cierre el menú inmediatamente
            suppressDocumentClick = true;
            setTimeout(() => { suppressDocumentClick = false; }, 350);
            // Ajustar si sale de la pantalla
            const mr = quickStatusMenu.getBoundingClientRect();
            if (mr.right > window.innerWidth) {
                quickStatusMenu.style.left = `${Math.max(8, e.pageX - (mr.width + 8))}px`;
            }
            if (mr.bottom > window.innerHeight) {
                quickStatusMenu.style.top = `${Math.max(8, e.pageY - (mr.height + 8))}px`;
            }
        };

        pendientesTableBody.addEventListener('contextmenu', function (e) {
            const resolved = resolvePendienteTarget(e.target);
            if (!resolved) return; // no es una celda objetivo
            showQuickMenu(e, e.target);
        });

        // Usar PointerEvent para manejar clicks (evita APIs obsoletas como mozInputSource)
        pendientesTableBody.addEventListener('pointerdown', function (e) {
            try {
                // e.button === 0 -> izquierdo, 2 -> derecho
                const resolved = resolvePendienteTarget(e.target);
                if (!resolved) return;
                // Sólo reaccionar a eventos de puntero primario (evita touches secundarios)
                if (e.isPrimary === false) return;
                // Para botones físicos: mostrar el menú en izquierdo (0)
                if (e.button === 0) {
                    // Crear un synthetic event-like object to pass position
                    showQuickMenu(e, e.target);
                }
                // Para el botón derecho, el evento 'contextmenu' se encargará
            } catch (err) {
                console.warn('pointerdown handler error', err);
            }
        });

        // Manejar la selección de un nuevo estado desde el menú
        quickStatusMenu.addEventListener('click', async function (e) {
            const btn = e.target.closest('.quick-status-btn');
            if (!btn || !lastContextTarget) return;
            const newStatus = btn.dataset.status;
            const projectId = lastContextTarget.dataset.projectId;
            const fieldName = lastContextTarget.dataset.field;
            if (!projectId || !fieldName) {
                alert('No se pudo identificar el proyecto o el campo.');
                quickStatusMenu.style.display = 'none';
                return;
            }
            // Petición AJAX para actualizar el estado del campo
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
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || 'Error al actualizar estado');
                }
                // Actualizar vista de pendientes y tabla
                await fetchProjects();
                displayAllPendientes();
            } catch (err) {
                console.error('Error actualizando estado rápido:', err);
                alert('Error al actualizar estado: ' + err.message);
            } finally {
                quickStatusMenu.style.display = 'none';
                lastContextTarget = null;
            }
        });

        // Ocultar menú al hacer clic fuera o presionar ESC
        document.addEventListener('click', function (e) {
            if (suppressDocumentClick) return; // ignorar el primer click después de abrir el menú
            if (!quickStatusMenu.contains(e.target)) {
                quickStatusMenu.style.display = 'none';
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') quickStatusMenu.style.display = 'none';
        });

        /**
         * Rellena el selector de años `<select>` con los años únicos extraídos de los
         * datos de los proyectos.
         */
        function populateYearSelector() {
            // Guardar el valor seleccionado actualmente para restaurarlo si es posible
            const currentSelection = yearSelector.value;

            // Extraer años evitando problemas de zona horaria (usando substring en lugar de Date)
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
         * Renderiza el gráfico de barras de "Proyectos Iniciados por Mes" usando Chart.js.
         * Obtiene los datos de la API de estadísticas.
         * @param {string|number} year - El año para el cual se deben obtener las estadísticas.
         */
        async function renderChart(year) {
            // Actualizar el título del gráfico según el filtro seleccionado
            const chartTitle = document.getElementById('chart-title');
            if (chartTitle) {
                chartTitle.textContent = `Proyectos Iniciados por Mes ${year ? '(' + year + ')' : '(Todos)'}`;
            }

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
            if (s === 'ok' || s === 'finalizado') return `<span class="badge badge-ok">${value}</span>`;
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

            // Actualiza los contadores de "Finalizados", "No Finalizados" y "Cerrados"
            const finishedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'finalizado').length;
            const notFinishedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'en curso').length;
            const closedCount = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'cerrado').length;
            document.getElementById('finished-count').textContent = finishedCount;
            document.getElementById('not-finished-count').textContent = notFinishedCount;
            document.getElementById('closed-count').textContent = closedCount;

            // Sincronizar el estado del checkbox con el filtro actual
            notFinishedFilterSwitch.checked = currentStatusFilter === 'not-finished';

            // Aplica filtro de "No Finalizados" (solo estado "En Curso")
            if (currentStatusFilter === 'not-finished') {
                projectsToDisplay = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'en curso');
            }

            // Aplica filtro de "Finalizados"
            if (currentStatusFilter === 'finished') {
                projectsToDisplay = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'finalizado');
            }

            // Aplica filtro de "Cerrados"
            if (currentStatusFilter === 'closed') {
                projectsToDisplay = projectsToDisplay.filter(p => p.Estado && String(p.Estado).trim().toLowerCase() === 'cerrado');
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
                'Detalles del Proyecto': ['Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO', 'CAMBIO'],
                'Detalles de Cómputo': ['CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'DOMINIO', 'SERVICIO', 'Computo'],
                'Requisitos para Paso a Operación': ['WINDOWS LICENCIA ACTIVADA', 'NTP', 'Antivirus', 'SCAN', 'CONFIG BACKUP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)']
            };

            const checklistFields = new Set(fieldGroups['Requisitos para Paso a Operación']);
            const checklistOptions = ['Pendiente', 'En Curso', 'OK', 'N/A'];

            const generateFieldHtml = (col, proj) => {
                const dataKey = col === 'CAMBIO' ? 'CAMBIO PASO OPERACIÓN (OLA)' : col;
                const value = proj[dataKey] ?? '';
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
                    loadContactsForDropdown(contactoId);
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

            // Listener para auto-actualizar fase cuando Estado cambia a "Cerrado"
            const estadoField = document.getElementById('field-Estado');
            if (estadoField) {
                estadoField.addEventListener('change', function() {
                    if (this.value.toLowerCase() === 'cerrado') {
                        // Auto-llenar fase con "CIERRE" y fecha actual
                        document.getElementById('faseSelect').value = 'CIERRE';
                        const today = new Date().toISOString().split('T')[0];
                        document.getElementById('faseDate').value = today;
                    }
                });
            }
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
            console.log('=== SHOW PROJECT DETAILS ===');
            console.log('Project ID:', projectId);
            currentDetailProjectId = projectId;
            const project = allProjects.find(p => p['Id Project'] === projectId);
            if (!project) {
                console.error('Project not found for ID:', projectId);
                return;
            }
            console.log('Project found:', project);

            document.getElementById('detailsModalLabel').textContent = `ID ${project['Id Project']} - ${project.Project}`;
            document.getElementById('editFromDetailsBtn').dataset.projectId = projectId;
            const detailsBody = document.getElementById('detailsModalBody');

            const fieldGroups = {
                'Detalles del Proyecto': ['Id Project', 'Project', 'RF', 'Estado', 'Start', 'Finish', 'OBSERVACIONES', 'CONTACTO', 'CAMBIO'],
                'Detalles de Cómputo': ['CANTIDAD MAQUINAS', 'COD SERV_HOSTNAME', 'PLATAFORMA', 'SO', 'DOMINIO', 'SERVICIO', 'INVENTARIO', 'Computo'],
                'Requisitos para Paso a Operación': ['WINDOWS LICENCIA ACTIVADA', 'NTP', 'Antivirus', 'SCAN', 'CONFIG BACKUP', 'MONITOREO NAGIOS', 'MONITOREO ELASTIC', 'UCMDB', 'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)']
            };

            console.log('Field groups:', fieldGroups);

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
                    const dataKey = col === 'CAMBIO' ? 'CAMBIO PASO OPERACIÓN (OLA)' : col;

                    // CONTACTO field always renders regardless of project.hasOwnProperty
                    if (col === 'CONTACTO') {
                        // Special handling for CONTACTO field - fetch contact info
                        console.log('Rendering CONTACTO field for project:', project['Id Project']);
                        detailsHtml += `
                            <div class="col-md-6 mb-2">
                                <span class="detail-label">CONTACTO:</span>
                                <div class="d-flex align-items-center gap-2">
                                    <span id="contact-info-${project['Id Project']}" class="contact-loading">Cargando...</span>
                                    <div id="contact-buttons-${project['Id Project']}" class="d-flex gap-1" style="display: none;">
                                        <!-- Teams and Email buttons will be added here -->
                                    </div>
                                </div>
                            </div>`;
                        // Fetch contact info asynchronously
                        console.log('Calling fetchContactInfo for project:', project['Id Project']);
                        fetchContactInfo(project['Id Project']);
                    } else if (col === 'INVENTARIO') {
                        // Special handling for INVENTARIO field - always render
                        detailsHtml += `
                            <div class="col-md-6 mb-2">
                                <span class="detail-label">${col.toUpperCase()}:</span>
                                <button class="btn-ai-note" onclick="window.openInventoryModal(${project['Id Project']})" title="Ver Inventario de Equipos">
                                    <i class="bi bi-server"></i>
                                </button>
                            </div>`;
                    } else if (project.hasOwnProperty(dataKey)) {
                        if (col === 'Computo') {
                            const computoValue = project[col] ?? '';
                            detailsHtml += `
                                <div class="col-12 mt-2">
                                    <label class="form-label detail-label">${col.toUpperCase()}:</label>
                                    <textarea class="form-control" rows="4" readonly>${computoValue}</textarea>
                                </div>`;
                        } else if (col === 'OBSERVACIONES') {
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
         * Fetch contact information for a specific project
         * @param {number} projectId - The ID of the project
         */
        async function fetchContactInfo(projectId) {
            console.log('=== FETCH CONTACT INFO ===');
            console.log('Project ID:', projectId);
            try {
                // Get all contacts and find the one associated with this project
                if (!window.allContactsForProjects) {
                    console.log('Contacts not cached, fetching from API...');
                    // Fetch contacts if not already loaded
                    const response = await fetch('/api/contacts');
                    console.log('Contacts API response status:', response.status);
                    if (response.ok) {
                        window.allContactsForProjects = await response.json();
                        console.log('Contacts loaded:', window.allContactsForProjects.length, 'items');
                        console.log('First few contacts:', window.allContactsForProjects.slice(0, 3));
                    } else {
                        throw new Error('Failed to fetch contacts');
                    }
                } else {
                    console.log('Using cached contacts:', window.allContactsForProjects.length, 'items');
                }

                // Find all contacts associated with this project
                console.log('Looking for contacts associated with project ID:', projectId);
                const contacts = window.allContactsForProjects.filter(c => {
                    console.log('Checking contact:', c.nombre, 'proyecto_id:', c.proyecto_id, 'proyecto:', c.proyecto);
                    // Check if contact is associated with this project by project_id or project.id_project
                    return c.proyecto_id === projectId ||
                           (c.proyecto && c.proyecto.id_project === projectId) ||
                           (c.proyecto && c.proyecto['Id Project'] === projectId);
                });

                console.log('Found contacts:', contacts);

                // Wait for the DOM element to be available with retry logic
                let contactElement = null;
                let retries = 0;
                const maxRetries = 10;

                while (!contactElement && retries < maxRetries) {
                    contactElement = document.getElementById(`contact-info-${projectId}`);
                    console.log(`Retry ${retries + 1}: Contact element found:`, !!contactElement);

                    if (!contactElement) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
                    }
                }

                console.log('Final contact element found:', !!contactElement);

                if (contactElement) {
                    if (contacts && contacts.length > 0) {
                        // Display multiple contacts with inline buttons
                        let contactsHtml = '';

                        contacts.forEach((contact, index) => {
                            const contactInfo = `${contact.nombre || ''}${contact.correo ? ' - ' + contact.correo : ''}`;

                            // Add contact as a flex container with inline buttons
                            if (index > 0) contactsHtml += '<br>';
                            contactsHtml += `
                                <div class="contact-item d-flex align-items-center justify-content-between">
                                    <span class="contact-name">${contactInfo || 'Sin contacto'}</span>
                                    <div class="contact-buttons">
                                        ${contact.correo ? `
                                            <a href="msteams:/l/chat/0/0?users=${contact.correo}" class="btn btn-sm btn-outline-primary" title="Chatear en Teams con ${contact.nombre}">
                                                <i class="bi bi-microsoft-teams"></i>
                                            </a>
                                            <a href="mailto:${contact.correo}" class="btn btn-sm btn-outline-primary" title="Enviar Correo a ${contact.nombre}">
                                                <i class="bi bi-envelope-fill"></i>
                                            </a>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        });

                        console.log('Setting contacts list with inline buttons:', contactsHtml);
                        contactElement.innerHTML = contactsHtml;
                        contactElement.classList.remove('contact-loading');

                        // Hide separate buttons container since buttons are now inline
                        const buttonsContainer = document.getElementById(`contact-buttons-${projectId}`);
                        if (buttonsContainer) {
                            buttonsContainer.style.display = 'none';
                        }
                    } else {
                        console.log('No contacts found for project:', projectId);
                        contactElement.textContent = 'Sin contacto asignado';
                        contactElement.classList.remove('contact-loading');

                        // Hide buttons if no contacts
                        const buttonsContainer = document.getElementById(`contact-buttons-${projectId}`);
                        if (buttonsContainer) {
                            buttonsContainer.style.display = 'none';
                        }
                    }
                } else {
                    console.error('Contact element not found for project:', projectId, 'after', maxRetries, 'retries');
                }
            } catch (error) {
                console.error('Error fetching contact info:', error);
                const contactElement = document.getElementById(`contact-info-${projectId}`);
                if (contactElement) {
                    contactElement.textContent = 'Error al cargar contacto';
                    contactElement.classList.remove('contact-loading');
                }
            }
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

        // Abre el modal de observaciones (bloc de notas)
        window.openObservacionesModal = (projectId) => {
            const project = allProjects.find(p => p['Id Project'] === projectId);
            if (project) {
                currentObservacionesId = projectId;
                originalObservacionesContent = project['OBSERVACIONES'] || '';
                const textarea = document.getElementById('observacionesContent');
                const modalTitle = document.getElementById('observacionesModalLabel');
                if (modalTitle) {
                    // Actualiza el título del modal para incluir el nombre del proyecto
                    modalTitle.innerHTML = `<i class="bi bi-journal-text me-2"></i>Observaciones - ${project.Project || 'Sin Título'}`;
                }
                textarea.value = originalObservacionesContent;
                observacionesModal.show();

                // Resetear la búsqueda al abrir el modal
                notepadSearchBar.classList.remove('visible');
                notepadSearchInput.value = '';
                performSearch();

                // Iniciar autoguardado cada 30 segundos
                if (autoSaveInterval) clearInterval(autoSaveInterval);
                autoSaveInterval = setInterval(() => {
                    const currentContent = textarea.value;
                    // Solo guardar si hay cambios respecto a lo último guardado
                    if (currentContent !== originalObservacionesContent) {
                        saveObservaciones(true); // true = modo silencioso
                    }
                }, 30000);
            }
        };

        // Abre el modal de detalles para un proyecto específico.
        window.openDetailsModal = (projectId) => {
            showProjectDetails(projectId);
            detailsModal.show();
            // Usar el evento 'shown' para redimensionar los textareas DESPUÉS de que el modal sea visible
            detailsModalEl.addEventListener('shown.bs.modal', () => {
                detailsModalEl.querySelectorAll('textarea').forEach(autoResizeTextarea);
            }, { once: true });
        };

        // Abre el modal de inventario para un proyecto específico.
        window.openInventoryModal = async (projectId) => {
            console.log('=== OPEN INVENTORY MODAL ===');
            console.log('Project ID:', projectId);

            try {
                // Obtener información del proyecto para el título
                const project = allProjects.find(p => p['Id Project'] === projectId);
                const projectName = project ? project.Project : `Proyecto ${projectId}`;

                // Actualizar título del modal con el nombre del proyecto
                const modalLabel = document.getElementById('inventoryModalLabel');
                modalLabel.innerHTML = `<i class="bi bi-server me-2"></i>Inventario de Equipos - ${projectName}`;

                console.log('Haciendo fetch a /api/inventario?proyecto_id=' + projectId);
                const response = await fetch(`/api/inventario?proyecto_id=${projectId}`);
                console.log('Response status:', response.status);

                if (!response.ok) {
                    console.error('Response no ok:', response.status);
                    throw new Error('Error al cargar inventario');
                }

                const inventario = await response.json();
                console.log('Inventario recibido:', inventario);

                const inventoryTableBody = document.getElementById('inventoryTableBody');
                const inventoryEmpty = document.getElementById('inventoryEmpty');
                const inventoryTable = document.getElementById('inventoryTable');
                const inventoryForm = document.getElementById('inventoryForm');

                // Ocultar formulario al abrir
                inventoryForm.style.display = 'none';

                console.log('Elementos DOM encontrados:', {
                    inventoryTableBody: !!inventoryTableBody,
                    inventoryEmpty: !!inventoryEmpty,
                    inventoryTable: !!inventoryTable
                });

                if (inventario.length === 0) {
                    console.log('Inventario vacío, mostrando mensaje vacío');
                    inventoryTable.style.display = 'none';
                    inventoryEmpty.style.display = 'block';
                } else {
                    console.log('Inventario con datos, mostrando tabla');
                    inventoryTable.style.display = 'table';
                    inventoryEmpty.style.display = 'none';

                    renderInventoryTable(inventario);
                }

                // Guardar el projectId actual para usarlo en el formulario
                document.getElementById('invProyectoId').value = projectId;

                console.log('Mostrando modal de inventario');
                const inventoryModal = new bootstrap.Modal(document.getElementById('inventoryModal'));
                inventoryModal.show();

            } catch (error) {
                console.error('Error al cargar inventario:', error);
                alert('Error al cargar el inventario del proyecto: ' + error.message);
            }
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

        // Lógica para guardar cambios en Observaciones
        const saveObservaciones = async (silent = false) => {
            const textarea = document.getElementById('observacionesContent');
            const newContent = textarea.value;

            try {
                const response = await fetch(`/api/projects/${currentObservacionesId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ "OBSERVACIONES": newContent })
                });

                if (!response.ok) throw new Error('Error al guardar observaciones');

                // Actualizar datos locales
                const project = allProjects.find(p => p['Id Project'] === currentObservacionesId);
                if (project) project['OBSERVACIONES'] = newContent;

                // Actualizar referencia original para evitar alerta al cerrar
                originalObservacionesContent = newContent;

                if (!silent) {
                    // La alerta de confirmación fue eliminada para una experiencia más fluida.
                } else {
                    console.log('Autoguardado de observaciones realizado.');
                }
                return true;
            } catch (error) {
                console.error(error);
                if (!silent) alert('Error al guardar: ' + error.message);
                return false;
            }
        };

        document.getElementById('saveObservacionesBtn').addEventListener('click', () => saveObservaciones(false));

        // --- Lógica de Búsqueda y Reemplazo en Bloc de Notas ---

        let searchDebounceTimeout;

        const performSearch = () => {
            const searchTerm = notepadSearchInput.value;
            const content = notepadTextarea.value;
            searchMatches = [];
            currentMatchIndex = -1;

            if (!searchTerm) {
                notepadMatchCounter.textContent = '0/0';
                return;
            }

            const regex = new RegExp(searchTerm, 'gi'); // g for global, i for case-insensitive
            let match;
            while ((match = regex.exec(content)) !== null) {
                searchMatches.push(match.index);
            }

            if (searchMatches.length > 0) {
                currentMatchIndex = 0;
                highlightMatch(currentMatchIndex, false); // Pasamos 'false' para no robar el foco
            } else {
                notepadMatchCounter.textContent = '0/0';
            }
        };

        const highlightMatch = (index, setFocus = true) => {
            if (index < 0 || index >= searchMatches.length) return;

            const start = searchMatches[index];
            const end = start + notepadSearchInput.value.length;

            // Realiza la selección del texto en el área de notas
            notepadTextarea.setSelectionRange(start, end);

            if (setFocus) {
                // Si se solicita, mueve el foco al área de texto (para botones Siguiente/Anterior)
                notepadTextarea.focus();
            } else {
                // Si no, asegura que el foco permanezca en el campo de búsqueda (mientras se escribe)
                notepadSearchInput.focus();
                // Coloca el cursor al final del texto en el input para poder seguir escribiendo
                const len = notepadSearchInput.value.length;
                notepadSearchInput.setSelectionRange(len, len);
            }

            notepadMatchCounter.textContent = `${index + 1}/${searchMatches.length}`;
        };

        document.getElementById('toggleSearchBtn').addEventListener('click', () => {
            notepadSearchBar.classList.toggle('visible');
            if (notepadSearchBar.classList.contains('visible')) {
                notepadSearchInput.focus();
                performSearch();
            }
        });

        document.getElementById('notepad-close-search-btn').addEventListener('click', () => {
            notepadSearchBar.classList.remove('visible');
            clearTimeout(searchDebounceTimeout);
        });

        // Se usa un debounce para evitar que la búsqueda se ejecute en cada pulsación,
        // lo que permite al usuario terminar de escribir antes de que el foco cambie.
        notepadSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(performSearch, 350);
        });
        notepadSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('notepad-next-btn').click();
            }
        });

        document.getElementById('notepad-next-btn').addEventListener('click', () => {
            if (searchMatches.length === 0) return;
            currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
            highlightMatch(currentMatchIndex);
        });

        document.getElementById('notepad-prev-btn').addEventListener('click', () => {
            if (searchMatches.length === 0) return;
            currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
            highlightMatch(currentMatchIndex);
        });

        document.getElementById('notepad-replace-btn').addEventListener('click', () => {
            const start = notepadTextarea.selectionStart;
            const end = notepadTextarea.selectionEnd;
            if (end - start === 0 || searchMatches.length === 0) return;
            notepadTextarea.setRangeText(notepadReplaceInput.value, start, end, 'select');
            performSearch();
        });

        document.getElementById('notepad-replace-all-btn').addEventListener('click', () => {
            const searchTerm = notepadSearchInput.value;
            if (!searchTerm) return;
            const replaceTerm = notepadReplaceInput.value;
            const regex = new RegExp(searchTerm, 'gi');
            notepadTextarea.value = notepadTextarea.value.replace(regex, replaceTerm);
            performSearch();
        });

        // Botón para maximizar/restaurar el bloc de notas
        const maximizeBtn = document.getElementById('maximizeObservacionesBtn');
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                const modalDialog = observacionesModalEl.querySelector('.modal-dialog');
                const modalContent = observacionesModalEl.querySelector('.modal-content');
                const icon = maximizeBtn.querySelector('i');

                modalDialog.classList.toggle('modal-fullscreen');
                modalContent.classList.toggle('notepad-fullscreen');

                if (modalDialog.classList.contains('modal-fullscreen')) {
                    // Limpiar estilos de arrastre para que ocupe toda la pantalla correctamente
                    modalDialog.style.top = '';
                    modalDialog.style.left = '';
                    modalDialog.style.position = '';
                    modalDialog.style.margin = '';

                    icon.classList.replace('bi-arrows-fullscreen', 'bi-fullscreen-exit');
                    maximizeBtn.title = "Restaurar";
                } else {
                    icon.classList.replace('bi-fullscreen-exit', 'bi-arrows-fullscreen');
                    maximizeBtn.title = "Maximizar";
                }
            });
        }

        // Detectar cambios al cerrar el modal de Observaciones
        observacionesModalEl.addEventListener('hide.bs.modal', function (e) {
            if (autoSaveInterval) clearInterval(autoSaveInterval); // Detener autoguardado
            clearTimeout(searchDebounceTimeout); // Limpiar el temporizador de búsqueda

            // Restablecer el título del modal al cerrar para que no se quede el nombre del proyecto anterior
            const modalTitle = document.getElementById('observacionesModalLabel');
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="bi bi-journal-text me-2"></i>Observaciones`;
            }

            const textarea = document.getElementById('observacionesContent');
            if (textarea.value !== originalObservacionesContent) {
                if (confirm("Se han detectado cambios sin guardar en las observaciones.\n\n¿Desea guardar los cambios antes de salir?")) {
                    e.preventDefault(); // Detener el cierre temporalmente
                    saveObservaciones().then(success => {
                        if (success) {
                            observacionesModal.hide(); // Cerrar manualmente si se guardó con éxito
                        }
                    });
                }
                // Si el usuario cancela (dice "No"), el modal se cierra y los cambios se descartan (comportamiento por defecto)
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
                    if (field === 'CAMBIO' || field === 'CAMBIO PASO OPERACIÓN (OLA)') {
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
                            const rawValue = String(project[field] ?? '').trim();
                            const fieldValue = rawValue.toLowerCase();
                            if (fieldValue === 'pendiente') {
                                cellContent = `<td class="text-center"><span class="pendiente-cell" data-field="${field}" data-value="Pendiente" data-project-id="${project['Id Project']}" title="${field}"><i class="bi bi-exclamation-triangle-fill icon-pendiente"></i></span></td>`;
                                break; // Encontramos un pendiente, no necesitamos seguir buscando
                            } else if (fieldValue === 'en curso') {
                                // Guardamos el primer campo que esté en curso (si no hay pendientes)
                                cellContent = `<td class="text-center"><span class="pendiente-cell" data-field="${field}" data-value="En Curso" data-project-id="${project['Id Project']}" title="${field}"><i class="bi bi-clock-fill icon-en-curso"></i></span></td>`;
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
        const closedCard = document.querySelector('.stat-card.closed');

        function updateActiveCard() {
            finishedCard.classList.remove('active');
            notFinishedCard.classList.remove('active');
            closedCard.classList.remove('active');
            if (currentStatusFilter === 'finished') {
                finishedCard.classList.add('active');
            } else if (currentStatusFilter === 'not-finished') {
                notFinishedCard.classList.add('active');
            } else if (currentStatusFilter === 'closed') {
                closedCard.classList.add('active');
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

        closedCard.addEventListener('click', () => {
            currentPage = 1;
            currentStatusFilter = currentStatusFilter === 'closed' ? null : 'closed';
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

        // =================================================================================
        // LÓGICA DEL WIDGET DE LIBRETA DE CONTACTOS
        // =================================================================================
        const contactsWidget = document.getElementById('contacts-widget');
        const contactsToggleBtn = document.getElementById('contacts-toggle-btn');
        const contactsWidgetBody = document.getElementById('contacts-widget-body');
        const contactsTableBody = document.getElementById('contacts-table-body');
        const contactsEmptyMessage = document.getElementById('contacts-empty-message');
        const addContactBtn = document.getElementById('add-contact-btn');
        const contactModalEl = document.getElementById('contactModal');
        const contactModal = new bootstrap.Modal(contactModalEl);
        const saveContactBtn = document.getElementById('saveContactBtn');
        let allContacts = [];
        let currentEditingContactId = null;
        let contactsCurrentPage = 1;
        const contactsPerPage = 10;

        /**
         * Update pagination controls for contacts table
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
         * Render contacts table with pagination
         */
        function renderContacts() {
            console.log('renderContacts called, allContacts.length:', allContacts.length);

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
         * Fetch all contacts from API
         */
        async function fetchAllContacts() {
            console.log('fetchAllContacts called');
            try {
                console.log('Fetching contacts from /api/contacts...');
                const response = await fetch('/api/contacts');
                console.log('Response status:', response.status);

                if (!response.ok) {
                    console.error('Response not OK:', response.status);
                    if (contactsEmptyMessage) {
                        contactsEmptyMessage.textContent = 'Error al cargar contactos.';
                        contactsEmptyMessage.style.display = 'block';
                        if (contactsTableBody) {
                            const tableResponsive = contactsTableBody.closest('.table-responsive');
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

                // Update the original contacts copy for search functionality
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
                if (contactsEmptyMessage) {
                    contactsEmptyMessage.textContent = 'Error al cargar contactos.';
                    contactsEmptyMessage.style.display = 'block';
                    if (contactsTableBody) {
                        const tableResponsive = contactsTableBody.closest('.table-responsive');
                        if (tableResponsive) tableResponsive.style.display = 'none';
                    }
                }
            }
        }

        // Close widget when clicking outside - MOVED BEFORE PAGINATION
        document.addEventListener('click', (event) => {
            if (contactsWidget && contactsToggleBtn) {
                const isClickInsideWidget = contactsWidget.contains(event.target);
                const isClickOnToggleBtn = contactsToggleBtn.contains(event.target);
                const isClickInsideModal = event.target.closest('.modal');

                if (!isClickInsideWidget && !isClickOnToggleBtn && !isClickInsideModal && contactsWidget.classList.contains('visible')) {
                    contactsWidget.classList.remove('visible');
                }
            }
        });

        // Event listeners
        if (contactsToggleBtn) {
            contactsToggleBtn.addEventListener('click', () => {
                if (contactsWidget.classList.toggle('visible')) {
                    fetchAllContacts();
                }
            });
        }

        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => openContactModal());
        }

        // Search functionality for contacts
        const contactsSearchInput = document.getElementById('contacts-search-input');
        if (contactsSearchInput) {
            contactsSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                filterContacts(searchTerm);
            });
        }

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

                    // More flexible search: check if any word of the search term matches
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

        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', saveContact);
        }

        if (contactsWidgetBody) {
            contactsWidgetBody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit-contact');
                if (editBtn) {
                    e.preventDefault();
                    e.stopPropagation();

                    const contactItem = editBtn.closest('.contact-list-item');
                    const contactId = parseInt(contactItem.dataset.contactId, 10);

                    console.log('Edit button clicked:', {
                        contactId: contactId,
                        rowElement: contactItem,
                        dataset: contactItem.dataset
                    });

                    const contact = allContacts.find(c => c.id === contactId);
                    console.log('Found contact:', contact);
                    console.log('Available contacts:', allContacts.slice(0, 3)); // Show first 3 for debugging

                    if (contact) {
                        console.log('Opening modal with contact data');
                        openContactModal(contact);
                    } else {
                        console.error('Contact not found for ID:', contactId);
                        showToast('No se encontró el contacto', 'error');
                    }
                }

                const deleteBtn = e.target.closest('.btn-delete-contact');
                if (deleteBtn) {
                    e.preventDefault();
                    e.stopPropagation();

                    const contactItem = deleteBtn.closest('.contact-list-item');
                    const contactId = parseInt(contactItem.dataset.contactId, 10);
                    console.log('Delete button clicked for contact ID:', contactId);
                    deleteContact(contactId);
                }
            });
        }

        // Load projects for dropdown
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
                console.log('First 3 projects:', projects.slice(0, 3));

                const select = document.getElementById('contact-proyecto');
                console.log('Projects select element found:', !!select);

                if (!select) {
                    console.error('Projects select not found');
                    return;
                }

                console.log('Current select options before clearing:', select.children.length);
                console.log('Current select HTML:', select.innerHTML);

                // Clear existing options except the first one
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
                console.log('Final select HTML:', select.innerHTML);

            } catch (error) {
                console.error('Error loading projects:', error);
            }
        }

        // Contact modal functions
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

            const formData = new FormData(form);

            // Debug: Check what FormData is actually getting
            console.log('=== FORM DATA DEBUG ===');
            for (let [key, value] of formData.entries()) {
                console.log(`FormData ${key}: ${value}`);
            }

            // Debug: Check direct element values
            console.log('=== DIRECT ELEMENT VALUES ===');
            const nombreElement = document.getElementById('contact-nombre');
            const correoElement = document.getElementById('contact-correo');
            const telefonoElement = document.getElementById('contact-telefono');
            const cargoElement = document.getElementById('contact-cargo');
            const areaElement = document.getElementById('contact-area');
            const notasElement = document.getElementById('contact-notas');
            const proyectoElement = document.getElementById('contact-proyecto');

            console.log('Direct values:', {
                nombre: nombreElement ? nombreElement.value : 'NOT FOUND',
                correo: correoElement ? correoElement.value : 'NOT FOUND',
                telefono: telefonoElement ? telefonoElement.value : 'NOT FOUND',
                cargo: cargoElement ? cargoElement.value : 'NOT FOUND',
                area: areaElement ? areaElement.value : 'NOT FOUND',
                notas: notasElement ? notasElement.value : 'NOT FOUND',
                proyecto: proyectoElement ? proyectoElement.value : 'NOT FOUND'
            });

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
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(payload)
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);

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
                contactModal.hide();

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
                    // If no search, restore the page (adjust if needed)
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

        // Función para cargar contactos en el selector desplegable
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

        // Helper function to get CSRF token
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

        // Toast notification helper
        function showToast(message, type = 'info') {
            // Create toast container if it doesn't exist
            let toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                toastContainer.style.zIndex = '1050';
                document.body.appendChild(toastContainer);
            }

            // Create toast element
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

            // Show toast
            const toast = new bootstrap.Toast(toastEl);
            toast.show();

            // Remove toast element after it's hidden
            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
        }

        // Funciones para el manejo del inventario
        function renderInventoryTable(inventario) {
            const inventoryTableBody = document.getElementById('inventoryTableBody');
            inventoryTableBody.innerHTML = '';

            inventario.forEach((item, index) => {
                console.log(`Procesando item ${index}:`, item);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.ubicacion || ''}</td>
                    <td>${item.ot || ''}</td>
                    <td>${item.codigo || ''}</td>
                    <td>${item.hostname || ''}</td>
                    <td>${item.cpu || ''}</td>
                    <td>${item.ram || ''}</td>
                    <td>${item.disco_so || ''}</td>
                    <td>${item.disco_pag || ''}</td>
                    <td>${item.disco_data || ''}</td>
                    <td>${item.ip_gestion || ''}</td>
                    <td>${item.ip_servicios || ''}</td>
                    <td>${item.ip_produccion || ''}</td>
                    <td>${item.ip_adicional_1 || ''}</td>
                    <td>${item.ip_adicional_2 || ''}</td>
                    <td>${item.sistema_operativo || ''}</td>
                    <td>${item.tipo_equipo || ''}</td>
                    <td>${item.referencia || ''}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary edit-inventory-btn" data-item-id="${item.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-inventory-btn" data-item-id="${item.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                inventoryTableBody.appendChild(row);
            });

            // Agregar event listeners para los botones de editar y eliminar
            document.querySelectorAll('.edit-inventory-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    editInventoryItem(this.dataset.itemId);
                });
            });

            document.querySelectorAll('.delete-inventory-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    deleteInventoryItem(this.dataset.itemId);
                });
            });
        }

        function showInventoryForm(item = null) {
            const inventoryForm = document.getElementById('inventoryForm');
            const inventoryTable = document.getElementById('inventoryTable');
            const inventoryEmpty = document.getElementById('inventoryEmpty');
            const formTitle = document.getElementById('inventoryFormTitle');

            // Mostrar formulario, ocultar tabla y mensaje vacío
            inventoryForm.style.display = 'block';
            inventoryTable.style.display = 'none';
            inventoryEmpty.style.display = 'none';

            if (item) {
                // Modo edición
                formTitle.textContent = 'Editar Equipo';
                document.getElementById('invItemId').value = item.id;
                document.getElementById('invUbicacion').value = item.ubicacion || '';
                document.getElementById('invOt').value = item.ot || '';
                document.getElementById('invCodigo').value = item.codigo || '';
                document.getElementById('invHostname').value = item.hostname || '';
                document.getElementById('invCpu').value = item.cpu || '';
                document.getElementById('invRam').value = item.ram || '';
                document.getElementById('invDiscoSo').value = item.disco_so || '';
                document.getElementById('invDiscoPag').value = item.disco_pag || '';
                document.getElementById('invDiscoData').value = item.disco_data || '';
                document.getElementById('invIpGestion').value = item.ip_gestion || '';
                document.getElementById('invIpServicios').value = item.ip_servicios || '';
                document.getElementById('invIpProduccion').value = item.ip_produccion || '';
                document.getElementById('invIpAdicional1').value = item.ip_adicional_1 || '';
                document.getElementById('invIpAdicional2').value = item.ip_adicional_2 || '';
                document.getElementById('invSistemaOperativo').value = item.sistema_operativo || '';
                document.getElementById('invTipoEquipo').value = item.tipo_equipo || '';
                document.getElementById('invReferencia').value = item.referencia || '';
            } else {
                // Modo agregar
                formTitle.textContent = 'Agregar Nuevo Equipo';
                document.getElementById('inventoryItemForm').reset();
                document.getElementById('invItemId').value = '';
            }
        }

        function hideInventoryForm() {
            const inventoryForm = document.getElementById('inventoryForm');
            inventoryForm.style.display = 'none';

            // Recargar inventario para mostrar la tabla actualizada
            const projectId = document.getElementById('invProyectoId').value;
            if (projectId) {
                loadInventoryData(projectId);
            }
        }

        async function loadInventoryData(projectId) {
            try {
                const response = await fetch(`/api/inventario?proyecto_id=${projectId}`);
                if (!response.ok) throw new Error('Error al cargar inventario');

                const inventario = await response.json();
                const inventoryTableBody = document.getElementById('inventoryTableBody');
                const inventoryEmpty = document.getElementById('inventoryEmpty');
                const inventoryTable = document.getElementById('inventoryTable');

                if (inventario.length === 0) {
                    inventoryTable.style.display = 'none';
                    inventoryEmpty.style.display = 'block';
                } else {
                    inventoryTable.style.display = 'table';
                    inventoryEmpty.style.display = 'none';
                    renderInventoryTable(inventario);
                }
            } catch (error) {
                console.error('Error al cargar inventario:', error);
                alert('Error al cargar el inventario: ' + error.message);
            }
        }

        async function saveInventoryItem() {
            const projectId = document.getElementById('invProyectoId').value;
            const itemId = document.getElementById('invItemId').value;

            const data = {
                proyecto_id: projectId,
                ubicacion: document.getElementById('invUbicacion').value,
                ot: document.getElementById('invOt').value,
                codigo: document.getElementById('invCodigo').value,
                hostname: document.getElementById('invHostname').value,
                cpu: document.getElementById('invCpu').value,
                ram: document.getElementById('invRam').value,
                disco_so: document.getElementById('invDiscoSo').value,
                disco_pag: document.getElementById('invDiscoPag').value,
                disco_data: document.getElementById('invDiscoData').value,
                ip_gestion: document.getElementById('invIpGestion').value,
                ip_servicios: document.getElementById('invIpServicios').value,
                ip_produccion: document.getElementById('invIpProduccion').value,
                ip_adicional_1: document.getElementById('invIpAdicional1').value,
                ip_adicional_2: document.getElementById('invIpAdicional2').value,
                sistema_operativo: document.getElementById('invSistemaOperativo').value,
                tipo_equipo: document.getElementById('invTipoEquipo').value,
                referencia: document.getElementById('invReferencia').value,
            };

            try {
                let response;
                if (itemId) {
                    // Modo edición
                    response = await fetch(`/api/inventario/${itemId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify(data)
                    });
                } else {
                    // Modo agregar
                    response = await fetch('/api/inventario', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify(data)
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al guardar el equipo');
                }

                hideInventoryForm();
                alert('Equipo guardado exitosamente');

            } catch (error) {
                console.error('Error al guardar equipo:', error);
                alert('Error al guardar el equipo: ' + error.message);
            }
        }

        async function editInventoryItem(itemId) {
            try {
                const response = await fetch(`/api/inventario/${itemId}`);
                if (!response.ok) throw new Error('Error al cargar el equipo');

                const item = await response.json();
                showInventoryForm(item);

            } catch (error) {
                console.error('Error al cargar equipo para editar:', error);
                alert('Error al cargar el equipo: ' + error.message);
            }
        }

        async function deleteInventoryItem(itemId) {
            if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
                return;
            }

            try {
                const response = await fetch(`/api/inventario/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrftoken
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al eliminar el equipo');
                }

                // Recargar la tabla
                const projectId = document.getElementById('invProyectoId').value;
                loadInventoryData(projectId);
                alert('Equipo eliminado exitosamente');

            } catch (error) {
                console.error('Error al eliminar equipo:', error);
                alert('Error al eliminar el equipo: ' + error.message);
            }
        }

        async function exportInventoryToExcel() {
            const projectId = document.getElementById('invProyectoId').value;

            if (!projectId) {
                alert('Error: No se pudo identificar el proyecto actual');
                return;
            }

            try {
                // Obtener datos del inventario
                const response = await fetch(`/api/inventario?proyecto_id=${projectId}`);
                if (!response.ok) throw new Error('Error al cargar inventario');

                const inventario = await response.json();

                if (inventario.length === 0) {
                    alert('No hay equipos para exportar');
                    return;
                }

                // Obtener nombre del proyecto
                const project = allProjects.find(p => p['Id Project'] === parseInt(projectId));
                const projectName = project ? project.Project : `Proyecto_${projectId}`;

                // Preparar datos para Excel
                const excelData = inventario.map(item => ({
                    'Ubicación': item.ubicacion || '',
                    'OT': item.ot || '',
                    'Código': item.codigo || '',
                    'Hostname': item.hostname || '',
                    'CPU': item.cpu || '',
                    'RAM': item.ram || '',
                    'Disco SO': item.disco_so || '',
                    'Disco Pag': item.disco_pag || '',
                    'Disco Data': item.disco_data || '',
                    'IP Gestión': item.ip_gestion || '',
                    'IP Servicios': item.ip_servicios || '',
                    'IP Producción': item.ip_produccion || '',
                    'IP Adicional 1': item.ip_adicional_1 || '',
                    'IP Adicional 2': item.ip_adicional_2 || '',
                    'Sistema Operativo': item.sistema_operativo || '',
                    'Tipo Equipo': item.tipo_equipo || '',
                    'Referencia': item.referencia || ''
                }));

                // Crear worksheet
                const ws = XLSX.utils.json_to_sheet(excelData);

                // Crear workbook
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

                // Generar nombre de archivo
                const fileName = `Inventario_${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`;

                // Descargar archivo
                XLSX.writeFile(wb, fileName);

                console.log('Archivo Excel exportado:', fileName);

            } catch (error) {
                console.error('Error al exportar a Excel:', error);
                alert('Error al exportar a Excel: ' + error.message);
            }
        }

        // Event listeners para el formulario de inventario
        document.getElementById('addInventoryItemBtn').addEventListener('click', () => {
            showInventoryForm();
        });

        document.getElementById('addFirstInventoryItemBtn').addEventListener('click', () => {
            showInventoryForm();
        });

        document.getElementById('cancelInventoryBtn').addEventListener('click', () => {
            hideInventoryForm();
        });

        document.getElementById('saveInventoryBtn').addEventListener('click', () => {
            saveInventoryItem();
        });

        // Botón para exportar a Excel
        document.getElementById('exportInventoryBtn').addEventListener('click', () => {
            exportInventoryToExcel();
        });

        // Botón para maximizar/restaurar el modal de inventario
        const maximizeInventoryBtn = document.getElementById('maximizeInventoryBtn');
        if (maximizeInventoryBtn) {
            maximizeInventoryBtn.addEventListener('click', () => {
                const inventoryModalEl = document.getElementById('inventoryModal');
                const modalDialog = inventoryModalEl.querySelector('.modal-dialog');
                const icon = maximizeInventoryBtn.querySelector('i');

                modalDialog.classList.toggle('modal-fullscreen');

                if (modalDialog.classList.contains('modal-fullscreen')) {
                    // Cambiar ícono a restaurar
                    icon.className = 'bi bi-arrows-angle-contract';
                    maximizeInventoryBtn.title = 'Restaurar';

                    // Limpiar estilos de arrastre para que ocupe toda la pantalla correctamente
                    modalDialog.style.top = '';
                    modalDialog.style.left = '';
                    modalDialog.style.position = '';
                    modalDialog.style.margin = '';
                } else {
                    // Cambiar ícono a maximizar
                    icon.className = 'bi bi-arrows-fullscreen';
                    maximizeInventoryBtn.title = 'Maximizar';
                }
            });
        }

});
