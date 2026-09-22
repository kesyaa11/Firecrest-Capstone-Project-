import { useState } from "react";
import { createUser } from "../api/users";

export default function CreateUserModal({ onUserCreated, managers }) {
  // Define statevar for form values
  const [formData, setFormData] = useState({
    country: "",
    manager_id: "",
    name: "",
    role: "",
    team: "",
  });

  // Define statevar for displaying API/form errors
  const [error, setError] = useState("");

  // Submit form handler
  async function handleSubmit(e) {
    e.preventDefault();

    // Clear prev error msg
    setError("");

    // Prepare userdata that will be sent for POST
    // Spread keeps all existing form data
    const payload = {
      ...formData,
      manager_id: formData.manager_id ? Number(formData.manager_id) : null,
    };

    try {
      const res = await createUser(payload);
      console.log("Created:", res);
      // Call onUserCreated which effectively loads users on User Management
      await onUserCreated();

      // Close modal after user is created successfully
      const modal = document.getElementById("createUserModal");
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      bootstrapModal.hide();
    } catch (err) {
      console.error("Error caught on component:", err);
      setError("Failed to create user.");
    }
  }

  return (
    // Bootstrap modal container
    <div
      className="modal fade"
      id="createUserModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              {/* Modal title */}
              <h5 className="modal-title">Create User</h5>

              {/* Modal Close button*/}
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            {/* Modal Body */}
            <div className="modal-body">
              <div className="row mb-3">
                {/* NAME */}
                <label className="col-sm-4 col-form-label">Name</label>
                <div className="col-sm-8">
                  <input
                    className="form-control"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="row mb-3">
                {/* COUNTRY */}
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

              <div className="row mb-3">
                {/* MANAGER */}
                <label className="col-sm-4 col-form-label">Manager</label>
                <div className="col-sm-8">
                  {/* Managers dropdown is disabled when the selected role === Manager */}
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

              <div className="row mb-3">
                {/* ROLE */}
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

              <div className="row mb-3">
                {/* TEAM */}
                <label className="col-sm-4 col-form-label">Team</label>
                <div className="col-sm-8">
                  <input
                    className="form-control"
                    type="text"
                    value={formData.team}
                    onChange={(e) =>
                      setFormData({ ...formData, team: e.target.value })
                    }
                  />
                </div>
              </div>

              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button type="submit" className="btn btn-primary">
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
