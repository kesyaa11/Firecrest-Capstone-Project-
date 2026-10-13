
import { useState } from "react";

export default function ProjectAssignmentsModal({
  projects = [],
  specifications = [],
  specificationUsers = [],
  users = [],
  onClose,
}) {
  const [search, setSearch] = useState("");

  // Find assigned users for a project or specification
  function getAssignedUsers(projectId, specificationId, role) {
    const assignedIds = specificationUsers
      .filter((assignment) => {
        const matchesProject =
          Number(assignment.project_id) === Number(projectId);

        const matchesSpecification =
          specificationId == null
            ? assignment.specification_id == null
            : Number(assignment.specification_id) ===
              Number(specificationId);

        return matchesProject && matchesSpecification;
      })
      .map((assignment) => Number(assignment.user_id));

    
      return users.filter((user) => {
        const userRole = user.role?.toLowerCase();

        const matchesRole =
          role === "developer"
            ? userRole === "dev" || userRole === "developer"
            : userRole === "sd";

        return (
          assignedIds.includes(Number(user.id)) &&
          matchesRole
        );
      });
  }

  const filteredProjects = projects.filter((project) => {
    const projectSpecifications = specifications.filter(
      (specification) =>
        Number(specification.project_id) === Number(project.id)
    );

    const searchableText = [
      project.name,
      ...projectSpecifications.flatMap((specification) => [
        specification.name,
        specification.version,
      ]),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  function renderMembers(members) {
    return members.length > 0 ? (
      <div className="d-flex flex-wrap gap-1">
        {members.map((member) => (
          <span
            key={member.id}
            className="badge bg-light text-dark border"
          >
            {member.name || member.username}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-muted small">Unassigned</span>
    );
  }

  return (
    <div
      className="modal fade show d-block"
      role="dialog"
      aria-modal="true"
      aria-labelledby="projectAssignmentsTitle"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title" id="projectAssignmentsTitle">
                Project & Specification Assignments
              </h5>
              <small className="text-muted">
                View team assignments before scheduling shifts.
              </small>
            </div>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <input
              type="search"
              className="form-control mb-3"
              placeholder="Search projects, specifications or versions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Project / Specification</th>
                    <th>Developers</th>
                    <th>SD</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => {
                    const projectSpecifications = specifications.filter(
                      (specification) =>
                        Number(specification.project_id) === Number(project.id)
                    );

                    const matchingSpecifications =
                      projectSpecifications.filter((specification) =>
                        [
                          project.name,
                          specification.name,
                          specification.version,
                        ]
                          .join(" ")
                          .toLowerCase()
                          .includes(search.toLowerCase())
                      );

                    return (
                      <FragmentRows
                        key={project.id}
                        project={project}
                        specifications={matchingSpecifications}
                        getAssignedUsers={getAssignedUsers}
                        renderMembers={renderMembers}
                      />
                    );
                  })}

                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
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

function FragmentRows({
  project,
  specifications,
  getAssignedUsers,
  renderMembers,
}) {
  return (
    <>
      <tr className="table-light">
        <td className="fw-semibold">{project.name}</td>
        <td>
          {renderMembers(getAssignedUsers(project.id, null, "developer"))}
        </td>
        <td>{renderMembers(getAssignedUsers(project.id, null, "sd"))}</td>
      </tr>

      {specifications.map((specification) => (
        <tr key={specification.id}>
          <td className="ps-4">
            <span className="badge bg-light text-dark border me-2">
              {specification.version || "No version"}
            </span>
            {specification.name}
          </td>

          <td>
            {renderMembers(
              getAssignedUsers(project.id, specification.id, "developer")
            )}
          </td>

          <td>
            {renderMembers(
              getAssignedUsers(project.id, specification.id, "sd")
            )}
          </td>
        </tr>
      ))}
    </>
  );
}
