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
    project_id INTEGER,
    specification_id INTEGER,
    work_type TEXT NOT NULL,
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
COMMENT ON COLUMN shift.work_type IS 'Type of work scheduled for this shift';

-- Table for public holidays 
CREATE TABLE public_holiday (
    id serial PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    country TEXT NOT NULL,
    is_national BOOLEAN,
    regions TEXT[] DEFAULT '{}',

    -- Prevent duplicated entries for the same holiday in the same country
    CONSTRAINT unique_holiday UNIQUE (name, country, date)
);

-- Table comments for public holidays table
COMMENT ON TABLE public_holiday IS 'This table stores the public holidays for NZ and PH and this table should update weekly';
COMMENT ON COLUMN public_holiday.id IS 'Unique identifier for the public holiday record. PK and auto unique';
COMMENT ON COLUMN public_holiday.name IS 'Name of the public holiday';
COMMENT ON COLUMN public_holiday.date IS 'Date of the public holiday';
COMMENT ON COLUMN public_holiday.country IS 'Country where the public holiday is observed';
COMMENT ON COLUMN public_holiday.is_national IS 'True means every part of the country celebrates it as a public holiday';
COMMENT ON COLUMN public_holiday.regions IS 'List of regions where the public holiday is celebrated in the country eg Manawatu';

-- Module B
CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tracker_ref TEXT,
    final_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Module B
CREATE TABLE project_specification (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    author_id INTEGER,
    version TEXT,
    content TEXT,
    specs BOOLEAN DEFAULT FALSE,
    build BOOLEAN DEFAULT FALSE,
    test_sheet BOOLEAN DEFAULT FALSE,
    launch_plan BOOLEAN DEFAULT FALSE,
    billing TEXT,
    roadmap BOOLEAN DEFAULT FALSE,
    target_date DATE,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Module B Table allows multiple users to be assigned to a project specification
CREATE TABLE specification_users (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    specification_id INTEGER,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (specification_id) REFERENCES project_specification(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Module B Handoff
CREATE TABLE specification_handoff (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    specification_id INTEGER NOT NULL,
    notified TIMESTAMP,
    expected TIMESTAMP,
    status TEXT,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (specification_id) REFERENCES project_specification(id)
);

-- Module B Delay for Status Specification Handoff
CREATE TABLE handoff_delay (
    id SERIAL PRIMARY KEY,
    handoff_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    delay_hours INTEGER,
    FOREIGN KEY (handoff_id) REFERENCES specification_handoff(id)
);

-- Module B handoff_signoff
CREATE TABLE handoff_signoff (
    id SERIAL PRIMARY KEY,
    handoff_id INTEGER NOT NULL,
    signer_id INTEGER NOT NULL,
    signer_role TEXT,
    signoff_date DATE,
    FOREIGN KEY (handoff_id) REFERENCES specification_handoff(id),
    FOREIGN KEY (signer_id) REFERENCES users(id)
);

-- Module B Dev Days
CREATE TABLE specification_dev_day (
    id SERIAL PRIMARY KEY,
    specification_id INTEGER NOT NULL,
    specified_month DATE NOT NULL,
    dev_days DECIMAL,
    FOREIGN KEY (specification_id) REFERENCES project_specification(id)
);

-- Module C Payroll Entry
CREATE TABLE payroll_entry (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    hours_worked DECIMAL NOT NULL,
    leave_hours DECIMAL NOT NULL,
    break_deduction DECIMAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Module C Leave Balance
CREATE TABLE leave_balance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sick_days INTEGER NOT NULL,
    al_accured DECIMAL NOT NULL,
    al_taken_accured DECIMAL NOT NULL,
    al_outstanding DECIMAL NOT NULL,
    annual_owing DECIMAL NOT NULL,
    alternative_days INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Module A Seed Data Test
INSERT INTO users (name, role, country, region, team, manager_id) VALUES
('Terry', 'Manager', 'NZ', 'NZ-WGN', NULL, NULL),
('Benjamin', 'Employee', 'NZ', 'NZ-MWT', 'Team 1', 1),
('Sarah', 'Employee', 'NZ', 'NZ-STL', 'Team 1', 1);

INSERT INTO shift (user_id, date, duration, shift_start, shift_end, shifts_count, slot_number, work_type) VALUES
(1, '2026-08-10', 2, '08:00', '18:00', 2, 1, 'Other'),
(2, '2026-08-10', 4, '09:00', '17:00', 3, 2, 'Development'),
(3, '2026-08-11', 6, '10:00', '18:00', 3, 3, 'Testing');

INSERT INTO leave_request (user_id, approver_id, start_date, end_date, leave_type, status) VALUES
(2, 1, '2026-08-20', '2026-08-22', 'Annual Leave', 'Pending'),
(3, 1, '2026-08-25', '2026-08-25', 'Sick Leave', 'Approved'),
(2, 1, '2026-09-01', '2026-09-01', 'Personal Leave', 'Rejected');

-- Module B Seed Data Test
INSERT INTO project (name, tracker_ref, final_date) VALUES
('Firecrest Capstone', 'TK-001', '2026-10-25'),
('Homelab', 'TK-002', '2026-12-31');

INSERT INTO project_specification (project_id, author_id, version, content, specs, build, test_sheet, launch_plan, billing, roadmap, target_date) VALUES
(1, 1, 'v0.1', 'Initial Project Creation', TRUE, FALSE, FALSE, FALSE, 'Non Billable', TRUE, '2026-10-25'),
(1, 2, 'v0.2', 'Added new features and updates', TRUE, TRUE, FALSE, FALSE, 'Non Billable', TRUE, '2026-11-15'),
(2, 3, 'v2.3', 'Homelab is loaded with everything possible', TRUE, TRUE, TRUE, TRUE, 'Billable', TRUE, '2026-12-31');

INSERT INTO specification_users (project_id, specification_id, user_id) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 3, 3);

INSERT INTO specification_handoff (project_id, specification_id, notifiedm expected, status) VALUES
(1, 1, '2026-25-09 09:45:00', '2026-30-09 17:00:00', 'Pending'),
(1, 2, '2026-01-10 10:00:00', '2026-05-10 17:00:00', 'Pending'),
(2, 3, '2026-15-11 14:30:00', '2026-20-11 17:00:00', 'Completed');

INSERT INTO handoff_delay (handoff_id, reason, delay_hours) VALUES
(1, 'Fire in the office', 48),
(2, 'Power outage', 3),
(3, 'Sickness', 24);