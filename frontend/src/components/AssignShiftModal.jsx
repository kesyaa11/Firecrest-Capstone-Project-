import { useState } from "react";
import { createShift } from "../api/shifts";

const slotTimes = [
  { start: "08:00:00", end: "10:00:00" },
  { start: "10:00:00", end: "12:00:00" },
  { start: "12:00:00", end: "14:00:00" },
  { start: "14:00:00", end: "16:00:00" },
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AssignShiftModal({ users, weekDates, onShiftsCreated }) {
  const [selectedMember, setSelectedMember] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shifts, setShifts] = useState({
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
  });

  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const days = weekDates.map((date, index) => ({
    key: dayKeys[index],
    date,
    label: date.toLocaleDateString("en-NZ", {
      weekday: "short",
      day: "numeric",
    }),
  }));

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

  function handleShiftChange(day, value) {
    setShifts({ ...shifts, [day]: Number(value) });
  }

  async function handleAssignShifts() {
    if (!selectedMember) {
      setResultMessage("Select a team member first.");
      return;
    }

    const totalShifts = days.reduce((total, day) => total + shifts[day.key], 0);
    if (totalShifts === 0) {
      setResultMessage("Select at least one shift.");
      return;
    }

    setIsSubmitting(true);
    setResultMessage("");

    try {
      for (const day of days) {
        for (let slotIndex = 0; slotIndex < shifts[day.key]; slotIndex += 1) {
          await createShift({
            user_id: Number(selectedMember),
            date: formatDate(day.date),
            shift_start: slotTimes[slotIndex].start,
            shift_end: slotTimes[slotIndex].end,
            slot_number: slotIndex + 1,
          });
        }
      }

      setResultMessage(`${totalShifts} shift(s) created successfully.`);
      await onShiftsCreated();
    } catch (error) {
      setResultMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const weekLabel = `${weekDates[0].toLocaleDateString("en-NZ")} – ${weekDates[6].toLocaleDateString("en-NZ")}`;

  return (
    <div className="modal fade" id="assignShiftModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Assign Shifts</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body text-start">
            <div className="mb-4 d-inline-block">
              <label className="form-label fw-bold">Week</label>
              <input type="text" className="form-control bg-light" value={weekLabel} readOnly />
            </div>

            <div className="mb-4 w-50">
              <label className="form-label fw-bold">Team Member</label>
              <select
                className="form-select"
                value={selectedMember}
                onChange={(event) => setSelectedMember(event.target.value)}
              >
                <option value="">Select team member...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Quick Allocate — Monday to Friday</label>
              <div className="d-flex gap-2 mb-2">
                {[1, 2, 3].map((number) => (
                  <button
                    key={number}
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setWeekdayShifts(number)}
                  >
                    {number} {number === 1 ? "Shift" : "Shifts"}
                  </button>
                ))}
              </div>
              <small className="text-muted">Slots run for two hours from 08:00, 10:00, 12:00, and 14:00.</small>
            </div>

            <div className="mb-2">
              <h6 className="fw-bold mb-3">Daily Shifts</h6>
              <div className="row g-2 flex-nowrap">
                {days.map((day) => (
                  <div className="col" key={day.key}>
                    <div className="border rounded p-3 text-center h-100">
                      <div className="fw-bold mb-2">{day.label}</div>
                      <select
                        className="form-select form-select-sm mx-auto"
                        style={{ width: "70px" }}
                        value={shifts[day.key]}
                        onChange={(event) => handleShiftChange(day.key, event.target.value)}
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {resultMessage && <span className="me-auto">{resultMessage}</span>}
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleAssignShifts} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Assign Shifts"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
