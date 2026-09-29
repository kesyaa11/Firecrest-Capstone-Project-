import { useState } from "react";
import ProjectDetailsModal from "./ProjectDetailsModal";
import CreateHandoffModal from "./CreateHandoffModal";
import HandoffDetailsModal from "./HandoffDetailsModal";

export default function DeveloperProjects({
  user,
  projects,
  projectSpecifications,
  specificationHandoffs,
  handoffSignoffs,
  refreshSpecificationHandoffs,
  users,
}) {

  // Currently selected project specification
  const [selectedSpecification, setSelectedSpecification] = useState(null);

  // Specification selected when creating a new handoff
  const [selectedHandoff, setSelectedHandoff] = useState(null);

  // Existing handoff selected for viewing
  const [selectedHandoffDetails, setSelectedHandoffDetails] = useState(null);

  // Handoff selected for resubmission
  const [resubmitHandoff, setResubmitHandoff] = useState(null);

  return (
    <>

      {/* My Projects */}
      <div className="card shadow-sm">
        <div className="card-body">

          {/* Logged-in developer name */}
          <div className="text-end">
            <span className="text-muted">
              {user?.name}
            </span>
          </div>

          <h5 className="mb-3">My Projects</h5>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">

              <thead>
                <tr>
                  <th>Project / version</th>
                  <th className="text-center">Roadmap</th>
                  <th className="text-center">Specs</th>
                  <th className="text-center">Build</th>
                  <th className="text-center">Test</th>
                  <th className="text-center">Launch</th>
                  <th className="text-end">Status</th>
                </tr>
              </thead>

              <tbody>
                {projectSpecifications.map((specification) => {

                  // Find the project this specification belongs to
                  const project = projects.find(
                    (project) =>
                      project.id === specification.project_id
                  );

                  // Find an existing handoff for this specification
                  const handoff = specificationHandoffs.find(
                    (handoff) =>
                      handoff.specification_id === specification.id
                  );

                  return (
                    <tr key={specification.id}>

                      {/* Project name and version */}
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none"
                          onClick={() =>
                            setSelectedSpecification({
                              project: project,
                              specification: specification,
                            })
                          }
                        >
                          {project?.name || "Unknown Project"} —{" "}
                          {specification.version}
                        </button>
                      </td>

                      {/* Project progress */}
                      <td className="text-center">
                        {specification.roadmap ? "✓" : "—"}
                      </td>

                      <td className="text-center">
                        {specification.specs ? "✓" : "—"}
                      </td>

                      <td className="text-center">
                        {specification.build ? "✓" : "—"}
                      </td>

                      <td className="text-center">
                        {specification.test_sheet ? "✓" : "—"}
                      </td>

                      <td className="text-center">
                        {specification.launch_plan ? "✓" : "—"}
                      </td>

                      {/* Project / handoff status */}
                      <td className="text-end">

                        {handoff?.status === "Pending" ? (

                          <span className="text-muted">
                            Sent for review
                          </span>

                        ) : handoff?.status === "Changes Requested" ? (

                          <span className="text-danger">
                            Changes requested
                          </span>

                        ) : handoff?.status === "Ready to test" ? (

                          <span className="text-success">
                            Ready to test
                          </span>

                        ) : handoff ? (

                          <span className="text-muted">
                            {handoff.status}
                          </span>

                        ) : specification.build ? (

                          <button
                            type="button"
                            className="btn btn-dark btn-sm"
                            onClick={() =>
                              setSelectedHandoff({
                                project: project,
                                specification: specification,
                              })
                            }
                          >
                            Create handoff
                          </button>

                        ) : (

                          <span className="text-muted">
                            In progress
                          </span>

                        )}

                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>


          {/* Current Handoffs */}
          <div className="card shadow-sm mt-4">
            <div className="card-body">

              <h5 className="mb-3">Current Handoffs</h5>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">

                  <thead>
                    <tr>
                      <th>Project / version</th>
                      <th>Submitted</th>
                      <th>Expected SD review</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {specificationHandoffs.length === 0 ? (

                      <tr>
                        <td
                          colSpan="5"
                          className="text-center text-muted py-4"
                        >
                          No current handoffs
                        </td>
                      </tr>

                    ) : (

                      specificationHandoffs.map((handoff) => {

                        // Find the specification associated with the handoff
                        const specification = projectSpecifications.find(
                          (specification) =>
                            specification.id === handoff.specification_id
                        );

                        // Find the project associated with the handoff
                        const project = projects.find(
                          (project) =>
                            project.id === handoff.project_id
                        );

                        return (
                          <tr key={handoff.id}>

                            {/* Project / version */}
                            <td>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() =>
                                  setSelectedHandoffDetails({
                                    handoff: handoff,
                                    project: project,
                                    specification: specification,
                                  })
                                }
                              >
                                {project?.name || "Unknown Project"} —{" "}
                                {specification?.version || "Unknown Version"}
                              </button>
                            </td>

                            {/* Date submitted */}
                            <td>
                              {handoff.notified
                                ? new Date(
                                    handoff.notified
                                  ).toLocaleString("en-NZ")
                                : "Unknown"}
                            </td>

                            {/* Expected SD review date */}
                            <td>
                              {handoff.expected
                                ? new Date(
                                    handoff.expected
                                  ).toLocaleString("en-NZ")
                                : "Not provided"}
                            </td>

                            {/* Handoff status */}
                            <td>
                              {handoff.status || "Unknown"}
                            </td>

                            {/* Handoff action */}
                            <td className="text-end">

                              {handoff.status === "Changes Requested" ? (

                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    setSelectedHandoffDetails({
                                      handoff: handoff,
                                      project: project,
                                      specification: specification,
                                    })
                                  }
                                >
                                  View feedback
                                </button>

                              ) : (

                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() =>
                                    setSelectedHandoffDetails({
                                      handoff: handoff,
                                      project: project,
                                      specification: specification,
                                    })
                                  }
                                >
                                  View
                                </button>

                              )}

                            </td>

                          </tr>
                        );
                      })

                    )}

                  </tbody>

                </table>
              </div>

            </div>
          </div>

        </div>
      </div>


      {/* Project details modal */}
      <ProjectDetailsModal
        selectedSpecification={selectedSpecification}
        onClose={() => setSelectedSpecification(null)}
      />


      {/* Create handoff modal */}
      <CreateHandoffModal
        selectedHandoff={selectedHandoff}
        onClose={() => setSelectedHandoff(null)}
        refreshSpecificationHandoffs={refreshSpecificationHandoffs}
      />


      {/* Existing handoff details / feedback modal */}
      <HandoffDetailsModal
        selectedHandoffDetails={selectedHandoffDetails}
        handoffSignoffs={handoffSignoffs}
        onClose={() => setSelectedHandoffDetails(null)}
        refreshSpecificationHandoffs={refreshSpecificationHandoffs}
        users={users}
        onResubmit={(handoffDetails) => {
          setSelectedHandoffDetails(null);
          setResubmitHandoff(handoffDetails);
        }}
      />

      {/* Resubmit handoff modal */}
      <CreateHandoffModal
        selectedHandoff={resubmitHandoff}
        existingHandoff={resubmitHandoff?.handoff}
        onClose={() => setResubmitHandoff(null)}
        refreshSpecificationHandoffs={refreshSpecificationHandoffs}
      />
    </>
  );
}