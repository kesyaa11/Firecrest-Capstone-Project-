import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

import { getLeaveRequests, patchLeaveRequest } from "../api/leaveRequests";

import { getUsers } from "../api/users";
import { getFortnightHours } from "../api/hours";
import FortnightSelector from "../components/FortnightSelector";
import ApplyLeaveModal from "../components/ApplyLeaveModal";

export default function Timesheet() {
  // Interim solution to show role-specific behaviour for the demo using nav state
  const location = useLocation();
  const { user: loggedInUser } = useAuth();

  // This state var will be used to take in leave requests data from API endpoint
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    async function loadLeaveRequests() {
      const requests = await getLeaveRequests();

      setLeaveRequests(requests || []);
    }

    loadLeaveRequests();
  }, []);

  // Check which role is being used for the demo
  const isManager = loggedInUser?.role === "manager";
  const isDeveloper = loggedInUser?.role === "developer";
  const isServiceDelivery = loggedInUser?.role === "sd";

  // Handle the approval or rejection of leave request
  async function handleLeaveDecision(id, status) {
    await patchLeaveRequest(id, { status });

    const requests = await getLeaveRequests();

    setLeaveRequests(requests || []);
  }

  // This state var will be used to keep track of the selected fortnight date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate the start and end dates for the selected pay period
  const startOfFortnight = new Date(selectedDate);
  startOfFortnight.setHours(0, 0, 0, 0);

  const day = startOfFortnight.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;

  startOfFortnight.setDate(startOfFortnight.getDate() - daysFromMonday);

  const endOfFortnight = new Date(startOfFortnight);
  endOfFortnight.setHours(23, 59, 59, 999);
  endOfFortnight.setDate(startOfFortnight.getDate() + 13);

  // Format the pay period dates for display
  const payPeriod = `${startOfFortnight.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
  })}-${endOfFortnight.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  // These state vars will be used to take in users and shifts data from API endpoints
  const [users, setUsers] = useState([]);
  const [fortnightHours, setFortnightHours] = useState(null);

  useEffect(() => {
    async function loadTimesheetData() {
      const users = await getUsers();
      setUsers(users || []);

      const hours = {};

      for (const user of users || []) {
        const result = await getFortnightHours(
          user.id,
          startOfFortnight.toISOString().split("T")[0],
        );

        hours[user.id] = result;
      }

      setFortnightHours(hours);
    }

    loadTimesheetData();
  }, [selectedDate]);

  // Calculate the hours worked by an employee during the selected pay fortnight
  function getHoursWorked(userId) {
    if (!fortnightHours || !fortnightHours[userId]) {
      return 0;
    }

    return Number(fortnightHours[userId].raw_hours || 0);
  }

  // Calculate the total approved leave hours for an employee during the selected pay period
  function getLeaveTakenHours(userId) {
    return leaveRequests
      .filter((request) => {
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);

        return (
          request.user_id === userId &&
          request.status === "Approved" &&
          leaveStart <= endOfFortnight &&
          leaveEnd >= startOfFortnight
        );
      })
      .reduce((total, request) => {
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);

        const start =
          leaveStart < startOfFortnight ? startOfFortnight : leaveStart;

        const end = leaveEnd > endOfFortnight ? endOfFortnight : leaveEnd;

        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        return total + days * 8;
      }, 0);
  }

  // Calculate the approved leave hours taken by an employee during the selected pay period
  function getLeaveTaken(userId) {
    const leaveByType = leaveRequests
      .filter((request) => {
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);

        return (
          request.user_id === userId &&
          request.status === "Approved" &&
          leaveStart <= endOfFortnight &&
          leaveEnd >= startOfFortnight
        );
      })
      .reduce((totals, request) => {
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);

        const start =
          leaveStart < startOfFortnight ? startOfFortnight : leaveStart;

        const end = leaveEnd > endOfFortnight ? endOfFortnight : leaveEnd;

        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const hours = days * 8;

        totals[request.leave_type] = (totals[request.leave_type] || 0) + hours;

        return totals;
      }, {});

    // Format the leave totals for display
    return Object.entries(leaveByType)
      .map(([leaveType, hours]) => `${leaveType}: ${hours}h`)
      .join(", ");
  }

  // Get the approved leave type for an employee during the selected pay period
  function getLeaveType(userId) {
    const request = leaveRequests.find((request) => {
      const leaveStart = new Date(request.start_date);
      const leaveEnd = new Date(request.end_date);

      return (
        request.user_id === userId &&
        request.status === "Approved" &&
        leaveStart <= endOfFortnight &&
        leaveEnd >= startOfFortnight
      );
    });

    return request ? request.leave_type : "-";
  }

  // Find the leave balance for an employee by their user ID
  function getLeaveBalance(userId) {
    return leaveBalances.find(
      (balance) => Number(balance.user_id) === Number(userId),
    );
  }

  // Calculate the total hours for an employee during the selected pay period
  function getTotalHours(userId) {
    return getHoursWorked(userId) + getLeaveTakenHours(userId);
  }

  // Export the current Timesheet data as a CSV file
  function exportTimesheetCSV() {
    const rows = users.map((user) => [
      user.name,
      getHoursWorked(user.id),
      getLeaveTaken(user.id) || "-",
      getTotalHours(user.id),
    ]);

    const headers = ["Employee", "Hours Worked", "Leave Taken", "Total Hours"];

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Timesheet-${payPeriod}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }
  return (
    <div className="container-fluid mt-4">
      {/* Timesheet page header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Timesheet</h1>

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

      {/* Timesheet section */}
      <div className="card border mb-4">
        {/* Section header */}
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Fortnightly Timesheet</h4>

          <FortnightSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>

        {/* Timesheet table */}
        <div className="card-body">
          <h5 className="card-title mb-3">Hours & Leave</h5>

          <div className="border rounded overflow-hidden">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Hours Worked</th>
                    <th>Leave Taken</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {(isManager
                    ? users
                    : users.filter((user) => user.name === loggedInUser?.name)
                  ).map((user) => (
                    <tr key={user.id}>
                      <td className="align-middle">{user.name}</td>
                      <td className="align-middle">
                        {getHoursWorked(user.id)}
                      </td>
                      <td>
                        {getLeaveTaken(user.id) ? (
                          <div className="d-flex flex-column align-items-center gap-1">
                            {getLeaveTaken(user.id)
                              .split(", ")
                              .map((leave, index) => (
                                <span
                                  key={index}
                                  className={`badge ${
                                    leave.toLowerCase().includes("sick")
                                      ? "bg-danger-subtle text-danger"
                                      : "bg-success-subtle text-success"
                                  }`}
                                >
                                  {leave}
                                </span>
                              ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="align-middle">{getTotalHours(user.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {isManager && (
        <div className="row mt-5">
          <div className="col">
            <h3>Leave Requests</h3>

            {leaveRequests
              .filter(
                // Filter out approved and rejected leave requests
                (request) =>
                  request.status !== "Approved" &&
                  request.status !== "Rejected",
              )
              .map((request) => (
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
              ))}
          </div>
        </div>
      )}
      <ApplyLeaveModal />
    </div>
  );
}
