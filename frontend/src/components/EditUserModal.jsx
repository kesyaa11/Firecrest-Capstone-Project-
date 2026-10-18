import { useEffect, useState } from "react";
import { getUsers, updateUser } from "../api/users";

import { Modal } from "bootstrap";

// Store the available regions for each supported country
const REGIONS_BY_COUNTRY = {
  NZ: [
    { value: "NZ-AUK", label: "Auckland" },
    { value: "NZ-NTL", label: "Northland" },
    { value: "NZ-WKO", label: "Waikato" },
    { value: "NZ-BOP", label: "Bay of Plenty" },
    { value: "NZ-GIS", label: "Gisborne" },
    { value: "NZ-HKB", label: "Hawke's Bay" },
    { value: "NZ-TKI", label: "Taranaki" },
    { value: "NZ-MWT", label: "Manawatū-Whanganui" },
    { value: "NZ-WGN", label: "Wellington" },
    { value: "NZ-TAS", label: "Tasman" },
    { value: "NZ-NSN", label: "Nelson" },
    { value: "NZ-MBH", label: "Marlborough" },
    { value: "NZ-WTC", label: "West Coast" },
    { value: "NZ-CAN", label: "Canterbury" },
    { value: "NZ-OTA", label: "Otago" },
    { value: "NZ-STL", label: "Southland" },
    { value: "NZ-CIT", label: "Chatham Islands" },
  ],
  PH: [
    { value: "AUR", label: "Aurora" },
    { value: "QUE", label: "Quezon" },
  ],
};

export default function EditUserModal({
  selectedUser,
  managers,
  onUserUpdated,
}) {
  // Statevar to store any API or form validation error messages
  const [error, setError] = useState("");

  // Statevar to store validation errors for individual form fields
  const [fieldErrors, setFieldErrors] = useState({});

  // Store existing teams and the selected team entry method
  const [existingTeams, setExistingTeams] = useState([]);
  const [teamOption, setTeamOption] = useState("existing");

  // Statevar to store the editable user details, including their country and region
  const [formData, setFormData] = useState({
    country: "",
    region: "",
    manager_id: "",
    name: "",
    role: "",
    team: "",
  });

  // Load existing team names from all users
  useEffect(() => {
    async function loadTeams() {
      try {
        const users = await getUsers();

        const teams = [
          ...new Set(users.map((user) => user.team?.trim()).filter(Boolean)),
        ].sort();

        setExistingTeams(teams);
      } catch (err) {
        console.error("Error loading teams:", err);
      }
    }

    loadTeams();
  }, []);

  // Prefill the form whenever a different user is selected
  useEffect(() => {
    if (!selectedUser) return;

    setFormData({
      country: selectedUser.country ?? "",
      region: selectedUser.region ?? "",
      manager_id:
        selectedUser.manager_id == null ? "" : String(selectedUser.manager_id),
      name: selectedUser.name ?? "",
      role: selectedUser.role ?? "",
      team: selectedUser.team ?? "",
    });

    // Select the appropriate team entry method for this user
    const currentTeam = selectedUser.team?.trim() || "";
    const manager = managers.find(
      (user) => String(user.id) === String(selectedUser.manager_id),
    );

    if (currentTeam && manager?.team === currentTeam) {
      setTeamOption("manager");
    } else if (currentTeam && !existingTeams.includes(currentTeam)) {
      setTeamOption("new");
    } else {
      setTeamOption("existing");
    }

    setError("");
    setFieldErrors({});
  }, [selectedUser, managers, existingTeams]);

  // Confirm and save the user's updated details
  async function handleSubmit(e) {
    e.preventDefault();

    // Validate all required fields before submitting
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Please enter a name.";
    }

    if (!formData.country) {
      errors.country = "Please select a country.";
    }

    if (!formData.region) {
      errors.region = "Please select a region.";
    }

    if (!formData.role) {
      errors.role = "Please select a role.";
    }

    // Require a manager for Dev and SD users
    if (formData.role !== "Manager" && !formData.manager_id) {
      errors.manager_id = "Please select a manager.";
    }

    // Determine the team based on the selected assignment method
    const selectedManager = managers.find(
      (user) => String(user.id) === formData.manager_id,
    );

    const team =
      teamOption === "manager"
        ? selectedManager?.team?.trim() || ""
        : formData.team.trim();

    if (!team) {
      errors.team = "Please select or enter a team name.";
    }

    // Store all validation errors
    setFieldErrors(errors);

    // Prevent submission if any fields are invalid
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!window.confirm("Save these changes?")) {
      return;
    }

    setError("");

    // Prepare the updated user data for the API
    const payload = {
      ...formData,
      team,
      region: formData.region,
      manager_id: formData.manager_id ? Number(formData.manager_id) : null,
    };

    try {
      const res = await updateUser(selectedUser.id, payload);
      console.log("Updated:", res);

      await onUserUpdated();

      // Close the modal after successfully updating the user
      const modal = document.getElementById("editUserModal");
      Modal.getInstance(modal)?.hide();
    } catch (err) {
      console.error("Error caught on component:", err);
      setError(err.message || "Failed to update user.");
    }
  }

  return (
    <div
      className="modal fade"
      id="editUserModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            {/* Modal header */}
            <div className="modal-header">
              <h5 className="modal-title">Edit User</h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            {/* Form fields */}
            <div className="modal-body">
              {/* Name */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Name</label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                  />

                  {fieldErrors.name && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Country</label>
                <div className="col-sm-8">
                  <select
                    className={`form-select ${fieldErrors.country ? "is-invalid" : ""}`}
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        country: e.target.value,
                        region: "",
                      })
                    }
                    required
                  >
                    <option value="NZ">NZ</option>
                    <option value="PH">PH</option>
                  </select>
                  {fieldErrors.country && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.country}
                    </div>
                  )}
                </div>
              </div>

              {/* Region */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Region</label>
                <div className="col-sm-8">
                  <select
                    className={`form-select ${fieldErrors.region ? "is-invalid" : ""}`}
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        region: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select region...</option>
                    {(REGIONS_BY_COUNTRY[formData.country] ?? []).map(
                      (region) => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ),
                    )}
                  </select>
                  {fieldErrors.region && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.region}
                    </div>
                  )}
                </div>
              </div>

              {/* Manager */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Manager</label>
                <div className="col-sm-8">
                  <select
                    className={`form-select ${fieldErrors.manager_id ? "is-invalid" : ""}`}
                    value={formData.manager_id}
                    disabled={formData.role === "Manager"}
                    onChange={(e) => {
                      const managerId = e.target.value;
                      const manager = managers.find(
                        (user) => String(user.id) === managerId,
                      );

                      setFormData({
                        ...formData,
                        manager_id: managerId,
                        team:
                          teamOption === "manager"
                            ? manager?.team || ""
                            : formData.team,
                      });
                    }}
                  >
                    <option value="">Select manager...</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.manager_id && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.manager_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Role</label>
                <div className="col-sm-8">
                  <select
                    className={`form-select ${fieldErrors.role ? "is-invalid" : ""}`}
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;

                      setFormData({
                        ...formData,
                        role: newRole,
                        manager_id:
                          newRole === "Manager" ? "" : formData.manager_id,
                        team:
                          newRole === "Manager" && teamOption === "manager"
                            ? ""
                            : formData.team,
                      });

                      // Managers cannot inherit a reporting manager's team
                      if (newRole === "Manager" && teamOption === "manager") {
                        setTeamOption("existing");
                      }
                    }}
                    required
                  >
                    <option value="Dev">Dev</option>
                    <option value="SD">SD</option>
                    <option value="Manager">Manager</option>
                  </select>
                  {fieldErrors.role && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.role}
                    </div>
                  )}
                </div>
              </div>

              {/* Team */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Team</label>
                <div className="col-sm-8">
                  {/* Choose whether to inherit, select, or create a team */}
                  {[
                    {
                      value: "manager",
                      label: formData.manager_id
                        ? "Same team as manager"
                        : "Same team as manager (select a manager first)",
                    },
                    { value: "existing", label: "Select existing team" },
                    { value: "new", label: "Create new team" },
                  ].map((option) => (
                    <div className="form-check mb-2" key={option.value}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="teamOption"
                        id={`edit-team-${option.value}`}
                        value={option.value}
                        checked={teamOption === option.value}
                        disabled={
                          option.value === "manager" && !formData.manager_id
                        }
                        onChange={(e) => {
                          const selectedOption = e.target.value;
                          setTeamOption(selectedOption);

                          const manager = managers.find(
                            (user) => String(user.id) === formData.manager_id,
                          );

                          setFormData({
                            ...formData,
                            team:
                              selectedOption === "manager"
                                ? manager?.team || ""
                                : selectedOption === "existing"
                                  ? ""
                                  : "",
                          });
                        }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`edit-team-${option.value}`}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}

                  {/* Select a team already used by another employee */}
                  {teamOption === "existing" && (
                    <select
                      className={`form-select ${fieldErrors.team ? "is-invalid" : ""}`}
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({ ...formData, team: e.target.value })
                      }
                    >
                      <option value="">No team selected</option>
                      {existingTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Enter a new team name */}
                  {teamOption === "new" && (
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.team ? "is-invalid" : ""}`}
                      placeholder="Enter new team name"
                      required={teamOption === "new"}
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({ ...formData, team: e.target.value })
                      }
                    />
                  )}

                  {/* Display the selected manager's team */}
                  {teamOption === "manager" && (
                    <input
                      type="text"
                      className={`form-control bg-light ${fieldErrors.team ? "is-invalid" : ""}`}
                      value={
                        managers.find(
                          (user) => String(user.id) === formData.manager_id,
                        )?.team || ""
                      }
                      readOnly
                    />
                  )}

                  {/* Display Team validation errors */}
                  {fieldErrors.team && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.team}
                    </div>
                  )}
                </div>
              </div>

              {/* Display API or form validation errors */}
              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>

            {/* Modal actions */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button type="submit" className="btn btn-success">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
