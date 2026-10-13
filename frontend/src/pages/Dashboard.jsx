import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect } from "react";

import WeekSelector from "../components/WeekSelector";
import AssignShiftModal from "../components/AssignShiftModal";
import AssignSingleShiftModal from "../components/AssignSingleShiftModal";
import RecordLeaveModal from "../components/RecordLeaveModal";
import ShiftDetailsModal from "../components/ShiftDetailsModal";
import BulkEditShiftModal from "../components/BulkEditShiftModal";
import BulkEditLeaveModal from "../components/BulkEditLeaveModal";
import EditLeaveModal from "../components/EditLeaveModal";

import TeamOverview from "../components/TeamOverview";
import ProjectAllocation from "../components/ProjectAllocation";
import ProjectAllocationModal from "../components/ProjectAllocationModal";
import ProjectDetailsModal from "../components/ProjectDetailsModal";

import { getUsers } from "../api/users";
import { getProjects } from "../api/projects";
import { getProjectSpecifications } from "../api/projectSpecifications";
import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  patchLeaveRequest,
  deleteLeaveRequest,
} from "../api/leaveRequests";
import { getShifts, patchShift, deleteShift } from "../api/shifts";
import { getPublicHolidays } from "../api/publicHolidays";

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

export default function Dashboard({ onLeaveChanged }) {
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

  // State var for project allocation
  const [showProjectAllocationModal, setShowProjectAllocationModal] =
    useState(false);

  // State var to store the project currently selected for detailed viewing.
  const [selectedProject, setSelectedProject] = useState(null);

  // Calendar State Data
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Statevar to store shifts, leave edit target, public holidays and leaves selected for bulk operations
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [selectedLeaveDays, setSelectedLeaveDays] = useState([]);
  const [leaveEditTarget, setLeaveEditTarget] = useState(null);
  const [publicHolidays, setPublicHolidays] = useState([]);

  // Statevar to track bulk edit modal state
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Statevar to track whether the bulk leave editor is open.
  const [showBulkEditLeave, setShowBulkEditLeave] = useState(false);

  // Statevar to store currently selected team member for weekly schedule
  const [selectedScheduleUser, setSelectedScheduleUser] = useState(null);

  // Statevar to track the user, slot and date selected for a new shift
  const [singleShiftUser, setSingleShiftUser] = useState(null);
  const [singleShiftDate, setSingleShiftDate] = useState(null);
  const [singleShiftSlot, setSingleShiftSlot] = useState(null);

  // Load users, shifts, public holidays, projects and specifications for the schedule
  async function loadScheduleData() {
    const loadedUsers = await getUsers();
    const loadedShifts = await getShifts();
    const loadedProjects = await getProjects();
    const loadedSpecifications = await getProjectSpecifications();
    const loadedLeaveRequests = await getLeaveRequests();

    // GET all public holidays
    const publicHolidaysData = await getPublicHolidays();

    setUsers(loadedUsers || []);
    setShifts(loadedShifts || []);
    setProjects(loadedProjects || []);
    console.log("Holiday API response:", publicHolidaysData);

    // Check which countries have public holidays
    console.log("Holiday countries:", [
      ...new Set((publicHolidaysData ?? []).map((h) => h.country)),
    ]);

    // Check which countries employees belong to
    console.log("Employee countries:", [
      ...new Set((loadedUsers ?? []).map((u) => u.country)),
    ]);

    setPublicHolidays(publicHolidaysData ?? []);
    setSpecifications(loadedSpecifications || []);
    setLeaveRequests(loadedLeaveRequests || []);
  }

  // Move one approved annual leave day to another free day.
  const handleLeaveDayDrop = async (e, targetDate) => {
    e.preventDefault();

    if (user?.role !== "manager") return;

    const requestId = Number(e.dataTransfer.getData("leaveRequestId"));
    const sourceDate = e.dataTransfer.getData("leaveDate");

    if (!requestId || !sourceDate || sourceDate === targetDate) return;

    const request = leaveRequests.find(
      (leave) =>
        Number(leave.id) === requestId &&
        Number(leave.user_id) === Number(selectedScheduleUser?.id) &&
        leave.status === "Approved" &&
        leave.leave_type === "Annual Leave" &&
        leave.start_date <= sourceDate &&
        leave.end_date >= sourceDate,
    );

    if (!request) {
      alert("Unable to find the annual-leave day.");
      return;
    }

    // Reject destinations containing shifts.
    const hasShift = shifts.some(
      (shift) =>
        Number(shift.user_id) === Number(selectedScheduleUser.id) &&
        shift.date === targetDate,
    );

    // Reject destinations containing approved leave.
    const hasLeave = leaveRequests.some(
      (leave) =>
        Number(leave.user_id) === Number(selectedScheduleUser.id) &&
        leave.status === "Approved" &&
        leave.start_date <= targetDate &&
        leave.end_date >= targetDate,
    );

    if (hasShift || hasLeave) {
      alert("Choose a day with no shifts or approved leave.");
      return;
    }

    try {
      // Remove only the dragged date from the original request.
      const remainingDates = [];
      const current = new Date(`${request.start_date}T12:00:00`);
      const end = new Date(`${request.end_date}T12:00:00`);

      while (current <= end) {
        const date = formatDate(current);

        if (date !== sourceDate) {
          remainingDates.push(date);
        }

        current.setDate(current.getDate() + 1);
      }

      // Split the remaining dates into consecutive ranges.
      const ranges = [];

      for (const date of remainingDates) {
        const lastRange = ranges[ranges.length - 1];

        if (!lastRange) {
          ranges.push({ start: date, end: date });
          continue;
        }

        const nextDate = new Date(`${lastRange.end}T12:00:00`);
        nextDate.setDate(nextDate.getDate() + 1);

        if (formatDate(nextDate) === date) {
          lastRange.end = date;
        } else {
          ranges.push({ start: date, end: date });
        }
      }

      // Update the original request or delete it if no days remain.
      if (ranges.length === 0) {
        await deleteLeaveRequest(request.id);
      } else {
        const [firstRange, ...additionalRanges] = ranges;

        await updateLeaveRequest(request.id, {
          ...request,
          start_date: firstRange.start,
          end_date: firstRange.end,
        });

        for (const range of additionalRanges) {
          await createLeaveRequest({
            ...request,
            id: undefined,
            start_date: range.start,
            end_date: range.end,
            status: "Approved",
          });
        }
      }

      // Create the moved day as a separate approved request.
      await createLeaveRequest({
        ...request,
        id: undefined,
        start_date: targetDate,
        end_date: targetDate,
        status: "Approved",
      });

      setSelectedLeaveDays([]);
      await loadScheduleData();
      onLeaveChanged?.();
    } catch (err) {
      console.error("Unable to move annual leave:", err);
      alert(
        "Unable to move annual leave. Please refresh and check the schedule.",
      );
      await loadScheduleData();
    }
  };

  // Handle Bulk delete for multiple selected shifts / leaves

  const handleBulkDelete = async () => {
    try {
      // Delete selected shifts.
      for (const shiftId of selectedShifts) {
        await deleteShift(shiftId);
      }

      // Group selected leave days by their original request.
      const leaveGroups = selectedLeaveDays.reduce((groups, day) => {
        const key = day.requestId;

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(day.date);
        return groups;
      }, {});

      // Process leave requests separately.
      for (const [requestId, datesToRemove] of Object.entries(leaveGroups)) {
        const request = leaveRequests.find(
          (leave) => Number(leave.id) === Number(requestId),
        );

        if (!request) continue;

        const removedDates = new Set(datesToRemove);
        const remainingDates = [];

        const current = new Date(`${request.start_date}T12:00:00`);
        const end = new Date(`${request.end_date}T12:00:00`);

        while (current <= end) {
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, "0");
          const day = String(current.getDate()).padStart(2, "0");
          const date = `${year}-${month}-${day}`;

          if (!removedDates.has(date)) {
            remainingDates.push(date);
          }

          current.setDate(current.getDate() + 1);
        }

        if (remainingDates.length === 0) {
          await deleteLeaveRequest(request.id);
          continue;
        }

        // Divide the remaining dates into consecutive ranges.
        const ranges = [];

        for (const date of remainingDates) {
          const lastRange = ranges[ranges.length - 1];

          if (!lastRange) {
            ranges.push({ start: date, end: date });
            continue;
          }

          const nextDate = new Date(`${lastRange.end}T12:00:00`);
          nextDate.setDate(nextDate.getDate() + 1);

          const nextYear = nextDate.getFullYear();
          const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
          const nextDay = String(nextDate.getDate()).padStart(2, "0");
          const expectedDate = `${nextYear}-${nextMonth}-${nextDay}`;

          if (date === expectedDate) {
            lastRange.end = date;
          } else {
            ranges.push({ start: date, end: date });
          }
        }

        // Keep the original request for the first remaining range.
        const [firstRange, ...additionalRanges] = ranges;

        await updateLeaveRequest(request.id, {
          ...request,
          start_date: firstRange.start,
          end_date: firstRange.end,
        });

        // Create additional ranges for any gaps.
        for (const range of additionalRanges) {
          await createLeaveRequest({
            ...request,
            id: undefined,
            start_date: range.start,
            end_date: range.end,
            status: "Approved",
          });
        }
      }

      setSelectedShifts([]);
      setSelectedLeaveDays([]);

      // Refresh the schedule and the Upcoming Leaves Aside.
      await loadScheduleData();
      onLeaveChanged?.();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert(
        "Unable to complete all deletions. Please refresh and check the schedule.",
      );
      await loadScheduleData();
    }
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

  // Clear selected shifts when clicking outside shift bubbles
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Preserve selected shifts while the Bulk Edit modal is open.
      if (showBulkEdit) return;
      // Clear selection only when clicking outside the schedule items and modal.
      if (
        !e.target.closest(".shift-card") &&
        !e.target.closest(".leave-card") &&
        !e.target.closest(".bulk-edit-btn") &&
        !e.target.closest(".delete-selected-btn") &&
        !e.target.closest(".cancel-selection-btn") &&
        !e.target.closest(".modal") &&
        !e.target.closest(".modal-backdrop")
      ) {
        setSelectedShifts([]);
        setSelectedLeaveDays([]);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [showBulkEdit]);

  // Calculate Monday-Sunday date range
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Team Overview calculations for the selected Monday-Sunday week

  const hasApprovedLeaveThisWeek = (userId) =>
    leaveRequests.some(
      (leave) =>
        Number(leave.user_id) === Number(userId) &&
        leave.status === "Approved" &&
        weekDates.some((date) => {
          const dateString = formatDate(date);
          return dateString >= leave.start_date && dateString <= leave.end_date;
        }),
    );

  const getUserShiftsThisWeek = (userId) =>
    shifts.filter(
      (shift) =>
        Number(shift.user_id) === Number(userId) &&
        weekDates.some((date) => formatDate(date) === shift.date),
    );

  // On Leave: count independently, even if the employee has shifts.
  const onLeave = users.filter((u) => hasApprovedLeaveThisWeek(u.id)).length;

  // Unassigned: absolutely zero shifts for the selected week.
  const unassigned = users.filter(
    (u) => getUserShiftsThisWeek(u.id).length === 0,
  ).length;

  // Allocated: has shifts, and EVERY shift has a project assigned.
  const allocated = users.filter((u) => {
    const userShifts = getUserShiftsThisWeek(u.id);

    return (
      userShifts.length > 0 &&
      userShifts.every(
        (shift) =>
          shift.project_id != null && String(shift.project_id).trim() !== "",
      )
    );
  }).length;

  // Awaiting Allocation: has shifts, and AT LEAST ONE
  // shift has no project assigned.
  const awaitingAllocation = users.filter((u) => {
    const userShifts = getUserShiftsThisWeek(u.id);

    return (
      userShifts.length > 0 &&
      userShifts.some(
        (shift) =>
          shift.project_id == null || String(shift.project_id).trim() === "",
      )
    );
  }).length;

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
          style={{ position: "relative" }}
          onClick={(e) => {
            if (showBulkEdit) return;
            if (
              !e.target.closest(".shift-card") &&
              !e.target.closest(".leave-card") &&
              !e.target.closest(".bulk-edit-btn") &&
              !e.target.closest(".delete-selected-btn") &&
              !e.target.closest(".modal") &&
              !e.target.closest(".modal-backdrop") &&
              !e.target.closest(".cancel-selection-btn")
            ) {
              setSelectedShifts([]);
              setSelectedLeaveDays([]);
            }
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
                          onClick={() => {
                            setSelectedScheduleUser(u);
                            setSelectedShifts([]);
                            setSelectedLeaveDays([]);
                          }}
                          style={{
                            padding: "16px",
                            cursor: "pointer",

                            fontWeight:
                              selectedScheduleUser?.id === u.id ? "700" : "500",
                            color: "#212529",
                            backgroundColor:
                              selectedScheduleUser?.id === u.id
                                ? "#b6d4fe"
                                : "transparent",
                            borderLeft:
                              selectedScheduleUser?.id === u.id
                                ? "5px solid #0d6efd"
                                : "5px solid transparent",
                            borderBottom: "1px solid #dee2e6",
                            transition: "background-color 0.15s ease",
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

                      // Get national and regional public holidays applicable to the selected employee
                      const publicHoliday = publicHolidays.filter((holiday) => {
                        const holidayDate = String(holiday.date ?? "").slice(
                          0,
                          10,
                        );
                        const holidayCountry = String(holiday.country ?? "")
                          .trim()
                          .toUpperCase();
                        const employeeCountry = String(
                          selectedScheduleUser.country ?? "",
                        )
                          .trim()
                          .toUpperCase();

                        // The holiday must match the date and employee's country
                        if (
                          holidayDate !== weekDate ||
                          holidayCountry !== employeeCountry
                        ) {
                          return false;
                        }

                        const isNational =
                          holiday.is_national === true ||
                          String(holiday.is_national).toLowerCase() === "true";

                        // National holidays apply to everyone in the country
                        if (isNational) return true;

                        // Regional holidays use the regions array from the holiday API
                        const holidayRegions = Array.isArray(holiday.regions)
                          ? holiday.regions.map((region) =>
                              String(region).trim().toUpperCase(),
                            )
                          : [];

                        const employeeRegion = String(
                          selectedScheduleUser.region ?? "",
                        )
                          .trim()
                          .toUpperCase();

                        return Boolean(
                          employeeRegion &&
                          holidayRegions.includes(employeeRegion),
                        );
                      });

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
                          onDragOver={(e) => {
                            if (
                              e.dataTransfer.types.includes("leaverequestid") ||
                              e.dataTransfer.types.includes("leavedate")
                            ) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }
                          }}
                          onDrop={async (e) => {
                            if (
                              !e.dataTransfer.types.includes("leaverequestid")
                            ) {
                              return;
                            }

                            await handleLeaveDayDrop(e, weekDate);
                          }}
                        >
                          {publicHoliday.length > 0 ? (
                            <div
                              className="rounded"
                              style={{
                                width: "80%",
                                height: "100%",
                                minHeight: "78px",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                marginInline: "auto",
                                fontSize: "0.85rem",
                                color: "#664d03",
                                backgroundColor: "#fff3cd",
                                border: "1px solid #ffecb5",
                                borderRadius: "6px",
                                padding: "6px",
                              }}
                              title={`Public Holiday — ${weekDate}`}
                            >
                              {publicHoliday.map((holiday) => (
                                <div
                                  key={holiday.id}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <strong>
                                    {holiday.country} · Public Holiday
                                  </strong>
                                  <span>{holiday.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : approvedLeave ? (
                            <div
                              className={`leave-card rounded ${
                                approvedLeave.leave_type === "Sick Leave"
                                  ? "bg-danger-subtle"
                                  : ""
                              }`}
                              draggable={
                                user?.role === "manager" &&
                                approvedLeave.leave_type === "Annual Leave"
                              }
                              onDoubleClick={(e) => {
                                e.stopPropagation();

                                // Only managers can edit leave.
                                if (user?.role !== "manager") return;

                                // Clear any existing selections.
                                setSelectedShifts([]);
                                setSelectedLeaveDays([]);

                                // Open the editor for this specific date.
                                setLeaveEditTarget({
                                  leaveRequest: approvedLeave,
                                  date: weekDate,
                                });
                              }}
                              onDragStart={(e) => {
                                if (
                                  approvedLeave.leave_type !== "Annual Leave"
                                ) {
                                  e.preventDefault();
                                  return;
                                }

                                e.dataTransfer.setData(
                                  "leaveRequestId",
                                  String(approvedLeave.id),
                                );
                                e.dataTransfer.setData("leaveDate", weekDate);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onClick={(e) => {
                                e.stopPropagation();

                                // Prevent selecting leave days while shifts are already selected.
                                if (selectedShifts.length > 0) return;

                                const selectedDay = {
                                  requestId: approvedLeave.id,
                                  date: weekDate,
                                };

                                const isSelected = selectedLeaveDays.some(
                                  (day) =>
                                    Number(day.requestId) ===
                                      Number(selectedDay.requestId) &&
                                    day.date === selectedDay.date,
                                );

                                if (e.ctrlKey || e.metaKey) {
                                  setSelectedLeaveDays((prev) =>
                                    isSelected
                                      ? prev.filter(
                                          (day) =>
                                            !(
                                              Number(day.requestId) ===
                                                Number(selectedDay.requestId) &&
                                              day.date === selectedDay.date
                                            ),
                                        )
                                      : [...prev, selectedDay],
                                  );
                                } else {
                                  setSelectedLeaveDays(
                                    isSelected ? [] : [selectedDay],
                                  );
                                }
                              }}
                              style={{
                                width: "80%",
                                height: "100%",
                                minHeight: "78px",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                marginInline: "auto",
                                fontSize: "0.85rem",
                                color: "#4b4c4c",
                                backgroundColor:
                                  approvedLeave.leave_type === "Annual Leave"
                                    ? "#DEE2E6"
                                    : approvedLeave.leave_type ===
                                        "Personal Leave"
                                      ? "#EDE9FE"
                                      : undefined,
                                border: "1px solid #ced4da",
                                // Show a not-allowed cursor on leave days while shifts are selected.
                                cursor:
                                  selectedShifts.length > 0
                                    ? "not-allowed"
                                    : "pointer",
                                boxShadow: selectedLeaveDays.some(
                                  (day) =>
                                    Number(day.requestId) ===
                                      Number(approvedLeave.id) &&
                                    day.date === weekDate,
                                )
                                  ? "0 0 0 3px rgba(33, 37, 41, 0.55)"
                                  : "none",
                              }}
                              title={`${approvedLeave.leave_type} — ${weekDate}`}
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
                                      if (selectedLeaveDays.length > 0) return;

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
                                      width: "80%",
                                      height: "78px",
                                      // Show a not-allowed cursor on shifts while leave days are selected.
                                      cursor:
                                        selectedLeaveDays.length > 0
                                          ? "not-allowed"
                                          : "pointer",
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
                                      width: "80%",
                                      height: "78px",
                                      position: "relative",
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
                                        ? "#scheduleActionModal"
                                        : undefined
                                    }
                                    onClick={() => {
                                      if (user?.role !== "manager") return;

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
                                          color: "#6c757d",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        + Schedule
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

          {(selectedShifts.length > 0 || selectedLeaveDays.length > 0) && (
            <div className="d-flex justify-content-end align-items-center gap-2 p-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm cancel-selection-btn"
                onClick={() => {
                  setSelectedShifts([]);
                  setSelectedLeaveDays([]);
                }}
              >
                Cancel Selection
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm bulk-edit-btn"
                title={
                  selectedLeaveDays.length > 0
                    ? "Edit selected leave"
                    : "Edit selected shifts"
                }
                onClick={() => {
                  if (selectedLeaveDays.length > 0) {
                    setShowBulkEditLeave(true);
                  } else if (selectedShifts.length > 0) {
                    setShowBulkEdit(true);
                  }
                }}
                disabled={
                  selectedShifts.length === 0 && selectedLeaveDays.length === 0
                }
              >
                ✏️ Bulk Edit
              </button>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm delete-selected-btn"
                title="Delete selected shifts and/or leaves"
                onClick={() => {
                  const totalSelected =
                    selectedShifts.length + selectedLeaveDays.length;

                  const confirmed = window.confirm(
                    `Delete ${totalSelected} selected item${
                      totalSelected === 1 ? "" : "s"
                    }?`,
                  );

                  if (confirmed) {
                    handleBulkDelete();
                  }
                }}
              >
                🗑️ Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Team Overview and Project Allocation */}
      <div className="row g-3 mt-1">
        <div className="col-lg-6">
          <TeamOverview
            allocated={allocated}
            awaitingAllocation={awaitingAllocation}
            onLeave={onLeave}
            unassigned={unassigned}
          />
        </div>

        <div className="col-lg-6">
          <ProjectAllocation
            data={projectAllocation}
            onViewAll={() => setShowProjectAllocationModal(true)}
          />
        </div>
      </div>

      {/* Shift Details Modal */}
      <ShiftDetailsModal
        shift={selectedShift}
        user={selectedShiftUser}
        role={user?.role}
        onUpdated={loadScheduleData}
      />
      {/* Schedule Action Modal */}
      <div
        className="modal fade"
        id="scheduleActionModal"
        tabIndex="-1"
        aria-labelledby="scheduleActionModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5
                  className="modal-title fw-semibold"
                  id="scheduleActionModalLabel"
                >
                  Add to Schedule
                </h5>
                <small className="text-muted">
                  {singleShiftUser?.name}
                  {singleShiftDate ? ` · ${singleShiftDate}` : ""}
                </small>
              </div>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body p-4">
              <p className="text-muted mb-3">
                What would you like to schedule?
              </p>

              <button
                type="button"
                className="btn w-100 text-start p-3 mb-3"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#212529",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  transition:
                    "background-color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f6ff";
                  e.currentTarget.style.borderColor = "#86b7fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#dee2e6";
                }}
                data-bs-dismiss="modal"
                data-bs-toggle="modal"
                data-bs-target="#assignSingleShiftModal"
              >
                <span className="fw-semibold d-block">Assign Shift</span>
                <small className="text-muted">
                  Schedule work for this employee.
                </small>
              </button>

              <button
                type="button"
                className="btn w-100 text-start p-3"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#212529",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  transition:
                    "background-color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f3f5";
                  e.currentTarget.style.borderColor = "#adb5bd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#dee2e6";
                }}
                data-bs-dismiss="modal"
                data-bs-toggle="modal"
                data-bs-target="#recordLeaveModal"
              >
                <span className="fw-semibold d-block">Record Leave</span>
                <small className="text-muted">
                  Record an employee's absence.
                </small>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Assign Single Shift Modal */}
      <AssignSingleShiftModal
        user={singleShiftUser}
        date={singleShiftDate}
        slot={singleShiftSlot}
        shifts={shifts}
        onShiftCreated={loadScheduleData}
      />
      {/* Record Leave Modal */}
      <RecordLeaveModal
        users={users}
        managerId={user?.id}
        initialUserId={singleShiftUser?.id}
        initialDate={singleShiftDate}
        onCreated={async () => {
          onLeaveChanged?.();
          await loadScheduleData();
        }}
      />
      {/* Single-day Leave Edit Modal */}
      {leaveEditTarget && (
        <EditLeaveModal
          leaveRequest={leaveEditTarget.leaveRequest}
          date={leaveEditTarget.date}
          shifts={shifts}
          leaveRequests={leaveRequests}
          publicHolidays={publicHolidays}
          users={users}
          onUpdated={async () => {
            await loadScheduleData();
            onLeaveChanged?.();
          }}
          onClose={() => setLeaveEditTarget(null)}
        />
      )}
      {/* Bulk Edit Leave Modal */}
      {showBulkEditLeave && (
        <BulkEditLeaveModal
          selectedLeaveDays={selectedLeaveDays}
          leaveRequests={leaveRequests}
          users={users}
          shifts={shifts}
          publicHolidays={publicHolidays}
          onUpdated={async () => {
            await loadScheduleData();
            onLeaveChanged?.();
          }}
          onClose={() => {
            setShowBulkEditLeave(false);
            setSelectedLeaveDays([]);
          }}
        />
      )}
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

      {showProjectAllocationModal && (
        <ProjectAllocationModal
          projects={projects}
          users={users}
          shifts={shifts}
          onClose={() => setShowProjectAllocationModal(false)}
          onViewProject={(project) => {
            setShowProjectAllocationModal(false);
            setSelectedProject(project);
          }}
        />
      )}

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          users={users}
          shifts={shifts}
          leaveRequests={leaveRequests}
          publicHolidays={publicHolidays}
          onClose={() => setSelectedProject(null)}
          onReassign={async (reassignment) => {
            // Get the replacement employee and conflict-free shifts to update.
            const { targetUserId, assignments } = reassignment;

            // Process each shift using its selected destination date and slot.
            for (const item of assignments) {
              const slotTimes = {
                1: { start: "08:00:00", end: "10:00:00" },
                2: { start: "10:30:00", end: "12:30:00" },
                3: { start: "12:45:00", end: "14:45:00" },
                4: { start: "15:00:00", end: "17:00:00" },
              }[item.slotNumber];

              // Stop if the selected time slot is invalid.
              if (!slotTimes) {
                throw new Error("Invalid time slot selected.");
              }

              // Update the employee, date and time slot for this shift.
              await patchShift(item.shift.id, {
                user_id: targetUserId,
                date: item.date,
                slot_number: item.slotNumber,
                shift_start: slotTimes.start,
                shift_end: slotTimes.end,
              });
            }

            // Reload users, shifts and other dashboard data after the updates.
            await loadScheduleData();

            // Close the project details modal when all submitted updates finish.
            // The reassignment modal handles any remaining conflicts.
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
