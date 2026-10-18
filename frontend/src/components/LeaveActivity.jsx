import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";

import { getUsers } from "../api/users";
import { getLeaveRequests, patchLeaveRequest } from "../api/leaveRequests";

import LeaveActivityModal from "./LeaveActivityModal";

export default function LeaveActivity({ refreshTrigger }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Update a leave request's status and refresh the activity list.
  async function handleLeaveDecision(id, status) {
    await patchLeaveRequest(id, { status });

    const requests = await getLeaveRequests();

    // Refresh the activity list after approval/rejection
    setLeaveRequests(requests || []);
  }

  // Load leave requests and users whenever the user or refresh trigger changes.
  useEffect(() => {
    async function loadLeaveActivity() {
      if (!user?.id) return;

      const [requests, userList] = await Promise.all([
        getLeaveRequests(),
        getUsers(),
      ]);

      console.log("LOGGED IN USER:", user);
      console.log("LEAVE REQUESTS:", requests);

      setUsers(userList || []);

      // Managers and admins can see all requests; other users see only their own.
      let visibleRequests;

      if (user.role === "manager" || user.role === "admin") {
        visibleRequests = requests || [];
      } else {
        visibleRequests = (requests || []).filter(
          (request) => Number(request.user_id) === Number(user.id),
        );
      }

      setLeaveRequests(visibleRequests);
    }

    loadLeaveActivity();
  }, [user, refreshTrigger]);

  const getUserName = (userId) => {
    const employee = users.find((user) => Number(user.id) === Number(userId));

    return employee?.name || `User ${userId}`;
  };

  return (
    <>
      <div className="card border mb-4">
        <div className="card-body">
          {/* Card Header */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">Leave Activity</h5>

            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#leaveActivityModal"
            >
              View All →
            </button>
          </div>

          {/* Card Description */}
          <p className="small text-muted mb-3">
            {user.role === "manager" || user.role === "admin"
              ? "Recent team leave requests"
              : "Recent leave requests"}
          </p>

          {/* Leave Activity List */}
          <div className="border rounded overflow-hidden">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    {(user.role === "manager" || user.role === "admin") && (
                      <th>Employee</th>
                    )}

                    <th>Leave Type</th>
                    <th className="text-end">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {leaveRequests.length > 0 ? (
                    [...leaveRequests]
                      .sort(
                        (a, b) =>
                          new Date(b.start_date) - new Date(a.start_date),
                      )
                      .slice(0, 3)
                      .map((request) => (
                        <tr key={request.id}>
                          {(user.role === "manager" ||
                            user.role === "admin") && (
                            <td>{getUserName(request.user_id)}</td>
                          )}

                          <td>
                            <div>{request.leave_type}</div>

                            <small className="text-muted">
                              {request.start_date} → {request.end_date}
                            </small>

                            {request.status === "Rejected" &&
                              request.reason && (
                                <div className="small text-danger mt-1">
                                  {request.reason}
                                </div>
                              )}
                          </td>

                          <td className="text-end">{request.status}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          user.role === "manager" || user.role === "admin"
                            ? 3
                            : 2
                        }
                        className="text-muted text-center py-3"
                      >
                        No leave activity
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <LeaveActivityModal
        leaveRequests={leaveRequests}
        users={users}
        user={user}
        onLeaveDecision={handleLeaveDecision}
      />
    </>
  );
}
