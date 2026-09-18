import BackToDashboard from "../components/BackToDashboard";
import { getUsers, deleteUser, updateUser } from "../api/users";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";

export default function UserManagement() {
  // Define statevar to hold array of users from getUsers API
  const [users, setUsers] = useState([]);

  // Define statevar to hold array of managers derived by filtering users on manager id === null
  const [managers, setManagers] = useState([]);

  // Define statevar to hold selected user for edits
  const [selectedUser, setSelectedUser] = useState(null);

  // Load users from the API and update users state
  async function loadUsers() {
    const users = await getUsers();
    setUsers(users);

    //  Filter users on manager id === null and set managers array
    setManagers(
      users.filter((user) => {
        return user.manager_id === null;
      }),
    );
  }

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

  // delete button onclick handle delete function
  async function handleDelete(id) {
    // Confirmation message
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(id);
      console.log("User deleted:", id);
      await loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  }

  return (
    <div className="container mt-4">
      <div className="mt-4">
        <CreateUserModal managers={managers} onUserCreated={loadUsers} />
        <EditUserModal
          managers={managers}
          selectedUser={selectedUser}
          onUserUpdated={loadUsers}
        />
      </div>
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>User Management</h2>
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
