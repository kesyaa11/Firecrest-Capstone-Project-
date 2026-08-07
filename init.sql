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
    slot_number INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed Data Test
INSERT INTO users (name, role, country, team, manager_id) VALUES
('Terry', 'Manager', 'NZ', NULL, NULL),
('Benjamin', 'Employee', 'NZ', 'Team 1', 1),
('Sarah', 'Employee', 'NZ', 'Team 1', 1);