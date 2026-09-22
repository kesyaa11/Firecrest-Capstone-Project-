import BackToDashboard from "../components/BackToDashboard";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProjects } from "../api/projects";
import { getUsers } from "../api/users";

export default function Projects() {
  // This state var will be used to take in projects data from API endpoint
  const [projects, setProjects] = useState([]);

  // This state var will be used to take in users data from API endpoint
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadProjects() {
      const projects = await getProjects();
      const users = await getUsers();

      setProjects(projects || []);
      setUsers(users || []);
    }

    loadProjects();
  }, []);

  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard to="/dashboard" />
      </div>
      <div className="row">
        <div className="col">
          <h2>Projects</h2>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Project</th>
                <th>Developer</th>
                <th>SD Lead</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{users.length}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
