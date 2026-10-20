import { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";

import WeekSelector from "../components/WeekSelector";

import { getUsers } from "../api/users";
import { getFortnightHoursForAllUsers } from "../api/hours";

import ApplyLeaveModal from "../components/ApplyLeaveModal";
import TimesheetDetailsModal from "../components/TimesheetDetailsModal";

import { toCsv } from "../utils/csv";

// Format a date as YYYY-MM-DD to match the API's date strings
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Timesheet() {
  const { user: loggedInUser } = useAuth();

  // Check which role is being used for the demo so one for admin, manager then everybody else
  const isManager = loggedInUser?.role === "manager";
  const isAdmin = loggedInUser?.role === "admin";

  // This state var will be used to keep track of the selected fortnight date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // The fortnight starts on the Tuesday on or before the selected date and runs
  // for 14 days, Tuesday (day 1) to Monday (day 14)
  const periodStart = new Date(selectedDate);
  periodStart.setHours(0, 0, 0, 0);
  periodStart.setDate(periodStart.getDate() - ((periodStart.getDay() + 5) % 7));

  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 13);

  const periodStartValue = formatDate(periodStart);
  const periodEndValue = formatDate(periodEnd);

  // Format the pay period dates for display
  const payPeriod = `${periodStart.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
  })}-${periodEnd.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  // These state vars will be used to take in users, shifts and fortnight results from API endpoints
  const [users, setUsers] = useState([]);

  const [fortnightHours, setFortnightHours] = useState([]);

  // Statevar to store selected employee's Timesheet result for the Details modal
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);

  // Statevar to track the current page and number of Timesheet rows displayed per page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Statevar to store the search text used to filter employees by name
  const [searchTerm, setSearchTerm] = useState("");

  // Reset to the first page when the selected fortnight changes
  useEffect(() => {
    setCurrentPage(1);
  }, [periodStartValue]);

  useEffect(() => {
    async function loadTimesheetData() {
      const users = await getUsers();

      setUsers(users || []);
    }

    loadTimesheetData();
  }, [selectedDate]);

  // Hours are calculated by the backend, reload them whenever the fortnight changes
  useEffect(() => {
    async function loadReport() {
      const results = await getFortnightHoursForAllUsers(periodStartValue);

      setFortnightHours(results || []);
    }

    loadReport();
  }, [periodStartValue]);

  // Refresh the timesheet report after user submits a leave request
  async function handleLeaveSubmitted() {
    const results = await getFortnightHoursForAllUsers(periodStartValue);
    setFortnightHours(results || []);
  }

  // Find the database user for the logged-in account
  const currentUser = users.find((user) => user.id === loggedInUser?.id);

  // Get the IDs of active users from the Users API
  const activeUserIds = new Set(
    users
      .filter((user) => user.is_active === true)
      .map((user) => Number(user.id)),
  );

  // Managers and Admins see active employees, other roles only see their own row
  const reportRows = fortnightHours.filter(
    (result) =>
      activeUserIds.has(Number(result.user_id)) &&
      (isManager ||
        isAdmin ||
        Number(result.user_id) === Number(currentUser?.id)),
  );

  // Filter Timesheet results by employee name and sort alphabetically
  const filteredRows = reportRows
    .filter((result) =>
      (result.user_name || `User ${result.user_id}`)
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()),
    )
    .sort((a, b) =>
      (a.user_name || `User ${a.user_id}`).localeCompare(
        b.user_name || `User ${b.user_id}`,
        undefined,
        { sensitivity: "base" },
      ),
    );

  // Calculate the total number of pages based on filtered Timesheet results
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  // Ensure the current page stays within the available page range
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Calculate which Timesheet rows should appear on the current page
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  // List the approved leave types for an employee during the fortnight
  function getLeaveTypes(result, emptyText = "-") {
    // Skip requests whose days were all counted by an earlier overlapping request
    const types = [
      ...new Set(
        result.approved_leave
          .filter((entry) => entry.calendar_days_in_period > 0)
          .map((entry) => entry.leave_type),
      ),
    ];

    return types.length > 0 ? types.join(" / ") : emptyText;
  }

  // Display only the main Timesheet summary columns
  const reportHeaders = [
    "Employee",
    "Hours Worked",
    "Hours After Breaks",
    "Total Leave Hours Taken",
    "Actions",
  ];

  // Generic payroll export columns, every value comes straight from the backend report
  const exportHeaders = [
    "Employee ID",
    "Employee",
    "Fortnight Start",
    "Fortnight End",
    "Raw Hours",
    "Break Hours",
    "Hours After Breaks",
    "Complete Sprints",
    "Development Days",
    "Remainder Hours",
    "Public Holiday Hours",
    "Holiday Adjusted Hours",
    "Approved Leave Days",
    "Leave Hours",
    "Leave Type",
    "Annual Leave Outstanding (hours)",
    "Annual Leave Taken (hours)",
    "Sick Days Available",
  ];

  function getExportRow(result) {
    return [
      result.user_id,
      result.user_name,
      result.period_start,
      result.period_end,
      result.raw_hours,
      result.break_hours,
      result.hours_after_breaks,
      result.complete_sprints,
      result.development_days,
      result.remainder_hours,
      result.public_holiday_hours,
      result.holiday_adjusted_hours,
      result.approved_leave_calendar_days,
      result.leave_hours,
      getLeaveTypes(result, ""),
      result.leave_balance?.al_outstanding,
      result.leave_balance?.al_taken_accured,
      result.leave_balance?.sick_days,
    ];
  }

  // Export the current fortnight report as a CSV file
  function exportTimesheetCSV() {
    const rows = reportRows.map((result) => getExportRow(result));

    const csvContent = toCsv([exportHeaders, ...rows]);

    // The byte order mark lets Excel read names with macrons and other non-ASCII characters
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Timesheet-${periodStartValue}-to-${periodEndValue}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }
  return (
    <div className="container-fluid mt-4">
      {/* Timesheet page header */}
      <div className="row align-items-center mb-3">
        <div className="col">
          <h1 className="mb-0">Timesheet</h1>
        </div>

        <div className="col text-end">
          {isManager || isAdmin ? (
            <button className="btn btn-primary" onClick={exportTimesheetCSV}>
              Export CSV
            </button>
          ) : (
            <button
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#applyLeaveModal"
            >
              Apply for Leave
            </button>
          )}
        </div>
      </div>

      {/* Display the pay period selector and employee search on the same row */}
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-4">
        <div>
          <WeekSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            displayLabel={`Pay period: ${payPeriod}`}
            stepDays={14}
          />
        </div>

        {/* Search users by name */}
        {(isManager || isAdmin) && (
          <div style={{ width: "100%", maxWidth: "320px" }}>
            <label htmlFor="searchTimesheet" className="form-label">
              Search users
            </label>
            <input
              id="searchTimesheet"
              type="search"
              className="form-control"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      <div className="row mt-4">
        <div className="col table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                {reportHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Display the main Timesheet summary for each employee */}
              {paginatedRows.map((result) => (
                <tr key={result.user_id}>
                  <td>{result.user_name || `User ${result.user_id}`}</td>
                  <td>{result.raw_hours}</td>
                  <td>{result.hours_after_breaks}</td>
                  <td>{result.leave_hours}</td>
                  <td>
                    {/* Open the selected employee's Timesheet Details modal */}
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      data-bs-toggle="modal"
                      data-bs-target="#timesheetDetailsModal"
                      onClick={() => setSelectedTimesheet(result)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <small className="text-muted">
            Unpaid breaks follow the current Firecrest prototype break rule.
            Leave balance shows annual leave outstanding in hours and sick leave
            in days.
          </small>
        </div>

        {/* Reserve space for 8 rows to prevent pagination from moving upwards */}
        <div
          style={{
            minHeight: Math.max(0, 8 - paginatedRows.length) * 49,
          }}
        />

        {/* Pagination controls */}
        <div className="d-flex justify-content-between align-items-center mt-3 mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="timesheetPageSize" className="mb-0">
              Show
            </label>

            <select
              id="timesheetPageSize"
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={8}>8</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <span>employees per page</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(safeCurrentPage - 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  className={`btn btn-sm ${
                    safeCurrentPage === page
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(safeCurrentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Display the selected employee's Timesheet details */}
      <TimesheetDetailsModal
        result={selectedTimesheet}
        getLeaveTypes={getLeaveTypes}
      />

      <ApplyLeaveModal onSubmitted={handleLeaveSubmitted} />
    </div>
  );
}
