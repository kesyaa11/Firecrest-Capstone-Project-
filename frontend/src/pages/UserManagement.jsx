import {
  getUsers,
  getActiveUsers,
  getInactiveUsers,
  deleteUser,
  updateUser,
} from "../api/users";

import { useEffect, useState } from "react";

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";

export default function UserManagement() {
  // Define statevar to hold array of users from the API
  const [users, setUsers] = useState([]);

  // Define statevar to hold the selected user status
  const [userStatus, setUserStatus] = useState("active");

  // Define statevar to hold array of managers derived by filtering users on manager id === null
  const [managers, setManagers] = useState([]);

  // Define statevar to hold selected user for edits
  const [selectedUser, setSelectedUser] = useState(null);

  // Load users from the API based on the selected status
  async function loadUsers() {
    try {
      let data;

      if (userStatus === "active") {
        data = await getActiveUsers();
      } else if (userStatus === "inactive") {
        data = await getInactiveUsers();
      } else {
        data = await getUsers();
      }

      setUsers(data);

      // Filter users on manager id === null and set managers array
      setManagers(
        data.filter((user) => {
          return user.manager_id === null && user.is_active !== false;
        }),
      );
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }

  // Run effect when the selected status changes
  useEffect(() => {
    loadUsers();
  }, [userStatus]);

  // Run effect on load to get initial users
  useEffect(() => {
    loadUsers();

    // Log users array for debugging
    console.log(users);
  }, []);

  // edit button onclick handle edit function
  function handleEdit(id, user) {
    setSelectedUser(user);
  }

  // Update user status to inactive instead of permanently deleting them
  async function handleDelete(id) {
    // Confirmation message
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this user?",
    );

    if (!confirmed) {
      return;
    }

    try {
      // Find the selected user and preserve their existing details
      const user = users.find((user) => user.id === id);

      if (!user) {
        throw new Error("User not found");
      }

      // Update user status to inactive
      await updateUser(id, {
        ...user,
        is_active: false,
      });

      console.log("User deactivated:", id);

      // Reload the current user list
      await loadUsers();
    } catch (err) {
      console.error("Error deactivating user:", err);
    }
  }

  return (
    <div className="container-fluid mt-4">
      <div className="mt-4">
        <CreateUserModal managers={managers} onUserCreated={loadUsers} />
        <EditUserModal
          managers={managers}
          selectedUser={selectedUser}
          onUserUpdated={loadUsers}
        />
      </div>
      <div className="row">
        <div className="col">
          <h1>User Management</h1>
        </div>

        <div className="col text-end">
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#createUserModal"
          >
            + Create User
          </button>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col d-flex justify-content-end align-items-end">
          <div>
            <label htmlFor="userStatus" className="form-label">
              User status
            </label>
            <select
              id="userStatus"
              className="form-select"
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value)}
              style={{ width: "220px" }}
            >
              <option value="active">Active users</option>
              <option value="inactive">Inactive users</option>
            </select>
          </div>
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
                        {/* Edit performs an action so using a button here */}
                        <button
                          className="border-0 bg-transparent btn p-1"
                          data-bs-toggle="modal"
                          data-bs-target="#editUserModal"
                          onClick={() => handleEdit(user.id, user)}
                        >
                          ✏️
                        </button>
                        {/* Archive performs an action, so use a button */}
                        <button
                          className="border-0 bg-transparent btn p-1"
                          onClick={() => handleDelete(user.id)}
                        >
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
