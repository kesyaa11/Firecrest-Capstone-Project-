import BackToDashboard from "../components/BackToDashboard";
import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import { getUsers } from "../api/users";
import { getShifts } from "../api/shifts";
import { useState, useEffect } from "react";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Schedule() {
  // These state vars will be used to take in users / shifts data from API endpiont
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  async function loadScheduleData() {
    const loadedUsers = await getUsers();
    const loadedShifts = await getShifts();

    setUsers(loadedUsers || []);
    setShifts(loadedShifts || []);
  }

  useEffect(() => {
    Promise.all([getUsers(), getShifts()]).then(([loadedUsers, loadedShifts]) => {
      setUsers(loadedUsers || []);
      setShifts(loadedShifts || []);
    });
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

  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>Schedule</h2>
        </div>

        <div className="col text-end">
          <button
            className="btn btn-success"
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
                {weekDates.map((date) => {
                  return (
                    <th key={date.toISOString()}>
                      {date.getDate()}{" "}
                      {date.toLocaleDateString("en-NZ", {
                        weekday: "short",
                      })}{" "}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {
                // map out each user then print its name on a data cell
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>

                    {
                      // map out each date of the week
                      weekDates.map((date) => {
                        // turn date into a comparable date to shift.date
                        const weekDate = formatDate(date);

                        // Count every shift for this user and date.
                        const dailyShifts = shifts.filter((shift) => {
                          return (
                            shift.user_id === user.id && shift.date === weekDate
                          );
                        });

                        return (
                          <td key={weekDate}>
                            {dailyShifts.length > 0
                              ? `${dailyShifts.length} ${
                                  dailyShifts.length === 1 ? "shift" : "shifts"
                                }`
                              : "—"}
                          </td>
                        );
                      })
                    }
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
