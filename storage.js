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

export const loadData = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return JSON.parse(JSON.stringify(defaultData));
    
    try {
        let parsed = JSON.parse(data);
        if (parsed.version < CURRENT_VERSION) {
            // Future schema migrations would run here
            parsed.version = CURRENT_VERSION;
            saveData(parsed);
        }
        return parsed;
    } catch (e) {
        console.error('Data corrupted, returning default', e);
        return JSON.parse(JSON.stringify(defaultData));
    }
};

export const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const resetData = () => {
    const fresh = JSON.parse(JSON.stringify(defaultData));
    saveData(fresh);
};
