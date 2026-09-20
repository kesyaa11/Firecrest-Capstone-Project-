import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/projects";

// Display the three projects with the nearest upcoming final dates
export default function RecentProjects() {
  const navigate = useNavigate();

  // Store the projects that will be displayed
  const [projects, setProjects] = useState([]);

  // Load project data when the component is first rendered
  useEffect(() => {
    async function loadProjects() {
      // Fetch all projects from the projects API
      const data = await getProjects();

      // Stop if no project data was returned
      if (!data) {
        setProjects([]);
        return;
      }

      // Get today's date and remove the current time
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter, sort and limit the projects for the dashboard
      const recentProjects = data
        // Only include projects with an upcoming final date
        .filter((project) => {
          const finalDate = new Date(project.final_date);
          return finalDate >= today;
        })
        // Sort projects by nearest upcoming final date
        .sort((a, b) => new Date(a.final_date) - new Date(b.final_date))
        // Only display the first three projects
        .slice(0, 3);

      // Store the selected projects for rendering
      setProjects(recentProjects);
    }

    loadProjects();
  }, []);

  return (
    <div
      className="card h-100 shadow-sm border-0 bg-light cursor-pointer hover-card"
      onClick={() => navigate("/handoff")}
      style={{ cursor: "pointer" }}
    >
      <div className="card-body">
        {/* Card Header */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">Recent Projects</h5>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/handoff");
            }}
          >
            View Projects →
          </button>
        </div>

        {/* Card Description */}
        <p className="small text-muted mb-3">
          Click to manage handoffs and project details
        </p>

        {/* Project List */}
        <div className="border rounded overflow-hidden">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Project</th>
                  <th className="text-end">Final Date</th>
                </tr>
              </thead>

              <tbody>
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td className="text-end">
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
                  // Display a message when there are no upcoming projects
                  <tr>
                    <td colSpan="2" className="text-muted text-center py-3">
                      No upcoming projects
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
