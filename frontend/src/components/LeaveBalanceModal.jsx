import React from "react";

export default function LeaveBalanceModal({ balance }) {
  return (
    <div
      className="modal fade"
      id="leaveBalanceModal"
      tabIndex="-1"
      aria-labelledby="leaveBalanceModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title" id="leaveBalanceModalLabel">
              Leave Balance Details
            </h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {balance ? (
              <div className="border rounded overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-striped table-hover mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th className="text-end">Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Annual Leave - Accrued */}
                      <tr>
                        <td>Annual Leave - Accrued</td>
                        <td className="text-end">
                          {balance.al_accured ?? 0} days
                        </td>
                      </tr>

                      {/* Annual Leave - Taken */}
                      <tr>
                        <td>Annual Leave - Taken</td>
                        <td className="text-end">
                          {balance.al_taken_accured ?? 0} days
                        </td>
                      </tr>

                      {/* Annual Leave - Outstanding */}
                      <tr>
                        <td>Annual Leave - Outstanding</td>
                        <td className="text-end">
                          {balance.al_outstanding ?? 0} days
                        </td>
                      </tr>

                      {/* Sick Leave */}
                      <tr>
                        <td>Sick Leave</td>
                        <td className="text-end">
                          {balance.sick_days ?? 0} days
                        </td>
                      </tr>

                      {/* Alternative Days */}
                      <tr>
                        <td>Alternative Days</td>
                        <td className="text-end">
                          {balance.alternative_days ?? 0} days
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-muted mb-0">No leave balance available.</p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
