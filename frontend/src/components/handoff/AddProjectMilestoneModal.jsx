import { useState } from "react";
import { createProjectSpecification } from "../../api/projectSpecifications";
import { createSpecificationUser } from "../../api/specificationUsers";

export default function AddProjectMilestoneModal({
  show,
  projects,
  users,
  onClose,
  refreshProjectSpecifications,
}) {
  // Existing client project that this new project/milestone belongs to
  const [projectId, setProjectId] = useState("");

  // New project/milestone information
  const [milestoneName, setMilestoneName] = useState("");
  const [version, setVersion] = useState("");
  const [link, setLink] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [developerId, setDeveloperId] = useState("");

  if (!show) return null;

  // Only show developers in the developer dropdown
  const developers = users.filter(
    (user) => user.role === "Dev"
  );

  // Function to handle adding a new project/milestone
  async function handleAddProjectMilestone() {
    try {
        // Create the new project / milestone under the selected client project
        const newSpecification = await createProjectSpecification({
        project_id: Number(projectId),
        name: milestoneName.trim(),
        version: version.trim() || null,
        link: link.trim() || null,
        specs: false,
        build: false,
        test_sheet: false,
        launch_plan: false,
        billing: null,
        roadmap: false,
        target_date: targetDate,
        });

        // Assign a developer if one was selected
        if (developerId) {
        await createSpecificationUser({
            project_id: Number(projectId),
            specification_id: newSpecification.id,
            user_id: Number(developerId),
        });
        }

        // Refresh the table so the new milestone appears immediately
        await refreshProjectSpecifications();

        // Close the modal
        onClose();

    } catch (error) {
        console.error(
        "Could not add project / milestone:",
        error
        );
    }
  }

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">

          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              Add Project / Milestone
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>

          {/* Form */}
          <div className="modal-body">

            {/* Existing client project */}
            <div className="mb-3">
              <label className="form-label">
                Client Project *
              </label>

              <select
                className="form-select"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">
                  Select client project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.client} — {project.name}
                  </option>
                ))}
              </select>
            </div>

            <hr />

            <h6 className="mb-3">
              Project / Milestone Details
            </h6>

            {/* Project / Milestone name */}
            <div className="mb-3">
              <label className="form-label">
                Project / Milestone name *
              </label>

              <input
                type="text"
                className="form-control"
                value={milestoneName}
                onChange={(event) =>
                  setMilestoneName(event.target.value)
                }
              />
            </div>

            {/* Version */}
            <div className="mb-3">
              <label className="form-label">
                Version
              </label>

              <input
                type="text"
                className="form-control"
                value={version}
                onChange={(event) =>
                  setVersion(event.target.value)
                }
                placeholder="e.g. v1.0"
              />
            </div>

            {/* HALO ticket */}
            <div className="mb-3">
              <label className="form-label">
                HALO Ticket
              </label>

              <input
                type="text"
                className="form-control"
                value={link}
                onChange={(event) =>
                  setLink(event.target.value)
                }
                placeholder="Ticket URL"
              />
            </div>

            {/* Target date */}
            <div className="mb-3">
              <label className="form-label">
                Target date *
              </label>

              <input
                type="date"
                className="form-control"
                value={targetDate}
                onChange={(event) =>
                  setTargetDate(event.target.value)
                }
              />
            </div>

            {/* Developer */}
            <div className="mb-3">
              <label className="form-label">
                Developer
              </label>

              <select
                className="form-select"
                value={developerId}
                onChange={(event) =>
                  setDeveloperId(event.target.value)
                }
              >
                <option value="">
                  No developer assigned
                </option>

                {developers.map((developer) => (
                  <option
                    key={developer.id}
                    value={developer.id}
                  >
                    {developer.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-dark"
              onClick={handleAddProjectMilestone}
              disabled={
                !projectId ||
                !milestoneName.trim() ||
                !targetDate
              }
            >
              Add Project / Milestone
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}