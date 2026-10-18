import { useState } from "react";

export default function ManageProjectsModal({
  show,
  projects = [],
  updateProject,
  refreshProjects,
  onClose,
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!show) return null;

  const selectedProject = projects.find(
    (project) => String(project.id) === selectedProjectId,
  );

  const isActive = selectedProject?.is_active === true;

  function handleClose() {
    if (saving) return;

    setSelectedProjectId("");
    setConfirming(false);
    setError("");
    onClose();
  }

  async function handleConfirm() {
    if (!selectedProject || saving) return;

    setSaving(true);
    setError("");

    try {
      await updateProject(selectedProject.id, {
        ...selectedProject,
        is_active: !isActive,
      });

      await refreshProjects();

      handleCloseAfterSave();
    } catch (err) {
      console.error("Failed to update project:", err);
      setError("Failed to update the project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCloseAfterSave() {
    setSelectedProjectId("");
    setConfirming(false);
    setError("");
    onClose();
  }

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-projects-title"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title" id="manage-projects-title">
              Manage projects
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={saving}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body">
            <p className="text-muted small">
              Change a project&apos;s activity status. All specifications
              belonging to that project will appear under the corresponding
              Active or Inactive tab.
            </p>

            <br />

            <label className="form-label" htmlFor="manage-project-select">
              Select project
            </label>

            <select
              id="manage-project-select"
              className="form-select mb-3"
              value={selectedProjectId}
              disabled={saving}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setConfirming(false);
                setError("");
              }}
            >
              <option value="">Select a project</option>

              {[...projects]
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((project) => (
                  <option key={project.id} value={String(project.id)}>
                    {project.name}
                  </option>
                ))}
            </select>

            {selectedProject && (
              <>
                <div className="d-flex justify-content-between align-items-center border rounded p-3 mb-3">
                  <span>Current status</span>

                  <span
                    className={`badge ${
                      isActive ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {confirming && (
                  <div className="alert alert-warning">
                    <strong>
                      {isActive
                        ? "Mark project as inactive?"
                        : "Reactivate project?"}
                    </strong>

                    <p className="mb-0 mt-2">
                      {isActive
                        ? `All specifications belonging to ${selectedProject.name} will move to the Inactive tab. No project data will be deleted.`
                        : `All specifications belonging to ${selectedProject.name} will move to the Active tab.`}
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>

            {selectedProject && (
              <button
                type="button"
                className={
                  isActive ? "btn btn-outline-danger" : "btn btn-success"
                }
                disabled={saving}
                onClick={() => {
                  if (confirming) {
                    handleConfirm();
                  } else {
                    setConfirming(true);
                  }
                }}
              >
                {saving
                  ? "Saving..."
                  : confirming
                    ? "Confirm"
                    : isActive
                      ? "Mark as inactive"
                      : "Reactivate project"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
