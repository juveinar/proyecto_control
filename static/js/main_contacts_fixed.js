// Contacts widget functionality - Fixed version

// Get DOM elements
const contactsWidget = document.getElementById('contacts-widget');
const contactsToggleBtn = document.getElementById('contacts-toggle-btn');
const contactsWidgetBody = document.getElementById('contacts-widget-body');
const contactsTableBody = document.getElementById('contacts-table-body');
const contactsEmptyMessage = document.getElementById('contacts-empty-message');
const addContactBtn = document.getElementById('add-contact-btn');
const contactModalEl = document.getElementById('contactModal');
const contactModal = new bootstrap.Modal(contactModalEl);
const saveContactBtn = document.getElementById('saveContactBtn');

// Variables
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

    // Add click handlers for pagination links
    navUl.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.closest('.page-link').dataset.page);
            if (page && page !== contactsCurrentPage && page >= 1 && page <= totalPages) {
                contactsCurrentPage = page;
                renderContacts();
            }
        });
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
        return `
        <tr data-contact-id="${contact.id}">
            <td class="align-middle">${contact.nombre}</td>
            <td class="align-middle small text-muted">${contact.cargo || ''}${contact.cargo && contact.area ? ' / ' : ''}${contact.area || ''}</td>
            <td class="align-middle small">
                ${contact.telefono ? `<div><i class="bi bi-telephone-fill me-2"></i>${contact.telefono}</div>` : ''}
                ${contact.correo ? `<div><i class="bi bi-envelope-fill me-2"></i>${contact.correo}</div>` : ''}
            </td>
            <td class="align-middle small">${contact.proyecto_nombre || ''}</td>
            <td class="text-end align-middle">
                <div class="d-flex gap-1 justify-content-end">
                    ${contact.correo ? `
                        <a href="msteams:/l/chat/0/0?users=${contact.correo}" class="btn btn-sm btn-outline-primary" title="Chatear en Teams"><i class="bi bi-microsoft-teams"></i></a>
                        <a href="mailto:${contact.correo}" class="btn btn-sm btn-outline-primary" title="Enviar Correo"><i class="bi bi-envelope-fill"></i></a>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-secondary btn-edit-contact" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-contact" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
                </div>
            </td>
        </tr>
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
        allContacts = await response.json();
        console.log('Contacts loaded:', allContacts.length, 'items');
        
        if (allContacts.length > 0) {
            console.log('First contact sample:', allContacts[0]);
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

if (saveContactBtn) {
    saveContactBtn.addEventListener('click', saveContact);
}

if (contactsWidgetBody) {
    contactsWidgetBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-contact');
        if (editBtn) {
            const contactId = parseInt(editBtn.closest('tr').dataset.contactId, 10);
            const contact = allContacts.find(c => c.id === contactId);
            if (contact) openContactModal(contact);
        }

        const deleteBtn = e.target.closest('.btn-delete-contact');
        if (deleteBtn) {
            const contactId = parseInt(deleteBtn.closest('tr').dataset.contactId, 10);
            deleteContact(contactId);
        }
    });
}

// Close widget when clicking outside
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

// Placeholder functions for contact operations (to be implemented)
function openContactModal(contact = null) {
    console.log('Opening contact modal for:', contact);
    // TODO: Implement contact modal functionality
}

function saveContact() {
    console.log('Saving contact...');
    // TODO: Implement save contact functionality
}

function deleteContact(contactId) {
    console.log('Deleting contact:', contactId);
    // TODO: Implement delete contact functionality
}
