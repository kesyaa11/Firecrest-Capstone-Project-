import { useState } from "react";

import ReviewHandoffModal from "./ReviewHandoffModal";
import ProjectDetailsModal from "./ProjectDetailsModal";
import ProgressIndicators from "./ProgressIndicators";
import RequestChangesModal from "./RequestChangesModal";
import ChangeRequestDetailsModal from "./ChangeRequestDetailsModal";
import ConfirmStageModal from "./ConfirmStageModal";
import TestingResultModal from "./TestingResultModal";
import NewClientProjectModal from "./NewClientProjectModal";
import AddProjectMilestoneModal from "./AddProjectMilestoneModal";

import {
  updateProjectSpecification,
} from "../../api/projectSpecifications";

import {
  updateSpecificationChangeRequest,
} from "../../api/specificationChangeRequests";


export default function SDProjects({
  user,
  projects,
  projectSpecifications,
  specificationHandoffs,
  refreshSpecificationHandoffs,
  refreshProjectSpecifications,
  users,
  specificationChangeRequests = [],
  refreshSpecificationChangeRequests,
  refreshProjects,
}) {

  // Project selected for viewing
  const [selectedSpecification, setSelectedSpecification] =
    useState(null);

  // Handoff selected for SD review
  const [selectedHandoff, setSelectedHandoff] =
    useState(null);

  // Project stage selected when requesting changes
  const [changeRequest, setChangeRequest] =
    useState(null);

  // Existing change request selected for viewing
  const [selectedChangeRequest, setSelectedChangeRequest] =
    useState(null);

  // Project stage selected for completion confirmation
  const [stageConfirmation, setStageConfirmation] =
    useState(null);

  // Project selected for testing
  const [testingProject, setTestingProject] =
    useState(null);

  // Handoff selected for viewing testing information
  const [testingInfoHandoff, setTestingInfoHandoff] =
    useState(null);

  // Controls New Client Project modal
  const [showNewClientProject, setShowNewClientProject] =
    useState(false);

  // Controls Add Project / Milestone modal
  const [
    showAddProjectMilestone,
    setShowAddProjectMilestone,
  ] = useState(false);


  // Handle progress checkbox being clicked
  function handleProgressChange(
    specification,
    field,
    checked
  ) {

    // Completed stage is being unchecked
    if (!checked) {

      setChangeRequest({
        specification: specification,
        field: field,
      });

      return;
    }


    // Stage is being completed
    setStageConfirmation({
      specification: specification,
      field: field,
    });
  }


  // Confirm project stage completion
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


      // Mark selected stage complete
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
        specificationChangeRequests.find(
          (request) =>
            request.specification_id ===
              specification.id &&
            request.stage === stageName &&
            request.resolved === false
        );


      // Resolve warning
      if (existingChangeRequest) {

        await updateSpecificationChangeRequest(
          existingChangeRequest.id,
          {
            ...existingChangeRequest,
            resolved: true,
          }
        );
      }


      // Reload progress
      await refreshProjectSpecifications();

      // Reload warnings
      await refreshSpecificationChangeRequests();

      setStageConfirmation(null);

    } catch (error) {

      console.error(
        "Could not complete project stage:",
        error
      );
    }
  }


  // Extract testing information
  function getTestingInformation(description) {

    if (!description) {
      return "No testing information provided";
    }

    const parts = description.split(
      "\n\nTesting information:\n"
    );

    return (
      parts[1]?.trim() ||
      "No testing information provided"
    );
  }


  return (
    <>

      <div className="card shadow-sm">

        <div className="card-body">


          {/* Projects header */}
          <div className="d-flex justify-content-between align-items-center mb-3">

            <h5 className="mb-0">
              Projects
            </h5>


            <div className="d-flex gap-2">

              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() =>
                  setShowAddProjectMilestone(true)
                }
              >
                + Add Project / Milestone
              </button>


              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() =>
                  setShowNewClientProject(true)
                }
              >
                + New Client Project
              </button>

            </div>

          </div>


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


                    // Find handoff
                    const handoff =
                      specificationHandoffs.find(
                        (handoff) =>
                          handoff.specification_id ===
                          specification.id
                      );


                    // Check whether ANY unresolved
                    // change request exists
                    const unresolvedChangeRequest =
                      specificationChangeRequests.find(
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
                              style={{
                                maxWidth: "300px",
                              }}
                            >
                              {project?.client || "Unknown Client"}
                            </div>

                            {/* Project group + milestone + version */}
                            <div
                              className="text-truncate"
                              style={{
                                maxWidth: "300px",
                              }}
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


                        {/* Status / handoff review */}
                        <td className="text-end">


                          {/* No handoff, but changes requested */}
                          {!handoff &&
                          unresolvedChangeRequest ? (

                            <span className="text-danger">
                              Changes requested
                            </span>


                          ) : !handoff ? (

                            <span className="text-muted">
                              In progress
                            </span>


                          ) : handoff.status ===
                            "Pending" ? (

                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() =>
                                setSelectedHandoff({
                                  handoff:
                                    handoff,
                                  project:
                                    project,
                                  specification:
                                    specification,
                                })
                              }
                            >
                              Review handoff
                            </button>


                          ) : handoff.status ===
                            "Test Failed - Changes Requested" ? (

                            <span className="text-danger">
                              Test Failed — Changes Requested
                            </span>


                          ) : handoff.status ===
                            "Changes Requested" ? (

                            <span className="text-danger">
                              Changes requested
                            </span>


                          ) : handoff.status ===
                            "Ready to test" ? (

                            <div className="d-flex flex-column align-items-end gap-1">

                              <button
                                type="button"
                                className="btn btn-link text-success p-0 text-decoration-none"
                                onClick={() =>
                                  setTestingInfoHandoff(
                                    handoff
                                  )
                                }
                              >
                                Ready to test ⓘ
                              </button>


                              <button
                                type="button"
                                className="btn btn-outline-dark btn-sm"
                                onClick={() =>
                                  setTestingProject({
                                    project:
                                      project,
                                    specification:
                                      specification,
                                    handoff:
                                      handoff,
                                  })
                                }
                              >
                                Record Test Result
                              </button>

                            </div>


                          ) : handoff.status ===
                            "Testing Passed - Ready for Launch" ? (

                            <span className="text-success">
                              Testing Passed — Ready for Launch
                            </span>


                          ) : handoff.status ===
                            "Launched" ? (

                            <span className="text-success fw-semibold">
                              ✓ Launched
                            </span>


                          ) : (

                            <span className="text-muted">

                              {handoff.status ||
                                "In progress"}

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

        </div>

      {/* Project details */}
      <ProjectDetailsModal
        selectedSpecification={
          selectedSpecification
        }
        onClose={() =>
          setSelectedSpecification(null)
        }
      />


      {/* SD handoff review */}
      <ReviewHandoffModal
        selectedHandoff={
          selectedHandoff
        }
        user={user}
        onClose={() =>
          setSelectedHandoff(null)
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


      {/* View requested change details */}
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


      {/* Testing result modal */}
      <TestingResultModal
        testingProject={
          testingProject
        }
        user={user}
        onClose={() =>
          setTestingProject(null)
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


      {/* Testing information modal */}
      {testingInfoHandoff && (

        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor:
              "rgba(0, 0, 0, 0.5)",
          }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">


              <div className="modal-header">

                <h5 className="modal-title">
                  Testing Information
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setTestingInfoHandoff(null)
                  }
                />

              </div>


              <div className="modal-body">

                <p
                  className="mb-0"
                  style={{
                    whiteSpace: "pre-line",
                  }}
                >

                  {getTestingInformation(
                    testingInfoHandoff.description
                  )}

                </p>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setTestingInfoHandoff(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}


      {/* New client project */}
      <NewClientProjectModal
        show={
          showNewClientProject
        }
        users={users}
        onClose={() =>
          setShowNewClientProject(false)
        }
        refreshProjects={
          refreshProjects
        }
        refreshProjectSpecifications={
          refreshProjectSpecifications
        }
      />


      {/* Add Project / Milestone */}
      <AddProjectMilestoneModal
        show={
          showAddProjectMilestone
        }
        projects={projects}
        users={users}
        onClose={() =>
          setShowAddProjectMilestone(false)
        }
        refreshProjectSpecifications={
          refreshProjectSpecifications
        }
      />

    </>
  );
}