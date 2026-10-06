export default function ChangeRequestDetailsModal({
  changeRequest,
  users,
  onClose,
}) {
  if (!changeRequest) {
    return null;
  }

  const requester = users?.find(
    (user) => user.id === changeRequest.requester_id
  );

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                Requested Changes — {changeRequest.stage}
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">

              <div className="alert alert-warning">
                Changes have been requested for this stage.
              </div>

              <p className="mb-1">
                <strong>Requested by:</strong>{" "}
                {requester?.name || "Unknown user"}
              </p>

              <p className="mb-1">
                <strong>Date:</strong>{" "}
                {new Date(
                  changeRequest.created_at
                ).toLocaleString("en-NZ")}
              </p>

              <hr />

              <p className="mb-1">
                <strong>Reason for changes</strong>
              </p>

              <p className="mb-0">
                {changeRequest.reason}
              </p>

            </div>

            <div className="modal-footer">
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

      <div className="modal-backdrop show" />
    </>
  );
}