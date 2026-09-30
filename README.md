# AeroBook - Airline Reservation System

A vanilla web application for managing airline flights and bookings, built with HTML, CSS, and JavaScript. 
Data is persisted locally using `localStorage`. This app was built using the GEMINI constraints (no frameworks, pure JS/HTML/CSS) and the Brand Guidelines (Matte Black Theme).

## Core Features
1. **Dashboard View:**
   - Summaries of total bookings and total spent.
   - List of all available flights with real-time seat counts.
2. **Search Flights View:**
   - Search flights by Origin and Destination.
   - Create bookings directly from search results.
3. **My Bookings View:**
   - View history of all bookings.
   - Cancel active bookings.
   - Reset data to initial state.

## Setup Instructions
1. Open `index.html` in any modern web browser.
2. No server or build step is required.

## Data Schema & Storage
Stored in `localStorage` under the key `airlineTracker:data`.
```json
{
  "version": 1,
  "settings": { "currency": "USD" },
  "flights": [
    { 
       "id": "f1", 
       "flightNumber": "FL101", 
       "origin": "JFK", 
       "destination": "LHR", 
       "departureDate": "2027-10-01T18:00", 
       "price": 500, 
       "totalSeats": 200, 
       "availableSeats": 200 
    }
  ],
  "bookings": [
    {
       "id": "b1",
       "flightId": "f1",
       "flightNumber": "FL101",
       "customerName": "John Doe",
       "passengerCount": 1,
       "totalAmount": 500,
       "status": "Confirmed",
       "createdAt": "2026-09-27T10:00:00.000Z"
    }
  ]
}
```

## Manual Test Checklist
- [ ] Verify Dashboard loads and shows sample flights.
- [ ] Go to Search Flights, enter 'JFK', click Search, and see results.
- [ ] Click 'Book', fill out the modal, confirm. Check that a success toast appears.
- [ ] Go to Dashboard. Verify 'Total Bookings' and 'Total Spent' incremented.
- [ ] Go to My Bookings. Verify the booking appears.
- [ ] Click Cancel on a booking. Verify status changes to 'Cancelled' and seat counts reflect the change in the Dashboard.

## Future Improvements
- Add complex dates to the Search filter.
- Implement an Undo feature within the 5-second toast window as described in GEMINI.md.
- Import/Export data feature.
