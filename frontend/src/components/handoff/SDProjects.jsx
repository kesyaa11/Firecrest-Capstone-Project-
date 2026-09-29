import {useState} from "react";
import ReviewHandoffModal from "./ReviewHandoffModal";

export default function SDProjects({
  user,
  projects,
  projectSpecifications,
  specificationHandoffs,
  refreshSpecificationHandoffs,
}) {

    // State to keep track of the currently selected handoff
    const [selectedHandoff, setSelectedHandoff] = useState(null);

  return (
    <>
    <div className="card shadow-sm">
      <div className="card-body">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Projects</h5>

          <button
            type="button"
            className="btn btn-dark btn-sm"
          >
            + Create project
          </button>
        </div>

        {/* Project specifications table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">

            <thead>
              <tr>
                <th>Project / version</th>
                <th>Client</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>

            <tbody>
              {projectSpecifications.map((specification) => {

                // Find the project this specification belongs to
                const project = projects.find(
                  (project) =>
                    project.id === specification.project_id
                );

                // Find the handoff for this specification
                const handoff = specificationHandoffs.find(
                  (handoff) =>
                    handoff.specification_id === specification.id
                );

                return (
                  <tr key={specification.id}>

                    {/* Project and specification */}
                    <td>
                      {project?.name || "Unknown Project"} —{" "}
                      {specification.version}
                    </td>

                    {/* Client */}
                    <td>
                      {project?.client || "Not provided"}
                    </td>

                    {/* Handoff status */}
                    <td>
                      {handoff?.status === "Pending" ? (
                        <span>Awaiting your review</span>
                      ) : handoff ? (
                        <span>{handoff.status}</span>
                      ) : (
                        <span className="text-muted">
                          In progress
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      {handoff?.status === "Pending" && (
                        <button
                          type="button"
                          className="btn btn-dark btn-sm"
                          onClick={() => 
                            setSelectedHandoff({
                                handoff: handoff,
                                project: project,
                                specification: specification,
                            })
                        }
                        >
                          Review
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>
    </div>

    <ReviewHandoffModal
        selectedHandoff={selectedHandoff}
        onClose={() => setSelectedHandoff(null)}
        user={user}
        refreshSpecificationHandoffs={refreshSpecificationHandoffs}
    />
    </>
  );
}