import { useState, useEffect } from "react";
import { updateShift, deleteShift } from "../api/shifts";
import { getProjects } from "../api/projects";
import { getProjectSpecifications } from "../api/projectSpecifications";

// Work type list on shift modal dropdown
const WORK_TYPES = [
  "Testing",
  "Development",
  "Meeting",
  "Documentation",
  "Other",
];

export default function ShiftDetailsModal({ shift, user, role, onUpdated }) {
  const [workType, setWorkType] = useState("");
  const [projectId, setProjectId] = useState("");
  const [specificationId, setSpecificationId] = useState("");
  const [projects, setProjects] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [error, setError] = useState("");

  // Refresh the form fields whenever a different shift is opened
  useEffect(() => {
    setWorkType(shift?.work_type || "");
    setProjectId(shift?.project_id || "");
    setSpecificationId(shift?.specification_id || "");
    setError("");
  }, [shift]);

  // Load projects and project specifications for the shift details
  useEffect(() => {
    async function loadAssignmentData() {
      try {
        const projectData = await getProjects();
        const specificationData = await getProjectSpecifications();

        setProjects(projectData || []);
        setSpecifications(specificationData || []);
      } catch (err) {
        console.error("Failed to load assignment data:", err);
      }
    }

    loadAssignmentData();
  }, []);

  // Permissiong flags for update and delete
  const canEdit = role === "manager" || role === "sd" || role === "developer";
  const canDelete = role === "manager";

  // Find the project linked to the current shift
  const selectedProject = projects.find(
    (project) => Number(project.id) === Number(shift?.project_id),
  );

  // Find the specification linked to the current shift
  const selectedSpecification = specifications.find(
    (specification) =>
      Number(specification.id) === Number(shift?.specification_id),
  );

  function closeModal() {
    const modalEl = document.getElementById("shiftDetailsModal");
    const modal = window.bootstrap?.Modal.getInstance(modalEl);
    modal?.hide();
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (!workType) {
      setError("Please select a work type.");
      return;
    }

    try {
      // Update the shift with the selected project, specification and work type
      await updateShift(shift.id, {
        id: shift.id,
        user_id: shift.user_id,
        date: shift.date,
        duration: shift.duration,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
        slot_number: shift.slot_number,
        project_id: projectId ? Number(projectId) : null,
        specification_id: specificationId ? Number(specificationId) : null,
        work_type: workType,
      });

      await onUpdated();
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to update shift.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this shift allocation?")) {
      return;
    }

    try {
      await deleteShift(shift.id);
      await onUpdated();
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to delete shift.");
    }
  }

  if (!shift) {
    return null;
  }

  return (
    <div
      className="modal fade"
      id="shiftDetailsModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSave}>
            <div className="modal-header">
              <h5 className="modal-title">Shift Details</h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body text-start">
              {/* Read-only shift information */}
              <p className="mb-1">
                <strong>Employee:</strong> {user?.name}
              </p>

              <p className="mb-3">
                <strong>Date:</strong> {shift.date} &nbsp;{" "}
                <strong>Time:</strong> {shift.shift_start?.slice(0, 5)}–
                {shift.shift_end?.slice(0, 5)}
              </p>

              {/* Project */}
              <div className="mb-3">
                <label className="form-label fw-bold">Project</label>

                <select
                  className="form-select"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setSpecificationId("");
                  }}
                  disabled={!canEdit}
                >
                  <option value="">Select project...</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specification */}
              <div className="mb-3">
                <label className="form-label fw-bold">Specification</label>

                <select
                  className="form-select"
                  value={specificationId}
                  onChange={(e) => setSpecificationId(e.target.value)}
                  disabled={!canEdit || !projectId}
                >
                  <option value="">Select specification...</option>

                  {specifications
                    .filter(
                      (specification) =>
                        Number(specification.project_id) === Number(projectId),
                    )
                    .map((specification) => (
                      <option key={specification.id} value={specification.id}>
                        Version {specification.version}
                      </option>
                    ))}
                </select>
              </div>

              {/* Work Type */}
              <div className="mb-3">
                <label className="form-label fw-bold">Work Type</label>

                <select
                  className="form-select"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">Select...</option>

                  {WORK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Project Spec Description
                </label>
                <div className="form-control bg-light">
                  {selectedSpecification?.content ||
                    "No project content available"}
                </div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
            </div>

            <div className="modal-footer">
              {/* Only someone with manager level access can delete the allocation entirely */}
              {canDelete && (
                <button
                  type="button"
                  className="btn btn-outline-danger me-auto"
                  onClick={handleDelete}
                >
                  Delete Shift
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>

              {canEdit && (
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
