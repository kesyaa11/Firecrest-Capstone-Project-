import { useState } from "react";
import LeaveBalanceDetailsModal from "./LeaveBalanceDetailsModal";

export default function TeamLeaveBalancesModal({ teamBalances }) {
  const [selectedBalance, setSelectedBalance] = useState(null);

  return (
    <>
      <div
        className="modal fade"
        id="teamLeaveBalancesModal"
        tabIndex="-1"
        aria-labelledby="teamLeaveBalancesModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <div>
                <h5 className="modal-title" id="teamLeaveBalancesModalLabel">
                  Team Leave Balances
                </h5>

                <small className="text-muted">
                  View employee leave balances
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
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th className="text-center">Annual</th>
                      <th className="text-center">Sick</th>
                      <th className="text-center">Alt</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {teamBalances.length > 0 ? (
                      teamBalances.map((balance) => (
                        <tr key={balance.id}>
                          <td>{balance.name}</td>

                          <td className="text-center">
                            {balance.al_outstanding ?? 0}
                          </td>

                          <td className="text-center">
                            {balance.sick_days ?? 0}
                          </td>

                          <td className="text-center">
                            {balance.alternative_days ?? 0}
                          </td>

                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#leaveBalanceDetailsModal"
                              onClick={() => setSelectedBalance(balance)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-muted text-center py-3">
                          No leave balances available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
      <LeaveBalanceDetailsModal balance={selectedBalance} />
    </>
  );
}
