import { useEffect, useState } from "react";
import { updateUser } from "../api/users";

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

  // Statevar to store the editable user details, including their country and region
  const [formData, setFormData] = useState({
    country: "",
    region: "",
    manager_id: "",
    name: "",
    role: "",
    team: "",
  });

  // Prefill the form when the modal opens
  useEffect(() => {
    const modal = document.getElementById("editUserModal");

    if (!modal) return;

    const handleModalShow = () => {
      if (!selectedUser) return;

      setFormData({
        country: selectedUser.country ?? "",
        region: selectedUser.region ?? "",
        manager_id:
          selectedUser.manager_id == null
            ? ""
            : String(selectedUser.manager_id),
        name: selectedUser.name ?? "",
        role: selectedUser.role ?? "",
        team: selectedUser.team ?? "",
      });

      setError("");
    };

    modal.addEventListener("show.bs.modal", handleModalShow);

    return () => {
      modal.removeEventListener("show.bs.modal", handleModalShow);
    };
  }, [selectedUser]);

  // Confirm and save the user's updated details
  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.region) {
      setError("Please select the user's region.");
      return;
    }

    if (!window.confirm("Save these changes?")) {
      return;
    }

    setError("");

    // Prepare the updated user data for the API
    const payload = {
      ...formData,
      region: formData.region,
      manager_id: formData.manager_id ? Number(formData.manager_id) : null,
    };

    try {
      const res = await updateUser(selectedUser.id, payload);
      console.log("Updated:", res);

      await onUserUpdated();

      const modal = document.getElementById("editUserModal");
      const bootstrapModal = window.bootstrap?.Modal.getInstance(modal);
      bootstrapModal?.hide();
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
          <form onSubmit={handleSubmit}>
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
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    required
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
                        region: "",
                      })
                    }
                    required
                  >
                    <option value="NZ">NZ</option>
                    <option value="PH">PH</option>
                  </select>
                </div>
              </div>

              {/* Region */}
              <div className="row mb-3">
                <label className="col-sm-4 col-form-label">Region</label>
                <div className="col-sm-8">
                  <select
                    className="form-select"
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
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
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
                    required
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
                      setFormData({
                        ...formData,
                        team: e.target.value,
                      })
                    }
                  />
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
