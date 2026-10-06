import { useState } from "react";
import { createSpecificationChangeRequest } from "../../api/specificationChangeRequests";
import { updateProjectSpecification } from "../../api/projectSpecifications";
import { updateSpecificationHandoff } from "../../api/specificationHandoffs";

export default function TestingResultModal({
  testingProject,
  onClose,
  user,
  refreshProjectSpecifications,
  refreshSpecificationChangeRequests,
  refreshSpecificationHandoffs,
}) {
  // Store the reason entered when testing fails
  const [failureReason, setFailureReason] = useState("");

  // Store which stage the project needs to return to
  const [failureStage, setFailureStage] = useState("");

  if (!testingProject) {
    return null;
  }

  const { project, specification, handoff } = testingProject;

  // Handle passing the testing stage
  async function handlePass() {
    try {
      // Mark the Test stage as completed
      const updatedSpecification = {
        ...specification,
        test_sheet: true,
      };

      await updateProjectSpecification(
        specification.id,
        updatedSpecification
      );

      // Update the same handoff to show testing passed
      await updateSpecificationHandoff(
        handoff.id,
        {
          ...handoff,
          status: "Testing Passed - Ready for Launch",
        }
      );

      // Refresh the progress and handoff status
      await refreshProjectSpecifications();
      await refreshSpecificationHandoffs();

      onClose();

    } catch (error) {
      console.error(
        "Could not record passed testing:",
        error
      );
    }
  }

  // Handle failing the testing stage
  async function handleFail() {
    if (!failureReason.trim() || !failureStage) {
      return;
    }

    try {
      // Record why testing failed
      await createSpecificationChangeRequest({
        specification_id: specification.id,
        requester_id: user.id,
        stage: failureStage,
        reason: failureReason.trim(),
      });

      // Send the project back to Build
      const updatedSpecification = {
        ...specification,
      };

      // If the problem is with the build, send the project back to Build
      if (failureStage === "Build") {
        updatedSpecification.build = false;
        updatedSpecification.test_sheet = false;
        updatedSpecification.launch_plan = false;
      }

      // If the problem is with the specification, send the project back to Specs
      if (failureStage === "Specs") {
        updatedSpecification.specs = false;
        updatedSpecification.build = false;
        updatedSpecification.test_sheet = false;
        updatedSpecification.launch_plan = false;
      }

      await updateProjectSpecification(
        specification.id,
        updatedSpecification
      );
      
      // Update the handoff status to show that testing failed
      await updateSpecificationHandoff(
        handoff.id,
        {
          ...handoff,
          status: "Test Failed - Changes Requested",
        }
      );

      // Refresh the progress indicators and warnings
      await refreshProjectSpecifications();
      await refreshSpecificationChangeRequests();
      await refreshSpecificationHandoffs();

      onClose();

    } catch (error) {
      console.error(
        "Could not record failed testing:",
        error
      );
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

            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                Testing Result
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>

            {/* Body */}
            <div className="modal-body">

              <p>
                <strong>Project:</strong>{" "}
                {project?.name || "Unknown Project"}
              </p>

              <p>
                <strong>Version:</strong>{" "}
                {specification.version}
              </p>

              <hr />

              <p className="mb-2">
                Did the handoff fail or pass testing?
              </p>

              <div className="mb-3">
                <label
                  htmlFor="testingNotes"
                  className="form-label"
                >
                </label>

                <textarea
                  id="testingNotes"
                  className="form-control"
                  rows="4"
                  placeholder="Enter the reason for failure, or any additional notes if testing passed..."
                  value={failureReason}
                  onChange={(event) =>
                    setFailureReason(event.target.value)
                  }
                />
              </div>

              <div className="mb-3">
                <label
                  htmlFor="failureStage"
                  className="form-label"
                >
                  If testing failed, changes are required in
                </label>

                <select
                  id="failureStage"
                  className="form-select"
                  value={failureStage}
                  onChange={(event) =>
                    setFailureStage(event.target.value)
                  }
                >
                  <option value="">
                    Select stage...
                  </option>

                  <option value="Build">
                    Build
                  </option>

                  <option value="Specs">
                    Specification
                  </option>
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
                className="btn btn-danger"
                disabled={!failureReason.trim() || !failureStage}
                onClick={handleFail}
              >
                Fail
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handlePass}
              >
                Pass
              </button>

            </div>

          </div>
        </div>
      </div>

      <div className="modal-backdrop show" />
    </>
  );
}