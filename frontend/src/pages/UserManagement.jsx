import {
  getUsers,
  getActiveUsers,
  getInactiveUsers,
  updateUser,
} from "../api/users";

import { useCallback, useEffect, useState } from "react";

import { Modal } from "bootstrap";

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import ReassignDirectReportsModal from "../components/ReassignDirectReportsModal";

// Convert API region codes into readable names
const REGION_NAMES = {
  "NZ-AUK": "Auckland",
  "NZ-NTL": "Northland",
  "NZ-WKO": "Waikato",
  "NZ-BOP": "Bay of Plenty",
  "NZ-GIS": "Gisborne",
  "NZ-HKB": "Hawke's Bay",
  "NZ-TKI": "Taranaki",
  "NZ-MWT": "Manawatū-Whanganui",
  "NZ-WGN": "Wellington",
  "NZ-TAS": "Tasman",
  "NZ-NSN": "Nelson",
  "NZ-MBH": "Marlborough",
  "NZ-WTC": "West Coast",
  "NZ-CAN": "Canterbury",
  "NZ-OTA": "Otago",
  "NZ-STL": "Southland",
  "NZ-CIT": "Chatham Islands",
  "PH-AUR": "Aurora",
  "PH-QUE": "Quezon",
  AUR: "Aurora",
  QUE: "Quezon",
};

export default function UserManagement() {
  // Define statevar to hold array of users from the API
  const [users, setUsers] = useState([]);

  // Define statevar to hold the selected user status
  const [userStatus, setUserStatus] = useState("active");

  // Define statevar to hold array of managers derived by filtering users on manager id === null
  const [managers, setManagers] = useState([]);

  // Statevar to store active managers for the reassignment dropdown
  const [activeManagers, setActiveManagers] = useState([]);

  // Define statevar to hold selected user for edits
  const [selectedUser, setSelectedUser] = useState(null);

  // Store the manager selected for deactivation and their direct reports
  const [managerToDeactivate, setManagerToDeactivate] = useState(null);
  const [directReports, setDirectReports] = useState([]);

  // Track reassignment progress and errors
  const [reassignmentSaving, setReassignmentSaving] = useState(false);
  const [reassignmentError, setReassignmentError] = useState("");

  // Load users from the API based on the selected status
  const loadUsers = useCallback(async () => {
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
  }, [userStatus]);

  // Load users from the API on initial render and when the selected status changes
  useEffect(() => {
    const fetchUsers = async () => {
      await loadUsers();
    };

    fetchUsers();
  }, [loadUsers]);

  // Open the reassignment modal when a manager is selected
  useEffect(() => {
    if (!managerToDeactivate) return;

    const modal = document.getElementById("reassignDirectReportsModal");
    Modal.getOrCreateInstance(modal).show();
  }, [managerToDeactivate]);

  // edit button onclick handle edit function
  function handleEdit(id, user) {
    console.log(user);
    setSelectedUser(user);
  }

  // Update user status to inactive instead of permanently deleting them
  async function handleDelete(id) {
    try {
      const allUsers = await getUsers();

      // Load active managers independently of the user status filter
      setActiveManagers(
        allUsers.filter(
          (user) =>
            user.role?.toLowerCase() === "manager" && user.is_active !== false,
        ),
      );

      const user = allUsers.find((user) => user.id === id);

      if (!user) {
        throw new Error("User not found");
      }

      // Find active employees currently reporting to this manager
      const reports = allUsers.filter(
        (employee) =>
          employee.manager_id === id && employee.is_active !== false,
      );

      // Open the reassignment modal if direct reports exist ie employee isManager
      if (reports.length > 0) {
        setManagerToDeactivate(user);
        setDirectReports(reports);
        setReassignmentError("");

        return;
      }

      // Deactivate normally when no direct reports exist
      if (!window.confirm("Are you sure you want to deactivate this user?")) {
        return;
      }

      await updateUser(id, {
        ...user,
        is_active: false,
      });

      await loadUsers();
    } catch (err) {
      console.error("Error deactivating user:", err);
    }
  }

  // Reassign employees before deactivating their existing manager
  async function handleReassignAndDeactivate(assignments) {
    if (!managerToDeactivate || reassignmentSaving) return;

    setReassignmentSaving(true);
    setReassignmentError("");

    try {
      // Recheck current users before applying changes
      const allUsers = await getUsers();

      const reports = allUsers.filter(
        (employee) =>
          employee.manager_id === managerToDeactivate.id &&
          employee.is_active !== false,
      );

      // Ensure every direct report has a replacement manager
      if (
        reports.length !== directReports.length ||
        reports.some((employee) => !assignments[employee.id])
      ) {
        throw new Error(
          "Direct reports have changed. Cancel and reopen the modal.",
        );
      }

      // Verify replacement managers are active and not being deactivated
      for (const employee of reports) {
        const replacementId = Number(assignments[employee.id]);
        const replacement = allUsers.find((user) => user.id === replacementId);

        if (
          !replacement ||
          replacement.is_active === false ||
          replacement.role?.toLowerCase() !== "manager" ||
          replacement.id === managerToDeactivate.id
        ) {
          throw new Error(`Invalid replacement manager for ${employee.name}.`);
        }
      }

      if (
        !window.confirm(
          "Confirm reassignment of all direct reports and deactivate this manager?",
        )
      ) {
        return;
      }

      // Update each employee using the existing PUT endpoint
      for (const employee of reports) {
        await updateUser(employee.id, {
          ...employee,
          manager_id: Number(assignments[employee.id]),
        });
      }

      // Deactivate the original manager only after all updates succeed
      await updateUser(managerToDeactivate.id, {
        ...managerToDeactivate,
        is_active: false,
      });

      // Refresh the user list and close the modal
      await loadUsers();

      const modal = document.getElementById("reassignDirectReportsModal");
      Modal.getInstance(modal)?.hide();

      setManagerToDeactivate(null);
      setDirectReports([]);
    } catch (err) {
      console.error("Error reassigning direct reports:", err);
      setReassignmentError(
        `${err.message || "Reassignment failed."} Some employee updates may have succeeded. Review assignments before retrying.`,
      );
      await loadUsers();
    } finally {
      setReassignmentSaving(false);
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
        {/* Reassign direct reports before deactivating their manager */}
        <ReassignDirectReportsModal
          key={managerToDeactivate?.id ?? "none"}
          manager={managerToDeactivate}
          directReports={directReports}
          managers={activeManagers}
          onConfirm={handleReassignAndDeactivate}
          onClose={() => {
            setManagerToDeactivate(null);
            setDirectReports([]);
            setReassignmentError("");
          }}
          saving={reassignmentSaving}
          error={reassignmentError}
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
                <th>Team</th>
                <th>Country</th>
                <th>Region</th>
                <th>Manager</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* Map each user into a table row */}
              {users.map((user) => {
                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{user.team?.trim() || "—"}</td>
                    <td>{user.country}</td>
                    <td>{REGION_NAMES[user.region] || user.region || "-"}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
