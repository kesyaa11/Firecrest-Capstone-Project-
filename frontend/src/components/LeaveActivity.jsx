import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

import { getLeaveRequests } from "../api/leaveRequests";

export default function LeaveActivity() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    async function loadLeaveActivity() {
      if (!user?.id) return;

      const requests = await getLeaveRequests();

      console.log("LOGGED IN USER:", user);
      console.log("LEAVE REQUESTS:", requests);

      const userRequests = (requests || []).filter(
        (request) => Number(request.user_id) === Number(user.id),
      );

      setLeaveRequests(userRequests);
    }

    loadLeaveActivity();
  }, [user]);

  return (
    <div className="card border mb-4">
      <div className="card-body">
        {/* Card Header */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">Leave Activity</h5>

          <button type="button" className="btn btn-outline-primary">
            View All →
          </button>
        </div>

        {/* Card Description */}
        <p className="small text-muted mb-3">Recent leave requests</p>

        {/* Leave Activity List */}
        <div className="border rounded overflow-hidden">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th className="text-end">Status</th>
                </tr>
              </thead>

              <tbody>
                {leaveRequests.length > 0 ? (
                  leaveRequests.slice(0, 5).map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div>{request.leave_type}</div>

                        <small className="text-muted">
                          {request.start_date} → {request.end_date}
                        </small>

                        {request.status === "Rejected" && request.reason && (
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
                    <td colSpan="2" className="text-muted text-center py-3">
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
  );
}
