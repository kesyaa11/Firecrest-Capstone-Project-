import { useState } from "react";
import { createShift } from "../api/shifts";

export default function AssignShiftModal({
  users = [],
  weekDates = [],
  existingShifts = [],
  onShiftsCreated,
}) {
  // This state var stores selected Team member
  const [selectedMember, setSelectedMember] = useState("");

  // This state var stores number of shifts allocated to each day
  const [shifts, setShifts] = useState({
    mon: 2,
    tue: 2,
    wed: 2,
    thu: 2,
    fri: 2,
    sat: 0,
    sun: 0,
  });

  // Set same number of shifts Monday to Friday (assuming these are working days by default)
  function setWeekdayShifts(numberOfShifts) {
    setShifts({
      ...shifts,
      mon: numberOfShifts,
      tue: numberOfShifts,
      wed: numberOfShifts,
      thu: numberOfShifts,
      fri: numberOfShifts,
    });
  }

  // Update number of shifts on a particular day
  function handleShiftChange(day, value) {
    setShifts({
      ...shifts,
      [day]: Number(value),
    });
  }

  const days =
    weekDates && weekDates.length === 7
      ? [
          { key: "mon", dateObj: weekDates[0] },
          { key: "tue", dateObj: weekDates[1] },
          { key: "wed", dateObj: weekDates[2] },
          { key: "thu", dateObj: weekDates[3] },
          { key: "fri", dateObj: weekDates[4] },
          { key: "sat", dateObj: weekDates[5] },
          { key: "sun", dateObj: weekDates[6] },
        ].map((d) => ({
          key: d.key,
          dateObj: d.dateObj,
          label: `${d.dateObj.toLocaleDateString("en-NZ", { weekday: "short" })} ${d.dateObj.getDate()}`,
        }))
      : [];

  // Get the start and end time for the selected shift slot
  function getShiftTimes(slotNumber) {
    const shiftTimes = [
      { start: "08:00", end: "10:00" },
      { start: "10:30", end: "12:30" },
      { start: "12:45", end: "14:45" },
      { start: "15:00", end: "17:00" },
    ];

    return shiftTimes[slotNumber - 1];
  }

  // Create selected shifts for each day of the week
  async function handleAssignShifts() {
    if (!selectedMember) return;

    try {
      // Store all shift creation requests before sending them to the API.
      const promises = [];
      // Process for each day in the selected week.
      days.forEach((day) => {
        // Get current number of shifts for a day
        const count = shifts[day.key];
        if (day.dateObj && count > 0) {
          const dateStr = `${day.dateObj.getFullYear()}-${String(
            day.dateObj.getMonth() + 1,
          ).padStart(
            2,
            "0",
          )}-${String(day.dateObj.getDate()).padStart(2, "0")}`;

          const currentShifts = existingShifts.filter(
            (shift) =>
              Number(shift.user_id) === Number(selectedMember) &&
              shift.date === dateStr,
          );

          const usedSlots = currentShifts.map((shift) => shift.slot_number);

          const availableSlots = [1, 2, 3, 4].filter(
            (slot) => !usedSlots.includes(slot),
          );

          const shiftsToCreate = Math.min(count, 3 - currentShifts.length);

          for (
            let i = 0;
            i < shiftsToCreate && i < availableSlots.length;
            i++
          ) {
            const times = getShiftTimes(availableSlots[i]);

            // Push a shift creation request to the promises array
            promises.push(
              createShift({
                user_id: Number(selectedMember),
                date: dateStr,
                duration: 2,
                shift_start: times.start,
                shift_end: times.end,
                shifts_count: currentShifts.length + i + 1,
                slot_number: availableSlots[i],
                work_type: "Other",
              }),
            );
          }
        }
      });

      // Await until all shift creation requests have completed.
      await Promise.all(promises);
      // Refresh the dashboard onShiftsCreated event
      if (onShiftsCreated) await onShiftsCreated();
    } catch (err) {
      // Error handling mechanism
      console.error("Error creating shifts:", err);
    }
  }

  return (
    <div className="modal fade" id="assignShiftModal" tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Assign Shifts</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body text-start">
            <div className="mb-4 d-inline-block">
              <label className="form-label fw-bold">Week</label>
              <input
                type="text"
                className="form-control bg-light"
                value={
                  weekDates && weekDates.length === 7
                    ? `${weekDates[0].toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })} – ${weekDates[6].toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`
                    : "Select a valid week"
                }
                readOnly
              />
            </div>

            <div className="mb-4 w-50">
              <label className="form-label fw-bold">Team Member</label>

              <select
                className="form-select"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Select team member...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">
                Quick Add — Monday to Friday
              </label>

              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setWeekdayShifts(1)}
                >
                  +1 Shift
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setWeekdayShifts(2)}
                >
                  +2 Shifts
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setWeekdayShifts(3)}
                >
                  +3 Shifts
                </button>
              </div>

              <small className="text-muted">
                Quickly add a number of shifts for Mon - Fri, then adjust
                individual days below.
              </small>
            </div>

            <div className="mb-2">
              <h6 className="fw-bold mb-3">Daily Shifts</h6>

              <div className="row g-2 flex-nowrap">
                {days.map((day) => (
                  <div className="col" key={day.key}>
                    <div className="border rounded p-3 text-center h-100">
                      <div className="fw-bold mb-2">{day.label}</div>

                      <input
                        type="number"
                        className="form-control form-control-sm mx-auto text-center"
                        style={{ width: "70px" }}
                        min="0"
                        max="12"
                        value={shifts[day.key]}
                        onFocus={(e) => e.target.select()}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          handleShiftChange(day.key, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
              data-bs-dismiss="modal"
              onClick={handleAssignShifts}
            >
              Assign Shifts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
