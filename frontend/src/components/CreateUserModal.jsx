import { useState } from "react";
import { createUser } from "../api/users";

export default function CreateUserModal() {
  const [formData, setFormData] = useState({
    country: "",
    id: "",
    manager_id: "",
    name: "",
    role: "",
    team: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      ...formData,
      id: Number(formData.id),
      manager_id: Number(formData.manager_id),
    };

    try {
      const res = await createUser(payload);
      console.log("Created:", res);
    } catch (err) {
      console.error("Error caught on component:", err);
    }
  }

  return (
    <div
      className="modal fade"
      id="createUserModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input
                    className="form-control"
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">ID</label>
                  <input
                    className="form-control"
                    type="number"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Manager ID</label>
                  <input
                    className="form-control"
                    type="number"
                    value={formData.manager_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manager_id: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Role</label>
                  <input
                    className="form-control"
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Team</label>
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
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button type="submit" className="btn btn-success">
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
