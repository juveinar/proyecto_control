// Debug script to check contacts rendering
console.log('=== DEBUG CONTACTS ===');

// Check if elements exist
const contactsTableBody = document.getElementById('contacts-table-body');
const contactsEmptyMessage = document.getElementById('contacts-empty-message');
const contactsWidget = document.getElementById('contacts-widget');

console.log('contactsTableBody:', contactsTableBody);
console.log('contactsEmptyMessage:', contactsEmptyMessage);
console.log('contactsWidget:', contactsWidget);

// Check if renderContacts function exists
if (typeof renderContacts === 'function') {
    console.log('renderContacts function exists');
} else {
    console.log('renderContacts function NOT found');
}

// Check if allContacts variable exists and has data
if (typeof allContacts !== 'undefined') {
    console.log('allContacts exists, length:', allContacts.length);
    if (allContacts.length > 0) {
        console.log('First contact:', allContacts[0]);
    }
} else {
    console.log('allContacts is undefined');
}

// Check if fetchAllContacts function exists
if (typeof fetchAllContacts === 'function') {
    console.log('fetchAllContacts function exists');
} else {
    console.log('fetchAllContacts function NOT found');
}

// Manually test API call
fetch('/api/contacts')
    .then(response => {
        console.log('API Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API Data received, length:', data.length);
        if (data.length > 0) {
            console.log('First contact from API:', data[0]);
        }
    })
    .catch(error => {
        console.error('API Error:', error);
    });
