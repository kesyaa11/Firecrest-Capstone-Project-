import { useEffect, useState } from "react";
import { getProjects } from "../api/projects";
import {useAuth} from "../auth/AuthContext";
import BackToDashboard from "../components/BackToDashboard";
import DeveloperProjects from "../components/handoff/DeveloperProjects";
import SDProjects from "../components/handoff/SDProjects";
//import ManagerProjects from "../components/handoff/ManagerProjects";
import {getProjectSpecifications} from "../api/projectSpecifications";  
import {getSpecificationHandoffs} from "../api/specificationHandoffs";
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
      </div>

      {/* Display projects based on user role */}
      <div className="row mt-4">
        <div className="col">

          {/* Display DeveloperProjects component for developers */}
          {user.role === "developer" && (
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
          
          {/* Display SDProjects component for software developers */}
          {user.role == "sd" && (
            <SDProjects
              user={user}
              projects={projects}
              projectSpecifications={projectSpecifications}
              specificationHandoffs={specificationHandoffs}
              refreshSpecificationHandoffs={refreshSpecificationHandoffs}
            />
          )}

          {/* Display ManagerProjects component for managers */}
          {user?.role=== "manager" && (
            <ManagerProjects
              projects={projects}
              projectSpecifications={projectSpecifications}
            />
          )}
        
        </div>
      </div>

    </div>
  );
}
