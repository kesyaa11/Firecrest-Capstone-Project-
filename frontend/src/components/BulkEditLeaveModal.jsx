import { useMemo, useState } from "react";
import { createLeaveRequest, updateLeaveRequest } from "../api/leaveRequests";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Personal Leave"];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsedDate = new Date(`${value}T12:00:00`);

  return (
    !Number.isNaN(parsedDate.getTime()) && formatDate(parsedDate) === value
  );
}

// Expand a request into its individual calendar dates.
function getDatesInRange(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Combine consecutive dates into ranges.
function getConsecutiveRanges(dates) {
  const ranges = [];

  for (const date of [...new Set(dates)].sort()) {
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

export default function BulkEditLeaveModal({
  selectedLeaveDays = [],
  leaveRequests = [],
  users = [],
  shifts = [],
  publicHolidays = [],
  onUpdated,
  onClose,
}) {
  const [edits, setEdits] = useState({});
  const [applyType, setApplyType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Find each selected calendar day and its original leave request.
  const selectedDays = useMemo(() => {
    const uniqueDays = new Map();

    for (const day of selectedLeaveDays) {
      uniqueDays.set(`${day.requestId}-${day.date}`, day);
    }

    return [...uniqueDays.values()]
      .map((day) => {
        const request = leaveRequests.find(
          (item) => Number(item.id) === Number(day.requestId),
        );

        const employee = request
          ? users.find(
              (person) => Number(person.id) === Number(request.user_id),
            )
          : null;

        const key = `${day.requestId}-${day.date}`;

        return {
          ...day,
          key,
          request,
          employee,
          newDate: edits[key]?.newDate ?? day.date,
          newLeaveType: edits[key]?.leaveType ?? request?.leave_type ?? "",
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedLeaveDays, leaveRequests, users, edits]);

  // Update one field on one selected day.
  const updateDay = (day, field, value) => {
    setEdits((current) => ({
      ...current,
      [day.key]: {
        newDate: current[day.key]?.newDate ?? day.date,
        leaveType: current[day.key]?.leaveType ?? day.request?.leave_type ?? "",
        [field]: value,
      },
    }));

    setError("");
  };

  // Apply one leave type to every selected day without changing dates.
  const applyTypeToAll = () => {
    if (!applyType) return;

    setEdits((current) => {
      const next = { ...current };

      for (const day of selectedDays) {
        next[day.key] = {
          newDate: day.newDate,
          leaveType: applyType,
        };
      }

      return next;
    });

    setError("");
  };

  const handleSave = async () => {
    setError("");

    if (selectedDays.length === 0) {
      setError("Select at least one leave day.");
      return;
    }

    if (selectedDays.some((day) => !day.request)) {
      setError(
        "A selected leave request could not be found. Refresh the schedule and select the days again.",
      );
      return;
    }

    const changedDays = selectedDays.filter(
      (day) =>
        day.newDate !== day.date || day.newLeaveType !== day.request.leave_type,
    );

    if (changedDays.length === 0) {
      setError("No changes have been made.");
      return;
    }

    // Collect every validation conflict instead of stopping at the first one.
    const conflicts = [];
    const addConflict = (message) => conflicts.push(message);

    const normaliseText = (value) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const normaliseCountry = (value) => {
      const country = normaliseText(value);

      if (["nz", "new zealand"].includes(country)) return "nz";
      if (["ph", "philippines", "the philippines"].includes(country)) {
        return "ph";
      }

      return country;
    };

    const getRegions = (value) => {
      if (Array.isArray(value)) {
        return value.map(normaliseText).filter(Boolean);
      }

      if (typeof value !== "string" || !value.trim()) return [];

      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed.map(normaliseText).filter(Boolean);
        }
      } catch {
        // Handle comma- or semicolon-separated region names.
      }

      return value.split(/[,;]/).map(normaliseText).filter(Boolean);
    };

    const isNationalHoliday = (value) =>
      value === true ||
      value === 1 ||
      ["true", "1", "yes"].includes(
        String(value ?? "")
          .trim()
          .toLowerCase(),
      );

    // Validate status, date and leave type for every changed day.
    for (const day of changedDays) {
      const name = day.employee?.name || "Employee";

      if (day.request.status !== "Approved") {
        addConflict(`${name}: only approved leave can be edited.`);
      }

      if (!isValidDate(day.newDate)) {
        addConflict(
          `${name}: ${day.newDate || "(no date)"} is not a valid date.`,
        );
      }

      if (!LEAVE_TYPES.includes(day.newLeaveType)) {
        addConflict(`${name}: choose a valid leave type.`);
      }
    }

    // Detect duplicate destination dates for the same employee.
    const destinations = new Map();
    const duplicateDestinations = new Set();

    for (const day of changedDays) {
      if (!isValidDate(day.newDate)) continue;

      const key = `${day.request.user_id}-${day.newDate}`;

      if (destinations.has(key)) {
        if (!duplicateDestinations.has(key)) {
          addConflict(
            `${day.employee?.name || "Employee"}: multiple leave days would land on ${day.newDate}.`,
          );
          duplicateDestinations.add(key);
        }
      } else {
        destinations.set(key, day);
      }
    }

    // Track source dates that will be removed from their original requests.
    const changedSourceDates = new Map();

    for (const day of changedDays) {
      const requestId = Number(day.request.id);

      if (!changedSourceDates.has(requestId)) {
        changedSourceDates.set(requestId, new Set());
      }

      changedSourceDates.get(requestId).add(day.date);
    }

    // Check every destination against shifts, leave and public holidays.
    for (const day of changedDays) {
      if (day.request.status !== "Approved" || !isValidDate(day.newDate)) {
        continue;
      }

      const employee = day.employee;
      const name = employee?.name || "Employee";

      // Check whether this employee already has a shift on the date.
      const hasShift = shifts.some((shift) => {
        const shiftUserId =
          shift.user_id ??
          shift.userId ??
          shift.employee_id ??
          shift.employeeId;

        const rawDate =
          shift.date ??
          shift.shift_date ??
          shift.shiftDate ??
          shift.start_date ??
          shift.startDate;

        return (
          Number(shiftUserId) === Number(day.request.user_id) &&
          String(rawDate ?? "").slice(0, 10) === day.newDate
        );
      });

      if (hasShift) {
        addConflict(`${name}: already has a shift on ${day.newDate}.`);
      }

      // Check for overlapping approved leave, excluding source dates
      // that this same bulk operation will remove.
      const hasApprovedLeave = leaveRequests.some((request) => {
        if (
          Number(request.user_id) !== Number(day.request.user_id) ||
          request.status !== "Approved"
        ) {
          return false;
        }

        const start = String(request.start_date ?? "").slice(0, 10);
        const end = String(request.end_date ?? "").slice(0, 10);

        if (start > day.newDate || end < day.newDate) {
          return false;
        }

        const datesBeingRemoved = changedSourceDates.get(Number(request.id));

        return !datesBeingRemoved?.has(day.newDate);
      });

      if (hasApprovedLeave) {
        addConflict(`${name}: already has approved leave on ${day.newDate}.`);
      }

      // Check national and regional public holidays.
      const employeeCountry = normaliseCountry(employee?.country);
      const employeeRegion = normaliseText(employee?.region);

      if (!employeeCountry) {
        addConflict(
          `${name}: country is missing; public holidays cannot be verified.`,
        );
        continue;
      }

      const applicableHoliday = publicHolidays.find((holiday) => {
        const holidayDate = String(holiday.date ?? "").slice(0, 10);

        if (
          holidayDate !== day.newDate ||
          normaliseCountry(holiday.country) !== employeeCountry
        ) {
          return false;
        }

        if (isNationalHoliday(holiday.is_national)) {
          return true;
        }

        // The database schema uses `regions` (plural).
        const regions = getRegions(holiday.regions ?? holiday.region);

        return employeeRegion !== "" && regions.includes(employeeRegion);
      });

      if (applicableHoliday) {
        addConflict(
          `${name}: ${applicableHoliday.name || "Public holiday"} falls on ${day.newDate}.`,
        );
      }
    }

    // Display all unique conflicts together and stop before saving.
    const uniqueConflicts = [...new Set(conflicts)];

    if (uniqueConflicts.length > 0) {
      setError(uniqueConflicts.map((message) => `• ${message}`).join("\n"));
      return;
    }

    const confirmed = window.confirm(
      `Save changes to ${changedDays.length} selected leave day(s)? Only changed days will be updated. Unselected dates will retain their original leave type.`,
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      // Process each original request independently.
      const groups = new Map();

      for (const day of changedDays) {
        const requestId = Number(day.request.id);

        if (!groups.has(requestId)) {
          groups.set(requestId, {
            request: day.request,
            days: [],
          });
        }

        groups.get(requestId).days.push(day);
      }

      for (const { request, days } of groups.values()) {
        const datesToRemove = new Set(days.map((day) => day.date));

        // Preserve all unselected dates under the original leave type.
        const remainingDates = getDatesInRange(
          request.start_date,
          request.end_date,
        ).filter((date) => !datesToRemove.has(date));

        const remainingRanges = getConsecutiveRanges(remainingDates);

        if (remainingRanges.length > 0) {
          const [firstRange, ...otherRanges] = remainingRanges;

          // Keep the original request ID on the first remaining range.
          await updateLeaveRequest(request.id, {
            ...request,
            start_date: firstRange.start,
            end_date: firstRange.end,
          });

          // Re-create any additional original-type ranges.
          for (const range of otherRanges) {
            await createLeaveRequest({
              ...request,
              id: undefined,
              start_date: range.start,
              end_date: range.end,
            });
          }

          // Re-create each edited day with its own date and leave type.
          for (const day of days) {
            await createLeaveRequest({
              ...request,
              id: undefined,
              start_date: day.newDate,
              end_date: day.newDate,
              leave_type: day.newLeaveType,
              status: request.status,
            });
          }
        } else {
          // If every original date is being edited, reuse the original ID
          // for the first edited day.
          const [firstDay, ...otherDays] = days;

          await updateLeaveRequest(request.id, {
            ...request,
            start_date: firstDay.newDate,
            end_date: firstDay.newDate,
            leave_type: firstDay.newLeaveType,
          });

          for (const day of otherDays) {
            await createLeaveRequest({
              ...request,
              id: undefined,
              start_date: day.newDate,
              end_date: day.newDate,
              leave_type: day.newLeaveType,
              status: request.status,
            });
          }
        }
      }

      await onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Bulk leave edit failed:", err);

      setError(
        err.message ||
          "Bulk edit failed. Some changes may already have been saved. Refresh the schedule and check the affected requests.",
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
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bulk Edit Leave</h5>

            <button
              type="button"
              className="btn-close"
              disabled={saving}
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <p className="text-muted">
              Change the date and leave type independently for each selected
              day.
            </p>

            <div className="alert alert-info">
              Only edited dates will change. Other dates in the original leave
              requests will retain their existing leave type.
            </div>

            <div className="row g-2 align-items-end mb-3">
              <div className="col-md-6">
                <label
                  htmlFor="applyLeaveType"
                  className="form-label fw-semibold"
                >
                  Apply one leave type to all
                </label>

                <select
                  id="applyLeaveType"
                  className="form-select"
                  value={applyType}
                  disabled={saving}
                  onChange={(event) => setApplyType(event.target.value)}
                >
                  <option value="">Choose leave type...</option>

                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-auto">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={saving || !applyType || selectedDays.length === 0}
                  onClick={applyTypeToAll}
                >
                  Apply to All
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Original date</th>
                    <th>New date</th>
                    <th>Current type</th>
                    <th>New type</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedDays.map((day) => (
                    <tr key={day.key}>
                      <td>{day.employee?.name || "Unknown"}</td>

                      <td>{day.date}</td>

                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={day.newDate}
                          disabled={saving}
                          onChange={(event) =>
                            updateDay(day, "newDate", event.target.value)
                          }
                        />
                      </td>

                      <td>{day.request?.leave_type || "Unknown"}</td>

                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={day.newLeaveType}
                          disabled={saving}
                          onChange={(event) =>
                            updateDay(day, "leaveType", event.target.value)
                          }
                        >
                          <option value="">Choose type...</option>

                          {LEAVE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedDays.length === 0 && (
              <div className="alert alert-warning">
                No leave days are selected.
              </div>
            )}

            {error && (
              <div
                className="alert alert-danger mt-3 mb-0"
                style={{ whiteSpace: "pre-line" }}
              >
                {error}
              </div>
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
              disabled={saving || selectedDays.length === 0}
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
