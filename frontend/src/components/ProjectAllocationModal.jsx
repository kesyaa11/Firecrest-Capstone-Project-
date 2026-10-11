import { useMemo, useState } from "react";

export default function ProjectAllocationModal({
  projects = [],
  users = [],
  shifts = [],
  onClose,
  onViewProject,
}) {
  const [search, setSearch] = useState("");

  // Derive project allocations and cache the result until the source data changes.
  const allocations = useMemo(() => {
    return projects.map((project) => {
      // Find the shifts associated with the current project.
      const projectShifts = shifts.filter(
        (shift) => Number(shift.project_id) === Number(project.id),
      );

      // Get unique user IDs so each team member appears only once.
      const memberIds = [
        ...new Set(projectShifts.map((shift) => Number(shift.user_id))),
      ];

      const members = memberIds
        .map((id) => users.find((user) => Number(user.id) === id))
        .filter(Boolean);

      return {
        ...project,
        members,
        shiftCount: projectShifts.length,
      };
    });
  }, [projects, users, shifts]);

  const filteredProjects = allocations.filter((project) =>
    project.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="projectAllocationModalTitle"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title" id="projectAllocationModalTitle">
                Project Allocations
              </h5>
              <small className="text-muted">
                Review project teams and scheduled work.
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
            <div className="mb-3">
              <input
                type="search"
                className="form-control"
                placeholder="Search projects..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Project</th>
                    <th>Team Members</th>
                    <th>Status</th>
                    <th>Scheduled Shifts</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td className="fw-semibold">{project.name}</td>

                      <td>
                        {project.members.length ? (
                          <div className="d-flex flex-wrap gap-1">
                            {project.members.map((member) => (
                              <span
                                key={member.id}
                                className="badge bg-light text-dark border"
                              >
                                {member.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">
                            No assigned members
                          </span>
                        )}
                      </td>

                      <td>{project.status || "—"}</td>

                      <td>{project.shiftCount}</td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => onViewProject?.(project)}
                        >
                          View project
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No matching projects found.
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
    </div>
  );
}
