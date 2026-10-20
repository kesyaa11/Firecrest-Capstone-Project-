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

  // Statevar to store the search text used to filter the user list
  const [searchTerm, setSearchTerm] = useState("");

  // Statevar to store the selected column and direction for sorting
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Statevar to track the current page and number of users displayed per page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Define statevar to hold array of managers derived by filtering users on manager id === null
  const [managers, setManagers] = useState([]);

  // Statevar to store active managers for the reassignment dropdown
  const [activeManagers, setActiveManagers] = useState([]);

  // Define statevar to hold selected user for edits
  const [selectedUser, setSelectedUser] = useState(null);

  // Statevar to store the manager selected for deactivation and their direct reports
  const [managerToDeactivate, setManagerToDeactivate] = useState(null);
  const [directReports, setDirectReports] = useState([]);

  // Statevar to track reassignment progress and errors
  const [reassignmentSaving, setReassignmentSaving] = useState(false);
  const [reassignmentError, setReassignmentError] = useState("");

  // Load users from the API based on the selected user status
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

      const allUsers = await getUsers();

      // Load active managers from all users regardless of the selected status filter.
      // Used for manager reassignment, table render and Create/Edit User dropdowns.
      const activeManagerList = allUsers.filter(
        (user) =>
          user.role?.toLowerCase() === "manager" && user.is_active !== false,
      );

      setActiveManagers(activeManagerList);
      setManagers(activeManagerList);
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
    // Create a fresh selected user object to trigger form prefilling
    setSelectedUser({ ...user });
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

  // Reactivate an inactive user
  async function handleReactivate(id) {
    try {
      const allUsers = await getUsers();
      const user = allUsers.find((user) => user.id === id);

      if (!user) {
        throw new Error("User not found");
      }

      if (!window.confirm(`Reactivate ${user.name}?`)) {
        return;
      }

      await updateUser(id, {
        ...user,
        is_active: true,
      });

      await loadUsers();
    } catch (err) {
      console.error("Error reactivating user:", err);
      window.alert(err.message || "Failed to reactivate user.");
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

  // Filter users based on the search text across table columns
  const filteredUsers = users.filter((user) => {
    const managerName =
      activeManagers.find((manager) => manager.id === user.manager_id)?.name ||
      "";

    const searchableValues = [
      user.name,
      user.role,
      user.team,
      user.country,
      REGION_NAMES[user.region] || user.region,
      managerName,
    ];

    return searchableValues.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()),
    );
  });

  // Sort filtered users by the selected column and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const getSortValue = (user) => {
      if (sortColumn === "manager") {
        return (
          activeManagers.find((manager) => manager.id === user.manager_id)
            ?.name || ""
        );
      }

      if (sortColumn === "region") {
        return REGION_NAMES[user.region] || user.region || "";
      }

      return user[sortColumn] ?? "";
    };

    const valueA = String(getSortValue(a));
    const valueB = String(getSortValue(b));

    const comparison = valueA.localeCompare(valueB, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Toggle sorting direction when a column header is clicked
  function handleSort(column) {
    if (sortColumn === column) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  }

  // Calculate the total number of pages based on filtered users
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));

  // Ensure the current page stays within the available page range
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Calculate which users should appear on the current page
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="container-fluid mt-4">
      <div className="mt-4">
        <CreateUserModal
          managers={managers}
          onUserCreated={async () => {
            setUserStatus("active");
            setSearchTerm(""); // so the user isnt hidden after its creation
            setCurrentPage(1);

            // Refresh the user list after successfully creating a user
            await loadUsers();
          }}
        />
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

      <div className="row align-items-center">
        <div className="col">
          <h1 className="mb-0">User Management</h1>
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

      {/* Active/Inactive tabs on the left, search on the right */}
      <div className="row mt-4 align-items-end">
        <div className="col-md-6">
          <ul className="nav nav-tabs border-bottom-0">
            {[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ].map((status) => (
              <li className="nav-item" key={status.value}>
                <button
                  type="button"
                  className={`nav-link ${
                    userStatus === status.value ? "active" : ""
                  }`}
                  onClick={() => {
                    setUserStatus(status.value);
                    setCurrentPage(1);
                  }}
                >
                  {status.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-md-6 d-flex justify-content-end pb-4">
          <div style={{ width: "100%", maxWidth: "320px" }}>
            <label htmlFor="searchUsers" className="form-label">
              Search users
            </label>
            <input
              id="searchUsers"
              type="search"
              className="form-control"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-bottom" />

      <div className="row mt-4">
        <div className="col">
          <table
            className="table table-striped table-hover"
            style={{
              tableLayout: "fixed",
              width: "100%",
            }}
          >
            {/* Allocate more space to columns containing longer text */}
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>
            <thead>
              <tr>
                {[
                  { key: "name", label: "Name" },
                  { key: "role", label: "Role" },
                  { key: "team", label: "Team" },
                  { key: "country", label: "Country" },
                  { key: "region", label: "Region" },
                  { key: "manager", label: "Manager" },
                ].map((column) => (
                  <th key={column.key}>
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none text-reset fw-bold p-0"
                      onClick={() => handleSort(column.key)}
                      title={`Sort by ${column.label}`}
                    >
                      {column.label}{" "}
                      <span className="text-secondary">
                        {sortColumn === column.key
                          ? sortDirection === "asc"
                            ? "▲"
                            : "▼"
                          : "⇅"}
                      </span>
                    </button>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* Map each paginated users into a table row */}
              {paginatedUsers.map((user) => {
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="text-truncate" title={user.name}>
                        {user.name}
                      </div>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.team?.trim() || "—"}</td>
                    <td>{user.country}</td>
                    <td>
                      <div
                        className="text-truncate"
                        title={REGION_NAMES[user.region] || user.region || "-"}
                      >
                        {REGION_NAMES[user.region] || user.region || "-"}
                      </div>
                    </td>
                    <td>
                      {/* Display manager regardless of the selected user status */}
                      {user.manager_id
                        ? activeManagers.find(
                            (manager) => manager.id === user.manager_id,
                          )?.name || "—"
                        : "—"}
                    </td>

                    <td>
                      {userStatus === "inactive" ? (
                        <button
                          className="border-0 bg-transparent btn p-1"
                          onClick={() => handleReactivate(user.id)}
                          title="Reactivate user"
                        >
                          🔄
                        </button>
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pagination controls */}
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="pageSize" className="mb-0">
                Show
              </label>

              <select
                id="pageSize"
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={8}>8</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <span>users per page</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(safeCurrentPage - 1)}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={`btn btn-sm ${
                      safeCurrentPage === page
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(safeCurrentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
