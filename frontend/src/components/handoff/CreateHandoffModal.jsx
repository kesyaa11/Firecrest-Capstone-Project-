import {useState, useEffect} from "react";
import {createSpecificationHandoff, updateSpecificationHandoff} from "../../api/specificationHandoffs";

export default function CreateHandoffModal({ 
    selectedHandoff, 
    onClose,
    refreshSpecificationHandoffs,
    existingHandoff = null
}) {

    if(!selectedHandoff) {
        return null; // Don't render the modal if no handoff is selected
    }

    // Determine if this is a resubmission of an existing handoff
    const isResubmitting = existingHandoff !== null;

    //state for handoff details
    const [expected, setExpected] = useState("");
    const [description, setDescription] = useState("");
    const [testingInformation, setTestingInformation] = useState("");

    useEffect(() => {

        if (existingHandoff) {

            // Get the previously saved handoff description
            const storedDescription =
                existingHandoff.description || "";

            // Separate the two sections
            const parts = storedDescription.split(
                "\n\nTesting information:\n"
            );

            // Put the previous information back into each textbox
            const covers = parts[0]
                ?.replace("What this covers:\n", "") || "";

            const testing = parts[1] || "";

            setDescription(covers);
            setTestingInformation(testing);

        } else {

            // New handoff starts with empty fields
            setExpected("");
            setDescription("");
            setTestingInformation("");
        }

    }, [existingHandoff, selectedHandoff]);

    const {project, specification} = selectedHandoff;

    async function handleSubmitHandoff() {
        const combinedDescription =
            `What this covers:\n${description}\n\n` +
            `Testing information:\n${testingInformation}`;
            
        const handoff = {
            project_id: project.id,
            specification_id: specification.id,

            // Record when the handoff was submitted/resubmitted
            notified: new Date().toISOString(),

            //Values from the form inputs
            expected: new Date(expected).toISOString(),
            description: combinedDescription,

            // New handoffs start as pending until review or goes back to pending so SD can review again
            status: "Pending",

        };
        try {

            if (isResubmitting) {

                // Update the existing handoff
                await updateSpecificationHandoff(
                    existingHandoff.id,
                    {
                        ...handoff,
                        id: existingHandoff.id
                    }
                );

                console.log("Handoff resubmitted successfully");

            } else {

                // Create a brand new handoff
                const createdHandoff =
                    await createSpecificationHandoff(handoff);

                console.log(
                    "Handoff created successfully:",
                    createdHandoff
                );
            }

            // Reload handoffs so the page updates
            await refreshSpecificationHandoffs();

            onClose();

        } catch (error) {
            console.error(
                "Could not submit handoff:",
                error
            );
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

                    <div className="modal-header">
                        <div>
                            {/* <small className="text-muted">DEV</small> */}
                            <h5 className="modal-title">
                                {isResubmitting ? "Update & Resubmit Handoff" : "Create Handoff"}
                            </h5>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        />
                    </div>

                    <div className="modal-body">

                        <h6>
                            {project?.name} - {specification.version}
                        </h6>

                        <div className="alert alert-success mt-3">
                            ✓ Build complete
                        </div>

                        <p>
                            <strong>Ticket: </strong>

                            {specification.link ? (
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

                        <div className="mb-3">
                            <label
                                htmlFor="expected"
                                className="form-label"
                            >
                                Expected SD review by
                            </label>

                            <input
                                id="expected"
                                type="datetime-local"
                                className="form-control"
                                value={expected}
                                onChange={(event) =>
                                    setExpected(event.target.value)
                                }
                            />
                        </div>

                        <div className="mb-3">
                            <label
                                htmlFor="description"
                                className="form-label"
                            >
                                What this covers
                            </label>

                            <textarea
                                id="description"
                                className="form-control"
                                rows="4"
                                placeholder="Describe what is included in this handoff..."
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                        </div>

                        <div className="mb-3">
                            <label
                                htmlFor="testingInformation"
                                className="form-label"
                            >
                                Testing information
                            </label>

                            <textarea
                                id="testingInformation"
                                className="form-control"
                                rows="4"
                                placeholder="Provide any information SD needs for testing, such as the build URL, environment, login details, or special instructions..."
                                value={testingInformation}
                                onChange={(event) =>
                                    setTestingInformation(event.target.value)
                                }
                            />
                        </div>

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
                            className="btn btn-dark"
                            disabled={!expected || !description}
                            onClick={handleSubmitHandoff}
                        >
                            {isResubmitting ? "Resubmit" : "Done"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}