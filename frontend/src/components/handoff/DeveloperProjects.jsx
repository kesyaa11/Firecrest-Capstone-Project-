import { useState } from "react";
import ProjectDetailsModal from "./ProjectDetailsModal";
import CreateHandoffModal from "./CreateHandoffModal";
import HandoffDetailsModal from "./HandoffDetailsModal";
import RequestChangesModal from "./RequestChangesModal";
import ChangeRequestDetailsModal from "./ChangeRequestDetailsModal";
import ConfirmStageModal from "./ConfirmStageModal";
import ProgressIndicators from "./ProgressIndicators";
import {updateProjectSpecification,} from "../../api/projectSpecifications";
import {updateSpecificationChangeRequest,} from "../../api/specificationChangeRequests";
import {updateSpecificationHandoff,} from "../../api/specificationHandoffs";

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

  // Controls the Active / Inactive project tabs
  const [projectTab, setProjectTab] = useState("active");

  // Projects table filters
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectSort, setProjectSort] = useState("default");

  // Find the project belonging to a specification
  function getSpecificationProject(specification) {
    return projects.find(
      (project) => project.id === specification.project_id
    );
  }

  // Determine the specification's current status
  function getSpecificationStatus(specification) {
    const handoff = specificationHandoffs.find(
      (handoff) => handoff.specification_id === specification.id
    );

    const hasUnresolvedChanges = specificationChangeRequests?.some(
      (request) =>
        request.specification_id === specification.id &&
        request.resolved === false
    );

    if (!handoff && hasUnresolvedChanges) return "Changes requested";
    if (handoff?.status === "Pending") return "Sent for review";
    if (handoff?.status === "Changes Requested") return "Changes requested";
    if (handoff?.status === "Ready to test") return "Ready to test";
    if (handoff?.status === "Testing Passed - Ready for Launch") {
      return "Ready for launch";
    }
    if (handoff?.status === "Launched") return "Launched";
    if (handoff?.status === "Test Failed - Changes Requested") {
      return "Test failed";
    }

    if (handoff) return handoff.status || "Unknown";
    if (specification.build) return "Ready for handoff";

    const hasStarted =
      specification.roadmap ||
      specification.specs ||
      specification.build ||
      specification.test_sheet ||
      specification.launch_plan;

    return hasStarted ? "In progress" : "Not started";
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

  // Filter and sort specifications without modifying the original data
  const sortedProjectSpecifications = [...projectSpecifications]
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
            (a.version || "").localeCompare(b.version || "", undefined, {
              numeric: true,
            }) || a.id - b.id
          );

        case "version-desc":
          return (
            (b.version || "").localeCompare(a.version || "", undefined, {
              numeric: true,
            }) || a.id - b.id
          );

        case "date-asc":
        case "date-desc": {
          const dateA = a.target_date
            ? Date.parse(a.target_date)
            : NaN;
          const dateB = b.target_date
            ? Date.parse(b.target_date)
            : NaN;

          // Specifications without valid target dates appear last
          if (Number.isNaN(dateA)) return Number.isNaN(dateB) ? a.id - b.id : 1;
          if (Number.isNaN(dateB)) return -1;

          return projectSort === "date-asc"
            ? dateA - dateB || a.id - b.id
            : dateB - dateA || a.id - b.id;
        }

        default:
          // Keep the existing order
          return a.id - b.id;
      }
    });

  // Selected project filter for the Handoffs table
  const [handoffProjectFilter, setHandoffProjectFilter] = useState("all");

  // Selected sorting order for the Handoffs table
  const [handoffSort, setHandoffSort] = useState("newest");

  // Find the project associated with a handoff
  function getHandoffProject(handoff) {
    const specification = projectSpecifications.find(
      (spec) => spec.id === handoff.specification_id
    );

    return projects.find(
      (project) => project.id === specification?.project_id
    );
  }

  // Filter handoffs by project, then sort the remaining results
  const filteredHandoffs = [...specificationHandoffs]
    .filter((handoff) => {
      if (handoffProjectFilter === "all") return true;

      const project = getHandoffProject(handoff);

      return String(project?.id) === handoffProjectFilter;
    })
    .sort((a, b) => {
      if (handoffSort === "project") {
        const projectA = getHandoffProject(a)?.name || "";
        const projectB = getHandoffProject(b)?.name || "";

        return (
          projectA.localeCompare(projectB) ||
          a.id - b.id
        );
      }

      const dateA = Date.parse(a.notified || "") || 0;
      const dateB = Date.parse(b.notified || "") || 0;

      if (handoffSort === "oldest") {
        return dateA - dateB || a.id - b.id;
      }

      return dateB - dateA || b.id - a.id;
    });

  // Handle changes in project progress checkboxes
  function handleProgressChange(
    specification,
    field,
    checked
  ) {

    const project = getSpecificationProject(specification);

    if (project?.is_active === false) {
      return;
    }

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


      // Handle Launch completion or re-completion
      if (field === "launch_plan") {
        const handoff = specificationHandoffs.find(
          (handoff) => handoff.specification_id === specification.id
        );

        // Only restore Launched when no other unresolved changes remain
        const hasOtherUnresolvedChanges = specificationChangeRequests?.some(
          (request) =>
            request.specification_id === specification.id &&
            request.resolved === false &&
            request.id !== existingChangeRequest?.id
        );

        if (handoff && !hasOtherUnresolvedChanges) {
          await updateSpecificationHandoff(handoff.id, {
            ...handoff,
            status: "Launched",
          });

          await refreshSpecificationHandoffs();
        }

        // Replay the launch celebration when Launch is completed
        if (!hasOtherUnresolvedChanges) {
          setShowLaunchBell(false);

          // Trigger the bell animation
          setTimeout(() => {
            setShowLaunchBell(true);
          }, 0);

          setTimeout(() => {
            setShowLaunchBell(false);
          }, 2000);
        }
      }
      } catch (error) {
        console.error(
        "Could not complete project stage:",
        error
    );
  }

  }

  // Total specifications belonging to projects in the selected tab
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

      {/* My Projects */}
      <div className="card shadow-sm">
        <div className="card-body">

          {/* Projects header */}
          <h5 className="mb-3">Projects</h5>

          {/* Active / Inactive project tabs */}
          <ul className="nav nav-tabs mb-3">
            {["active", "inactive"].map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  type="button"
                  className={`nav-link ${
                    projectTab === tab ? "active" : ""
                  }`}
                  onClick={() => {
                    setProjectTab(tab);

                    // Reset filters when switching tabs
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

          {/* Project filters and sorting */}
          <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5 g-2 mb-3">

            {/* Project filter */}
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

            {/* Client filter */}
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

            {/* Version filter */}
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

            {/* Status filter */}
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

            {/* Sorting */}
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

          {/* Clear filters */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted small">
              Showing {sortedProjectSpecifications.length} of{" "}
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
                    Version / Specification
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "100px" }}
                  >
                    Roadmap
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "100px" }}
                  >
                    Specs
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "100px" }}
                  >
                    Build
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "100px" }}
                  >
                    Test
                  </th>

                  <th
                    className="text-center"
                    style={{ width: "100px" }}
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

                {sortedProjectSpecifications.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-muted py-4"
                  >
                    No project specifications match the selected filters.
                  </td>
                </tr>
              )}

              {sortedProjectSpecifications.map(
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

                        {/* Version / Specification */}
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
                              {getSpecificationStatus(specification)}
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

              {/* Handoffs header and controls */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h5 className="mb-0">Handoffs</h5>

                <div className="d-flex align-items-center flex-wrap gap-2">

                  {/* Filter handoffs by project */}
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "200px" }}
                    value={handoffProjectFilter}
                    onChange={(event) =>
                      setHandoffProjectFilter(event.target.value)
                    }
                    aria-label="Filter handoffs by project"
                  >
                    <option value="all">All projects</option>

                    {[...projects]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((project) => (
                        <option key={project.id} value={String(project.id)}>
                          {project.name}
                        </option>
                      ))}
                  </select>

                  {/* Sort handoffs */}
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "190px" }}
                    value={handoffSort}
                    onChange={(event) =>
                      setHandoffSort(event.target.value)
                    }
                    aria-label="Sort handoffs"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="project">Project name A–Z</option>
                  </select>

                  {/* Clear handoff filters and reset sorting */}
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none"
                    onClick={() => {
                      setHandoffProjectFilter("all");
                      setHandoffSort("newest");
                    }}
                  >
                    Clear filters
                  </button>

                </div>
              </div>

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead>
                    <tr>
                      <th>
                        Version / Specification 
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

                    {filteredHandoffs.length === 0 ? (

                      <tr>
                        <td
                          colSpan="5"
                          className="text-center text-muted py-4"
                        >
                          {specificationHandoffs.length === 0
                            ? "No current handoffs"
                            : "No handoffs match the selected project"}
                        </td>
                      </tr>

                    ) : (

                      filteredHandoffs.map(
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

                              {/* Version / Specification */}
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

                                  {/* Display version and specification name as the main label */}
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-light text-dark border flex-shrink-0">
                                      {specification?.version || "No version"}
                                    </span>

                                    <span
                                      className="fw-semibold text-truncate"
                                      title={specification?.name || "Unnamed specification"}
                                    >
                                      {specification?.name || "Unnamed specification"}
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