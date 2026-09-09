DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS leave_request;
DROP TABLE IF EXISTS shift;

-- Used in Modules A, B, and C
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    team TEXT,
    manager_id INTEGER,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Table Comments for Users Table
COMMENT ON TABLE users IS 'Stores all personal information for people who work at Firecrest';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user, PK and auto unique';
COMMENT ON COLUMN users.name IS 'The users name';
COMMENT ON COLUMN users.role IS 'Are they part of the management, are they a Dev or are they part of SD';
COMMENT ON COLUMN users.country IS 'Country this person is located in (NZ or PH)';
COMMENT ON COLUMN users.region IS 'Region this person is located in eg Manawatu';
COMMENT ON COLUMN users.team IS 'Unsure what this is for yet';
COMMENT ON COLUMN users.manager_id IS 'Whoever this persons manager is';

-- Module A
CREATE TABLE leave_request (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    approver_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Table Comments for Leave Requests Table
COMMENT ON TABLE leave_request IS 'This table is used for storing and tracking leave and their requests eg sick, annual, bereavement, alternate, etc';
COMMENT ON COLUMN leave_request.id IS 'Unique identifier for the leave request, PK and auto unique';
COMMENT ON COLUMN leave_request.user_id IS 'Whoever is requesting the leave, relates to User ID in the users table';
COMMENT ON COLUMN leave_request.approver_id IS 'Whoever has approved the leave / rejected the leave request, relates to User ID in the users table';
COMMENT ON COLUMN leave_request.start_date IS 'Leave start date.';
COMMENT ON COLUMN leave_request.end_date IS 'Leave end date.';
COMMENT ON COLUMN leave_request.leave_type IS 'Type of leave requested eg sick, annual, bereavement, alternate, etc';
COMMENT ON COLUMN leave_request.status IS 'Has the leave been accepted, rejected or is still pending';

-- Module A
CREATE TABLE shift (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    duration INTEGER,
    shift_start TIME,
    shift_end TIME,
    shifts_count INTEGER,
    slot_number INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table Comments for Shifts Table
COMMENT ON TABLE shift IS 'This table stores all shifts for the employees in the system with all relevant information';
COMMENT ON COLUMN shift.id IS 'Unique identifier for the shift record. PK and auto unique';
COMMENT ON COLUMN shift.user_id IS 'User assigned to this shift relating to users table';
COMMENT ON COLUMN shift.date IS 'Date of shift';
COMMENT ON COLUMN shift.duration IS 'Length of the shift in hours';
COMMENT ON COLUMN shift.shift_start IS 'Start time for the shift';
COMMENT ON COLUMN shift.shift_end IS 'End time for the shift';
COMMENT ON COLUMN shift.shifts_count IS 'How many sprints / shifts are being worked this day';
COMMENT ON COLUMN shift.slot_number IS 'If there are limited employee slots for a shift? This is to manage who is on the shift';

-- Table for public holidays 
CREATE TABLE public_holiday (
    id serial PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    country TEXT NOT NULL,
    is_national BOOLEAN

    -- Prevent duplicated entries for the same holiday in the same country
    CONSTRAINT unique_holiday UNIQUE (name, country, date)
)

-- Regions Public Holidays Table
CREATE TABLE public_holiday_regions (
    id serial PRIMARY KEY,
    holiday_id INTEGER NOT NULL,
    region_code TEXT NOT NULL

    -- Prevent duplicated entries for the same holiday division
    CONSTRAINT unique_holiday_regions UNIQUE (holiday_id, region_code)

    -- Foreign Key Reference | If the public holiday is deleted the subdivision is deleted also
    FOREIGN KEY (holiday_id) REFERENCES public_holiday(id) ON DELETE CASCADE
)

-- Table comments for public holidays table
COMMENT ON TABLE public_holiday IS 'This table stores the public holidays for NZ and PH and this table should update weekly';
COMMENT ON COLUMN public_holiday.id IS 'Unique identifier for the public holiday record. PK and auto unique';
COMMENT ON COLUMN public_holiday.name IS 'Name of the public holiday';
COMMENT ON COLUMN public_holiday.type IS 'Type of the public holiday eg full day, half day, etc';
COMMENT ON COLUMN public_holiday.start_date IS 'Start date of the public holiday';
COMMENT ON COLUMN public_holiday.end_date IS 'End date of the public holiday';
COMMENT ON COLUMN public_holiday.country IS 'Country where the public holiday is observed';

-- Table comments for public holiday regions table
COMMENT ON TABLE public_holiday_regions IS 'Some holidays only occur in certain parts of the country, this table stores each region in reference to the public holiday';
COMMENT ON COLUMN public_holiday_regions.id IS 'Unique identifier for the public holiday region record. PK and auto unique';
COMMENT ON COLUMN public_holiday_regions.holiday_id IS 'Foreign key reference to the public holiday table';
COMMENT ON COLUMN public_holiday_regions.region_code IS 'Region code for the public holiday';

-- Module B
CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tracker_ref TEXT
);

-- Module B
CREATE TABLE project_specification (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    author_id INTEGER,
    version TEXT,
    content TEXT,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Module A Seed Data Test
INSERT INTO users (name, role, country, team, manager_id) VALUES
('Terry', 'Manager', 'NZ', NULL, NULL),
('Benjamin', 'Employee', 'NZ', 'Team 1', 1),
('Sarah', 'Employee', 'NZ', 'Team 1', 1);

INSERT INTO shift (user_id, date, duration, shift_start, shift_end, shifts_count, slot_number) VALUES
(1, '2026-08-10', 2, '08:00', '18:00', 2, 1),
(2, '2026-08-10', 4, '09:00', '17:00', 3, 2),
(3, '2026-08-11', 6, '10:00', '18:00', 3, 3);

INSERT INTO leave_request (user_id, approver_id, start_date, end_date, leave_type, status) VALUES
(2, 1, '2026-08-20', '2026-08-22', 'Annual Leave', 'Pending'),
(3, 1, '2026-08-25', '2026-08-25', 'Sick Leave', 'Approved'),
(2, 1, '2026-09-01', '2026-09-01', 'Personal Leave', 'Rejected');

-- Module B Seed Data Test
INSERT INTO project (name, tracker_ref) VALUES
('Firecrest Capstone', 'TK-001'),
('Homelab', 'TK-002');

INSERT INTO project_specification (project_id, author_id, version, content) VALUES
(1, 1, 'v0.1', 'Initial Project Creation'),
(2, 3, 'v2.3', 'Homelab is loaded with everything possible')