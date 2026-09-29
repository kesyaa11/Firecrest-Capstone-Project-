import {useState} from "react";
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

  //sanity check for the user object
  console.log("SD USER:", user);

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

            {/* Developer confirmation */}
            {handoff.success && (
              <div className="alert alert-success mt-3">
                ✓ Developer confirmed build matches specification
              </div>
            )}

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

            <h6>What this covers</h6>

            <p>{handoff.description || "No description provided"}</p>

            <hr />

            <h6>SD Review</h6>
            <label className="form-label">
              Review Message
            </label>

            <textarea
              className="form-control"
              rows="3"
              placeholder="Add notes about the review..."
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
            />

          </div>

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
              disabled={!reviewMessage.trim()}
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
        </div>
      </div>
    </div>
  );
}