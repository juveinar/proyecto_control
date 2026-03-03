/**
 * Módulo de gestión de eventos
 * Contiene todas las funciones relacionadas con la gestión de eventos del calendario
 */

// Variables globales para eventos
let allEvents = [];
let currentEventIndex = -1;
let homeEventIndex = -1;
let currentEditingEvent = null;

/**
 * Obtener todos los eventos desde la API
 */
async function fetchAllEvents() {
    try {
        const response = await fetch('/api/events');
        if (!response.ok) {
            const nextEventContent = document.getElementById('next-event-content');
            if (nextEventContent) {
                nextEventContent.innerHTML = '<p>No hay eventos próximos.</p>';
            }
            return;
        }
        allEvents = await response.json();

        // Ordena los eventos por fecha de inicio
        allEvents.sort((a, b) => new Date(a['Fecha de Inicio']) - new Date(b['Fecha de Inicio']));

        // Encuentra el índice del próximo evento futuro
        const now = new Date();
        homeEventIndex = allEvents.findIndex(event => new Date(event['Fecha de Inicio']) > now);

        // Si no hay eventos futuros, muestra el último evento pasado
        if (homeEventIndex === -1 && allEvents.length > 0) {
            homeEventIndex = allEvents.length - 1;
        }

        displayEvent(homeEventIndex);
        updateActiveCard(); // Asegura que la tarjeta activa se muestre al cargar
    } catch (error) {
        console.error("Error fetching events:", error);
        const nextEventContent = document.getElementById('next-event-content');
        if (nextEventContent) {
            nextEventContent.innerHTML = '<p>Error al cargar eventos.</p>';
        }
    }
}

/**
 * Mostrar detalles de un evento en el widget
 * @param {number} index - Índice del evento en el array
 */
function displayEvent(index) {
    const homeBtn = document.getElementById('home-event-btn');
    const nextEventContent = document.getElementById('next-event-content');
    const eventToggleBtn = document.getElementById('event-toggle-btn');

    if (index >= 0 && index < allEvents.length) {
        currentEventIndex = index;
        const event = allEvents[index];
        const startDate = new Date(event['Fecha de Inicio']);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

        // Resalta la fecha si el evento está a menos de 24 horas
        const now = new Date();
        const diffHours = (startDate - now) / (1000 * 60 * 60);
        let startDateClass = '';
        if (diffHours > 0 && diffHours <= 24) {
            startDateClass = 'overdue'; // Reutilizamos la clase 'overdue' para el resaltado
            if (eventToggleBtn) eventToggleBtn.classList.add('warning');
        } else {
            if (eventToggleBtn) eventToggleBtn.classList.remove('warning');
        }

        if (nextEventContent) {
            nextEventContent.innerHTML = `
                <h5>${event.Titulo}</h5>
                <p><strong>Inicio:</strong> <span class="${startDateClass}">${startDate.toLocaleDateString('es-ES', options)}</span></p>
                <p><strong>Lugar:</strong> ${event.Ubicacion || 'N/A'}</p>
                ${event.Descripcion ? `<p><strong>Desc:</strong> ${event.Descripcion}</p>` : ''}
            `;
        }

        // Asigna los eventos de clic para los botones de editar y eliminar
        const deleteEventBtn = document.getElementById('delete-event-btn');
        const editEventBtn = document.getElementById('edit-event-btn');
        
        if (deleteEventBtn) deleteEventBtn.onclick = () => deleteEvent(event);
        if (editEventBtn) editEventBtn.onclick = () => editEvent(event);

        if (index === homeEventIndex && homeBtn) {
            homeBtn.classList.add('active');
        } else if (homeBtn) {
            homeBtn.classList.remove('active');
        }
    } else {
        if (nextEventContent) {
            nextEventContent.innerHTML = '<p>No hay eventos para mostrar.</p>';
        }
        if (homeBtn) {
            homeBtn.classList.remove('active');
        }
    }
}

/**
 * Eliminar un evento
 * @param {Object} event - Objeto del evento a eliminar
 */
async function deleteEvent(event) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${event.Titulo}"?`)) return;

    try {
        const response = await fetch(`/api/events/${event.id}`, { 
            method: 'DELETE', 
            headers: { 'X-CSRFToken': getCookie('csrftoken') } 
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete event');
        }
        
        await fetchAllEvents(); // Actualizar los eventos
    } catch (error) {
        console.error("Error deleting event:", error);
        if (window.UtilsModule) {
            window.UtilsModule.showToast('Error al eliminar el evento.', 'error');
        }
    }
}

/**
 * Editar un evento existente
 * @param {Object} event - Objeto del evento a editar
 */
function editEvent(event) {
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

    const eventModalLabel = document.getElementById('eventModalLabel');
    if (eventModalLabel) {
        eventModalLabel.textContent = 'Editar Evento';
    }

    const eventTitle = document.getElementById('event-title');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    const eventLocation = document.getElementById('event-location');
    const eventDescription = document.getElementById('event-description');
    const hiddenIdInput = document.getElementById('event-id');

    if (eventTitle) eventTitle.value = event.Titulo || '';
    if (eventStart) eventStart.value = toLocalInputValue(startDate);
    if (eventEnd) eventEnd.value = toLocalInputValue(endDate);
    if (eventLocation) eventLocation.value = event['Ubicacion'] || '';
    if (eventDescription) eventDescription.value = event['Descripcion'] || '';
    if (hiddenIdInput) hiddenIdInput.value = event.id;

    const eventModalEl = document.getElementById('eventModal');
    if (eventModalEl) {
        const eventModal = new bootstrap.Modal(eventModalEl);
        eventModal.show();
    }
}

/**
 * Guardar evento (nuevo o edición)
 */
async function saveEvent() {
    const eventTitle = document.getElementById('event-title');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    const eventLocation = document.getElementById('event-location');
    const eventDescription = document.getElementById('event-description');
    const hiddenIdInput = document.getElementById('event-id');

    if (!eventTitle?.value.trim() || !eventStart?.value) {
        if (window.UtilsModule) {
            window.UtilsModule.showToast('Título y fecha de inicio son obligatorios.', 'error');
        }
        return;
    }

    const toIsoStringLocal = (value) => {
        if (!value) return null;
        // value es "YYYY-MM-DDTHH:MM"
        const d = new Date(value);
        return d.toISOString();
    };

    const payload = {
        "Titulo": eventTitle?.value.trim() || '',
        "Fecha de Inicio": toIsoStringLocal(eventStart?.value),
        "Fecha de Fin": eventEnd?.value ? toIsoStringLocal(eventEnd?.value) : null,
        "Ubicacion": eventLocation?.value.trim() || '',
        "Descripcion": eventDescription?.value.trim() || ''
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
                'X-CSRFToken': getCookie('csrftoken')
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
        
        const eventModalEl = document.getElementById('eventModal');
        if (eventModalEl) {
            const eventModal = bootstrap.Modal.getInstance(eventModalEl);
            if (eventModal) eventModal.hide();
        }
    } catch (error) {
        console.error(isEditEvent ? "Error updating event:" : "Error adding event:", error);
        if (window.UtilsModule) {
            window.UtilsModule.showToast(isEditEvent ? 'Error al actualizar el evento.' : 'Error al agregar el evento.', 'error');
        }
    }
}

/**
 * Mostrar primer evento (home)
 */
function showFirstEvent() {
    if (homeEventIndex !== -1) {
        displayEvent(homeEventIndex);
    } else {
        fetchAllEvents();
    }
}

/**
 * Mostrar evento siguiente
 */
function showNextEvent() {
    if (currentEventIndex < allEvents.length - 1) {
        displayEvent(currentEventIndex + 1);
    }
}

/**
 * Mostrar evento anterior
 */
function showPreviousEvent() {
    if (currentEventIndex > 0) {
        displayEvent(currentEventIndex - 1);
    }
}

/**
 * Abrir modal para nuevo evento
 */
function openNewEventModal() {
    currentEditingEvent = null;
    
    const eventModalLabel = document.getElementById('eventModalLabel');
    if (eventModalLabel) {
        eventModalLabel.textContent = 'Nuevo Evento';
    }

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.reset();
    }

    const hiddenIdInput = document.getElementById('event-id');
    if (hiddenIdInput) {
        hiddenIdInput.value = '';
    }

    const eventModalEl = document.getElementById('eventModal');
    if (eventModalEl) {
        const eventModal = new bootstrap.Modal(eventModalEl);
        eventModal.show();
    }
}

// Exportar funciones para uso global
window.EventsModule = {
    fetchAllEvents,
    displayEvent,
    deleteEvent,
    editEvent,
    saveEvent,
    showFirstEvent,
    showNextEvent,
    showPreviousEvent,
    openNewEventModal
};
