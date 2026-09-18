import { useState, useEffect } from "react";
import { patchShift, deleteShift } from "../api/shifts";

const WORK_TYPES = ["Programming", "Testing", "Documentation", "Other"];

export default function ShiftDetailsModal({ shift, user, role, onUpdated }) {
  const [workType, setWorkType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  // Refresh the form fields whenever a different shift is opened
  useEffect(() => {
    setWorkType(shift?.work_type || "");
    setDescription(shift?.description || "");
    setError("");
  }, [shift]);

  const canEdit = role === "manager" || role === "sd" || role === "developer";
  const canDelete = role === "manager";

  function closeModal() {
    const modalEl = document.getElementById("shiftDetailsModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    try {
      // SD/Dev and Manager alike only ever save work_type + description here —
      // date/time/assignee changes are a manager-only action done elsewhere
      // (e.g. via AssignShiftModal or a future "reassign" flow).
      await patchShift(shift.id, { work_type: workType, description });
      await onUpdated();
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to update shift.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this shift allocation?")) {
      return;
    }

    try {
      await deleteShift(shift.id);
      await onUpdated();
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to delete shift.");
    }
  }

  if (!shift) {
    return null;
  }

  return (
    <div className="modal fade" id="shiftDetailsModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSave}>
            <div className="modal-header">
              <h5 className="modal-title">Shift Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body text-start">
              {/* Read-only for everyone — only a manager can change who/when via a separate flow */}
              <p className="mb-1"><strong>Employee:</strong> {user?.name}</p>
              <p className="mb-3"><strong>Date:</strong> {shift.date} &nbsp; <strong>Time:</strong> {shift.shift_start}–{shift.shift_end}</p>

              <div className="mb-3">
                <label className="form-label fw-bold">Work Type</label>
                <select
                  className="form-select"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">Select...</option>
                  {WORK_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
            </div>

            <div className="modal-footer">
              {/* Only a manager can delete the allocation entirely */}
              {canDelete && (
                <button type="button" className="btn btn-outline-danger me-auto" onClick={handleDelete}>
                  Delete Shift
                </button>
              )}

              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>

              {canEdit && (
                <button type="submit" className="btn btn-success">
                  Save
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}