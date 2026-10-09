export default function ProjectAllocation({ data = [], onViewAll }) {
  return (
    <div className="card shadow-sm h-100">
      <div
        className="card-header bg-white d-flex justify-content-between align-items-center"
        style={{ minHeight: "62px" }}
      >
        <h5 className="mb-0">Project Allocation</h5>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm px-3 py-2"
          onClick={onViewAll}
        >
          View all
        </button>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Project</th>
                <th>Team Members</th>
                <th>Status</th>
                <th>Current Stage / Milestone</th>
              </tr>
            </thead>

            <tbody>
              {data.map((project) => (
                <tr key={project.id}>
                  <td className="fw-medium">{project.name}</td>

                  <td>
                    <div className="d-flex gap-1">
                      {project.members.map((member) => (
                        <span
                          key={member.id}
                          className="badge rounded-circle bg-light text-dark border"
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                          }}
                          title={member.name}
                        >
                          {member.initials}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span className="text-muted">{project.status || "—"}</span>
                  </td>

                  <td className="text-muted">{project.stage || "—"}</td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-muted text-center py-4">
                    No project allocations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
