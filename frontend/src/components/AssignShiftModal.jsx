import { useState } from "react";
import { createShift } from "../api/shifts";

export default function AssignShiftModal({ users = [], weekDates = [], onShiftsCreated }) {
  const [selectedMember, setSelectedMember] = useState("");

  const [shifts, setShifts] = useState({
    mon: 2,
    tue: 2,
    wed: 2,
    thu: 2,
    fri: 2,
    sat: 0,
    sun: 0,
  });

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
    setShifts({
      ...shifts,
      [day]: Number(value),
    });
  }

  const days = weekDates && weekDates.length === 7
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

  async function handleAssignShifts() {
    if (!selectedMember) return;

    try {
      const promises = [];
      days.forEach((day) => {
        const count = shifts[day.key];
        if (day.dateObj && count > 0) {
          const dateStr = day.dateObj.toISOString().split("T")[0];
          
          for (let i = 0; i < count; i++) {
            promises.push(
              createShift({
                user_id: Number(selectedMember),
                date: dateStr,
                duration: 2, // Satisfies the backend 2-hour shift rule
                shift_start: null,
                shift_end: null, // Left blank for client configuration
                shiftsCount: count,
                slot_number: i + 1,
              })
            );
          }
        }
      });

      await Promise.all(promises);
      if (onShiftsCreated) await onShiftsCreated();
    } catch (err) {
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
                        onChange={(e) => handleShiftChange(day.key, e.target.value)}
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