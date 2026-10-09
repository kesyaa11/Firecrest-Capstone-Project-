import { useMemo, useState } from "react";

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
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [destinations, setDestinations] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const selectedShifts = sourceShifts.filter((shift) =>
    selectedIds.includes(Number(shift.id)),
  );

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

  const getDestination = (shift) => ({
    date: destinations[shift.id]?.date ?? shift.date,
    slotNumber: Number(destinations[shift.id]?.slotNumber ?? shift.slot_number),
  });

  const findConflicts = (assignments) => {
    const blocked = [];

    for (const assignment of assignments) {
      const { shift, date, slotNumber } = assignment;

      const occupied = shifts.some(
        (existing) =>
          Number(existing.id) !== Number(shift.id) &&
          Number(existing.user_id) === Number(targetUserId) &&
          String(existing.date) === date &&
          Number(existing.slot_number) === slotNumber,
      );

      const onLeave = leaveRequests.some(
        (leave) =>
          Number(leave.user_id) === Number(targetUserId) &&
          leave.status === "Approved" &&
          leave.start_date <= date &&
          leave.end_date >= date,
      );

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

    // Also detect two selected shifts being moved to the same slot.
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

  const handleSubmit = async () => {
    setError("");
    setConflicts([]);

    if (!sourceUserId || !targetUserId || selectedShifts.length === 0) {
      setError("Choose the employees and at least one shift.");
      return;
    }

    const assignments = selectedShifts.map((shift) => {
      const destination = getDestination(shift);
      return { shift, ...destination };
    });

    const blocked = findConflicts(assignments);
    const blockedIds = new Set(blocked.map((item) => Number(item.shiftId)));
    const safeAssignments = assignments.filter(
      (item) => !blockedIds.has(Number(item.shift.id)),
    );

    setConflicts(blocked);

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

    if (!window.confirm(message)) return;

    setSubmitting(true);

    try {
      // Only conflict-free assignments are sent to the API.
      await onConfirm?.({
        project,
        sourceUserId: Number(sourceUserId),
        targetUserId: Number(targetUserId),
        assignments: safeAssignments,
      });

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
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
