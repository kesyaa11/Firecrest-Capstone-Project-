export default function ConfirmStageModal({
  confirmation,
  onConfirm,
  onClose,
}) {
  if (!confirmation) {
    return null;
  }

  const stageNames = {
    roadmap: "Roadmap",
    specs: "Specs",
    build: "Build",
    test_sheet: "Test",
    launch_plan: "Launch",
  };

  const stageName = stageNames[confirmation.field];

  return (
    <>
      <div className="modal show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                Confirm {stageName} Completion
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">
              <p className="mb-0">
                Are you sure the <strong>{stageName}</strong> stage has been
                completed?
              </p>
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
                className="btn btn-primary"
                onClick={onConfirm}
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="modal-backdrop show" />
    </>
  );
}