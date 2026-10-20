import { useState } from "react";
import ManageProjectsModal from "./ManageProjectsModal";
import { updateProject } from "../../api/projects";

export default function ManagerProjects({
  projects = [],
  projectSpecifications = [],
  specificationHandoffs = [],
  specificationChangeRequests = [],
  refreshProjects,
}) {
  // Projects table filters and sorting
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectSort, setProjectSort] = useState("default");

  // Handle project tab change
  function handleProjectTabChange(tab) {
    setProjectTab(tab);
    setProjectFilter("all");
    setClientFilter("all");
    setVersionFilter("all");
    setStatusFilter("all");
    setProjectSort("default");
  }

  // Controls the Manage Projects modal
   const [showManageProjects, setShowManageProjects] = useState(false);

  // Active / Inactive project tabs
  const [projectTab, setProjectTab] = useState("active");

  // Find the parent project for a specification
  function getSpecificationProject(specification) {
    return projects.find(
      (project) => project.id === specification.project_id
    );
  }

  // Determine the current specification workflow status
  function getSpecificationStatus(specification) {
    const handoff = specificationHandoffs.find(
      (handoff) => handoff.specification_id === specification.id
    );

    const hasUnresolvedChanges = specificationChangeRequests.some(
      (request) =>
        request.specification_id === specification.id &&
        request.resolved === false
    );

    if (!handoff && hasUnresolvedChanges) {
      return "Changes requested";
    }

    if (!handoff) {
      return "In progress";
    }

    switch (handoff.status) {
      case "Pending":
        return "Awaiting review";

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

  // Choose the badge colour based on the status
  function getStatusBadgeClass(status) {
    switch (status) {
      case "Launched":
        return "bg-success-subtle text-success-emphasis";

      case "Ready for launch":
      case "Ready to test":
        return "bg-info-subtle text-info-emphasis";

      case "Awaiting review":
        return "bg-warning-subtle text-warning-emphasis";

      case "Changes requested":
      case "Test failed":
        return "bg-danger-subtle text-danger-emphasis";

      default:
        return "bg-light text-secondary border";
    }
  }

  // Display progress with completed and incomplete icons
  function renderProgressIndicator(completed) {
    return completed ? (
      <span
        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success"
        style={{ width: "26px", height: "26px" }}
        title="Completed"
        aria-label="Completed"
      >
        ✓
      </span>
    ) : (
      <span
        className="text-secondary opacity-50"
        title="Not completed"
        aria-label="Not completed"
      >
        —
      </span>
    );
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

  // Versions available for the selected project
  const availableVersions = [
    ...new Set(
      availableSpecifications
        .map((specification) => specification.version)
        .filter(Boolean)
    ),
  ].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  // Clients available for the selected tab and project
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

  // Statuses available for the selected tab and project
  const availableStatuses = [
    ...new Set(
      availableSpecifications.map(getSpecificationStatus)
    ),
  ].sort();

  // Filter and sort project specifications
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

          // Keep missing target dates at the bottom
          if (Number.isNaN(dateA)) {
            return Number.isNaN(dateB) ? a.id - b.id : 1;
          }

          if (Number.isNaN(dateB)) {
            return -1;
          }

          return projectSort === "date-asc"
            ? dateA - dateB || a.id - b.id
            : dateB - dateA || a.id - b.id;
        }

        default:
          return a.id - b.id;
      }
    });

  return (
    <>
    <div className="card shadow-sm">
      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Projects</h5>

        <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => setShowManageProjects(true)}
        >
            Manage projects
        </button>
        </div>

        {/* Active / Inactive project tabs */}
        <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
            <button
            type="button"
            className={`nav-link ${projectTab === "active" ? "active" : ""}`}
            onClick={() => handleProjectTabChange("active")}
            >
            Active
            </button>
        </li>

        <li className="nav-item">
            <button
            type="button"
            className={`nav-link ${projectTab === "inactive" ? "active" : ""}`}
            onClick={() => handleProjectTabChange("inactive")}
            >
            Inactive
            </button>
        </li>
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
                .sort((a, b) =>
                  (a.name || "").localeCompare(b.name || "")
                )
                .map((project) => (
                  <option
                    key={project.id}
                    value={String(project.id)}
                  >
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
              <option value="date-asc">
                Target date: earliest
              </option>
              <option value="date-desc">
                Target date: latest
              </option>
            </select>
          </div>
        </div>

        {/* Results count and clear filters */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted small">
            Showing {sortedProjectSpecifications.length} of{" "}
            {projectSpecifications.length} specifications
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

        {/* Projects table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Project / version</th>
                <th>Client</th>
                <th className="text-center">Roadmap</th>
                <th className="text-center">Specs</th>
                <th className="text-center">Build</th>
                <th className="text-center">Test</th>
                <th className="text-center">Launch</th>
                <th className="text-end">Status</th>
              </tr>
            </thead>

            <tbody>
              {/* No matching specifications */}
              {sortedProjectSpecifications.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-4"
                  >
                    No project specifications match the selected filters.
                  </td>
                </tr>
              )}

              {/* Specification rows */}
              {sortedProjectSpecifications.map((specification) => {
                const project =
                  getSpecificationProject(specification);

                const status =
                  getSpecificationStatus(specification);

                return (
                  <tr
                    key={specification.id}
                    style={{ height: "64px" }}
                  >
                    {/* Project and version */}
                    <td>
                      <div className="fw-semibold">
                        {project?.name || "Unknown Project"}
                      </div>

                      <span className="badge bg-light text-dark border mt-1">
                        {specification.version || "No version"}
                      </span>
                    </td>

                    {/* Client */}
                    <td>
                      {project?.client || "Unknown Client"}
                    </td>

                    {/* Roadmap */}
                    <td className="text-center">
                      {renderProgressIndicator(
                        specification.roadmap
                      )}
                    </td>

                    {/* Specs */}
                    <td className="text-center">
                      {renderProgressIndicator(
                        specification.specs
                      )}
                    </td>

                    {/* Build */}
                    <td className="text-center">
                      {renderProgressIndicator(
                        specification.build
                      )}
                    </td>

                    {/* Test */}
                    <td className="text-center">
                      {renderProgressIndicator(
                        specification.test_sheet
                      )}
                    </td>

                    {/* Launch */}
                    <td className="text-center">
                      {renderProgressIndicator(
                        specification.launch_plan
                      )}
                    </td>

                    {/* Workflow status */}
                    <td className="text-end">
                      <span
                        className={`badge rounded-pill ${getStatusBadgeClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>

    {/* Manage Projects modal */}
    <ManageProjectsModal
        show={showManageProjects}
        projects={projects}
        updateProject={updateProject}
        refreshProjects={refreshProjects}
        onClose={() => setShowManageProjects(false)}
    />
    </>
  );
}
