import { useState } from "react";
import { updateShift } from "../api/shifts";

export default function TransferShiftsModal({
  selectedShifts,
  shifts,
  users,
  onUpdated,
  onClose,
}) {
  // Store the employee selected for transfer
  const [targetUserId, setTargetUserId] = useState("");

  const transferConflicts = selectedShifts.filter((shiftId) => {
    const shift = shifts.find((existingShift) => existingShift.id === shiftId);

    if (!shift || !targetUserId) return false;

    return shifts.some(
      (existingShift) =>
        Number(existingShift.user_id) === Number(targetUserId) &&
        existingShift.date === shift.date &&
        existingShift.slot_number === shift.slot_number,
    );
  });

  const handleTransfer = async () => {
    if (!targetUserId || transferConflicts.length > 0) {
      return;
    }

    for (const shiftId of selectedShifts) {
      const shift = shifts.find(
        (existingShift) => existingShift.id === shiftId,
      );

      if (!shift) continue;

      await updateShift(shiftId, {
        ...shift,
        user_id: Number(targetUserId),
      });
    }

    await onUpdated();
    onClose();
  };
  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Transfer Shifts</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <p className="mb-3">
              Transfer {selectedShifts.length} selected shift
              {selectedShifts.length === 1 ? "" : "s"} to another employee.
            </p>

            <label className="form-label">Transfer to</label>

            <select
              className="form-select"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            >
              <option value="">Select employee</option>
              {users
                .filter((user) => {
                  const selectedShift = shifts.find(
                    (shift) => shift.id === selectedShifts[0],
                  );

                  return Number(user.id) !== Number(selectedShift?.user_id);
                })
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
            {transferConflicts.length > 0 && (
              <div className="alert alert-warning mt-3 mb-0">
                <strong>Transfer conflicts:</strong>
                <ul className="mb-0 mt-2">
                  {transferConflicts.map((shiftId) => {
                    const shift = shifts.find(
                      (existingShift) => existingShift.id === shiftId,
                    );

                    return (
                      <li key={shiftId}>
                        {shift?.date} — Slot {shift?.slot_number}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 small">
                  The selected shifts cannot be transferred while these
                  destination slots are occupied.
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-success"
              disabled={!targetUserId || transferConflicts.length > 0}
              onClick={handleTransfer}
            >
              Transfer Shifts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
