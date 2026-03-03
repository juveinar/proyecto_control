/**
 * Módulo de gestión de gráficos y estadísticas
 * Contiene todas las funciones relacionadas con la visualización de datos
 */

// Variables globales para gráficos
let projectsChart = null;
let selectedMonth = null;
let selectedBarIndex = -1;
let originalBarColors = [];
let currentStatusFilter = 'not-finished';

/**
 * Renderizar gráfico de proyectos por mes usando Chart.js
 * @param {string|number} year - Año para filtrar estadísticas
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
        const ctx = document.getElementById('projectsChart');
        
        if (!ctx) return;
        
        if (projectsChart) { 
            projectsChart.destroy(); 
        }

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
                        if (window.ProjectsModule) {
                            window.ProjectsModule.renderTable();
                        }
                        
                        const clearMonthFilterBtn = document.getElementById('clearMonthFilterBtn');
                        if (clearMonthFilterBtn) {
                            clearMonthFilterBtn.style.display = 'inline-block';
                        }
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
                                return stats.full_labels ? stats.full_labels[dataIndex] : tooltipItems[0].label;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { color: '#00aaff', stepSize: 1 }, 
                        grid: { color: 'rgba(0, 170, 255, 0.1)' } 
                    },
                    x: { 
                        ticks: { color: '#00aaff', autoSkip: false, font: { size: 10 } }, 
                        grid: { display: false } 
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error rendering chart:", error);
    }
}

/**
 * Actualizar tarjetas de filtro de estado
 */
function updateActiveCard() {
    const finishedCard = document.getElementById('finished-card');
    const notFinishedCard = document.getElementById('not-finished-card');
    const closedCard = document.getElementById('closed-card');
    const notFinishedFilterSwitch = document.getElementById('notFinishedFilterSwitch');

    // Resetear todas las clases activas
    if (finishedCard) finishedCard.classList.remove('active');
    if (notFinishedCard) notFinishedCard.classList.remove('active');
    if (closedCard) closedCard.classList.remove('active');

    // Sincronizar el estado del checkbox con el filtro actual
    if (notFinishedFilterSwitch) {
        notFinishedFilterSwitch.checked = currentStatusFilter === 'not-finished';
    }

    // Aplicar clase activa según el filtro actual
    if (currentStatusFilter === 'finished' && finishedCard) {
        finishedCard.classList.add('active');
    } else if (currentStatusFilter === 'not-finished' && notFinishedCard) {
        notFinishedCard.classList.add('active');
    } else if (currentStatusFilter === 'closed' && closedCard) {
        closedCard.classList.add('active');
    }
}

/**
 * Limpiar filtro de mes
 */
function clearMonthFilter() {
    selectedMonth = null;
    selectedBarIndex = -1;
    
    // Restaurar colores originales de las barras
    if (projectsChart && projectsChart.data.datasets[0]) {
        projectsChart.data.datasets[0].backgroundColor = [...originalBarColors];
        projectsChart.update();
    }
    
    // Ocultar botón de limpiar filtro
    const clearMonthFilterBtn = document.getElementById('clearMonthFilterBtn');
    if (clearMonthFilterBtn) {
        clearMonthFilterBtn.style.display = 'none';
    }
    
    // Re-renderizar tabla sin filtro de mes
    if (window.ProjectsModule) {
        window.ProjectsModule.renderTable();
    }
}

/**
 * Generar informe con IA
 */
async function generateAIReport() {
    const generarInformeLink = document.getElementById('generarInformeIaLink');
    const informeProgressWidget = document.getElementById('informe-progress-widget');
    const informeProgressBar = document.getElementById('informeProgressBar');
    const informeProgressStatus = document.getElementById('informeProgressStatus');

    if (!generarInformeLink || !informeProgressWidget) return;

    const href = generarInformeLink.href;

    // Mostrar el widget
    if (informeProgressWidget) {
        informeProgressWidget.classList.add('visible');
    }
    
    if (informeProgressBar) { 
        informeProgressBar.style.width = '0%'; 
        informeProgressBar.textContent = '0%'; 
    }
    
    if (informeProgressStatus) { 
        informeProgressStatus.textContent = 'Preparando generación...'; 
    }

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
            if (informeProgressStatus) {
                informeProgressStatus.textContent = `Error: ${res.status}`;
            }
            if (informeProgressBar) {
                informeProgressBar.style.width = '100%';
                informeProgressBar.textContent = 'Error';
                informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                informeProgressBar.style.backgroundColor = '#dc3545';
            }
            return;
        }

        // Intentar parsear JSON de forma segura
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
                setTimeout(() => { 
                    try { URL.revokeObjectURL(debugUrl); } catch(e){} 
                }, 30000);
            } catch (e) {
                console.error('No se pudo abrir debug blob:', e);
            }
            if (informeProgressStatus) {
                informeProgressStatus.textContent = 'Respuesta inválida del servidor (ver nueva pestaña)';
            }
            if (informeProgressBar) {
                informeProgressBar.style.width = '100%';
                informeProgressBar.textContent = 'Error';
                informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
                informeProgressBar.style.backgroundColor = '#dc3545';
            }
            return;
        }
        
        if (!data || !data.success) {
            if (informeProgressStatus) {
                informeProgressStatus.textContent = data && data.message ? data.message : 'No se pudo generar el informe.';
            }
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
        
        if (informeProgressStatus) {
            informeProgressStatus.textContent = 'Informe generado. Descargando...';
        }

        // Crear un blob con el HTML y abrirlo en una nueva pestaña
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
                
                if (informeProgressStatus) {
                    informeProgressStatus.textContent = 'Informe abierto en nueva pestaña.';
                }

                // Ocultar el widget después de un par de segundos
                setTimeout(() => {
                    if (informeProgressWidget) {
                        informeProgressWidget.classList.remove('visible');
                    }
                }, 2000);

                // Liberar el blob url eventualmente
                setTimeout(() => { 
                    try { URL.revokeObjectURL(blobUrl); } catch(e){} 
                }, 30000);
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
        if (informeProgressStatus) {
            informeProgressStatus.textContent = 'Error. Revisa la consola.';
        }
        if (informeProgressBar) {
            informeProgressBar.style.width = '100%';
            informeProgressBar.textContent = 'Error';
            informeProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
            informeProgressBar.style.backgroundColor = '#dc3545';
        }
        console.error('Error generando informe IA:', error);
    }
}

// Exportar funciones para uso global
window.ChartsModule = {
    renderChart,
    updateActiveCard,
    clearMonthFilter,
    generateAIReport
};
