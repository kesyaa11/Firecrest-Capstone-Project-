import { deleteSpecificationHandoff } from "../../api/specificationHandoffs";

export default function HandoffDetailsModal({
  selectedHandoffDetails,
  onClose,
  refreshSpecificationHandoffs,
  handoffSignoffs,
  users,
  onResubmit,
}) {

  // Do not display the modal if no handoff has been selected
  if (!selectedHandoffDetails) {
    return null;
  }

  // Get the handoff, project and specification information
  const { handoff, project, specification } = selectedHandoffDetails;

  // Find all reviews that belong to this handoff
  const reviews = handoffSignoffs?.filter(
    (signoff) => signoff.handoff_id === handoff.id
  ) || [];

  // Get the most recent review
  const latestReview = reviews.length > 0
    ? reviews[reviews.length - 1]
    : null;

  // Find the user who submitted the review
  const reviewer = users?.find(
    (user) => user.id === latestReview?.signer_id
  );

  // Handle the deletion of the current handoff
  async function handleDeleteHandoff() {

    // Ask the developer to confirm before deleting
    const confirmed = window.confirm(
      "Are you sure you want to delete this handoff?"
    );

    if (!confirmed) {
      return;
    }

    try {

      // Delete the selected handoff
      await deleteSpecificationHandoff(handoff.id);

      // Reload handoffs so the tables update
      await refreshSpecificationHandoffs();

      // Close the details modal
      onClose();

    } catch (error) {
      console.error("Could not delete handoff:", error);
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

          {/* Modal header */}
          <div className="modal-header">
            <div>
              <small className="text-muted">
                {handoff.status === "Changes Requested"
                  ? "HANDOFF FEEDBACK"
                  : "HANDOFF"}
              </small>

              <h5 className="modal-title">
                {project?.name || "Unknown Project"} —{" "}
                {specification?.version || "Unknown Version"}
              </h5>
            </div>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>

          {/* Modal body */}
          <div className="modal-body">

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

            {/* Display SD review if one exists */}
            {latestReview && (
              <>
                <hr />

                <h6>SD Review</h6>

                <p>
                  <strong>Reviewed by:</strong>{" "}
                  {reviewer?.name || "Unknown reviewer"}
                </p>

                <p>
                  <strong>Review message:</strong>
                </p>

                <div className="border rounded p-3 bg-light">
                  {latestReview.handoff_message ||
                    "No review message provided"}
                </div>
              </>
            )}

          </div>

          {/* Modal footer */}
          <div className="modal-footer">

            {/* Only pending handoffs can be deleted */}
            {handoff.status === "Pending" && (
              <button
                type="button"
                className="btn btn-danger me-auto"
                onClick={handleDeleteHandoff}
              >
                Delete
              </button>
            )}

            {handoff.status === "Changes Requested" && (
              <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => onResubmit({
                      handoff: handoff,
                      project: project,
                      specification: specification,
                  })}
              >
                  Update & Resubmit
              </button>
            )}

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