import { useMemo, useState } from "react";

import ReassignWorkModal from "./ReassignWorkModal";

const getShiftTimes = (slotNumber) => {
  const times = {
    1: "08:00–10:00",
    2: "10:30–12:30",
    3: "12:45–14:45",
    4: "15:00–17:00",
  };

  return times[slotNumber] || "Time unavailable";
};

export default function ProjectDetailsModal({
  project,
  users = [],
  shifts = [],
  leaveRequests = [],
  onClose,
  onReassign,
}) {
  // Statevar to control visibility of the Reassign Work modal.
  const [showReassignModal, setShowReassignModal] = useState(false);

  const projectShifts = useMemo(() => {
    if (!project) return [];

    return shifts
      .filter((shift) => Number(shift.project_id) === Number(project.id))
      .map((shift) => ({
        ...shift,
        employee: users.find(
          (user) => Number(user.id) === Number(shift.user_id),
        ),
      }))
      .sort((a, b) => {
        const dateComparison = String(a.date).localeCompare(String(b.date));

        return dateComparison || a.slot_number - b.slot_number;
      });
  }, [project, shifts, users]);

  if (!project) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="projectDetailsModalTitle"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title" id="projectDetailsModalTitle">
                {project.name}
              </h5>
              <small className="text-muted">
                Project team and scheduled work
              </small>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>

          <div className="modal-body">
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div className="border rounded p-3 flex-fill">
                <small className="text-muted d-block">Project status</small>
                <strong>{project.status || "Not specified"}</strong>
              </div>

              <div className="border rounded p-3 flex-fill">
                <small className="text-muted d-block">Scheduled shifts</small>
                <strong>{projectShifts.length}</strong>
              </div>

              <div className="border rounded p-3 flex-fill">
                <small className="text-muted d-block">Assigned employees</small>
                <strong>
                  {new Set(projectShifts.map((shift) => shift.user_id)).size}
                </strong>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Scheduled Work</h6>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowReassignModal(true)}
                disabled={projectShifts.length === 0}
              >
                Reassign Work
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Work Type</th>
                  </tr>
                </thead>

                <tbody>
                  {projectShifts.map((shift) => (
                    <tr key={shift.id}>
                      <td className="fw-semibold">
                        {shift.employee?.name || "Unknown employee"}
                      </td>
                      <td>{shift.date || "—"}</td>
                      <td>{getShiftTimes(shift.slot_number)}</td>
                      <td>{shift.work_type || "—"}</td>
                    </tr>
                  ))}

                  {projectShifts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No shifts are scheduled for this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {showReassignModal && (
        <ReassignWorkModal
          project={project}
          users={users}
          shifts={shifts}
          leaveRequests={leaveRequests}
          onClose={() => setShowReassignModal(false)}
          onConfirm={async (reassignment) => {
            await onReassign?.(reassignment);
          }}
        />
      )}
    </div>
  );
}
