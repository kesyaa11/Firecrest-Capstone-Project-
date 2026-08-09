DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS leave_request;
DROP TABLE IF EXISTS shift;

-- Used in Modules A, B, and C
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    country TEXT NOT NULL,
    team TEXT,
    manager_id INTEGER,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Module A
CREATE TABLE leave_request (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    approver_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Module A
CREATE TABLE shift (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    slot_number INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed Data Test
INSERT INTO users (name, role, country, team, manager_id) VALUES
('Terry', 'Manager', 'NZ', NULL, NULL),
('Benjamin', 'Employee', 'NZ', 'Team 1', 1),
('Sarah', 'Employee', 'NZ', 'Team 1', 1);

INSERT INTO shift (user_id, date, shift_start, shift_end, slot_number) VALUES
(1, '2026-08-10', '08:00', '18:00', 1),
(2, '2026-08-10', '09:00', '17:00', 2),
(3, '2026-08-11', '10:00', '18:00', 3);

INSERT INTO leave_request (user_id, approver_id, start_date, end_date, leave_type, status) VALUES
(2, 1, '2026-08-20', '2026-08-22', 'Annual Leave', 'Pending'),
(3, 1, '2026-08-25', '2026-08-25', 'Sick Leave', 'Approved'),
(2, 1, '2026-09-01', '2026-09-01', 'Personal Leave', 'Rejected');