import { useState } from "react";
import { createHandoffSignoff } from "../../api/handoffSignoffs";
import { updateSpecificationHandoff } from "../../api/specificationHandoffs";

export default function ReviewHandoffModal({
  selectedHandoff,
  user,
  onClose,
  refreshSpecificationHandoffs,
}) {
  // State for the review message
  const [reviewMessage, setReviewMessage] = useState("");

  // State for whether SD confirms the build matches the specification
  const [buildMatchesSpecs, setBuildMatchesSpecs] = useState(false);

  // Do not display modal until a handoff is selected
  if (!selectedHandoff) {
    return null;
  }

  const { handoff, project, specification } = selectedHandoff;

  async function handleReview(approved) {
    try {
      // Create the SD review/signoff record
      await createHandoffSignoff({
        handoff_id: handoff.id,
        signer_id: user.id,
        handoff_message: reviewMessage,
        signoff_date: new Date().toISOString(),
        success: approved,
      });

      // Update the original handoff with its new workflow status
      await updateSpecificationHandoff(handoff.id, {
        ...handoff,
        status: approved ? "Ready to test" : "Changes Requested",
      });

      // Reload handoffs so the tables display the new status
      await refreshSpecificationHandoffs();

      // Close the review modal
      onClose();
    } catch (error) {
      console.error("Could not complete handoff review:", error);
    }
  }

  function getHandoffDetails(description) {
    if (!description) {
      return {
        covers: "Not provided",
        testingInformation: "Not provided",
      };
    }

    const parts = description.split(
      "\n\nTesting information:\n"
    );

    const covers = parts[0]
      ?.replace("What this covers:\n", "")
      .trim();

    const testingInformation = parts[1]?.trim();

    return {
      covers: covers || "Not provided",
      testingInformation:
        testingInformation || "Not provided",
    };
  }

  const handoffDetails = getHandoffDetails(
    handoff.description
  );

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
            <div>
              <small className="text-muted">SD</small>
              <h5 className="modal-title">Review handoff</h5>
            </div>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>

          {/* Body */}
          <div className="modal-body">

            <h6>
              {project?.name || "Unknown Project"} —{" "}
              {specification?.version || "Unknown Version"}
            </h6>

            <p>
              <strong>Ticket: </strong>

              {specification?.link ? (
                <a
                  href={specification.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View ticket ↗
                </a>
              ) : (
                "Not provided"
              )}
            </p>

            <hr />

            <p>
              <strong>Submitted:</strong>{" "}
              {new Date(handoff.notified).toLocaleString("en-NZ")}
            </p>

            <p>
              <strong>Expected SD review:</strong>{" "}
              {handoff.expected
                ? new Date(handoff.expected).toLocaleString("en-NZ")
                : "Not provided"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {handoff.status || "Unknown"}
            </p>

            <hr />

            <div className="mb-3">
              <strong>What this covers</strong>

              <p className="mb-0">
                {handoffDetails.covers}
              </p>
            </div>

            <div className="mb-3">
              <strong>Testing information</strong>

              <p className="mb-0">
                {handoffDetails.testingInformation}
              </p>
            </div>

            <hr />

            {/* SD Review */}
            <h6>SD Review</h6>

            <label className="form-label">
              Review Message
            </label>

            <textarea
              className="form-control"
              rows="3"
              placeholder="Add notes about the review..."
              value={reviewMessage}
              onChange={(event) =>
                setReviewMessage(event.target.value)
              }
            />

            {/* SD confirmation */}
            <div className="form-check mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="buildMatchesSpecs"
                checked={buildMatchesSpecs}
                onChange={(event) =>
                  setBuildMatchesSpecs(event.target.checked)
                }
              />

              <label
                className="form-check-label"
                htmlFor="buildMatchesSpecs"
              >
                I confirm the build matches the specification
              </label>
            </div>

          </div>
          {/* End Body */}

          {/* Footer */}
          <div className="modal-footer">

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => handleReview(false)}
              disabled={!reviewMessage.trim()}
            >
              Request changes
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={() => handleReview(true)}
              disabled={
                !reviewMessage.trim() ||
                !buildMatchesSpecs
              }
            >
              Approve
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>

          </div>
          {/* End Footer */}

        </div>
      </div>
    </div>
  );
}