import { useState } from "react";

import ProjectDetailsModal from "./ProjectDetailsModal";
import CreateHandoffModal from "./CreateHandoffModal";
import HandoffDetailsModal from "./HandoffDetailsModal";
import RequestChangesModal from "./RequestChangesModal";
import ChangeRequestDetailsModal from "./ChangeRequestDetailsModal";
import ConfirmStageModal from "./ConfirmStageModal";
import ProgressIndicators from "./ProgressIndicators";

import {
  updateProjectSpecification,
} from "../../api/projectSpecifications";

import {
  updateSpecificationChangeRequest,
} from "../../api/specificationChangeRequests";

import {
  updateSpecificationHandoff,
} from "../../api/specificationHandoffs";


export default function DeveloperProjects({
  user,
  projects,
  projectSpecifications,
  specificationHandoffs,
  handoffSignoffs,
  refreshSpecificationHandoffs,
  refreshProjectSpecifications,
  users,
  specificationChangeRequests,
  refreshSpecificationChangeRequests,
}) {

  // Currently selected project specification
  const [selectedSpecification, setSelectedSpecification] =
    useState(null);

  // Specification selected when creating a new handoff
  const [selectedHandoff, setSelectedHandoff] =
    useState(null);

  // Existing handoff selected for viewing
  const [selectedHandoffDetails, setSelectedHandoffDetails] =
    useState(null);

  // Handoff selected for resubmission
  const [resubmitHandoff, setResubmitHandoff] =
    useState(null);

  // Project stage selected for requesting changes
  const [changeRequest, setChangeRequest] =
    useState(null);

  // Change request selected for viewing
  const [selectedChangeRequest, setSelectedChangeRequest] =
    useState(null);

  // Project stage selected for confirmation
  const [stageConfirmation, setStageConfirmation] =
    useState(null);

  // Controls the launch bell animation
  const [showLaunchBell, setShowLaunchBell] =
    useState(false);


  // Handle changes in project progress checkboxes
  function handleProgressChange(
    specification,
    field,
    checked
  ) {

    // A completed stage is being unchecked
    if (!checked) {
      setChangeRequest({
        specification: specification,
        field: field,
      });

      return;
    }

    // An incomplete stage is being marked complete.
    // Ask for confirmation before updating the database.
    setStageConfirmation({
      specification: specification,
      field: field,
    });
  }


  // Confirm stage completion
  async function confirmStageCompletion() {

    if (!stageConfirmation) {
      return;
    }

    try {

      const specification =
        stageConfirmation.specification;

      const field =
        stageConfirmation.field;

      const stageNames = {
        roadmap: "Roadmap",
        specs: "Specs",
        build: "Build",
        test_sheet: "Test",
        launch_plan: "Launch",
      };

      const stageName =
        stageNames[field];


      // Mark the selected stage as complete
      const updatedSpecification = {
        ...specification,
        [field]: true,
      };

      await updateProjectSpecification(
        specification.id,
        updatedSpecification
      );


      // Find an unresolved change request
      // for this specific stage
      const existingChangeRequest =
        specificationChangeRequests?.find(
          (request) =>
            request.specification_id ===
              specification.id &&
            request.stage === stageName &&
            request.resolved === false
        );


      // Resolve the warning for this stage
      if (existingChangeRequest) {

        await updateSpecificationChangeRequest(
          existingChangeRequest.id,
          {
            ...existingChangeRequest,
            resolved: true,
          }
        );
      }


      // Reload project progress and warnings
      await refreshProjectSpecifications();
      await refreshSpecificationChangeRequests();

      setStageConfirmation(null);


      // Launch has its own completion behaviour
      if (field === "launch_plan") {

        const handoff =
          specificationHandoffs.find(
            (handoff) =>
              handoff.specification_id ===
              specification.id
          );


        // Mark the handoff as launched
        if (handoff) {

          await updateSpecificationHandoff(
            handoff.id,
            {
              ...handoff,
              status: "Launched",
            }
          );

          await refreshSpecificationHandoffs();
        }


        // Show launch celebration
        setShowLaunchBell(true);

        setTimeout(() => {
          setShowLaunchBell(false);
        }, 2000);
      }

    } catch (error) {

      console.error(
        "Could not complete project stage:",
        error
      );
    }
  }


  return (
    <>

      {/* My Projects */}
      <div className="card shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">
            Projects
          </h5>

          <div className="table-responsive">

            <table
              className="table table-hover align-middle mb-0"
              style={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >

              <thead>
                <tr>
                  <th
                    style={{
                      width: "320px",
                      minWidth: "320px",
                      maxWidth: "320px",
                    }}
                  >
                    Project / version
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "90px" }}
                  >
                    Roadmap
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "90px" }}
                  >
                    Specs
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "90px" }}
                  >
                    Build
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "90px" }}
                  >
                    Test
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "90px" }}
                  >
                    Launch
                  </th>

                  <th
                    className="text-end"
                    style={{ width: "220px" }}
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>

                {projectSpecifications.map(
                  (specification) => {

                    // Find parent project
                    const project =
                      projects.find(
                        (project) =>
                          project.id ===
                          specification.project_id
                      );


                    // Find existing handoff
                    const handoff =
                      specificationHandoffs.find(
                        (handoff) =>
                          handoff.specification_id ===
                          specification.id
                      );


                    // Check whether this specification
                    // has ANY unresolved change request
                    const unresolvedChangeRequest =
                      specificationChangeRequests?.find(
                        (request) =>
                          request.specification_id ===
                            specification.id &&
                          request.resolved === false
                      );


                    return (

                      <tr
                        key={specification.id}
                        style={{ height: "64px" }}
                      >

                        {/* Project / version */}
                        <td
                          style={{
                            width: "320px",
                            minWidth: "320px",
                            maxWidth: "320px",
                          }}
                        >

                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none text-start w-100"
                            onClick={() =>
                              setSelectedSpecification({
                                project: project,
                                specification: specification,
                              })
                            }
                          >

                            {/* Client */}
                            <div
                              className="text-muted small text-truncate"
                              style={{ maxWidth: "300px" }}
                            >
                              {project?.client || "Unknown Client"}
                            </div>


                            {/* Project group + milestone + version */}
                            <div
                              className="text-truncate"
                              style={{ maxWidth: "300px" }}
                              title={`${project?.name || "Unknown Project"}${
                                specification.name
                                  ? ` · ${specification.name}`
                                  : ""
                              }${
                                specification.version
                                  ? ` — ${specification.version}`
                                  : ""
                              }`}
                            >

                              <span className="fw-semibold">
                                {project?.name || "Unknown Project"}
                              </span>

                              {specification.name && (
                                <>
                                  {" · "}
                                  {specification.name}
                                </>
                              )}

                              {specification.version && (
                                <>
                                  {" — "}
                                  {specification.version}
                                </>
                              )}

                            </div>

                          </button>

                        </td>


                        {/* Shared progress indicators */}
                        <ProgressIndicators
                          specification={
                            specification
                          }
                          specificationChangeRequests={
                            specificationChangeRequests
                          }
                          onProgressChange={
                            handleProgressChange
                          }
                          onViewChangeRequest={
                            setSelectedChangeRequest
                          }
                        />


                        {/* Project / handoff status */}
                        <td className="text-end">

                          {/* Changes requested before a handoff exists */}
                          {!handoff &&
                          unresolvedChangeRequest ? (

                            <span className="text-danger">
                              Changes requested
                            </span>


                          ) : handoff?.status ===
                            "Pending" ? (

                            <span className="text-muted">
                              Sent for review
                            </span>


                          ) : handoff?.status ===
                            "Changes Requested" ? (

                            <span className="text-danger">
                              Changes requested
                            </span>


                          ) : handoff?.status ===
                            "Ready to test" ? (

                            <span className="text-success">
                              Ready to test
                            </span>


                          ) : handoff?.status ===
                            "Testing Passed - Ready for Launch" ? (

                            <span className="text-success">
                              Testing Passed — Ready for Launch
                            </span>


                          ) : handoff?.status ===
                            "Launched" ? (

                            <span className="text-success fw-semibold">
                              ✓ Launched
                            </span>


                          ) : handoff?.status ===
                              "Test Failed - Changes Requested" &&
                            specification.build ? (

                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() =>
                                setResubmitHandoff({
                                  handoff: handoff,
                                  project: project,
                                  specification:
                                    specification,
                                })
                              }
                            >
                              Update & Resubmit
                            </button>


                          ) : handoff?.status ===
                            "Test Failed - Changes Requested" ? (

                            <span className="text-danger">
                              Test Failed — Changes Requested
                            </span>


                          ) : handoff ? (

                            <span className="text-muted">
                              {handoff.status}
                            </span>


                          ) : specification.build ? (

                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() =>
                                setSelectedHandoff({
                                  project: project,
                                  specification:
                                    specification,
                                })
                              }
                            >
                              Create handoff
                            </button>


                          ) : (

                            <span className="text-muted">
                              In progress
                            </span>

                          )}

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>


          {/* Handoffs */}
          <div className="card shadow-sm mt-4">

            <div className="card-body">

              <h5 className="mb-3">
                Handoffs
              </h5>

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead>
                    <tr>
                      <th>
                        Project / version
                      </th>

                      <th>
                        Submitted
                      </th>

                      <th>
                        Expected SD review
                      </th>

                      <th>
                        Status
                      </th>

                      <th className="text-end">
                        Action
                      </th>
                    </tr>
                  </thead>


                  <tbody>

                    {specificationHandoffs.length === 0 ? (

                      <tr>
                        <td
                          colSpan="5"
                          className="text-center text-muted py-4"
                        >
                          No current handoffs
                        </td>
                      </tr>

                    ) : (

                      specificationHandoffs.map(
                        (handoff) => {

                          // Find associated specification
                          const specification =
                            projectSpecifications.find(
                              (specification) =>
                                specification.id ===
                                handoff.specification_id
                            );


                          // Find associated project
                          const project =
                            projects.find(
                              (project) =>
                                project.id ===
                                handoff.project_id
                            );


                          return (

                            <tr key={handoff.id}>

                              {/* Project / version */}
                              <td>

                                <button
                                  type="button"
                                  className="btn btn-link p-0 text-decoration-none text-start w-100"
                                  onClick={() =>
                                    setSelectedHandoffDetails({
                                      handoff:
                                        handoff,
                                      project:
                                        project,
                                      specification:
                                        specification,
                                    })
                                  }
                                >

                                  <div className="text-muted small">
                                    {project?.client ||
                                      "Unknown Client"}
                                  </div>

                                  <div>

                                    <span className="fw-semibold">
                                      {project?.name ||
                                        "Unknown Project"}
                                    </span>

                                    {specification?.name && (
                                      <>
                                        {" · "}
                                        {
                                          specification.name
                                        }
                                      </>
                                    )}

                                    {specification?.version && (
                                      <>
                                        {" — "}
                                        {
                                          specification.version
                                        }
                                      </>
                                    )}

                                  </div>

                                </button>

                              </td>


                              {/* Date submitted */}
                              <td>

                                {handoff.notified
                                  ? new Date(
                                      handoff.notified
                                    ).toLocaleString(
                                      "en-NZ"
                                    )
                                  : "Unknown"}

                              </td>


                              {/* Expected SD review */}
                              <td>

                                {handoff.expected
                                  ? new Date(
                                      handoff.expected
                                    ).toLocaleString(
                                      "en-NZ"
                                    )
                                  : "Not provided"}

                              </td>


                              {/* Handoff status */}
                              <td>
                                {handoff.status ||
                                  "Unknown"}
                              </td>


                              {/* Action */}
                              <td className="text-end">

                                {handoff.status ===
                                "Changes Requested" ? (

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() =>
                                      setSelectedHandoffDetails({
                                        handoff:
                                          handoff,
                                        project:
                                          project,
                                        specification:
                                          specification,
                                      })
                                    }
                                  >
                                    View feedback
                                  </button>

                                ) : (

                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() =>
                                      setSelectedHandoffDetails({
                                        handoff:
                                          handoff,
                                        project:
                                          project,
                                        specification:
                                          specification,
                                      })
                                    }
                                  >
                                    View
                                  </button>

                                )}

                              </td>

                            </tr>
                          );
                        }
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>
      </div>


      {/* Launch celebration bell */}
      {showLaunchBell && (
        <div className="launch-bell">
          🔔
        </div>
      )}


      {/* Project details */}
      <ProjectDetailsModal
        selectedSpecification={
          selectedSpecification
        }
        onClose={() =>
          setSelectedSpecification(null)
        }
      />


      {/* Create handoff */}
      <CreateHandoffModal
        selectedHandoff={
          selectedHandoff
        }
        onClose={() =>
          setSelectedHandoff(null)
        }
        refreshSpecificationHandoffs={
          refreshSpecificationHandoffs
        }
      />


      {/* Existing handoff details */}
      <HandoffDetailsModal
        selectedHandoffDetails={
          selectedHandoffDetails
        }
        handoffSignoffs={
          handoffSignoffs
        }
        onClose={() =>
          setSelectedHandoffDetails(null)
        }
        refreshSpecificationHandoffs={
          refreshSpecificationHandoffs
        }
        users={users}
        onResubmit={(handoffDetails) => {

          setSelectedHandoffDetails(null);

          setResubmitHandoff(
            handoffDetails
          );
        }}
      />


      {/* Resubmit handoff */}
      <CreateHandoffModal
        selectedHandoff={
          resubmitHandoff
        }
        existingHandoff={
          resubmitHandoff?.handoff
        }
        onClose={() =>
          setResubmitHandoff(null)
        }
        refreshSpecificationHandoffs={
          refreshSpecificationHandoffs
        }
      />


      {/* Request project stage changes */}
      <RequestChangesModal
        changeRequest={
          changeRequest
        }
        onClose={() =>
          setChangeRequest(null)
        }
        user={user}
        specificationHandoffs={
          specificationHandoffs
        }
        refreshProjectSpecifications={
          refreshProjectSpecifications
        }
        refreshSpecificationChangeRequests={
          refreshSpecificationChangeRequests
        }
        refreshSpecificationHandoffs={
          refreshSpecificationHandoffs
        }
      />


      {/* Requested change details */}
      <ChangeRequestDetailsModal
        changeRequest={
          selectedChangeRequest
        }
        users={users}
        onClose={() =>
          setSelectedChangeRequest(null)
        }
      />


      {/* Confirm stage completion */}
      <ConfirmStageModal
        confirmation={
          stageConfirmation
        }
        onConfirm={
          confirmStageCompletion
        }
        onClose={() =>
          setStageConfirmation(null)
        }
      />

    </>
  );
}