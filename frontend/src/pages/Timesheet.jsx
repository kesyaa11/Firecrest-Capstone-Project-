import BackToDashboard from "../components/BackToDashboard";
import { useState, useEffect } from "react";
import { getLeaveRequests, patchLeaveRequest } from "../api/leaveRequests";
import WeekSelector from "../components/WeekSelector";
import { getUsers } from "../api/users";
import { getShifts } from "../api/shifts";
import { getFortnightHoursForAllUsers } from "../api/hours";
import { useAuth } from "../auth/AuthContext";
import ApplyLeaveModal from "../components/ApplyLeaveModal";
import { toCsv } from "../utils/csv";

// Format a date as YYYY-MM-DD to match the API's date strings
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Show the leave balance fields that approved leave updates
function formatLeaveBalance(balance) {
  if (!balance) return "-";

  return `AL ${balance.al_outstanding}h / Sick ${balance.sick_days}d`;
}

export default function Timesheet() {
  const { user: loggedInUser } = useAuth();

  // This state var will be used to take in leave requests data from API endpoint
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Check which role is being used for the demo
  const isManager = loggedInUser?.role === "manager";

  // This state var will be used to keep track of the selected date
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
  const [shifts, setShifts] = useState([]);
  const [fortnightHours, setFortnightHours] = useState([]);
  const [decisionError, setDecisionError] = useState("");

  async function loadLeaveRequests() {
    const requests = await getLeaveRequests();

    setLeaveRequests(requests || []);
  }

  async function loadFortnightHours() {
    const results = await getFortnightHoursForAllUsers(periodStartValue);

    setFortnightHours(results || []);
  }

  useEffect(() => {
    async function loadTimesheetData() {
      const users = await getUsers();
      const shifts = await getShifts();
      const requests = await getLeaveRequests();

      setUsers(users || []);
      setShifts(shifts || []);
      setLeaveRequests(requests || []);
    }

    loadTimesheetData();
  }, []);

  // Hours are calculated by the backend, reload them whenever the fortnight changes
  useEffect(() => {
    async function loadReport() {
      const results = await getFortnightHoursForAllUsers(periodStartValue);

      setFortnightHours(results || []);
    }

    loadReport();
  }, [periodStartValue]);

  // Handle the approval or rejection of leave request
  async function handleLeaveDecision(id, status) {
    setDecisionError("");

    try {
      await patchLeaveRequest(id, { status });
    } catch (err) {
      setDecisionError(err.message);
    }

    // Approved leave and balances show in the report so reload it as well
    await loadLeaveRequests();
    await loadFortnightHours();
  }

  // Refresh after a staff member submits a leave request
  async function handleLeaveSubmitted() {
    await loadLeaveRequests();
  }

  // Find the database user for the logged-in account
  const currentUser = users.find((user) => user.id === loggedInUser?.id);

  // Managers see everyone, other roles only see their own row
  const reportRows = isManager
    ? fortnightHours
    : fortnightHours.filter((result) => result.user_id === currentUser?.id);

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

  // Build the values shown in each report row, all calculated by the backend
  function getRow(result) {
    return [
      result.user_name || `User ${result.user_id}`,
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
      getLeaveTypes(result),
      formatLeaveBalance(result.leave_balance),
    ];
  }

  const reportHeaders = [
    "Employee",
    "Hours Worked",
    "Unpaid Breaks",
    "Hours After Breaks",
    "Sprints",
    "Dev Days",
    "Remainder Hours",
    "Public Holiday Hours",
    "Holiday Adjusted Hours",
    "Approved Leave (days)",
    "Leave Hours",
    "Leave Type",
    "Leave Balance",
  ];

  // Shifts already scheduled for the employee during a leave request
  function getAffectedShifts(request) {
    return shifts.filter(
      (shift) =>
        shift.user_id === request.user_id &&
        shift.date >= request.start_date &&
        shift.date <= request.end_date,
    );
  }

  // Other staff with approved leave overlapping a leave request
  function getOthersOnLeave(request) {
    const names = leaveRequests
      .filter(
        (other) =>
          other.id !== request.id &&
          other.user_id !== request.user_id &&
          other.status === "Approved" &&
          other.start_date <= request.end_date &&
          other.end_date >= request.start_date,
      )
      .map((other) => users.find((user) => user.id === other.user_id)?.name);

    return [...new Set(names)].filter(Boolean);
  }

  // Leave requests belonging to the logged-in staff member, newest first
  const myLeaveRequests = leaveRequests
    .filter((request) => request.user_id === currentUser?.id)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

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
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard to="/dashboard" />
      </div>

      <div className="text-center mb-4">
        <h2 className="fw-bold mb-0">Timesheet</h2>

        <WeekSelector
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          displayLabel={`Pay period: ${payPeriod}`}
          stepDays={14}
        />
      </div>

      <div className="row">
        <div className="col text-end">
          {isManager ? (
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
              {reportRows.map((result) => (
                <tr key={result.user_id}>
                  {getRow(result).map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
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
      </div>

      {!isManager && (
        <div className="row mt-5">
          <div className="col">
            <h3>My Leave Requests</h3>

            {myLeaveRequests.length === 0 && (
              <p className="text-muted">No leave requests yet.</p>
            )}

            {myLeaveRequests.map((request) => (
              <div key={request.id} className="border rounded p-3 mb-3">
                <strong>
                  {request.start_date} - {request.end_date}
                </strong>
                <div>Leave Type: {request.leave_type}</div>
                <div>Status: {request.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isManager && (
        <div className="row mt-5">
          <div className="col">
            <h3>Leave Requests</h3>

            {decisionError && (
              <div className="alert alert-danger">{decisionError}</div>
            )}

            {leaveRequests
              .filter(
                // Filter out approved and rejected leave requests
                (request) =>
                  request.status !== "Approved" &&
                  request.status !== "Rejected",
              )
              .map((request) => {
                const affectedShifts = getAffectedShifts(request);
                const othersOnLeave = getOthersOnLeave(request);

                return (
                  <div key={request.id} className="border rounded p-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col">
                        <strong>
                          {request.start_date} - {request.end_date}
                        </strong>

                        <div>
                          Requester:{" "}
                          {
                            users.find((user) => user.id === request.user_id)
                              ?.name
                          }
                        </div>
                        <div>Leave Type: {request.leave_type}</div>

                        <div>Status: {request.status}</div>

                        {/* Schedule impact for the requested dates */}
                        <div className="small text-muted mt-2">
                          Scheduled shifts in this period:{" "}
                          {affectedShifts.length > 0
                            ? affectedShifts
                                .map(
                                  (shift) =>
                                    `${shift.date} ${shift.shift_start?.slice(0, 5)}`,
                                )
                                .join(", ")
                            : "none"}
                        </div>
                        <div className="small text-muted">
                          Others on approved leave:{" "}
                          {othersOnLeave.length > 0
                            ? othersOnLeave.join(", ")
                            : "none"}
                        </div>
                      </div>

                      <div className="col text-end">
                        <button
                          className="btn btn-success me-2"
                          onClick={() =>
                            handleLeaveDecision(request.id, "Approved")
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            handleLeaveDecision(request.id, "Rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      <ApplyLeaveModal onSubmitted={handleLeaveSubmitted} />
    </div>
  );
}
