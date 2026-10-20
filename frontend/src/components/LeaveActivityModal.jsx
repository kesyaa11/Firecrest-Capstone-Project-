import { useState } from "react";

export default function LeaveActivityModal({
  leaveRequests,
  users,
  user,
  onLeaveDecision,
}) {
  // Check whether the user can review and action team leave requests.
  const isManager = user?.role === "manager" || user?.role === "admin";

  // Statevars to track the current page and number of leave requests per page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Prioritise pending requests by start date, nearest to farthest.
  // All remaining requests follow by date, regardless of status.
  const sortedRequests = [...leaveRequests].sort((a, b) => {
    const aPending = a.status === "Pending";
    const bPending = b.status === "Pending";

    // Pending requests always appear first.
    if (aPending !== bPending) return aPending ? -1 : 1;

    // Sort requests chronologically within each group.
    return a.start_date.localeCompare(b.start_date);
  });

  // Calculate the number of pages based on available leave requests
  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));

  // Ensure the current page remains valid when requests change
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Calculate which leave requests appear on the current page
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRequests = sortedRequests.slice(
    startIndex,
    startIndex + pageSize,
  );

  const getUserName = (userId) => {
    const employee = users.find((user) => Number(user.id) === Number(userId));

    return employee?.name || `User ${userId}`;
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
                      {paginatedRequests.map((request) => (
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
                                    onClick={() =>
                                      onLeaveDecision(request.id, "Rejected")
                                    }
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

            {/* Pagination controls for leave requests */}
            <div className="d-flex justify-content-between align-items-center px-3 py-3 flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="leavePageSize" className="mb-0">
                  Show
                </label>

                <select
                  id="leavePageSize"
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <span>requests per page</span>
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

                {/* Display numbered page buttons */}
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
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
                ))}

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
    </>
  );
}
