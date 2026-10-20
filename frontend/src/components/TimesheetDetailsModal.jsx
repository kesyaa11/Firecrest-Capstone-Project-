export default function TimesheetDetailsModal({ result, getLeaveTypes }) {
  // Keep the modal mounted even when no employee is selected
  const leaveBalance = result?.leave_balance
    ? `AL ${result.leave_balance.al_outstanding}h / Sick ${result.leave_balance.sick_days}d`
    : "-";

  // Display the selected employee's work allocation
  const workDetails = [
    ["Sprints", result?.complete_sprints],
    ["Dev Days", result?.development_days],
    ["Public Holiday Hours", result?.public_holiday_hours],
    ["Holiday Adjusted Hours", result?.holiday_adjusted_hours],
  ];

  // Display the selected employee's leave information
  const leaveDetails = [
    ["Approved Leave (days)", result?.approved_leave_calendar_days],
    ["Leave Hours", result?.leave_hours],
    ["Leave Type", result ? getLeaveTypes(result) : "-"],
    ["Leave Balance", leaveBalance],
  ];

  // Display the main Timesheet totals as summary cards
  const summaryCards = [
    ["Hours Worked", result?.raw_hours, "h"],
    ["Unpaid Breaks", result?.break_hours, "h"],
    ["Hours After Breaks", result?.hours_after_breaks, "h"],
    ["Remainder Hours", result?.remainder_hours, "h"],
  ];

  return (
    <div
      className="modal fade"
      id="timesheetDetailsModal"
      tabIndex="-1"
      aria-labelledby="timesheetDetailsModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          {/* Display the employee name and close button */}
          <div className="modal-header">
            <h5 className="modal-title" id="timesheetDetailsModalLabel">
              {result?.user_name ||
                (result ? `User ${result.user_id}` : "Employee")}{" "}
              - Timesheet Details
            </h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>

          <div className="modal-body p-4">
            {/* Display four summary cards */}
            <div className="row g-3 mb-4">
              {summaryCards.map(([label, value, unit]) => (
                <div className="col-12 col-sm-6 col-lg-3" key={label}>
                  <div className="border rounded-3 p-3 h-100">
                    <div className="text-muted small mb-2">{label}</div>

                    <div className="d-flex align-items-baseline gap-1">
                      <span className="fs-2 fw-bold">{value ?? 0}</span>
                      <span className="text-muted">{unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Display Work Allocation and Leave Information panels */}
            <div className="row g-3">
              {/* Work Allocation panel */}
              <div className="col-12 col-lg-6">
                <div className="border rounded-3 h-100 overflow-hidden">
                  <div className="bg-light px-3 py-3 fw-semibold">
                    Work Allocation
                  </div>

                  <div className="px-3">
                    {workDetails.map(([label, value]) => (
                      <div
                        key={label}
                        className="d-flex justify-content-between align-items-center py-3 border-bottom"
                      >
                        <span>{label}</span>
                        <span className="fw-semibold">{value ?? "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leave Information panel */}
              <div className="col-12 col-lg-6">
                <div className="border rounded-3 h-100 overflow-hidden">
                  <div className="bg-light px-3 py-3 fw-semibold">
                    Leave Information
                  </div>

                  <div className="px-3">
                    {leaveDetails.map(([label, value]) => (
                      <div
                        key={label}
                        className="d-flex justify-content-between align-items-center py-3 border-bottom"
                      >
                        <span>{label}</span>
                        <span className="fw-semibold">{value ?? "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close the modal without modifying Timesheet data */}
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
