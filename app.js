// === utils.js ===
const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);
};

const formatCurrency = (amount) => {
    const currencyCode = (typeof appData !== 'undefined' && appData.settings && appData.settings.currency) ? appData.settings.currency : 'USD';
    
    let locale = 'en-US';
    if(currencyCode === 'INR') locale = 'en-IN';
    else if(currencyCode === 'EUR') locale = 'en-IE';
    else if(currencyCode === 'GBP') locale = 'en-GB';
    else if(currencyCode === 'JPY') locale = 'ja-JP';
    else if(currencyCode === 'AUD') locale = 'en-AU';

    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

const sanitizeHTML = (str) => {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

const escapeHTML = sanitizeHTML;

// === storage.js ===
const STORAGE_KEY = 'airlineTracker:data';
const CURRENT_VERSION = 1;

const defaultData = {
    version: CURRENT_VERSION,
    settings: { currency: 'USD' },
    flights: [
        { id: 'f1', flightNumber: 'FL101', origin: 'JFK', destination: 'LHR', departureDate: '2027-10-01T18:00', price: 500, totalSeats: 200, availableSeats: 200 },
        { id: 'f2', flightNumber: 'FL102', origin: 'LHR', destination: 'JFK', departureDate: '2027-10-05T10:00', price: 450, totalSeats: 200, availableSeats: 200 },
        { id: 'f3', flightNumber: 'FL201', origin: 'SFO', destination: 'JFK', departureDate: '2027-10-10T08:00', price: 300, totalSeats: 150, availableSeats: 150 },
        { id: 'f4', flightNumber: 'FL202', origin: 'JFK', destination: 'SFO', departureDate: '2027-10-12T14:00', price: 320, totalSeats: 150, availableSeats: 150 },
        { id: 'f5', flightNumber: 'FL301', origin: 'LAX', destination: 'NRT', departureDate: '2027-11-01T23:30', price: 800, totalSeats: 300, availableSeats: 300 }
    ],
    bookings: []
};

const loadData = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return JSON.parse(JSON.stringify(defaultData));
    
    try {
        let parsed = JSON.parse(data);
        if (parsed.version < CURRENT_VERSION) {
            parsed.version = CURRENT_VERSION;
            saveData(parsed);
        }
        return parsed;
    } catch (e) {
        console.error('Data corrupted, returning default', e);
        return JSON.parse(JSON.stringify(defaultData));
    }
};

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const resetData = () => {
    const fresh = JSON.parse(JSON.stringify(defaultData));
    saveData(fresh);
};

// === app.js (main logic) ===
let appData = loadData();

// UI Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    search: document.getElementById('view-search'),
    bookings: document.getElementById('view-bookings'),
    settings: document.getElementById('view-settings')
};
const navBtns = {
    dashboard: document.getElementById('nav-dashboard'),
    search: document.getElementById('nav-search'),
    bookings: document.getElementById('nav-bookings'),
    settings: document.getElementById('nav-settings')
};
const toastEl = document.getElementById('toast');

// Navigation Logic
const navigateTo = (viewName) => {
    Object.keys(views).forEach(k => {
        views[k].classList.add('hidden');
        navBtns[k].classList.remove('active');
    });
    views[viewName].classList.remove('hidden');
    navBtns[viewName].classList.add('active');
    renderView(viewName);
};

Object.keys(navBtns).forEach(k => {
    navBtns[k].addEventListener('click', () => navigateTo(k));
});

// Toast Helper
let toastTimeout;
const showToast = (message, isError = false) => {
    toastEl.textContent = message;
    if(isError) toastEl.classList.add('error');
    else toastEl.classList.remove('error');
    
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 4000);
};

// Render Functions
const renderDashboard = () => {
    const activeBookings = appData.bookings.filter(b => b.status === 'Confirmed');
    document.getElementById('dash-total-bookings').textContent = activeBookings.length;
    
    const totalSpent = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    document.getElementById('dash-total-spent').textContent = formatCurrency(totalSpent);

    const tbody = document.getElementById('dash-flights-table');
    if (appData.flights.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No flights available.</td></tr>';
        return;
    }
    
    tbody.innerHTML = appData.flights.map(f => `
        <tr>
            <td><strong>${escapeHTML(f.flightNumber)}</strong></td>
            <td>${escapeHTML(f.origin)} &rarr; ${escapeHTML(f.destination)}</td>
            <td>${formatDate(f.departureDate)}</td>
            <td>${formatCurrency(f.price)}</td>
            <td>
                <span style="color: ${f.availableSeats > 0 ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${f.availableSeats} / ${f.totalSeats}
                </span>
            </td>
        </tr>
    `).join('');
};

const performSearch = (showAll = false) => {
    const origin = document.getElementById('search-origin').value.trim().toUpperCase();
    const dest = document.getElementById('search-dest').value.trim().toUpperCase();
    
    let results = appData.flights;
    
    if (!showAll) {
        if (origin) results = results.filter(f => f.origin.includes(origin));
        if (dest) results = results.filter(f => f.destination.includes(dest));
    }

    const resultsContainer = document.getElementById('search-results');
    resultsContainer.classList.remove('hidden');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="card" style="grid-column: 1 / -1;"><p>No flights found matching your search.</p></div>';
        return;
    }

    resultsContainer.innerHTML = results.map(f => `
        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
                <h4 style="color:var(--accent-primary); font-size:1.2rem;">${escapeHTML(f.flightNumber)}</h4>
                <p style="color:var(--text-primary); margin-bottom:8px; font-weight:500;">
                    ${escapeHTML(f.origin)} &rarr; ${escapeHTML(f.destination)}
                </p>
                <p style="color:var(--text-secondary); margin-bottom:24px; font-size:0.9rem;">
                    Departs: ${formatDate(f.departureDate)}<br>
                    Seats Available: ${f.availableSeats}
                </p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:600; font-size:1.25rem;">${formatCurrency(f.price)}</span>
                <button class="btn btn-book" data-id="${f.id}" ${f.availableSeats === 0 ? 'disabled' : ''}>
                    ${f.availableSeats > 0 ? 'Book' : 'Sold Out'}
                </button>
            </div>
        </div>
    `).join('');

    resultsContainer.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', (e) => openBookingModal(e.target.getAttribute('data-id')));
    });
};

document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
});

document.getElementById('btn-show-all').addEventListener('click', () => {
    document.getElementById('search-origin').value = '';
    document.getElementById('search-dest').value = '';
    performSearch(true);
});

// Booking Modal Logic
let currentFlightPrice = 0;
const modalEl = document.getElementById('booking-modal');

const openBookingModal = (flightId) => {
    const flight = appData.flights.find(f => f.id === flightId);
    if(!flight) return;
    
    document.getElementById('modal-flight-num').textContent = flight.flightNumber;
    document.getElementById('modal-flight-route').innerHTML = `${escapeHTML(flight.origin)} &rarr; ${escapeHTML(flight.destination)}`;
    document.getElementById('modal-flight-id').value = flight.id;
    document.getElementById('modal-name').value = '';
    
    const countInput = document.getElementById('modal-count');
    countInput.value = 1;
    countInput.max = flight.availableSeats;
    
    currentFlightPrice = flight.price;
    updateModalTotal();
    
    modalEl.classList.remove('hidden');
    document.getElementById('modal-name').focus();
};

const updateModalTotal = () => {
    const count = parseInt(document.getElementById('modal-count').value) || 1;
    document.getElementById('modal-total').textContent = formatCurrency(count * currentFlightPrice);
};
document.getElementById('modal-count').addEventListener('input', updateModalTotal);

document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    modalEl.classList.add('hidden');
});

document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const flightId = document.getElementById('modal-flight-id').value;
    const name = document.getElementById('modal-name').value.trim();
    const count = parseInt(document.getElementById('modal-count').value);
    
    const flightIndex = appData.flights.findIndex(f => f.id === flightId);
    if(flightIndex === -1 || appData.flights[flightIndex].availableSeats < count) {
        showToast('Not enough seats available!', true);
        return;
    }
    
    appData.flights[flightIndex].availableSeats -= count;
    const booking = {
        id: generateId(),
        flightId,
        flightNumber: appData.flights[flightIndex].flightNumber,
        customerName: name,
        passengerCount: count,
        totalAmount: count * currentFlightPrice,
        status: 'Confirmed',
        createdAt: new Date().toISOString()
    };
    appData.bookings.push(booking);
    saveData(appData);
    
    modalEl.classList.add('hidden');
    showToast('Booking successful!');
    
    if(!views.dashboard.classList.contains('hidden')) renderDashboard();
    if(!views.search.classList.contains('hidden')) performSearch();
});

// Bookings View
const renderBookings = () => {
    const tbody = document.getElementById('bookings-table');
    if(appData.bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No bookings found.</td></tr>';
        return;
    }
    
    const sortedBookings = [...appData.bookings].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = sortedBookings.map(b => `
        <tr>
            <td><code>${b.id.substring(0,6)}</code></td>
            <td><strong>${escapeHTML(b.flightNumber)}</strong></td>
            <td>${escapeHTML(b.customerName)} (${b.passengerCount} pax)</td>
            <td>${formatDate(b.createdAt)}</td>
            <td>${formatCurrency(b.totalAmount)}</td>
            <td>
                <span style="color: ${b.status==='Confirmed' ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${b.status}
                </span>
            </td>
            <td>
                ${b.status === 'Confirmed' ? 
                    `<button class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;" data-cancel-id="${b.id}">Cancel</button>` 
                    : '-'}
            </td>
        </tr>
    `).join('');
    
    tbody.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', (e) => cancelBooking(e.target.getAttribute('data-cancel-id')));
    });
};

const cancelBooking = (bookingId) => {
    if(!confirm('Are you sure you want to cancel this booking?')) return;
    
    const booking = appData.bookings.find(b => b.id === bookingId);
    if(booking && booking.status === 'Confirmed') {
        booking.status = 'Cancelled';
        const flight = appData.flights.find(f => f.id === booking.flightId);
        if(flight) flight.availableSeats += booking.passengerCount;
        
        saveData(appData);
        showToast('Booking cancelled.');
        renderBookings();
        renderDashboard();
    }
};

document.getElementById('btn-reset').addEventListener('click', () => {
    if(confirm('Are you sure you want to reset ALL data? This will restore default flights and remove all bookings.')) {
        resetData();
        appData = loadData();
        renderDashboard();
        renderBookings();
        showToast('Data reset to defaults.');
    }
});

const renderView = (viewName) => {
    if (viewName === 'dashboard') renderDashboard();
    else if (viewName === 'search') {
        performSearch(true); 
    }
    else if (viewName === 'bookings') renderBookings();
    else if (viewName === 'settings') {
        document.getElementById('setting-currency').value = appData.settings.currency || 'USD';
    }
};

document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newCurrency = document.getElementById('setting-currency').value;
    appData.settings.currency = newCurrency;
    saveData(appData);
    
    showToast('Preferences saved!');
});

// Initialize
renderDashboard();
