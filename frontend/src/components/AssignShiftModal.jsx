import { useState } from "react";
import { createShift } from "../api/shifts";

export default function AssignShiftModal({
  users,
  weekStart,
  onShiftAssigned,
}) {
  // Define statevar to store any error message
  const [error, setError] = useState("");

  // Define statevar to store selected team member
  const [selectedMember, setSelectedMember] = useState("");

  // Computer the end of the week based off weekStart
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Create date format which will be applied to weekStart and weekEnd
  const formatDate = (date) =>
    date.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Init at 3 shifts across working days
  const [shifts, setShifts] = useState({
    mon: 3,
    tue: 3,
    wed: 3,
    thu: 3,
    fri: 3,
    sat: 0,
    sun: 0,
  });

  // Define statevar for slot number, this determines start / end time slot of a shift
  const [slotNumber, setSlotNumber] = useState(1);

  // Weekday shift setter
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

  // Handle change in number of shifts on a particular day
  function handleShiftChange(day, value) {
    setShifts({
      ...shifts,
      [day]: Number(value),
    });
  }

  // Handle slot change so it min max between 1-4
  function handleSlotChange(value) {
    const number = Number(value);

    if (number < 1) {
      setSlotNumber(1);
    } else if (number > 4) {
      setSlotNumber(4);
    } else {
      setSlotNumber(number);
    }
  }

  // Handle assigning shifts for the selected team member
  async function handleAssignShifts() {
    // Clear any previous error message
    setError("");

    // Check that a team member has been selected
    if (!selectedMember) {
      setError("Please select a team member.");
      return;
    }

    try {
      // Loop through each day of the selected week
      for (let i = 0; i < days.length; i++) {
        const day = days[i];

        // Get the number of shifts assigned to this day
        const shiftCount = shifts[day.key];

        // Skip days where no shifts are assigned
        if (shiftCount === 0) continue;

        // Create the date for this day based on the selected week
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);

        // Format the date as YYYY-MM-DD for the API
        const formattedDate = date.toISOString().split("T")[0];

        // Create the shift through the API
        await createShift({
          user_id: Number(selectedMember),
          date: formattedDate,
          shifts_count: shiftCount,
          slot_number: slotNumber,
        });
      }

      // Reload the schedule with the newly assigned shifts
      await onShiftAssigned();

      // Close the modal after the shifts have been assigned successfully
      const modal = document.getElementById("assignShiftModal");
      const modalInstance = bootstrap.Modal.getInstance(modal);
      modalInstance.hide();
    } catch (err) {
      // Store an error message to display to the user
      setError("Failed to assign shifts.");
    }
  }

  // Create an array representing each day of the selected week
  const days = Array.from({ length: 7 }, (_, i) => {
    // Create a date starting from Monday of the selected week
    const date = new Date(weekStart);

    // Move forward by the number of days represented by this item
    date.setDate(date.getDate() + i);

    return {
      // Use the day name as the key for the shifts state
      key: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][i],

      // Format the date for display
      label: date.toLocaleDateString("en-NZ", {
        weekday: "short",
        day: "numeric",
      }),

      // Monday to Friday are working days
      working: i < 5,

      // Keep the actual date available when creating the shift
      date: date,
    };
  });

  return (
    <div
      className="modal fade"
      id="assignShiftModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          {/* Modal Title */}
          <div className="modal-header">
            <h5 className="modal-title">Assign Shifts</h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body text-start">
            {/* Week */}
            <div className="mb-4 d-inline-block">
              <label className="form-label fw-bold">Week</label>

              <input
                type="text"
                className="form-control bg-light"
                value={`${formatDate(weekStart)} – ${formatDate(weekEnd)}`}
                readOnly
              />
            </div>

            {/* Team Member */}
            <div className="mb-4 w-50">
              <label className="form-label fw-bold">Team Member</label>

              <select
                className="form-select"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Select team member...</option>

                {users
                  .filter((user) => user.role !== "Manager")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick Allocate */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                Quick Allocate — Monday to Friday
              </label>

              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setWeekdayShifts(1)}
                >
                  1 Shift
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setWeekdayShifts(2)}
                >
                  2 Shifts
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setWeekdayShifts(3)}
                >
                  3 Shifts
                </button>
              </div>

              <small className="text-muted">
                Quickly allocate a number of shifts for Mon - Fri, then adjust
                individual days below.
              </small>
            </div>

            {/* Daily Shifts */}
            <div className="mb-2">
              <h6 className="fw-bold mb-3">Daily Shifts</h6>

              <div className="row g-2 flex-nowrap">
                {days.map((day) => (
                  <div className="col" key={day.key}>
                    <div className="border rounded p-3 text-center h-100">
                      <div className="fw-bold mb-2">{day.label}</div>

                      <input
                        type="number"
                        className="form-control form-control-sm mx-auto"
                        style={{ width: "70px" }}
                        min="0"
                        value={shifts[day.key]}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        onChange={(e) =>
                          handleShiftChange(day.key, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slot Number */}
            <div className="mb-4">
              <label className="form-label fw-bold">Coverage Period</label>

              <select
                className="form-select"
                style={{ width: "100px" }}
                value={slotNumber}
                onChange={(e) => setSlotNumber(Number(e.target.value))}
              >
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
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
              className="btn btn-success"
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
