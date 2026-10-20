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

  // Controls the Active / Inactive tabs
  const [projectTab, setProjectTab] = useState("active");

  // Projects table filters and sorting
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectSort, setProjectSort] = useState("default");

  // Find the parent project for a specification
  function getSpecificationProject(specification) {
    return projects.find(
      (project) => project.id === specification.project_id
    );
  }

  // Match the statuses displayed in the SD Projects table
  function getSpecificationStatus(specification) {
    const handoff = specificationHandoffs.find(
      (handoff) => handoff.specification_id === specification.id
    );

    const unresolvedChangeRequest = specificationChangeRequests.some(
      (request) =>
        request.specification_id === specification.id &&
        request.resolved === false
    );

    if (!handoff && unresolvedChangeRequest) {
      return "Changes requested";
    }

    if (!handoff) return "In progress";

    switch (handoff.status) {
      case "Pending":
        return "Pending review";
      case "Changes Requested":
        return "Changes requested";
      case "Test Failed - Changes Requested":
        return "Test failed";
      case "Ready to test":
        return "Ready to test";
      case "Testing Passed - Ready for Launch":
        return "Ready for launch";
      case "Launched":
        return "Launched";
      default:
        return handoff.status || "In progress";
    }
  }

  // Projects belonging to the selected Active / Inactive tab
  const availableProjects = projects.filter(
    (project) => project.is_active === (projectTab === "active")
  );

  // Specifications belonging to the selected tab and project
  const availableSpecifications = projectSpecifications.filter(
    (specification) => {
      const project = getSpecificationProject(specification);

      return (
        project?.is_active === (projectTab === "active") &&
        (projectFilter === "all" ||
          String(specification.project_id) === projectFilter)
      );
    }
  );

  // Available versions for the selected project
  const availableVersions = [
    ...new Set(
      availableSpecifications
        .map((specification) => specification.version)
        .filter(Boolean)
    ),
  ].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  // Available clients for the selected tab and project
  const availableClients = [
    ...new Set(
      availableProjects
        .filter(
          (project) =>
            projectFilter === "all" ||
            String(project.id) === projectFilter
        )
        .map((project) => project.client)
        .filter(Boolean)
    ),
  ].sort();

  // Available statuses for the selected tab and project
  const availableStatuses = [
    ...new Set(
      availableSpecifications.map(getSpecificationStatus)
    ),
  ].sort();

  // Apply all filters, then sorting
  const filteredProjectSpecifications = [...projectSpecifications]
  .filter((specification) => {
    const project = getSpecificationProject(specification);

    return (
        (projectTab === "active"
          ? project?.is_active === true
          : project?.is_active === false) &&
        (projectFilter === "all" ||
          String(specification.project_id) === projectFilter) &&
        (clientFilter === "all" ||
          (project?.client || "") === clientFilter) &&
        (versionFilter === "all" ||
          (specification.version || "") === versionFilter) &&
        (statusFilter === "all" ||
          getSpecificationStatus(specification) === statusFilter)
      );
    })
    .sort((a, b) => {
      const projectA = getSpecificationProject(a)?.name || "";
      const projectB = getSpecificationProject(b)?.name || "";

      switch (projectSort) {
        case "project-asc":
          return projectA.localeCompare(projectB) || a.id - b.id;

        case "project-desc":
          return projectB.localeCompare(projectA) || a.id - b.id;

        case "version-asc":
          return (
            (a.version || "").localeCompare(
              b.version || "",
              undefined,
              { numeric: true }
            ) || a.id - b.id
          );

        case "version-desc":
          return (
            (b.version || "").localeCompare(
              a.version || "",
              undefined,
              { numeric: true }
            ) || a.id - b.id
          );

        case "date-asc":
        case "date-desc": {
          const dateA = a.target_date
            ? Date.parse(a.target_date)
            : NaN;
          const dateB = b.target_date
            ? Date.parse(b.target_date)
            : NaN;

          // Missing target dates always appear last
          if (Number.isNaN(dateA)) {
            return Number.isNaN(dateB) ? a.id - b.id : 1;
          }
          if (Number.isNaN(dateB)) return -1;

          return projectSort === "date-asc"
            ? dateA - dateB || a.id - b.id
            : dateB - dateA || a.id - b.id;
        }

        default:
          return a.id - b.id;
      }
    });

  // Handle progress checkbox being clicked
  function handleProgressChange(specification, field, checked) {

    const project = getSpecificationProject(specification);

    if (project?.is_active === false) {
      return;
    }

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

  // Count specifications belonging to the selected project tab
  const tabSpecificationsCount = projectSpecifications.filter(
    (specification) => {
      const project = getSpecificationProject(specification);

      return projectTab === "active"
        ? project?.is_active === true
        : project?.is_active === false;
    }
  ).length;


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

          {/* Active / Inactive project tabs */}
          <ul className="nav nav-tabs mb-3">
            {["active", "inactive"].map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  type="button"
                  className={`nav-link ${projectTab === tab ? "active" : ""}`}
                  onClick={() => {
                    setProjectTab(tab);
                    setProjectFilter("all");
                    setClientFilter("all");
                    setVersionFilter("all");
                    setStatusFilter("all");
                    setProjectSort("default");
                  }}
                >
                  {tab === "active" ? "Active" : "Inactive"}
                </button>
              </li>
            ))}
          </ul>

          {/* Projects filtering and sorting */}
          <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5 g-2 mb-3">

            {/* Project */}
            <div className="col">
              <label className="form-label small text-muted mb-1">
                Project
              </label>
              <select
                className="form-select form-select-sm"
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setClientFilter("all");
                  setVersionFilter("all");
                  setStatusFilter("all");
                }}
              >
                <option value="all">All projects</option>
                {[...availableProjects]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Client */}
            <div className="col">
              <label className="form-label small text-muted mb-1">
                Client
              </label>
              <select
                className="form-select form-select-sm"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All clients</option>
                {availableClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            {/* Version */}
            <div className="col">
              <label className="form-label small text-muted mb-1">
                Version
              </label>
              <select
                className="form-select form-select-sm"
                value={versionFilter}
                onChange={(e) => setVersionFilter(e.target.value)}
              >
                <option value="all">All versions</option>
                {availableVersions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="col">
              <label className="form-label small text-muted mb-1">
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="col">
              <label className="form-label small text-muted mb-1">
                Sort by
              </label>
              <select
                className="form-select form-select-sm"
                value={projectSort}
                onChange={(e) => setProjectSort(e.target.value)}
              >
                <option value="default">Default order</option>
                <option value="project-asc">Project A–Z</option>
                <option value="project-desc">Project Z–A</option>
                <option value="version-asc">Version ascending</option>
                <option value="version-desc">Version descending</option>
                <option value="date-asc">Target date: earliest</option>
                <option value="date-desc">Target date: latest</option>
              </select>
            </div>
          </div>

          {/* Results count and clear filters */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted small">
              Showing {filteredProjectSpecifications.length} of{" "}
              {tabSpecificationsCount} {projectTab} specifications
            </span>

            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none p-0"
              onClick={() => {
                setProjectFilter("all");
                setClientFilter("all");
                setVersionFilter("all");
                setStatusFilter("all");
                setProjectSort("default");
              }}
            >
              Clear filters
            </button>
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

                {filteredProjectSpecifications.map(
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
                            {/* Display version and specification name as the main label */}
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-light text-dark border flex-shrink-0">
                                {specification.version || "No version"}
                              </span>

                              <span
                                className="fw-semibold text-truncate"
                                title={specification.name || "Unnamed specification"}
                              >
                                {specification.name || "Unnamed specification"}
                              </span>
                            </div>

                            {/* Display project name and client underneath */}
                            <div
                              className="text-muted small text-truncate mt-1"
                              title={`${project?.name || "Unknown Project"} · ${project?.client || "Unknown Client"}`}
                            >
                              {project?.name || "Unknown Project"}
                              {" · "}
                              {project?.client || "Unknown Client"}
                            </div>
                          </button>
                        </td>


                        {/* Shared progress indicators */}
                        <ProgressIndicators
                          specification={specification}
                          specificationChangeRequests={specificationChangeRequests}
                          onProgressChange={handleProgressChange}
                          onViewChangeRequest={setSelectedChangeRequest}
                          disabled={project?.is_active === false}
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
                              disabled={project?.is_active === false}
                              onClick={() =>
                                setSelectedHandoff({
                                  handoff: handoff,
                                  project: project,
                                  specification: specification,
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
                                disabled={project?.is_active === false}
                                onClick={() =>
                                  setTestingProject({
                                    project: project,
                                    specification: specification,
                                    handoff: handoff,
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

              {filteredProjectSpecifications.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-muted py-4"
                  >
                    No project specifications match the selected filters.
                  </td>
                </tr>
              )}

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