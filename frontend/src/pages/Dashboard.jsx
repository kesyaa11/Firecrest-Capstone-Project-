import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../components/UpcomingLeaves";
import { useAuth } from "../auth/AuthContext";
import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import ShiftDetailsModal from "../components/ShiftDetailsModal";
import { getUsers } from "../api/users";
import { getShifts, createShift, deleteShift } from "../api/shifts";
import { useState, useEffect, useRef } from "react";
import RecentProjects from "../components/RecentProjects";
import AssignSingleShiftModal from "../components/AssignSingleShiftModal";

const ROLE_TITLES = {
  manager: "Manager Dashboard",
  admin: "Admin Dashboard",
  sd: "SD Dashboard",
  developer: "Developer Dashboard",
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getShiftTimes(slotNumber) {
  const shifts = [
    { start: "08:00", end: "10:00" },
    { start: "10:30", end: "12:30" },
    { start: "12:45", end: "14:45" },
  ];

  return shifts[slotNumber - 1];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const title = ROLE_TITLES[user?.role] || "Dashboard";

  // Calendar State Data
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Store the user and date selected for a new shift
  const [singleShiftUser, setSingleShiftUser] = useState(null);
  const [singleShiftDate, setSingleShiftDate] = useState(null);

  // Store the user and date currently being edited
  const [editingCell, setEditingCell] = useState(null);
  // Reference the shift count input while editing
  const shiftCountInputRef = useRef(null);
  // Store the number of shifts being edited
  const [editCount, setEditCount] = useState(1);

  async function loadScheduleData() {
    const loadedUsers = await getUsers();
    const loadedShifts = await getShifts();
    setUsers(loadedUsers || []);
    setShifts(loadedShifts || []);
  }

  useEffect(() => {
    loadScheduleData();
  }, []);

  // Calculate Monday-Sunday date range
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  function openShiftDetails(shift, shiftUser) {
    setSelectedShift(shift);
    setSelectedShiftUser(shiftUser);
    const modalEl = document.getElementById("shiftDetailsModal");
    if (modalEl) {
      const modal = window.bootstrap?.Modal.getOrCreateInstance(modalEl);
      modal?.show();
    }
  }

  // Automatically focus and highlight the shift count when editing starts for single shift
  useEffect(() => {
    if (editingCell && shiftCountInputRef.current) {
      shiftCountInputRef.current.focus();
      shiftCountInputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="row align-items-center mb-3">
        <div className="col text-start">
          <h1>{title}</h1>
          <p className="text-muted mb-0">Welcome, {user?.name}</p>
        </div>
        {user?.role === "manager" && (
          <div className="col text-end">
            <button
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#assignShiftModal"
            >
              + Assign Shift
            </button>
            <AssignShiftModal
              users={users}
              weekDates={weekDates}
              onShiftsCreated={loadScheduleData}
            />
          </div>
        )}
      </div>

      {/* Embedded Weekly Schedule Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Weekly Schedule</h5>
          <WeekSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
        <div className="card-body p-0 table-responsive">
          <table className="table table-striped table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Team Member</th>
                {weekDates.map((date) => (
                  <th
                    key={date.toISOString()}
                    className="text-center"
                    style={{ width: "11.7%" }}
                  >
                    {date.getDate()}{" "}
                    {date.toLocaleDateString("en-NZ", { weekday: "short" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  {weekDates.map((date) => {
                    const weekDate = formatDate(date);
                    const dailyShifts = shifts.filter(
                      (s) => s.user_id === u.id && s.date === weekDate,
                    );
                    return (
                      <td
                        key={weekDate}
                        className="text-center p-2 align-top"
                        style={{ height: "72px" }}
                      >
                        {editingCell?.userId === u.id &&
                        editingCell?.date === weekDate ? (
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <input
                              ref={shiftCountInputRef}
                              type="number"
                              className="form-control form-control-sm text-center"
                              style={{ width: "55px" }}
                              min="0"
                              max="12"
                              value={editCount}
                              onClick={(e) => e.target.select()}
                              onChange={(e) => {
                                const value = e.target.value;

                                if (value === "") {
                                  setEditCount("");
                                  return;
                                }

                                const number = Number(value);

                                if (number >= 0 && number <= 12) {
                                  setEditCount(number);
                                }
                              }}
                            />

                            <button
                              type="button"
                              className="btn btn-sm btn-link text-success p-1 fs-5"
                              title="Save"
                              onClick={async () => {
                                const currentShifts = shifts.filter(
                                  (shift) =>
                                    shift.user_id === u.id &&
                                    shift.date === weekDate,
                                );

                                const currentCount = currentShifts.length;

                                try {
                                  // Add shifts when the requested count is higher
                                  if (editCount > currentCount) {
                                    for (
                                      let i = currentCount;
                                      i < editCount;
                                      i++
                                    ) {
                                      const times = getShiftTimes(i + 1);

                                      await createShift({
                                        user_id: Number(u.id),
                                        date: weekDate,
                                        duration: 2,
                                        shift_start: times.start,
                                        shift_end: times.end,
                                        slot_number: i + 1,
                                      });
                                    }
                                  }

                                  // Delete shifts when the requested count is lower
                                  if (editCount < currentCount) {
                                    const shiftsToDelete =
                                      currentShifts.slice(editCount);

                                    for (const shift of shiftsToDelete) {
                                      await deleteShift(shift.id);
                                    }
                                  }

                                  // Refresh the dashboard after saving
                                  await loadScheduleData();

                                  // Exit editing mode
                                  setEditingCell(null);
                                } catch (err) {
                                  console.error("Error saving shifts:", err);
                                }
                              }}
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-1 fs-5"
                              title="Cancel"
                              onClick={() => setEditingCell(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : dailyShifts.length > 0 ? (
                          <div className="d-flex flex-column align-items-center gap-1">
                            {dailyShifts
                              .slice()
                              .sort((a, b) => a.slot_number - b.slot_number)
                              .map((shift, index) => (
                                <div
                                  key={shift.id}
                                  className={`shift-card ${
                                    index % 3 === 0
                                      ? "shift-card-blue"
                                      : index % 3 === 1
                                        ? "shift-card-green"
                                        : "shift-card-amber"
                                  }`}
                                  style={{ cursor: "pointer" }}
                                  title="Double-click to edit"
                                  onDoubleClick={() => {
                                    setSelectedShift(shift);
                                    setSelectedShiftUser(u);

                                    const modalEl =
                                      document.getElementById(
                                        "shiftDetailsModal",
                                      );
                                    const modal = new bootstrap.Modal(modalEl);
                                    modal.show();
                                  }}
                                >
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {shift.shift_start?.slice(0, 5)}–
                                    {shift.shift_end?.slice(0, 5)}
                                  </div>

                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    Project — TBD
                                  </div>
                                </div>
                              ))}

                            {/* Add another shift */}
                            <div
                              className="add-shift-cell"
                              onClick={async () => {
                                const nextSlot = dailyShifts.length + 1;
                                const times = getShiftTimes(nextSlot);

                                if (!times) {
                                  alert("No more shift slots available.");
                                  return;
                                }

                                try {
                                  await createShift({
                                    user_id: Number(u.id),
                                    date: weekDate,
                                    duration: 2,
                                    shift_start: times.start,
                                    shift_end: times.end,
                                    slot_number: nextSlot,
                                  });

                                  await loadScheduleData();
                                } catch (err) {
                                  console.error("Error adding shift:", err);
                                  alert(err.message);
                                }
                              }}
                            >
                              <span>+ Add shift</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="add-shift-cell"
                            onClick={async () => {
                              const nextSlot = dailyShifts.length + 1;
                              const times = getShiftTimes(nextSlot);

                              if (!times) {
                                alert("No more shift slots available.");
                                return;
                              }

                              try {
                                await createShift({
                                  user_id: Number(u.id),
                                  date: weekDate,
                                  duration: 2,
                                  shift_start: times.start,
                                  shift_end: times.end,
                                  slot_number: nextSlot,
                                });

                                await loadScheduleData();
                              } catch (err) {
                                console.error("Error adding shift:", err);
                                alert(err.message);
                              }
                            }}
                          >
                            <span>+ Add shift</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Interactive Content Cards */}
      <div className="row g-4">
        {/* Recent Projects */}
        {(user?.role === "manager" ||
          user?.role === "sd" ||
          user?.role === "developer") && (
          <div className="col-md-6">
            <RecentProjects />
          </div>
        )}

        {/* Upcoming Leaves */}
        {(user?.role === "manager" || user?.role === "admin") && (
          <div className={user?.role === "admin" ? "col-12" : "col-md-6"}>
            <UpcomingLeaves />
          </div>
        )}
      </div>

      {/* Shift Details Modal */}
      <ShiftDetailsModal
        shift={selectedShift}
        user={selectedShiftUser}
        role={user?.role}
        onUpdated={loadScheduleData}
      />
      {/* Assign Single Shift Modal */}
      <AssignSingleShiftModal
        user={singleShiftUser}
        date={singleShiftDate}
        shifts={shifts}
        onShiftCreated={loadScheduleData}
      />
    </div>
  );
}
