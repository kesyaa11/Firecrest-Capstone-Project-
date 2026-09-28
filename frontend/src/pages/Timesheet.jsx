import BackToDashboard from "../components/BackToDashboard";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getLeaveRequests, patchLeaveRequest } from "../api/leaveRequests";
import WeekSelector from "../components/WeekSelector";
import { getUsers } from "../api/users";
import { getShifts } from "../api/shifts";
import { useAuth } from "../auth/AuthContext";
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

  // This state var will be used to keep track of the selected week date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate the start and end dates for the selected pay period
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setHours(23, 59, 59, 999);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Format the pay period dates for display
  const payPeriod = `${startOfWeek.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
  })}-${endOfWeek.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  // These state vars will be used to take in users and shifts data from API endpoints
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    async function loadTimesheetData() {
      const users = await getUsers();
      const shifts = await getShifts();

      setUsers(users || []);
      setShifts(shifts || []);
    }

    loadTimesheetData();
  }, []);

  // Calculate the hours worked by an employee during the selected pay period
  function getHoursWorked(userId) {
    return shifts
      .filter((shift) => {
        const shiftDate = new Date(shift.date);

        return (
          shift.user_id === userId &&
          shiftDate >= startOfWeek &&
          shiftDate <= endOfWeek
        );
      })
      .reduce((total, shift) => total + Number(shift.duration || 0), 0);
  }

  // Calculate the approved leave hours taken by an employee during the selected pay period
  function getLeaveTaken(userId) {
    return leaveRequests
      .filter((request) => {
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);

        return (
          request.user_id === userId &&
          request.status === "Approved" &&
          leaveStart <= endOfWeek &&
          leaveEnd >= startOfWeek
        );
      })
      .reduce((total, request) => {
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);

        const start = leaveStart < startOfWeek ? startOfWeek : leaveStart;

        const end = leaveEnd > endOfWeek ? endOfWeek : leaveEnd;

        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        return total + days * 8;
      }, 0);
  }

  // Get the approved leave type for an employee during the selected pay period
  function getLeaveType(userId) {
    const request = leaveRequests.find((request) => {
      const leaveStart = new Date(request.start_date);
      const leaveEnd = new Date(request.end_date);

      return (
        request.user_id === userId &&
        request.status === "Approved" &&
        leaveStart <= endOfWeek &&
        leaveEnd >= startOfWeek
      );
    });

    return request ? request.leave_type : "-";
  }

  // Calculate the total hours for an employee during the selected pay period
  function getTotalHours(userId) {
    return getHoursWorked(userId) + getLeaveTaken(userId);
  }

  // Export the current Timesheet data as a CSV file
  function exportTimesheetCSV() {
    const rows = users.map((user) => [
      user.name,
      getHoursWorked(user.id),
      "-",
      getLeaveTaken(user.id) || "-",
      getLeaveType(user.id),
      getTotalHours(user.id),
    ]);

    const headers = [
      "Employee",
      "Hours Worked",
      "Leave Balance",
      "Leave Taken",
      "Leave Type",
      "Total Hours",
    ];

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
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Hours Worked</th>
                <th>Leave Balance</th>
                <th>Leave Taken</th>
                <th>Leave Type</th>
                <th>Total Hours</th>
              </tr>
            </thead>

            <tbody>
              {(isManager
                ? users
                : users.filter((user) => user.name === loggedInUser?.name)
              ).map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{getHoursWorked(user.id)}</td>
                  <td>-</td>
                  <td>{getLeaveTaken(user.id) || "-"}</td>
                  <td>{getLeaveType(user.id)}</td>
                  <td>{getTotalHours(user.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
