import { useMemo, useState } from "react";

// These are the time slots a shift can be assigned to.
const SLOTS = [
  { value: 1, label: "08:00–10:00", start: "08:00:00", end: "10:00:00" },
  { value: 2, label: "10:30–12:30", start: "10:30:00", end: "12:30:00" },
  { value: 3, label: "12:45–14:45", start: "12:45:00", end: "14:45:00" },
  { value: 4, label: "15:00–17:00", start: "15:00:00", end: "17:00:00" },
];

export default function ReassignWorkModal({
  project,
  users = [],
  shifts = [],
  leaveRequests = [],
  onClose,
  onConfirm,
}) {
  // Statevar to track source employee, target employee and shift IDs
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Statevar to track new date/slot for each selected shift then store any conflicts found
  const [destinations, setDestinations] = useState({});
  const [conflicts, setConflicts] = useState([]);

  // Statevar flag to prevent user from submitting again while updates are running and flag to show validation messages
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Once employee has been chosen, show that employee's shifts for this project
  const projectShifts = useMemo(
    () =>
      shifts
        .filter((shift) => Number(shift.project_id) === Number(project?.id))
        .sort(
          (a, b) =>
            String(a.date).localeCompare(String(b.date)) ||
            Number(a.slot_number) - Number(b.slot_number),
        ),
    [project, shifts],
  );

  const sourceShifts = projectShifts.filter(
    (shift) => String(shift.user_id) === sourceUserId,
  );

  // Store shifts the user has selected so we process those shifts only
  const selectedShifts = sourceShifts.filter((shift) =>
    selectedIds.includes(Number(shift.id)),
  );

  // Save the new date or time slot for a shift.
  // Use the manager's chosen date or time slot if it exists else keep original value
  const setDestination = (shift, field, value) => {
    setDestinations((current) => ({
      ...current,
      [shift.id]: {
        date: current[shift.id]?.date ?? shift.date,
        slotNumber: current[shift.id]?.slotNumber ?? Number(shift.slot_number),
        ...current[shift.id],
        [field]: value,
      },
    }));
    setConflicts([]);
    setError("");
  };

  // Get the manager's chosen date and time slot for the shift.
  // If no changes were made, use the original date and time slot.
  const getDestination = (shift) => ({
    date: destinations[shift.id]?.date ?? shift.date,
    slotNumber: Number(destinations[shift.id]?.slotNumber ?? shift.slot_number),
  });

  // Check IF selected shifts can be assigned to the replacement employee.
  // Look for existing shifts, approved leave and clashes between selected shifts.
  const findConflicts = (assignments) => {
    const blocked = [];

    for (const assignment of assignments) {
      const { shift, date, slotNumber } = assignment;

      // Check IF the replacement employee already has a shift
      // on the same date and on the same time slot.
      const occupied = shifts.some(
        (existing) =>
          Number(existing.id) !== Number(shift.id) &&
          Number(existing.user_id) === Number(targetUserId) &&
          String(existing.date) === date &&
          Number(existing.slot_number) === slotNumber,
      );

      // Check IF the replacement employee has approved leave
      // covering the date chosen for this shift.
      const onLeave = leaveRequests.some(
        (leave) =>
          Number(leave.user_id) === Number(targetUserId) &&
          leave.status === "Approved" &&
          leave.start_date <= date &&
          leave.end_date >= date,
      );

      // Store the conflict so we can tell the manager why shift is blocked.
      if (occupied || onLeave) {
        blocked.push({
          shiftId: shift.id,
          date,
          slotNumber,
          reason: occupied
            ? "The replacement employee already has a shift in this slot."
            : "The replacement employee has approved leave on this date.",
        });
      }
    }

    // Check selected shifts against each other as well.
    // Two shifts cannot be moved to the same date and time slot.
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a = assignments[i];
        const b = assignments[j];

        if (
          a.date === b.date &&
          Number(a.slotNumber) === Number(b.slotNumber)
        ) {
          for (const item of [a, b]) {
            if (!blocked.some((entry) => entry.shiftId === item.shift.id)) {
              blocked.push({
                shiftId: item.shift.id,
                date: item.date,
                slotNumber: item.slotNumber,
                reason: "Two selected shifts cannot occupy the same slot.",
              });
            }
          }
        }
      }
    }

    return blocked;
  };

  // Check whether the replacement employee already has a shift in the same slot,
  // has approved leave on the selected date, or has another selected shift
  // being moved into the same date and time slot THEN and only then can we submit updates to the API
  const handleSubmit = async () => {
    setError("");
    setConflicts([]);

    // Check both employees are selected and at least one shift is chosen.
    if (!sourceUserId || !targetUserId || selectedShifts.length === 0) {
      setError("Choose the employees and at least one shift.");
      return;
    }

    // Get the selected shifts and their chosen destination date and time slot.
    const assignments = selectedShifts.map((shift) => {
      const destination = getDestination(shift);
      return { shift, ...destination };
    });

    // Check the selected shifts and identify any conflicts before proceeding.
    const blocked = findConflicts(assignments);
    const blockedIds = new Set(blocked.map((item) => Number(item.shiftId)));

    // Keep only the shifts that have no conflicts and can proceed.
    const safeAssignments = assignments.filter(
      (item) => !blockedIds.has(Number(item.shift.id)),
    );

    setConflicts(blocked);

    // Stop if every selected shift has a conflict and let the manager fix them.
    if (safeAssignments.length === 0) {
      setError("No shifts can be moved yet. Fix the conflicts shown below.");
      return;
    }

    const message =
      `Reassign ${safeAssignments.length} shift(s) to ` +
      `${users.find((user) => Number(user.id) === Number(targetUserId))?.name}?` +
      (blocked.length
        ? ` ${blocked.length} conflicting shift(s) will remain unchanged.`
        : "");

    // Check to confirm before sending the shift updates.
    // If they cancel THEN do not proceed with the transfer.
    if (!window.confirm(message)) return;

    setSubmitting(true);

    try {
      // Send the conflict-free shifts to the parent component where API updates will be handled
      await onConfirm?.({
        project,
        sourceUserId: Number(sourceUserId),
        targetUserId: Number(targetUserId),
        assignments: safeAssignments,
      });

      // Keep track of the shifts that were processed then remove from current selection.
      const completedIds = new Set(
        safeAssignments.map((item) => Number(item.shift.id)),
      );

      setSelectedIds((current) =>
        current.filter((id) => !completedIds.has(Number(id))),
      );

      setDestinations((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([id]) => !completedIds.has(Number(id)),
          ),
        ),
      );

      // Close the modal IF no conflicts.
      // Otherwise, keep it open so the manager can resolve remaining conflicts.
      if (blocked.length === 0) {
        onClose();
      } else {
        setError(
          `${safeAssignments.length} shift(s) processed. Resolve the remaining conflicts below.`,
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "An update failed. Refresh the schedule before retrying.",
      );
      // Processing is finished and so user can submit another request again
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Reassignment modal main container
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          {/* Reassignment modal header */}
          <div className="modal-header">
            {/* Modal title and Project name */}
            <div>
              <h5 className="modal-title">Reassign / Reschedule Work</h5>
              <small className="text-muted">{project?.name}</small>
            </div>
            <button
              type="button"
              className="btn-close"
              disabled={submitting}
              onClick={onClose}
              aria-label="Close"
            />
          </div>
          {/* Modal body */}
          <div className="modal-body">
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Employee to reassign from
                </label>
                <select
                  className="form-select"
                  value={sourceUserId}
                  disabled={submitting}
                  onChange={(event) => {
                    setSourceUserId(event.target.value);
                    setTargetUserId("");
                    setSelectedIds([]);
                    setDestinations({});
                    setConflicts([]);
                    setError("");
                  }}
                >
                  <option value="">Select employee...</option>
                  {[
                    ...new Map(
                      projectShifts
                        .map((shift) => {
                          const user = users.find(
                            (item) => Number(item.id) === Number(shift.user_id),
                          );
                          return user ? [String(user.id), user] : null;
                        })
                        .filter(Boolean),
                    ).values(),
                  ].map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Replacement employee
                </label>
                <select
                  className="form-select"
                  value={targetUserId}
                  disabled={!sourceUserId || submitting}
                  onChange={(event) => {
                    setTargetUserId(event.target.value);
                    setConflicts([]);
                    setError("");
                  }}
                >
                  <option value="">Select employee...</option>
                  {users
                    .filter((user) => String(user.id) !== sourceUserId)
                    .map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <p className="text-muted small">
              Select the shifts to move. You can keep the original date and slot
              or choose a different date and slot for each shift.
            </p>

            {sourceShifts.length === 0 ? (
              <p className="text-muted border rounded p-3">
                Select an employee to view their project shifts.
              </p>
            ) : (
              <div className="table-responsive">
                {/* Shift table */}
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Select</th>
                      <th>Original date</th>
                      <th>Work type</th>
                      <th>New date</th>
                      <th>New time slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceShifts.map((shift) => {
                      const destination = getDestination(shift);
                      const conflict = conflicts.find(
                        (item) => Number(item.shiftId) === Number(shift.id),
                      );

                      return (
                        <tr key={shift.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              disabled={submitting}
                              checked={selectedIds.includes(Number(shift.id))}
                              onChange={(event) => {
                                setSelectedIds((current) =>
                                  event.target.checked
                                    ? [...current, Number(shift.id)]
                                    : current.filter(
                                        (id) => id !== Number(shift.id),
                                      ),
                                );
                                setConflicts([]);
                                setError("");
                              }}
                            />
                          </td>
                          <td>{shift.date}</td>
                          <td>{shift.work_type || "—"}</td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={destination.date}
                              disabled={
                                submitting ||
                                !selectedIds.includes(Number(shift.id))
                              }
                              onChange={(event) =>
                                setDestination(
                                  shift,
                                  "date",
                                  event.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={destination.slotNumber}
                              disabled={
                                submitting ||
                                !selectedIds.includes(Number(shift.id))
                              }
                              onChange={(event) =>
                                setDestination(
                                  shift,
                                  "slotNumber",
                                  Number(event.target.value),
                                )
                              }
                            >
                              {SLOTS.map((slot) => (
                                <option key={slot.value} value={slot.value}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                            {conflict && (
                              <small className="text-danger d-block mt-1">
                                {conflict.reason}
                              </small>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Error / Conflict messages */}
            {error && (
              <div className="alert alert-warning mt-3 mb-0">{error}</div>
            )}

            {conflicts.length > 0 && (
              <div className="alert alert-danger mt-3 mb-0">
                <strong>{conflicts.length} conflict(s) found.</strong> Change
                the date or time slot of the blocked shifts, then press Continue
                again. Conflicted shifts have not been updated.
              </div>
            )}
          </div>
          {/* Modal footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                submitting ||
                !sourceUserId ||
                !targetUserId ||
                selectedIds.length === 0
              }
              onClick={handleSubmit}
            >
              {submitting ? "Processing..." : "Check & Reassign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
