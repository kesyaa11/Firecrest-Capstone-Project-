import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../components/UpcomingLeaves";
import { useAuth } from "../auth/AuthContext";
import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import ShiftDetailsModal from "../components/ShiftDetailsModal";
import { getUsers } from "../api/users";
import { getProjects } from "../api/projects";
import { getShifts, patchShift } from "../api/shifts";
import { useState, useEffect } from "react";
import RecentProjects from "../components/RecentProjects";
import AssignSingleShiftModal from "../components/AssignSingleShiftModal";
import { getProjectSpecifications } from "../api/projectSpecifications";
import { getLeaveRequests } from "../api/leaveRequests";

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
    { start: "15:00", end: "17:00" },
  ];

  return shifts[slotNumber - 1];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get the user's initials for the profile avatar
  const userInitials = user?.name
    ?.split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .toUpperCase();

  // This state var stores projects list state
  const [projects, setProjects] = useState([]);

  // Set the dashboard title based on the user's role
  const title = ROLE_TITLES[user?.role] || "Dashboard";

  // This state var stores project spec state
  const [specifications, setSpecifications] = useState([]);

  // Calendar State Data
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Statevar to store collapsed users
  const [collapsedUsers, setCollapsedUsers] = useState({});

  // Store the user, slot and date selected for a new shift
  const [singleShiftUser, setSingleShiftUser] = useState(null);
  const [singleShiftDate, setSingleShiftDate] = useState(null);
  const [singleShiftSlot, setSingleShiftSlot] = useState(null);

  // Toggle the collapsed state for a user
  const toggleUser = (userId) => {
    setCollapsedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Load users, shifts, projects and specifications for the schedule
  async function loadScheduleData() {
    const loadedUsers = await getUsers();
    const loadedShifts = await getShifts();
    const loadedProjects = await getProjects();
    const loadedSpecifications = await getProjectSpecifications();
    const loadedLeaveRequests = await getLeaveRequests();

    setUsers(loadedUsers || []);
    setShifts(loadedShifts || []);
    setProjects(loadedProjects || []);
    setSpecifications(loadedSpecifications || []);
    setLeaveRequests(loadedLeaveRequests || []);
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
              + Assign Shifts
            </button>
            <AssignShiftModal
              users={users}
              weekDates={weekDates}
              existingShifts={shifts}
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
        <div
          className="card-body p-0 table-responsive"
          style={{
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          <table className="table table-striped table-hover mb-0 align-middle">
            <thead className="sticky-top bg-white">
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
                  <td
                    colSpan={collapsedUsers[u.id] ? 8 : 1}
                    onClick={() => toggleUser(u.id)}
                    style={{
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <span className="me-2" style={{ fontSize: "1.2rem" }}>
                      {collapsedUsers[u.id] ? "▸" : "▾"}
                    </span>
                    {u.name}
                  </td>
                  {!collapsedUsers[u.id] &&
                    weekDates.map((date) => {
                      const weekDate = formatDate(date);
                      const dailyShifts = shifts.filter(
                        (s) => s.user_id === u.id && s.date === weekDate,
                      );

                      const approvedLeave = leaveRequests.find((request) => {
                        return (
                          Number(request.user_id) === Number(u.id) &&
                          request.status === "Approved" &&
                          request.start_date <= weekDate &&
                          request.end_date >= weekDate
                        );
                      });

                      return (
                        <td
                          key={weekDate}
                          className="text-center p-2 align-top"
                          style={{ height: "72px" }}
                        >
                          {approvedLeave ? (
                            <div
                              className={
                                approvedLeave.leave_type === "Sick Leave"
                                  ? "bg-danger-subtle rounded"
                                  : "rounded"
                              }
                              style={{
                                width: "105px",
                                height: "324px",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                fontSize: "0.85rem",
                                fontWeight: "400",
                                color: "#4b4c4c",
                                backgroundColor:
                                  approvedLeave.leave_type === "Annual Leave"
                                    ? "#dee2e6"
                                    : undefined,
                                border:
                                  approvedLeave.leave_type === "Sick Leave"
                                    ? "1px solid #f1b8b8"
                                    : "1px solid #ced4da",
                              }}
                            >
                              {approvedLeave.leave_type}
                            </div>
                          ) : (
                            <div className="d-flex flex-column align-items-center gap-1">
                              {[1, 2, 3, 4].map((slotNumber) => {
                                const shift = dailyShifts.find(
                                  (existingShift) =>
                                    existingShift.slot_number === slotNumber,
                                );

                                const project = projects.find(
                                  (existingProject) =>
                                    existingProject.id === shift?.project_id,
                                );

                                // Find the specification linked to the shift
                                const specification = specifications.find(
                                  (existingSpecification) =>
                                    Number(existingSpecification.id) ===
                                    Number(shift?.specification_id),
                                );

                                return shift ? (
                                  <div
                                    draggable={user?.role === "manager"}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData(
                                        "shiftId",
                                        shift.id,
                                      );
                                    }}
                                    key={slotNumber}
                                    className={`shift-card ${
                                      slotNumber % 3 === 1
                                        ? "shift-card-blue"
                                        : slotNumber % 3 === 2
                                          ? "shift-card-green"
                                          : "shift-card-amber"
                                    }`}
                                    style={{
                                      width: "105px",
                                      height: "78px",
                                      cursor: "pointer",
                                      boxSizing: "border-box",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    title="Double-click to edit"
                                    onDoubleClick={() => {
                                      setSelectedShift(shift);
                                      setSelectedShiftUser(u);

                                      const modalEl =
                                        document.getElementById(
                                          "shiftDetailsModal",
                                        );

                                      const modal = new bootstrap.Modal(
                                        modalEl,
                                      );
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
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {project?.name
                                        ? project.name.length > 16
                                          ? `${project.name.slice(0, 16)}...`
                                          : project.name
                                        : "Project — TBD"}
                                      {specification?.version &&
                                        ` – ${specification.version}`}
                                    </div>
                                    <div
                                      className="text-muted"
                                      style={{
                                        fontSize: "0.65rem",
                                      }}
                                    >
                                      ({shift.work_type || "Work Type — TBD"})
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    key={slotNumber}
                                    className="add-shift-cell"
                                    style={{
                                      width: "105px",
                                      height: "78px",
                                      border: "1px dashed #d6d9dc",
                                      borderRadius: "6px",
                                      padding: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      boxSizing: "border-box",
                                      fontSize: "0.7rem",
                                    }}
                                    data-bs-toggle={
                                      user?.role === "manager"
                                        ? "modal"
                                        : undefined
                                    }
                                    data-bs-target={
                                      user?.role === "manager"
                                        ? "#assignSingleShiftModal"
                                        : undefined
                                    }
                                    onClick={() => {
                                      setSingleShiftUser(u);
                                      setSingleShiftDate(weekDate);
                                      setSingleShiftSlot(slotNumber);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                    }}
                                    onDrop={async (e) => {
                                      e.preventDefault();

                                      const shiftId = Number(
                                        e.dataTransfer.getData("shiftId"),
                                      );

                                      const draggedShift = shifts.find(
                                        (existingShift) =>
                                          existingShift.id === shiftId,
                                      );

                                      if (!draggedShift) return;

                                      const targetOccupied = dailyShifts.some(
                                        (existingShift) =>
                                          existingShift.slot_number ===
                                            slotNumber &&
                                          existingShift.id !== shiftId,
                                      );

                                      if (targetOccupied) {
                                        alert("That slot is already occupied.");
                                        return;
                                      }

                                      try {
                                        const times = getShiftTimes(slotNumber);

                                        await patchShift(shiftId, {
                                          date: weekDate,
                                          slot_number: slotNumber,
                                          shift_start: `${times.start}:00`,
                                          shift_end: `${times.end}:00`,
                                        });

                                        const updatedShifts = await getShifts();
                                        setShifts(updatedShifts);
                                      } catch (err) {
                                        alert("Unable to move shift.");
                                      }
                                    }}
                                  >
                                    {user?.role === "manager" && (
                                      <span
                                        style={{
                                          color: "#adb5bd",
                                          fontSize: "0.7rem",
                                          opacity: 0,
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.opacity = 1;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = 0;
                                        }}
                                      >
                                        + Add shift
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
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
        slot={singleShiftSlot}
        shifts={shifts}
        onShiftCreated={loadScheduleData}
      />
    </div>
  );
}
