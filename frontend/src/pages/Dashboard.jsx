import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../components/UpcomingLeaves";
import { useAuth } from "../auth/AuthContext";
import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import ShiftDetailsModal from "../components/ShiftDetailsModal";
import { getUsers } from "../api/users";
import { getShifts } from "../api/shifts";
import { useState, useEffect } from "react";

//role-specific navigation links
const ROLE_LINKS = {
  manager: [
    { label: "Users", path: "/users" },
    { label: "Payroll", path: "/payroll" },
    { label: "Projects", path: "/handoff" },
  ],
  admin: [{ label: "Users", path: "/users" }],
  sd: [{ label: "Projects", path: "/handoff" }],
  developer: [{ label: "Projects", path: "/handoff" }],
};

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const links = ROLE_LINKS[user?.role] || [];
  const title = ROLE_TITLES[user?.role] || "Dashboard";

  // Calendar State Data
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="row align-items-center mb-3">
        <div className="col">
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

      {/* Top Quick Navigation Buttons */}
      <div className="row mb-4">
        {links.map((link) => (
          <div className="col" key={link.path}>
            <button
              className="btn btn-outline-primary w-100"
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          </div>
        ))}
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
                  <th key={date.toISOString()} className="text-center">
                    {date.getDate()}{" "}
                    {date.toLocaleDateString("en-NZ", { weekday: "short" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="fw-bold">{u.name}</td>
                  {weekDates.map((date) => {
                    const weekDate = formatDate(date);
                    const dailyShifts = shifts.filter(
                      (s) => s.user_id === u.id && s.date === weekDate,
                    );
                    return (
                      <td key={weekDate} className="text-center align-top p-2">
                        {dailyShifts.length > 0 ? (
                          /* Stackable flexbox container for daily shifts */
                          <div className="d-flex flex-column gap-1 align-items-center">
                            {dailyShifts.map((shift, index) => (
                              <span
                                key={shift.id}
                                className="badge bg-primary w-100 py-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => openShiftDetails(shift, u)}
                                title={`${shift.work_type || "Shift"}: ${shift.shift_start || ""} - ${shift.shift_end || ""}`}
                              >
                                Shift #{index + 1}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
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
        {/* Clickable Recent Projects Block */}
        {(user?.role === "manager" ||
          user?.role === "sd" ||
          user?.role === "developer") && (
          <div className={user?.role === "admin" ? "col-12" : "col-md-6"}>
            <div
              className="card h-100 shadow-sm border-0 bg-light cursor-pointer hover-card"
              onClick={() => navigate("/handoff")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Recent Projects</h5>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/handoff");
                    }}
                  >
                    View Projects →
                  </button>
                </div>
                <p className="small text-muted mb-3">
                  Click to manage handoffs and project details
                </p>
                <div className="border rounded bg-white p-2">
                  <div className="py-2 border-bottom">
                    Project Phoenix - Testing
                  </div>
                  <div className="py-2 border-bottom">
                    Customer Portal Upgrade - Handoff Pending
                  </div>
                  <div className="py-2">Network Automation - Development</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clickable Upcoming Leaves Block */}
        {(user?.role === "manager" || user?.role === "admin") && (
          <div className={user?.role === "admin" ? "col-12" : "col-md-6"}>
            <div
              className="card h-100 shadow-sm border-0 bg-light cursor-pointer hover-card"
              onClick={() => navigate("/payroll")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Upcoming Leaves</h5>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/payroll");
                    }}
                  >
                    View Payroll →
                  </button>
                </div>
                <p className="small text-muted mb-1">
                  Click to view leave balances and payroll details
                </p>
                <UpcomingLeaves />
              </div>
            </div>
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
    </div>
  );
}
