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
      console.log("LEAVE ACTIVITY USER CHECK:", user);

      // Temporary workaround due to time constraints: admin accounts have no user ID.
      // Allow admins to load leave activity while retaining ID validation for other roles.
      if (!user || (user.role !== "admin" && !user.id)) return;

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
            {leaveRequests.length > 0 ? (
              [...leaveRequests]
                .sort((a, b) => {
                  // Keep pending requests first, then upcoming approved leave.
                  const today = new Date().toLocaleDateString("en-CA");

                  const getPriority = (request) => {
                    if (request.status === "Pending") return 0;
                    if (
                      request.status === "Approved" &&
                      request.start_date >= today
                    )
                      return 1;
                    return 2;
                  };

                  const priorityDifference = getPriority(a) - getPriority(b);

                  if (priorityDifference !== 0) return priorityDifference;

                  // Pending and upcoming approved: nearest first.
                  if (getPriority(a) < 2) {
                    return a.start_date.localeCompare(b.start_date);
                  }

                  // Historical requests: newest first.
                  return b.start_date.localeCompare(a.start_date);
                })
                .slice(0, 5)
                .map((request) => (
                  <div key={request.id} className="px-3 py-3 border-bottom">
                    {/* Display employee name and leave status */}
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="fw-semibold">
                        {user.role === "manager" || user.role === "admin"
                          ? getUserName(request.user_id)
                          : request.leave_type}
                      </div>

                      <span className="small text-muted text-nowrap">
                        {request.status}
                      </span>
                    </div>

                    {/* Display leave type and requested dates */}
                    <div className="small mt-1">
                      {(user.role === "manager" || user.role === "admin") && (
                        <div>{request.leave_type}</div>
                      )}

                      <div className="text-muted mt-1">
                        {request.start_date} → {request.end_date}
                      </div>

                      {/* Display the rejection reason when available */}
                      {request.status === "Rejected" && request.reason && (
                        <div className="text-danger mt-1">{request.reason}</div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-muted text-center py-3">
                No leave activity
              </div>
            )}
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
