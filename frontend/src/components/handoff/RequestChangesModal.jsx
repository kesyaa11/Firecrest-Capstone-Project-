import { useState } from "react";
import { createSpecificationChangeRequest } from "../../api/specificationChangeRequests";
import { updateProjectSpecification } from "../../api/projectSpecifications";
import { updateSpecificationHandoff } from "../../api/specificationHandoffs";

export default function RequestChangesModal({
  changeRequest,
  onClose,
  user,
  specificationHandoffs = [],
  refreshProjectSpecifications,
  refreshSpecificationChangeRequests,
  refreshSpecificationHandoffs,
}) {
  const [reason, setReason] = useState("");

  if (!changeRequest) {
    return null;
  }

  // Convert database field names into names shown to the user
  const stageNames = {
    roadmap: "Roadmap",
    specs: "Specs",
    build: "Build",
    test_sheet: "Test",
    launch_plan: "Launch",
  };

  const stageName =
    stageNames[changeRequest.field] || changeRequest.field;

  async function handleRequestChanges() {
    if (!reason.trim()) {
      return;
    }

    try {
      const specification = changeRequest.specification;
      const field = changeRequest.field;

      console.log("Logged in user:", user);

      // Save the reason for going backwards
      await createSpecificationChangeRequest({
        specification_id: specification.id,
        requester_id: user.id,
        stage: stageName,
        reason: reason.trim(),
      });

      // Start with the current specification
      const updatedSpecification = {
        ...specification,
      };

      // Reset the selected stage and everything after it
      if (field === "roadmap") {
        updatedSpecification.roadmap = false;
        updatedSpecification.specs = false;
        updatedSpecification.build = false;
        updatedSpecification.test_sheet = false;
        updatedSpecification.launch_plan = false;
      }

      if (field === "specs") {
        updatedSpecification.specs = false;
        updatedSpecification.build = false;
        updatedSpecification.test_sheet = false;
        updatedSpecification.launch_plan = false;
      }

      if (field === "build") {
        updatedSpecification.build = false;
        updatedSpecification.test_sheet = false;
        updatedSpecification.launch_plan = false;
      }

      if (field === "test_sheet") {
        updatedSpecification.test_sheet = false;
        updatedSpecification.launch_plan = false;
      }

      if (field === "launch_plan") {
        updatedSpecification.launch_plan = false;
      }

      // Update the project progress
      await updateProjectSpecification(
        specification.id,
        updatedSpecification
      );

      // Find the handoff belonging to this project specification
      const handoff = specificationHandoffs.find(
        (handoff) =>
          handoff.specification_id === specification.id
      );

      // These statuses are controlled by the special
      // handoff and testing workflows
      const protectedStatuses = [
        "Pending SD Review",
        "Test Failed - Changes Requested",
      ];

      // For normal project stage changes,
      // update the status to Changes Requested
      if (
        handoff &&
        !protectedStatuses.includes(handoff.status)
      ) {
        await updateSpecificationHandoff(handoff.id, {
          ...handoff,
          status: "Changes Requested",
        });
      }

      // Reload the updated data from the backend
      await refreshProjectSpecifications();
      await refreshSpecificationChangeRequests();

      if (refreshSpecificationHandoffs) {
        await refreshSpecificationHandoffs();
      }

      onClose();
    } catch (error) {
      console.error("Could not request project changes:", error);
    }
  }

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            {/* Modal header */}
            <div className="modal-header">
              <h5 className="modal-title">
                Request Changes — {stageName}
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>

            {/* Modal body */}
            <div className="modal-body">
              <p className="text-muted">
                Explain why changes are being requested for the{" "}
                <strong>{stageName}</strong> stage.
              </p>

              <br />

              <textarea
                id="changeReason"
                className="form-control"
                rows="4"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Describe what needs to be changed..."
              />
            </div>

            {/* Modal footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={!reason.trim()}
                onClick={handleRequestChanges}
              >
                Request Changes
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="modal-backdrop show" />
    </>
  );
}