-- Used in Modules A, B, and C
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- Unique ID for user
    name TEXT NOT NULL, -- User's name
    role TEXT NOT NULL, -- Manager, Dev, or SD
    country TEXT NOT NULL, -- Country origin NZ or PH
    region TEXT, -- Region eg NZ-MWT
    team TEXT, -- Optional Team field
    manager_id INTEGER, -- Who their manager is / who they report to
    is_active BOOLEAN DEFAULT TRUE, -- Is the user still active within the company?
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL, -- Reference the manager's user
    CONSTRAINT unique_user UNIQUE (name, role, country, region) -- Prevent duplicated users
);

-- Table Comments for Users Table
COMMENT ON TABLE users IS 'Stores all personal information for people who work at Firecrest';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user, PK and auto unique';
COMMENT ON COLUMN users.name IS 'The users name';
COMMENT ON COLUMN users.role IS 'Are they part of the management, are they a Dev or are they part of SD';
COMMENT ON COLUMN users.country IS 'Country this person is located in (NZ or PH)';
COMMENT ON COLUMN users.region IS 'Region this person is located in eg NZ-MWT';
COMMENT ON COLUMN users.team IS 'Optional team field';
COMMENT ON COLUMN users.manager_id IS 'Whoever this persons manager is';
COMMENT ON COLUMN users.is_active IS 'Is this user still active within the comapany? Or have they left?';

-- Module A
CREATE TABLE leave_request (
    id SERIAL PRIMARY KEY, -- Unique ID for leave request
    user_id INTEGER NOT NULL, -- User's id for who is requesting the leave
    approver_id INTEGER, -- Who approved or rejected the leave 
    start_date DATE NOT NULL, -- When their leave starts
    end_date DATE NOT NULL, -- When their leave ends
    leave_type TEXT NOT NULL, -- Type of leave eg sick, annual, bereavement, alternate etc
    status TEXT NOT NULL, -- Is the leave pending, approved, or rejected
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Reference the user requesting leave
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL, -- Reference the user approving or rejecting the leave
    CONSTRAINT unique_leave_request UNIQUE (user_id, start_date, end_date, leave_type) -- Prevent duplicated leave requests for the same user and same dates
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

-- Table for public holidays 
CREATE TABLE public_holiday (
    id serial PRIMARY KEY, -- Unique ID for public holiday
    name TEXT NOT NULL, -- Name of the public holiday
    date DATE NOT NULL, -- Date of the public holiday
    country TEXT NOT NULL, -- What country this public holiday is for
    is_national BOOLEAN, -- Is this a national holiday or region specific
    regions TEXT[] DEFAULT '{}', -- Regions this public holiday is for if it's not national

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
    id SERIAL PRIMARY KEY, -- Unique ID for project
    name TEXT NOT NULL, -- Name of the project
    client TEXT, -- Who the client is for this project
    tracker_ref TEXT, -- Tracker reference for the project
    final_date DATE, -- Final date this project is expected to be completed by
    is_active BOOLEAN DEFAULT TRUE, -- Is this project still active (eg completed and no longer worked on)
    CONSTRAINT unique_project UNIQUE (name, client, tracker_ref) -- Prevent duplicated projects
);

-- Module B
CREATE TABLE project_specification (
    id SERIAL PRIMARY KEY, -- Unique ID for project specification
    project_id INTEGER NOT NULL, -- ID of the project this specification is for
    name TEXT NOT NULL, -- Name of the specification
    version TEXT NOT NULL, -- What version of the project this is eg v0.1, v0.2?
    link TEXT, -- The link to HALO where the specification's ticket is located
    specs BOOLEAN DEFAULT FALSE, -- Has the specs been completed
    build BOOLEAN DEFAULT FALSE, -- Has the build been completed
    test_sheet BOOLEAN DEFAULT FALSE, -- Has the test sheet been completed
    launch_plan BOOLEAN DEFAULT FALSE, -- Is the launchable?
    billing TEXT, -- What kind of billing this project is eg dev days, one off, non billable etc
    roadmap BOOLEAN DEFAULT FALSE, -- Is the roadmap completed
    target_date DATE, -- What's the target date for this specification
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE, -- If the project gets deleted the specification gets deleted too
    CONSTRAINT unique_specification UNIQUE (project_id, version)
);

-- Module A
CREATE TABLE shift (
    id SERIAL PRIMARY KEY, -- Unique ID for shift
    user_id INTEGER NOT NULL, -- User's id for who is assigned to the shift
    date DATE NOT NULL, -- Date of shift
    duration INTEGER, -- Length of shift in hours
    shift_start TIME, -- Start time for the shift
    shift_end TIME, -- End time for the shift
    shifts_count INTEGER, -- How many sprints they're doing in the day (optional field for if they want to change to 1 shift a day with this many sprints instead of 3 different shifts a day)
    slot_number INTEGER, -- UNSURE 
    project_id INTEGER, -- ID of the project that this person on this shift is working on
    specification_id INTEGER, -- Which specification this person is working on eg v0.1, v0.2
    work_type TEXT NOT NULL, -- What work are they doing? Are they testing, in a meeting, development, etc
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Reference user assigned to shift
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE SET NULL, -- Reference project id
    FOREIGN KEY (specification_id) REFERENCES project_specification(id) ON DELETE SET NULL -- Reference specification id
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

-- Module B
-- Stores change requests when Dev or SD needs a specification to return to an earlier stage
CREATE TABLE specification_change_request (
    id SERIAL PRIMARY KEY,
    specification_id INTEGER NOT NULL,
    requester_id INTEGER,
    stage TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (specification_id) REFERENCES project_specification(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_change_request UNIQUE (specification_id, stage, requester_id) -- Prevent duplicated change requests for the same specification and stage by the same requester
);

-- Module B Table allows multiple users to be assigned to a project specification
CREATE TABLE specification_users (
    id SERIAL PRIMARY KEY, -- Unique ID for specification user
    project_id INTEGER NOT NULL, -- The project id this user is working on
    specification_id INTEGER, -- The optional specification this user is working on eg v0.1, v0.2
    user_id INTEGER NOT NULL, -- ID of the user that is working on this project / specification
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE, -- Reference project id
    FOREIGN KEY (specification_id) REFERENCES project_specification(id) ON DELETE CASCADE, -- Reference specification id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Reference user id
    CONSTRAINT unique_specification_user UNIQUE (project_id, specification_id, user_id) -- Prevent duplicated entries for the same user on the same project and specification
);

-- Module B Handoff
CREATE TABLE specification_handoff (
    id SERIAL PRIMARY KEY, -- Unique ID for specification handoff
    project_id INTEGER NOT NULL, -- Project id this handoff is for
    specification_id INTEGER NOT NULL, -- Specification id this handoff is for eg (v0.1, v0.2)
    notified TIMESTAMP, -- When was this handoff created?
    expected TIMESTAMP, -- When does this handoff need to be completed by?
    status TEXT, -- Status of the handoff? Eg pending, testing, completed etc
    description TEXT, -- Description of what is being handed off and what needs to be done
    success boolean, -- Did the handoff succeed of fail?
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE, -- Reference project id
    FOREIGN KEY (specification_id) REFERENCES project_specification(id) ON DELETE CASCADE, -- Reference project specification id
    CONSTRAINT unique_specification_handoff UNIQUE (project_id, specification_id, status) -- Prevent duplicated handoffs for the same project and specification with the same status
);

-- Module B Delay for Status Specification Handoff
CREATE TABLE handoff_delay (
    id SERIAL PRIMARY KEY, -- Unique ID for handoff delay
    handoff_id INTEGER NOT NULL, -- Handoff id this delay is for
    reason TEXT NOT NULL, -- Why did this handoff get rejected or was it good
    delay_hours INTEGER, -- How many hours is this handoff delayed for? Eg failed fix it and resubmit and it'll be worked within 8 hours
    FOREIGN KEY (handoff_id) REFERENCES specification_handoff(id) ON DELETE CASCADE, -- Reference handoff id
    CONSTRAINT unique_handoff_delay UNIQUE (handoff_id, reason) -- Prevent duplicated handoff delays for the same handoff with the same reason
);

-- Module B handoff_signoff
CREATE TABLE handoff_signoff (
    id SERIAL PRIMARY KEY, -- Unique ID for handoff signoff
    handoff_id INTEGER NOT NULL, -- Handoff id this signoff is for
    signer_id INTEGER, -- Who signed off this handoff
    handoff_message TEXT, -- What was their message for the signoff? eg "Failed at this point fix this and that"
    signoff_date TIMESTAMP, -- When this handoff was signed off
    success BOOLEAN, -- Did it the handoff succeed or fail?
    FOREIGN KEY (handoff_id) REFERENCES specification_handoff(id) ON DELETE CASCADE, -- Reference handoff id
    FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE SET NULL, -- Reference user id for whoever is signing off this handoff
    CONSTRAINT unique_handoff_signoff UNIQUE (handoff_id, signer_id) -- Prevent duplicated handoff signoffs for the same handoff by the same signer
);

-- Module B Dev Days | Says how many dev days need to be completed in a month
CREATE TABLE specification_dev_day (
    id SERIAL PRIMARY KEY, -- Unique ID for specification dev day
    project_id INTEGER NOT NULL, -- Project id this dev day is for
    specification_id INTEGER, -- Specification id this dev day is for
    specified_month DATE NOT NULL, -- What month this allocation of dev days is for eg Jan, Feb etc
    dev_days DECIMAL, -- How many dev days are allocated for this month
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE, -- Reference project id
    FOREIGN KEY (specification_id) REFERENCES project_specification(id) ON DELETE CASCADE, -- Reference specification id
    CONSTRAINT unique_specification_dev_day UNIQUE (project_id, specification_id, specified_month) -- Prevent duplicated dev day allocations for the same project and specification in the same month
);

-- Module C Payroll Entry
CREATE TABLE payroll_entry (
    id SERIAL PRIMARY KEY, -- Unique ID for payroll entry
    user_id INTEGER NOT NULL, -- User id this payroll entry is for
    period_start DATE NOT NULL, -- Start date of the payroll period
    period_end DATE NOT NULL, -- End date of the payroll period
    hours_worked DECIMAL NOT NULL, -- Total hours worked in this payroll period
    leave_hours DECIMAL NOT NULL, -- Total leave hours taken in this payroll period
    break_deduction DECIMAL NOT NULL, -- Total break deduction in this payroll period
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_payroll_entry UNIQUE (user_id, period_start, period_end) -- Prevent duplicated payroll entries for the same user in the same period
);

-- Module C Leave Balance
CREATE TABLE leave_balance (
    id SERIAL PRIMARY KEY, -- Unique ID for leave balance
    user_id INTEGER NOT NULL, -- User id this leave balance is for
    sick_days INTEGER NOT NULL, -- Total sick days available for this user
    al_accured DECIMAL NOT NULL, -- Total annual leave accrued for this user
    al_taken_accured DECIMAL NOT NULL, -- Total annual leave taken for this user
    al_outstanding DECIMAL NOT NULL, -- Total annual leave outstanding for this user
    annual_owing DECIMAL NOT NULL, -- Total annual leave owing for this user
    alternative_days INTEGER NOT NULL, -- Total alternative days available for this user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_leave_balance UNIQUE (user_id) -- Prevent duplicated leave balances for the same user
);

-- Seed Data for Testing, this data is used just for testing purposes and will need to be removed for the final version

-- User Data
INSERT INTO users (name, role, country, region, team, manager_id) VALUES
('Terry Jeffords', 'Manager', 'NZ', 'NZ-WGN', NULL, NULL),
('Benjamin Franklin', 'Dev', 'NZ', 'NZ-MWT', 'Team 1', 1),
('Sarah Parker', 'SD', 'NZ', 'NZ-STL', 'Team 1', 1),
('Lucy Heartfilia', 'SD', 'PH', 'PH-AUR', 'Team 1', 1);

-- Project Data
INSERT INTO project (name, client, tracker_ref, final_date, is_active) VALUES
('Firecrest Capstone', 'Firecrest', 'TK-001', '2026-10-25', TRUE),
('Homelab', 'Phomon Limited', 'TK-002', '2026-12-31', TRUE),
('Battle Bot Project', 'Massey University', 'TK-139', '2029-7-12', FALSE);

-- Project Specification Data
INSERT INTO project_specification (project_id, name, version, link, specs, build, test_sheet, launch_plan, billing, roadmap, target_date) VALUES
(1, 'Initial Project Creation', 'v0.1', 'https://cdn-icons-png.flaticon.com/512/4703/4703650.png', TRUE, FALSE, FALSE, FALSE, 'Non Billable', TRUE, '2026-10-25'),
(1, 'Added new features and updates', 'v0.2', 'https://store.steampowered.com/', TRUE, TRUE, FALSE, FALSE, 'Non Billable', TRUE, '2026-11-15'),
(2, 'Homelab is loaded with everything possible', 'v2.3', 'https://assets.nintendo.com.au/image/upload/f_auto/q_auto/v1674436794/NAL/Articles/Get%20to%20know%20Link%20and%20his%20many%20adventures/hero', TRUE, TRUE, TRUE, TRUE, 'Billable', TRUE, '2026-12-31'),
(3, 'Battle Bot chainsaw has been added to Crocky Rocky', 'v1.1', 'https://www.youtube.com/watch?v=-jzP1at7nfE', FALSE, FALSE, FALSE, FALSE, 'Non Billable', FALSE, '2029-07-12');

-- Shift Data
INSERT INTO shift (user_id, date, duration, shift_start, shift_end, shifts_count, slot_number, work_type) VALUES
(1, '2026-08-10', 2, '08:00', '18:00', 2, 1, 'Other'),
(2, '2026-08-10', 4, '09:00', '17:00', 3, 2, 'Development'),
(3, '2026-08-11', 6, '10:00', '18:00', 3, 3, 'Testing');

-- Leave Request Data
INSERT INTO leave_request (user_id, approver_id, start_date, end_date, leave_type, status) VALUES
(2, 1, '2026-08-20', '2026-08-22', 'Annual Leave', 'Pending'),
(3, 1, '2026-08-25', '2026-08-25', 'Sick Leave', 'Approved'),
(2, 1, '2026-09-01', '2026-09-01', 'Personal Leave', 'Rejected');

-- Specification User Assignment
INSERT INTO specification_users (project_id, specification_id, user_id) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 3, 3),
(3, 4, 1),
(3, 4, 2),
(3, 4, 3);

-- Specification Handoff Data
INSERT INTO specification_handoff (project_id, specification_id, notified, expected, status, description, success) VALUES
(1, 1, '2026-09-25 09:45:00', '2026-09-30 17:00:00', 'Pending', 'Test the initial APIs and ensure frontend can connect', NULL),
(1, 2, '2026-10-01 10:00:00', '2026-10-05 17:00:00', 'Testing', 'Implement the new features and update the existing ones', NULL),
(2, 3, '2026-11-15 14:30:00', '2026-11-20 17:00:00', 'Completed', 'Complete the homelab setup and configuration', TRUE),
(3, 4, '2026-09-28 11:00:35', '2029-01-07 4:00:00', 'Completed', 'Add the new features to the battle bot', FALSE);

-- Handoff Signoff Data
INSERT INTO handoff_signoff (handoff_id, signer_id, handoff_message, signoff_date, success) VALUES
(3, 3, 'Tested homelab config and setup, everything is working as required', '2026-11-20 16:45:00', TRUE),
(4, 3, 'Tested Battle bot features currently chainsaw goes wild and is a hazard, needs to be bolted down better', '2026-10-10 15:30:00', FALSE);

-- Handoff Delay Data
INSERT INTO handoff_delay (handoff_id, reason, delay_hours) VALUES
(1, 'Fire in the office', 48),
(2, 'Power outage', 3),
(3, 'Sickness', 24);