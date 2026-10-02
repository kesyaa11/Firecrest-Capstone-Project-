import { useEffect, useState } from "react";
import { getProjects } from "../api/projects";
import { useAuth } from "../auth/AuthContext";

import DeveloperProjects from "../components/handoff/DeveloperProjects";
import SDProjects from "../components/handoff/SDProjects";
//import ManagerProjects from "../components/handoff/ManagerProjects";
import { getProjectSpecifications } from "../api/projectSpecifications";
import { getSpecificationHandoffs } from "../api/specificationHandoffs";
import { getHandoffSignoffs } from "../api/handoffSignoffs";
import { getUsers } from "../api/users";

export default function HandoffManagement() {
  // Get the current user from the authentication context
  const { user } = useAuth();

  // Store all projects returned from the API
  const [projects, setProjects] = useState([]);

  // Store the project specifications returned from the API
  const [projectSpecifications, setProjectSpecifications] = useState([]);

  // Store the specification handoffs returned from the API
  const [specificationHandoffs, setSpecificationHandoffs] = useState([]);

  // Store the handoff signoffs returned from the API
  const [handoffSignoffs, setHandoffSignoffs] = useState([]);

  // Store the users returned from the API
  const [users, setUsers] = useState([]);

  // Function to refresh the specification handoffs from the API
  async function refreshSpecificationHandoffs() {
    const handoffs = await getSpecificationHandoffs();
    setSpecificationHandoffs(handoffs || []);
  }

  // Load all projects and project specifications when the component first renders
  useEffect(() => {
    async function loadData() {
      // Fetch all these from the API
      const data = await getProjects();
      const specs = await getProjectSpecifications();
      const handoffs = await getSpecificationHandoffs();
      const signoffs = await getHandoffSignoffs();
      const usersData = await getUsers();

      //sanity check to ensure data is being fetched correctly
      console.log("PROJECTS FROM API:", data);
      console.log("SPECIFICATIONS FROM API:", specs);

      // Store the returned projects
      setProjects(data || []);
      setProjectSpecifications(specs || []);
      setSpecificationHandoffs(handoffs || []);
      setHandoffSignoffs(signoffs || []);
      setUsers(usersData || []);

      //more saniy check
      console.log("HANDOFFS FROM API:", handoffs);
      console.log("SIGNOFFS FROM API:", signoffs);
    }

    loadData();
  }, []);

  return (
    <div className="container mt-4">
      <h1>Handoff Management</h1>

      <div className="mt-4">
        {user?.role === "developer" && (
          <DeveloperProjects
            user={user}
            projects={projects}
            projectSpecifications={projectSpecifications}
            specificationHandoffs={specificationHandoffs}
            refreshSpecificationHandoffs={refreshSpecificationHandoffs}
            handoffSignoffs={handoffSignoffs}
            users={users}
          />
        )}

        {user?.role === "sd" && (
          <SDProjects
            user={user}
            projects={projects}
            projectSpecifications={projectSpecifications}
            specificationHandoffs={specificationHandoffs}
            refreshSpecificationHandoffs={refreshSpecificationHandoffs}
          />
        )}
      </div>
    </div>
  );
}
