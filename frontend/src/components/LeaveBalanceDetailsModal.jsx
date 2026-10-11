export default function LeaveBalanceDetailsModal({ balance }) {
  if (!balance) return null;

  return (
    <div
      className="modal fade"
      id="leaveBalanceDetailsModal"
      tabIndex="-1"
      aria-labelledby="leaveBalanceDetailsModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title" id="leaveBalanceDetailsModalLabel">
                {balance.name}
              </h5>

              <small className="text-muted">Leave Balance Details</small>
            </div>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            {/* Annual Leave */}
            <h6 className="mb-3">Annual Leave</h6>

            <div className="table-responsive mb-4">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td>Accrued</td>
                    <td className="text-end">{balance.al_accrued ?? 0}</td>
                  </tr>

                  <tr>
                    <td>Taken</td>
                    <td className="text-end">
                      {balance.al_taken_accrued ?? 0}
                    </td>
                  </tr>

                  <tr>
                    <td>Outstanding</td>
                    <td className="text-end">{balance.al_outstanding ?? 0}</td>
                  </tr>

                  <tr>
                    <td>Annual Owing</td>
                    <td className="text-end">{balance.annual_owing ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sick Leave */}
            <h6 className="mb-3">Sick Leave</h6>

            <div className="table-responsive mb-4">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td>Available</td>
                    <td className="text-end">{balance.sick_days ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Alternative Days */}
            <h6 className="mb-3">Alternative Days</h6>

            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td>Available</td>
                    <td className="text-end">
                      {balance.alternative_days ?? 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

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
  );
}
