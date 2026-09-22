import { useEffect, useState } from "react";
import { getProjects } from "../api/projects";
import BackToDashboard from "../components/BackToDashboard";

export default function HandoffManagement() {
  // Store all projects returned from the API
  const [projects, setProjects] = useState([]);

  // Load all projects when the component first renders
  useEffect(() => {
    async function loadProjects() {
      // Fetch all projects from the projects API
      const data = await getProjects();

      // Store the returned projects
      setProjects(data || []);
    }

    loadProjects();
  }, []);

  return (
    <div className="container mt-4">
      {/* Back to Dashboard */}
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>

      {/* Page Header */}
      <div className="row align-items-center">
        <div className="col">
          <h2 className="text-start">Handoff Management</h2>
          <p className="text-start text-muted mb-0">
            View projects and manage project handoffs
          </p>
        </div>

        <div className="col text-end">
          <button className="btn btn-primary">+ Create Handoff</button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="row mt-4">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Tracker</th>
                      <th>Final Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <tr key={project.id}>
                          {/* Display the project name */}
                          <td>{project.name}</td>

                          {/* Display the project tracker reference */}
                          <td>{project.tracker_ref}</td>

                          {/* Display the project final date */}
                          <td>
                            {new Date(project.final_date).toLocaleDateString(
                              "en-NZ",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Display a message when no projects are available
                      <tr>
                        <td colSpan="3" className="text-muted text-center py-4">
                          No projects found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
