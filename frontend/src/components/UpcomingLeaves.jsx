import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaveRequests } from "../api/leaveRequests";
import { getUsers } from "../api/users";

export default function UpcomingLeaves({ refreshTrigger }) {
  const navigate = useNavigate();

  // Store all leave requests and users returned from the API
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [users, setUsers] = useState([]);

  // Get today's date and date a month from now
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthFromNow = new Date(today);
  monthFromNow.setDate(today.getDate() + 30);

  // Filter leaves with Approved state AND whose start date is within a month from now
  const upcomingLeaves = leaveRequests
    .filter((leave) => {
      const startDate = new Date(leave.start_date);

      return (
        leave.status === "Approved" &&
        startDate >= today &&
        startDate <= monthFromNow
      );
    })
    .sort((a, b) => {
      return new Date(a.start_date) - new Date(b.start_date);
    })
    // Only display the first three upcoming leaves
    .slice(0, 3);

  // Reload leave requests whenever the refresh trigger changes.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [leaveData, userData] = await Promise.all([
          getLeaveRequests(),
          getUsers(),
        ]);

        if (!cancelled) {
          setLeaveRequests(leaveData || []);
          setUsers(userData || []);
        }
      } catch (err) {
        console.error("Failed to load upcoming leaves:", err);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return (
    <div
      className="card border mb-4"
      onClick={() => navigate("/timesheet")}
      style={{ cursor: "pointer" }}
    >
      <div className="card-body">
        {/* Card Header */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">Upcoming Leaves</h5>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/timesheet");
            }}
          >
            View Timesheet →
          </button>
        </div>

        {/* Card Description */}
        <p className="small text-muted mb-3">
          Click to view leave balances and Timesheet details
        </p>

        {/* Upcoming Leaves Table */}
        <div className="border rounded overflow-hidden">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Dates</th>
                </tr>
              </thead>

              <tbody>
                {upcomingLeaves.length > 0 ? (
                  upcomingLeaves.map((leave) => {
                    // Convert start and end dates into JS comparable dates
                    const startDate = new Date(leave.start_date);
                    const endDate = new Date(leave.end_date);

                    // Find the user associated with this leave request
                    const user = users.find((user) => {
                      return user.id === leave.user_id;
                    });

                    // Format start and end dates to date and month
                    const startFormatted = startDate.toLocaleDateString(
                      "en-NZ",
                      {
                        day: "numeric",
                        month: "short",
                      },
                    );

                    const endFormatted = endDate.toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <tr key={leave.id}>
                        {/* Display the user's name */}
                        <td>{user?.name}</td>

                        {/* Display one date if start and end are on same day otherwise show a range */}
                        <td>
                          {startDate.getTime() === endDate.getTime()
                            ? startFormatted
                            : `${startFormatted} to ${endFormatted}`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Display a message when there are no upcoming approved leaves
                  <tr>
                    <td colSpan="2" className="text-muted text-center py-3">
                      No upcoming leaves
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
