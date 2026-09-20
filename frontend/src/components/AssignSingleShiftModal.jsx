import { useState, useEffect } from "react";
import { createShift } from "../api/shifts";

export default function AssignSingleShiftModal({
  user,
  date,
  shifts = [],
  onShiftCreated,
}) {
  // Store the number of shifts to assign
  const [shiftCount, setShiftCount] = useState(1);

  // Load the existing shift count for this user and date
  useEffect(() => {
    if (!user || !date) {
      setShiftCount(0);
      return;
    }

    const existingShifts = shifts.filter(
      (shift) => shift.user_id === user.id && shift.date === date,
    );

    setShiftCount(existingShifts.length);
  }, [user, date, shifts]);

  // Create the single shift
  async function handleSave() {
    try {
      await createShift({
        user_id: Number(user.id),
        date: date,
        duration: 2,
        shift_start: startTime,
        shift_end: endTime,
        shiftsCount: 1,
        slot_number: 1,
      });

      // Refresh the dashboard onShiftCreated
      if (onShiftCreated) {
        await onShiftCreated();
      }
    } catch (err) {
      console.error("Error creating shift:", err);
    }
  }

  return (
    <div className="modal fade" id="assignSingleShiftModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title">Assign Shift</h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body text-start">
            {/* Team Member */}
            <div className="mb-3">
              <label className="form-label fw-bold">Team Member</label>
              <input
                type="text"
                className="form-control"
                value={user?.name || ""}
                disabled
              />
            </div>

            {/* Date */}
            <div className="mb-3">
              <label className="form-label fw-bold">Date</label>
              <input
                type="text"
                className="form-control"
                value={date || ""}
                disabled
              />
            </div>
            {/* Number of Shifts */}
            <input
              type="number"
              className="form-control"
              min="0"
              max="12"
              value={shiftCount}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onChange={(e) => {
                const value = Number(e.target.value);

                if (value >= 0 && value <= 12) {
                  setShiftCount(value);
                }
              }}
            />
          </div>

          {/* Modal Footer */}
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
              className="btn btn-primary"
              onClick={handleSave}
              data-bs-dismiss="modal"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
