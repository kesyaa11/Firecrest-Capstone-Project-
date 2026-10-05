import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect } from "react";

import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import AssignSingleShiftModal from "../components/AssignSingleShiftModal";
import ShiftDetailsModal from "../components/ShiftDetailsModal";
import BulkEditShiftModal from "../components/BulkEditShiftModal";
import TransferShiftsModal from "../components/TransferShiftsModal";

import TeamOverview from "../components/TeamOverview";
import ProjectAllocation from "../components/ProjectAllocation";

import { getUsers } from "../api/users";
import { getProjects } from "../api/projects";
import { getProjectSpecifications } from "../api/projectSpecifications";
import { getLeaveRequests } from "../api/leaveRequests";
import { getShifts, patchShift, deleteShift } from "../api/shifts";

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

  // Store shifts selected for bulk operations
  const [selectedShifts, setSelectedShifts] = useState([]);

  // Store bulk edit modal state
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Store bulk transfer modal state
  const [showTransfer, setShowTransfer] = useState(false);

  // Statevar to store currently selected team member for weekly schedule
  const [selectedScheduleUser, setSelectedScheduleUser] = useState(null);

  // Store the user, slot and date selected for a new shift
  const [singleShiftUser, setSingleShiftUser] = useState(null);
  const [singleShiftDate, setSingleShiftDate] = useState(null);
  const [singleShiftSlot, setSingleShiftSlot] = useState(null);

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

  // Handle Bulk delete
  const handleBulkDelete = async () => {
    for (const shiftId of selectedShifts) {
      await deleteShift(shiftId);
    }

    setSelectedShifts([]);
    await loadScheduleData();
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  // Automatically select the first team member when users are loaded
  useEffect(() => {
    if (users.length > 0 && !selectedScheduleUser) {
      setSelectedScheduleUser(users[0]);
    }
  }, [users, selectedScheduleUser]);

  // Calculate Monday-Sunday date range
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Team Overview calculations
  const onLeave = users.filter((u) =>
    leaveRequests.some(
      (leave) =>
        Number(leave.user_id) === Number(u.id) && leave.status === "Approved",
    ),
  ).length;

  const onShift = users.filter((u) =>
    shifts.some(
      (shift) =>
        Number(shift.user_id) === Number(u.id) &&
        weekDates.some((date) => formatDate(date) === shift.date),
    ),
  ).length;

  const available = users.length - onLeave - onShift;

  const unassigned = 0;

  // Project Allocation
  const projectAllocation = projects
    .map((project) => {
      const assignedUsers = shifts
        .filter(
          (shift) =>
            Number(shift.project_id) === Number(project.id) &&
            weekDates.some((date) => formatDate(date) === shift.date),
        )
        .map((shift) =>
          users.find((user) => Number(user.id) === Number(shift.user_id)),
        )
        .filter(Boolean);

      // Remove duplicate team members
      const uniqueMembers = Array.from(
        new Map(assignedUsers.map((member) => [member.id, member])).values(),
      );

      return {
        id: project.id,
        name: project.name,

        members: uniqueMembers.map((member) => ({
          id: member.id,
          name: member.name,
          initials: member.name
            ?.split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase(),
        })),

        status: project.status || "—",
        stage: project.stage || "—",
      };
    })
    .filter((project) => project.members.length > 0);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="row align-items-center mb-4 pt-3">
        <div className="col text-start">
          <h1 className="dashboard-title">{title}</h1>
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
          <button type="button" className="btn btn-outline-secondary btn-sm">
            Switch to Monthly View
          </button>
          <WeekSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
        <div
          className="card-body p-0"
          style={{
            position: "relative",
          }}
        >
          <div
            className="table-responsive"
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
                <tr>
                  {/* Scrollable team member selector */}
                  <td
                    style={{
                      width: "18%",
                      minWidth: "180px",
                      verticalAlign: "top",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}
                    >
                      {users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedScheduleUser(u)}
                          style={{
                            padding: "16px",
                            cursor: "pointer",
                            fontWeight:
                              selectedScheduleUser?.id === u.id ? "600" : "500",
                            backgroundColor:
                              selectedScheduleUser?.id === u.id
                                ? "#e9ecef"
                                : "transparent",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          {u.name}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Selected team member's weekly schedule */}
                  {selectedScheduleUser &&
                    weekDates.map((date) => {
                      const weekDate = formatDate(date);

                      const dailyShifts = shifts.filter(
                        (s) =>
                          Number(s.user_id) ===
                            Number(selectedScheduleUser.id) &&
                          s.date === weekDate,
                      );

                      const approvedLeave = leaveRequests.find((request) => {
                        return (
                          Number(request.user_id) ===
                            Number(selectedScheduleUser.id) &&
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
                                    Number(existingProject.id) ===
                                    Number(shift?.project_id),
                                );

                                const specification = specifications.find(
                                  (existingSpecification) =>
                                    Number(existingSpecification.id) ===
                                    Number(shift?.specification_id),
                                );

                                return shift ? (
                                  <div
                                    key={slotNumber}
                                    draggable={user?.role === "manager"}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData(
                                        "shiftId",
                                        shift.id,
                                      );
                                    }}
                                    onClick={(e) => {
                                      if (e.ctrlKey || e.metaKey) {
                                        setSelectedShifts((prev) =>
                                          prev.includes(shift.id)
                                            ? prev.filter(
                                                (id) => id !== shift.id,
                                              )
                                            : [...prev, shift.id],
                                        );
                                      } else {
                                        setSelectedShifts((prev) =>
                                          prev.includes(shift.id)
                                            ? []
                                            : [shift.id],
                                        );
                                      }
                                    }}
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
                                      boxShadow: selectedShifts.includes(
                                        shift.id,
                                      )
                                        ? "0 0 0 3px rgba(33, 37, 41, 0.55)"
                                        : "none",
                                    }}
                                    title="Double-click to edit"
                                    onDoubleClick={() => {
                                      setSelectedShift(shift);
                                      setSelectedShiftUser(
                                        selectedScheduleUser,
                                      );

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
                                      setSingleShiftUser(selectedScheduleUser);
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

                                      try {
                                        const times = getShiftTimes(slotNumber);

                                        await patchShift(shiftId, {
                                          user_id: selectedScheduleUser.id,
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
              </tbody>
            </table>
          </div>

          {selectedShifts.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm me-2"
                title="Edit selected shifts"
                onClick={() => setShowBulkEdit(true)}
              >
                ✏️ Bulk Edit
              </button>

              <button
                type="button"
                className="btn btn-outline-success btn-sm me-2"
                title="Transfer selected shifts"
                onClick={() => setShowTransfer(true)}
              >
                ⇄ Transfer
              </button>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                title="Delete selected shifts"
                onClick={() => {
                  const confirmed = window.confirm(
                    `Delete ${selectedShifts.length} selected shift${
                      selectedShifts.length === 1 ? "" : "s"
                    }?`,
                  );

                  if (confirmed) {
                    handleBulkDelete();
                  }
                }}
              >
                🗑️ Delete Selected
              </button>
            </>
          )}
        </div>
      </div>

      {/* Team Overview and Project Allocation */}
      <div className="row g-3 mt-1">
        <div className="col-lg-6">
          <TeamOverview
            onShift={onShift}
            available={available}
            onLeave={onLeave}
            unassigned={unassigned}
          />
        </div>

        <div className="col-lg-6">
          <ProjectAllocation data={projectAllocation} />
        </div>
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
      {/* Bulk Edit Shifts Modal */}
      {showBulkEdit && (
        <BulkEditShiftModal
          selectedShifts={selectedShifts}
          shifts={shifts}
          users={users}
          onUpdated={loadScheduleData}
          onClose={() => setShowBulkEdit(false)}
        />
      )}
      {/* Transfer Shifts Modal */}
      {showTransfer && (
        <TransferShiftsModal
          selectedShifts={selectedShifts}
          shifts={shifts}
          users={users}
          onUpdated={loadScheduleData}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
