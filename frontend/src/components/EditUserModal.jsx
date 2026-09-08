import { useEffect, useState } from "react";
import { updateUser } from "../api/users";

export default function EditUserModal({
  selectedUser,
  managers,
  onUserUpdated,
}) {
  // Define statevar for displaying API/form errors
  const [error, setError] = useState("");

  // Define statevar for the editable form values
  const [formData, setFormData] = useState({
    country: "",
    manager_id: "",
    name: "",
    role: "",
    team: "",
  });

  // When a user is selected, copy their existing data into the form
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        country: selectedUser.country,
        manager_id: selectedUser.manager_id,
        name: selectedUser.name,
        role: selectedUser.role,
        team: selectedUser.team,
      });
    }
  }, [selectedUser]);

  async function handleSubmit(e) {
    e.preventDefault();

<<<<<<< HEAD
=======
    // Confirmation message
    if (!window.confirm("Save these changes?")) {
      return;
    }

>>>>>>> frontend/edit-user
    // Clear prev error msg
    setError("");

    // Prepare userdata that will be sent for PUT
    // Spread keeps all existing form data
    const payload = {
      ...formData,
      manager_id: formData.manager_id ? Number(formData.manager_id) : null,
    };

    try {
      const res = await updateUser(selectedUser.id, payload);
      console.log("Updated:", res);

      // Call onUserUpdated which effectively loads users on User Management
      await onUserUpdated();

      // Close modal after user is successfully updated
      const modal = document.getElementById("editUserModal");
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      bootstrapModal.hide();
    } catch (err) {
      console.error("Error caught on component:", err);
      setError("Failed to update user.");
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
          <form onSubmit={handleSubmit}>
            {/* Modal header */}
            <div className="modal-header">
              <h5 className="modal-title">Edit User</h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            {/* Form fields */}
            <div className="modal-body">
              {/* Name */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Name</label>

                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Country */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Country</label>

                <div className="col-sm-8">
                  <select
                    className="form-select"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        country: e.target.value,
                      })
                    }
                  >
                    <option value="NZ">NZ</option>
                    <option value="PH">PH</option>
                  </select>
                </div>
              </div>

              {/* Manager */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Manager</label>

                <div className="col-sm-8">
                  <select
                    className="form-select"
                    value={formData.manager_id}
                    disabled={formData.role === "Manager"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manager_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select manager...</option>

                    {managers.map((manager) => {
                      return (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Role</label>

                <div className="col-sm-8">
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value,
                        manager_id:
                          e.target.value === "Manager"
                            ? ""
                            : formData.manager_id,
                      })
                    }
                  >
                    <option value="Dev">Dev</option>
                    <option value="SD">SD</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              {/* Team */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Team</label>

                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.team}
                    onChange={(e) =>
                      setFormData({ ...formData, team: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Display an error returned from the API */}
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
