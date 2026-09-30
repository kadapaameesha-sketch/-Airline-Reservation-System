-- 1. Create Database and Use it
CREATE DATABASE IF NOT EXISTS AirlineReservation;
USE AirlineReservation;

-- 2. Drop existing tables and views if they exist (for re-runnability)
DROP VIEW IF EXISTS FlightAvailability;
DROP TRIGGER IF EXISTS AfterBookingInsert;
DROP TRIGGER IF EXISTS AfterBookingUpdate;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Seats;
DROP TABLE IF EXISTS Flights;
DROP TABLE IF EXISTS Customers;

-- 3. Design schema and define constraints
CREATE TABLE Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE Flights (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    arrival_airport VARCHAR(10) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0)
);

CREATE TABLE Seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(5) NOT NULL,
    class ENUM('Economy', 'Business', 'First') NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE,
    UNIQUE (flight_id, seat_number)
);

CREATE TABLE Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    flight_id INT NOT NULL,
    seat_id INT NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status ENUM('Confirmed', 'Cancelled') DEFAULT 'Confirmed',
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES Seats(seat_id) ON DELETE CASCADE
);

-- 4. Triggers for booking updates and cancellations
DELIMITER //

CREATE TRIGGER AfterBookingInsert
AFTER INSERT ON Bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'Confirmed' THEN
        UPDATE Seats SET is_booked = TRUE WHERE seat_id = NEW.seat_id;
    END IF;
END //

CREATE TRIGGER AfterBookingUpdate
AFTER UPDATE ON Bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status = 'Confirmed' THEN
        UPDATE Seats SET is_booked = FALSE WHERE seat_id = NEW.seat_id;
    ELSEIF NEW.status = 'Confirmed' AND OLD.status = 'Cancelled' THEN
        UPDATE Seats SET is_booked = TRUE WHERE seat_id = NEW.seat_id;
    END IF;
END //

DELIMITER ;

-- 5. Flight availability views
CREATE VIEW FlightAvailability AS
SELECT 
    f.flight_id,
    f.flight_number,
    f.departure_airport,
    f.arrival_airport,
    f.departure_time,
    f.arrival_time,
    f.total_seats,
    COUNT(s.seat_id) AS available_seats
FROM 
    Flights f
LEFT JOIN 
    Seats s ON f.flight_id = s.flight_id AND s.is_booked = FALSE
GROUP BY 
    f.flight_id;

-- 6. Insert sample flight and booking records
INSERT INTO Customers (first_name, last_name, email, phone) VALUES
('John', 'Doe', 'john.doe@example.com', '1234567890'),
('Jane', 'Smith', 'jane.smith@example.com', '0987654321'),
('Alice', 'Johnson', 'alice.j@example.com', '5551234567');

INSERT INTO Flights (flight_number, departure_airport, arrival_airport, departure_time, arrival_time, total_seats) VALUES
('FL101', 'JFK', 'LHR', '2027-10-01 18:00:00', '2027-10-02 06:00:00', 3),
('FL102', 'LHR', 'JFK', '2027-10-05 10:00:00', '2027-10-05 14:00:00', 3);

INSERT INTO Seats (flight_id, seat_number, class) VALUES
(1, '1A', 'First'),
(1, '1B', 'Business'),
(1, '2A', 'Economy'),
(2, '1A', 'First'),
(2, '1B', 'Business'),
(2, '2A', 'Economy');

-- Insert a booking (Trigger will update Seats.is_booked to TRUE)
INSERT INTO Bookings (customer_id, flight_id, seat_id, amount, status) VALUES
(1, 1, 1, 1500.00, 'Confirmed'),
(2, 1, 2, 800.00, 'Confirmed');

-- Update a booking to Cancelled (Trigger will update Seats.is_booked to FALSE)
UPDATE Bookings SET status = 'Cancelled' WHERE booking_id = 2;

-- 7. Write queries for available seats, flight search, booking summary report

-- Query 1: Flight Search (e.g., JFK to LHR on 2027-10-01)
-- SELECT * FROM FlightAvailability 
-- WHERE departure_airport = 'JFK' 
--   AND arrival_airport = 'LHR'
--   AND DATE(departure_time) = '2027-10-01';

-- Query 2: Available seats for a specific flight (e.g., flight_id = 1)
-- SELECT seat_number, class 
-- FROM Seats 
-- WHERE flight_id = 1 AND is_booked = FALSE;

-- Query 3: Generate booking summary report
-- SELECT 
--     f.flight_number,
--     COUNT(b.booking_id) AS total_bookings,
--     SUM(CASE WHEN b.status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
--     SUM(CASE WHEN b.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
--     SUM(CASE WHEN b.status = 'Confirmed' THEN b.amount ELSE 0 END) AS total_revenue
-- FROM 
--     Flights f
-- LEFT JOIN 
--     Bookings b ON f.flight_id = b.flight_id
-- GROUP BY 
--     f.flight_id;
