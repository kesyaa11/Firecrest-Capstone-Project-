import { useState } from "react";
import { createProject } from "../../api/projects";
import { createProjectSpecification } from "../../api/projectSpecifications";
import { createSpecificationUser } from "../../api/specificationUsers";

export default function NewClientProjectModal({
  show,
  users,
  onClose,
  refreshProjects,
  refreshProjectSpecifications,
}) {

  const [client, setClient] = useState("");
  const [projectName, setProjectName] = useState("");
  const [finalDate, setFinalDate] = useState("");

  const [leadSDId, setLeadSDId] = useState("");

  const [milestoneName, setMilestoneName] = useState("");
  const [version, setVersion] = useState("");
  const [link, setLink] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const [developerId, setDeveloperId] = useState("");

  if (!show) {
    return null;
  }

  console.log("USERS IN CREATE PROJECT MODAL:", users);

  // Only show SD users in the Lead SD dropdown
  const sdUsers = users.filter(
    (user) => user.role === "SD"
  );

  // Only show developers in the developer dropdown
  const developers = users.filter(
    (user) => user.role === "Dev"
  );

  async function handleCreateProject() {
    try {
        // 1. Create the main client project
        const newProject = await createProject({
        name: projectName.trim(),
        client: client.trim(),
        tracker_ref: null,
        final_date: finalDate || null,
        is_active: true,
        });

        // 2. Create the first project / milestone
        const newSpecification = await createProjectSpecification({
        project_id: newProject.id,
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

        // 3. Assign the Lead SD to the overall project
        await createSpecificationUser({
        project_id: newProject.id,
        specification_id: null,
        user_id: Number(leadSDId),
        });

        // 4. Assign developer to the first milestone if one was selected
        if (developerId) {
        await createSpecificationUser({
            project_id: newProject.id,
            specification_id: newSpecification.id,
            user_id: Number(developerId),
        });
        }

        // 5. Reload the project information shown on the page
        await refreshProjects();
        await refreshProjectSpecifications();

        // 6. Close the modal
        onClose();

    } catch (error) {
        console.error(
        "Could not create client project:",
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

          <div className="modal-header">
            <h5 className="modal-title">
              New Client Project
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>

          <div className="modal-body">

            {/* Client project details */}
            <h6 className="mb-3">
              Client Project
            </h6>

            <div className="mb-3">
              <label className="form-label">
                Client *
              </label>

              <input
                type="text"
                className="form-control"
                value={client}
                onChange={(event) =>
                  setClient(event.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Project name *
              </label>

              <input
                type="text"
                className="form-control"
                value={projectName}
                onChange={(event) =>
                  setProjectName(event.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Overall final date
              </label>

              <input
                type="date"
                className="form-control"
                value={finalDate}
                onChange={(event) =>
                  setFinalDate(event.target.value)
                }
              />
            </div>

            <div className="mb-4">
              <label className="form-label">
                Lead Service Delivery *
              </label>

              <select
                className="form-select"
                value={leadSDId}
                onChange={(event) =>
                  setLeadSDId(event.target.value)
                }
              >
                <option value="">
                  Select Service Delivery...
                </option>

                {sdUsers.map((sdUser) => (
                  <option
                    key={sdUser.id}
                    value={sdUser.id}
                  >
                    {sdUser.name}
                  </option>
                ))}
              </select>
            </div>

            <hr />
            
            <br />

            {/* First project / milestone */}
            <h6 className="mb-1">
              First Project / Milestone
            </h6>
            
            <p className="text-muted small">
              Every new client project starts with at least
              one project or milestone.
            </p>

            <br />

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

            <div className="mb-3">
              <label className="form-label">
                Version
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. v1.0"
                value={version}
                onChange={(event) =>
                  setVersion(event.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                HALO ticket
              </label>

              <input
                type="text"
                className="form-control"
                value={link}
                onChange={(event) =>
                  setLink(event.target.value)
                }
              />
            </div>

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

              <div className="form-text">
                Developer assignment is optional.
              </div>
            </div>

          </div>

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
              onClick={handleCreateProject}
              disabled={
                !client.trim() ||
                !projectName.trim() ||
                !leadSDId ||
                !milestoneName.trim() ||
                !targetDate
              }
            >
              Create Project
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}