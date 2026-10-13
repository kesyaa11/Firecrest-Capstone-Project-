import { useState, useEffect } from "react";
import { createLeaveRequest } from "../api/leaveRequests";

export default function RecordLeaveModal({
  users = [],
  managerId,
  onCreated,
  initialUserId,
  initialDate,
}) {
  // Statevar to track the selected employee, leave type, date range, and saving status for the leave form
  const [userId, setUserId] = useState("");
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Prefill the employee and date from the selected schedule cell
  useEffect(() => {
    if (initialUserId != null) {
      setUserId(String(initialUserId));
    }

    if (initialDate) {
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialUserId, initialDate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (endDate < startDate) {
      alert("End date cannot be before start date.");
      return;
    }

    setSaving(true);

    try {
      await createLeaveRequest({
        user_id: Number(userId),
        approver_id: Number(managerId),
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        status: "Approved",
      });

      await onCreated?.();

      setUserId("");
      setLeaveType("Annual Leave");
      setStartDate("");
      setEndDate("");

      window.bootstrap?.Modal.getOrCreateInstance(
        document.getElementById("recordLeaveModal"),
      ).hide();

      alert("Leave recorded successfully.");
    } catch (err) {
      alert(err.message || "Failed to record leave.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal fade"
      id="recordLeaveModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Record Employee Leave</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                >
                  <option value="">Select employee...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Leave type</label>
                <select
                  className="form-select"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Personal Leave</option>
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">End date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={saving}
              >
                {saving ? "Saving..." : "Record Leave"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
