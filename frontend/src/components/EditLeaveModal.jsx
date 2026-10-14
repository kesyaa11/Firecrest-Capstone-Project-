import { useState } from "react";
import { createLeaveRequest, updateLeaveRequest } from "../api/leaveRequests";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Personal Leave"];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRemainingRanges(startDate, endDate, excludedDate) {
  const dates = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (current <= end) {
    const date = formatDate(current);

    if (date !== excludedDate) {
      dates.push(date);
    }

    current.setDate(current.getDate() + 1);
  }

  const ranges = [];

  for (const date of dates) {
    const lastRange = ranges[ranges.length - 1];

    if (!lastRange) {
      ranges.push({ start: date, end: date });
      continue;
    }

    const nextDate = new Date(`${lastRange.end}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);

    if (formatDate(nextDate) === date) {
      lastRange.end = date;
    } else {
      ranges.push({ start: date, end: date });
    }
  }

  return ranges;
}

export default function EditLeaveModal({
  leaveRequest,
  date,
  shifts = [],
  leaveRequests = [],
  publicHolidays = [],
  users = [],
  onUpdated,
  onClose,
}) {
  // Statevar to track the edited date, leave type, saving status, and any error messages.
  const [newDate, setNewDate] = useState(date || "");
  const [leaveType, setLeaveType] = useState(leaveRequest?.leave_type || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!leaveRequest) return null;

  const dateChanged = newDate !== date;
  const typeChanged = leaveType !== leaveRequest.leave_type;

  const isMultiDay =
    leaveRequest.start_date !== date || leaveRequest.end_date !== date;

  const employee = users.find(
    (person) => Number(person.id) === Number(leaveRequest.user_id),
  );

  const handleSave = async () => {
    setError("");

    if (!newDate || !leaveType) {
      setError("Choose a date and leave type.");
      return;
    }

    if (!LEAVE_TYPES.includes(leaveType)) {
      setError("Choose a valid leave type.");
      return;
    }

    // Validate that the selected date is a real calendar date.
    const parsedDate = new Date(`${newDate}T12:00:00`);

    if (
      // Check that the date matches the YYYY-MM-DD format.
      !/^\d{4}-\d{2}-\d{2}$/.test(newDate) ||
      // Check whether the parsed date is invalid
      Number.isNaN(parsedDate.getTime()) ||
      formatDate(parsedDate) !== newDate
    ) {
      setError("Choose a valid date.");
      return;
    }

    if (!dateChanged && !typeChanged) {
      setError("No changes have been made.");
      return;
    }

    if (dateChanged) {
      // Moving within the same request's range would overlap its
      // other approved leave days.
      const insideOriginalRange =
        newDate >= leaveRequest.start_date && newDate <= leaveRequest.end_date;

      if (insideOriginalRange) {
        setError(
          "That date is already covered by this leave request. Choose a date outside its current range.",
        );
        return;
      }

      // Reject a destination containing a shift.
      const hasShift = shifts.some(
        (shift) =>
          Number(shift.user_id) === Number(leaveRequest.user_id) &&
          shift.date === newDate,
      );

      if (hasShift) {
        setError("That employee already has a shift on this date.");
        return;
      }

      // Reject a destination covered by another approved leave.
      const hasLeave = leaveRequests.some(
        (request) =>
          Number(request.id) !== Number(leaveRequest.id) &&
          Number(request.user_id) === Number(leaveRequest.user_id) &&
          request.status === "Approved" &&
          request.start_date <= newDate &&
          request.end_date >= newDate,
      );

      if (hasLeave) {
        setError("That employee already has approved leave on this date.");
        return;
      }

      // Check the employee's national public holidays.
      const hasHoliday = publicHolidays.some(
        (holiday) =>
          holiday.date === newDate &&
          holiday.country === employee?.country &&
          holiday.is_national,
      );

      if (hasHoliday) {
        setError(
          "The selected date is a national public holiday for this employee.",
        );
        return;
      }
    }

    if (
      dateChanged &&
      isMultiDay &&
      !window.confirm(
        `Move ${date} to ${newDate}? Only the selected day will move. The other dates will remain under the original leave request.`,
      )
    ) {
      return;
    }

    if (
      typeChanged &&
      isMultiDay &&
      !window.confirm(
        `Changing the leave type will split the original request. Only ${date} will become ${leaveType}. Continue?`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      // A single-day request can be updated directly.
      if (!isMultiDay) {
        await updateLeaveRequest(leaveRequest.id, {
          ...leaveRequest,
          start_date: newDate,
          end_date: newDate,
          leave_type: leaveType,
        });
      } else {
        // Preserve every other date under the original request.
        const ranges = getRemainingRanges(
          leaveRequest.start_date,
          leaveRequest.end_date,
          date,
        );

        const [firstRange, ...additionalRanges] = ranges;

        if (firstRange) {
          await updateLeaveRequest(leaveRequest.id, {
            ...leaveRequest,
            start_date: firstRange.start,
            end_date: firstRange.end,
          });

          for (const range of additionalRanges) {
            await createLeaveRequest({
              ...leaveRequest,
              id: undefined,
              start_date: range.start,
              end_date: range.end,
            });
          }
        }

        // Create the edited day as its own request.
        await createLeaveRequest({
          ...leaveRequest,
          id: undefined,
          start_date: newDate,
          end_date: newDate,
          leave_type: leaveType,
          status: leaveRequest.status,
        });
      }

      await onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Unable to edit leave:", err);

      setError(
        err.message ||
          "Unable to update leave. Some changes may already have been saved; refresh and check the schedule.",
      );

      try {
        await onUpdated?.();
      } catch (refreshError) {
        console.error("Unable to refresh schedule:", refreshError);
      }
    } finally {
      setSaving(false);
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
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Leave Day</h5>

            <button
              type="button"
              className="btn-close"
              disabled={saving}
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <p>
              <strong>Employee:</strong> {employee?.name || "Unknown"}
            </p>

            <p>
              <strong>Original date:</strong> {date}
            </p>

            {isMultiDay && (
              <div className="alert alert-info">
                This day belongs to a multi-day leave request. Changing it will
                preserve the other dates and split the selected day into a
                separate request.
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="editLeaveDate" className="form-label">
                New date
              </label>

              <input
                id="editLeaveDate"
                type="date"
                className="form-control"
                value={newDate}
                disabled={saving}
                onChange={(event) => setNewDate(event.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="editLeaveType" className="form-label">
                Leave type
              </label>

              <select
                id="editLeaveType"
                className="form-select"
                value={leaveType}
                disabled={saving}
                onChange={(event) => setLeaveType(event.target.value)}
                required
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="alert alert-danger mt-3 mb-0">{error}</div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || (!dateChanged && !typeChanged)}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
