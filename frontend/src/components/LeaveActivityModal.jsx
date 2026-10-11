import { useState } from "react";

export default function LeaveActivityModal({
  leaveRequests,
  users,
  user,
  onLeaveDecision,
}) {
  // Check whether the user can review and action team leave requests.
  const isManager = user?.role === "manager" || user?.role === "admin";

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const getUserName = (userId) => {
    const employee = users.find((user) => Number(user.id) === Number(userId));

    return employee?.name || `User ${userId}`;
  };

  // Reject the selected request and clear the rejection form afterwards.
  const handleReject = async () => {
    if (!selectedRequest) return;

    await onLeaveDecision(selectedRequest.id, "Rejected");

    console.log("Prototype rejection:", {
      requestId: selectedRequest.id,
      reason: rejectionReason,
    });

    setRejectionReason("");
    setSelectedRequest(null);
  };

  return (
    <>
      {/* Leave Activity Modal */}
      <div
        className="modal fade"
        id="leaveActivityModal"
        tabIndex="-1"
        aria-labelledby="leaveActivityModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <div>
                <h5 className="modal-title" id="leaveActivityModalLabel">
                  {isManager ? "Leave Requests" : "My Leave History"}
                </h5>

                <small className="text-muted">
                  {isManager
                    ? "Review team leave requests"
                    : "View your leave request history"}
                </small>
              </div>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body">
              {leaveRequests.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        {isManager && <th>Employee</th>}
                        <th>Leave Type</th>
                        <th>Dates</th>
                        <th className="text-center">Status</th>
                        {isManager && <th className="text-end">Action</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {leaveRequests.map((request) => (
                        <tr key={request.id}>
                          {isManager && <td>{getUserName(request.user_id)}</td>}

                          <td>{request.leave_type}</td>

                          <td>
                            <div>{request.start_date}</div>
                            <small className="text-muted">
                              → {request.end_date}
                            </small>
                          </td>

                          <td className="text-center">{request.status}</td>

                          {isManager && (
                            <td className="text-end">
                              {request.status === "Pending" ? (
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => setSelectedRequest(request)}
                                  >
                                    Reject
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() =>
                                      onLeaveDecision(request.id, "Approved")
                                    }
                                  >
                                    Approve
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted text-center py-4">
                  No leave requests available.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <div
        className="modal fade"
        id="rejectLeaveModal"
        tabIndex="-1"
        aria-labelledby="rejectLeaveModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="rejectLeaveModalLabel">
                Reject Leave Request
              </h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              {selectedRequest && (
                <>
                  <p className="mb-1">
                    <strong>Leave Type:</strong> {selectedRequest.leave_type}
                  </p>

                  <p className="mb-3">
                    <strong>Dates:</strong> {selectedRequest.start_date} →{" "}
                    {selectedRequest.end_date}
                  </p>

                  <label htmlFor="rejectionReason" className="form-label">
                    Reason for rejection
                  </label>

                  <textarea
                    id="rejectionReason"
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter a reason..."
                  />
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
