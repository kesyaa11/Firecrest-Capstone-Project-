import BackToDashboard from "../components/BackToDashboard";
import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import ShiftDetailsModal from "../components/ShiftDetailsModal";
import RecordLeaveModal from "../components/RecordLeaveModal";

import { getUsers } from "../api/users";
import { getShifts } from "../api/shifts";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Schedule() {
  console.log("SCHEDULE RENDERING");

  // These state vars will be used to take in users / shifts data from API endpiont
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState(null);

  async function loadScheduleData() {
    const loadedUsers = await getUsers();
    const loadedShifts = await getShifts();
    setUsers(loadedUsers || []);
    setShifts(loadedShifts || []);
  }

  useEffect(() => {
    Promise.all([getUsers(), getShifts()]).then(
      ([loadedUsers, loadedShifts]) => {
        setUsers(loadedUsers || []);
        setShifts(loadedShifts || []);
      },
    );
  }, []);

  // creates a state var then assigns current date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // assign currentdate to weekstart which will be determined next
  const weekStart = new Date(selectedDate);

  // set date of weekstart by getting its date minus days passed since Monday
  // which is calc'd by weekstart getDay which returns a number + 6 and result mod by 7
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  // create an array with length 7 which will represent days of the week
  // i is the number that mathematically determines the day of the week
  // ie Monday = 0, Tuesday = 1 ... Sunday = 6
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    // so everytime it loops around it creates a date from the calc'd weekStart as above
    // then it starts from there plus i up until all 7 array items have been added
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  function openShiftDetails(shift, shiftUser) {
    setSelectedShift(shift);
    setSelectedShiftUser(shiftUser);
    const modalEl = document.getElementById("shiftDetailsModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>Schedule</h2>
        </div>

        {user?.role === "manager" && (
          <div className="col text-end">
            <div className="dropdown d-inline-block">
              <button
                className="btn btn-success dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                + Add
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#assignShiftModal"
                  >
                    Assign Shift
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#recordLeaveModal"
                  >
                    Record Leave
                  </button>
                </li>
              </ul>
            </div>

            <AssignShiftModal
              users={users}
              weekDates={weekDates}
              onShiftsCreated={loadScheduleData}
            />

            <RecordLeaveModal
              users={users}
              managerId={user.id}
              onCreated={loadScheduleData}
            />
          </div>
        )}
      </div>

      <WeekSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Team Member</th>
                {weekDates.map((date) => (
                  <th key={date.toISOString()}>
                    {date.getDate()}{" "}
                    {date.toLocaleDateString("en-NZ", {
                      weekday: "short",
                    })}{" "}
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
                      (shift) =>
                        shift.user_id === u.id && shift.date === weekDate,
                    );

                    return (
                      <td key={weekDate}>
                        {dailyShifts.length > 0
                          ? dailyShifts.map((shift) => (
                              <span
                                key={shift.id}
                                className="badge bg-primary me-1 mb-1"
                                role="button"
                                onClick={() => openShiftDetails(shift, u)}
                              >
                                {shift.work_type || "Shift"}
                              </span>
                            ))
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftDetailsModal
        shift={selectedShift}
        user={selectedShiftUser}
        role={user?.role}
        onUpdated={loadScheduleData}
      />
    </div>
  );
}
