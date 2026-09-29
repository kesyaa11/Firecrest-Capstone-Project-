export default function ProjectDetailsModal({
    selectedSpecification,
    onClose,
}) {

    if (!selectedSpecification) {
        return null; // Don't render the modal if no specification is selected
    }

    const { project, specification } = selectedSpecification;

    return (
        <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">

                    {/* Modal Header */}
                    <div className="modal-header">
                        <div>
                            <h5 className="modal-title">
                                {project?.name} - {specification.version}
                            </h5>

                            <span className="text-muted">
                                {project?.client}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        />
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body">
                        <h6>Project Details</h6>

                        <p>
                            <strong>Project Name:</strong> {project?.name}
                        </p>

                        <p>
                            <strong>Client:</strong> {project?.client}
                        </p>

                        <p>
                            <strong>Tracker Number:</strong> {project?.tracker_ref}
                        </p>

                        <hr />

                        <h6>Project specification</h6>

                        <p>
                            <strong>Name:</strong> {specification.name}
                        </p>

                        <p>
                            <strong>Version:</strong> {specification.version}
                        </p>

                        <p>
                            <strong>Target date:</strong>{" "}
                            {specification.target_date
                                ? new Date(
                                    specification.target_date
                                  ).toLocaleDateString("en-NZ")
                                : "Not provided"}
                        </p>

                        <p>
                            <strong>Ticket:</strong>{" "}
                            {specification.link ? (
                                <a
                                    href={specification.link}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View ticket ↗
                                </a>
                            ) : (
                                "Not provided"
                            )}
                        </p>

                        <hr />

                        <h6>Progress</h6>

                        <div className="d-flex gap-4 flex-wrap">
                            <span>
                                {specification.roadmap ? "✓" : "—"} Roadmap
                            </span>

                            <span>
                                {specification.specs ? "✓" : "—"} Specs
                            </span>

                            <span>
                                {specification.build ? "✓" : "—"} Build
                            </span>

                            <span>
                                {specification.test_sheet ? "✓" : "—"} Test
                            </span>

                            <span>
                                {specification.launch_plan ? "✓" : "—"} Launch
                            </span>
                        </div>
                    </div>

                    {/* Modal Footer */}
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
    );
}