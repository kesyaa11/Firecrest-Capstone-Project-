import { useState } from "react";

export default function AssignShiftModal() {
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

  const days = [
    { key: "mon", label: "Mon 7", working: true },
    { key: "tue", label: "Tue 8", working: true },
    { key: "wed", label: "Wed 9", working: true },
    { key: "thu", label: "Thu 10", working: true },
    { key: "fri", label: "Fri 11", working: true },
    { key: "sat", label: "Sat 12", working: false },
    { key: "sun", label: "Sun 13", working: false },
  ];

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
                value="7 Sep 2026 – 13 Sep 2026"
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
                <option value="Benjamin">Benjamin</option>
                <option value="Sarah">Sarah</option>
                <option value="Richard">Richard</option>
                <option value="Carmen SanDiego">Carmen SanDiego</option>
                <option value="Keziah">Keziah</option>
                <option value="Karlo Magno Guadalupe">
                  Karlo Magno Guadalupe
                </option>
                <option value="Jordan">Jordan</option>
                <option value="William">William</option>
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

                      <select
                        className="form-select form-select-sm mx-auto"
                        style={{ width: "70px" }}
                        value={shifts[day.key]}
                        onChange={(e) =>
                          handleShiftChange(day.key, e.target.value)
                        }
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
              data-bs-dismiss="modal"
            >
              Assign Shifts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
