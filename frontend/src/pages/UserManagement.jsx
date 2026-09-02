import BackToDashboard from "../components/BackToDashboard";
import { getUsers } from "../api/users";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function UserManagement() {
  // Define statevar to hold array of users from getUsers API
  const [users, setUsers] = useState([]);

  // Run effect onload to loadUsers then setUsers
  useEffect(() => {
    async function loadUsers() {
      const users = await getUsers();
      setUsers(users);
    }

    loadUsers();
    // log users array for debugging
    console.log(users);
  }, []);

  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>User Management</h2>
        </div>

        <div className="col text-end">
          <button className="btn btn-success">+ Add User</button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Country</th>
                <th>Manager</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* Map each user into a table row */}
              {users.map((user) => {
                return (
                  <>
                    <tr>
                      <td>{user.name}</td>
                      <td>{user.role}</td>
                      <td>{user.country}</td>
                      <td>
                        {/* If the user has a manager_id, find that manager in users */}
                        {user.manager_id
                          ? `${
                              // Find user whose ID matches this user's manager_id then print its name
                              users.find((manager) => {
                                return manager.id === user.manager_id;
                              })?.name
                            } `
                          : "-"}
                      </td>
                      <td>
                        {/* Edit user navigates somewhere, so use a Link */}
                        <Link to={users} className="text-decoration-none">
                          ✏️
                        </Link>
                        {/* Archive performs an action, so use a button */}
                        <button className="border-0 bg-transparent btn p-1">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
