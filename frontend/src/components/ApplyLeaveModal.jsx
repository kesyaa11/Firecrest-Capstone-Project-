import { useState, useEffect } from "react";
import { createLeaveRequest } from "../api/leaveRequests";
import { getUsers } from "../api/users";
import { useAuth } from "../auth/AuthContext";

export default function ApplyLeaveModal() {
  const { user: loggedInUser } = useAuth();

  // Define statevar for form values
  const [formData, setFormData] = useState({
    leave_type: "Annual Leave",
    start_date: "",
    end_date: "",
  });

  // Store users loaded from the API
  const [users, setUsers] = useState([]);

  // Load users so the employee and manager IDs can be mapped
  useEffect(() => {
    async function loadUsers() {
      const loadedUsers = await getUsers();
      setUsers(loadedUsers || []);
    }

    loadUsers();
  }, []);

  // Handle changes to the leave form
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  // Handle submitting the leave request - DEMO version only for hardcoded roles
  async function handleSubmit(e) {
    e.preventDefault();

    // Find the logged-in employee in the database users
    const employee = users.find(
      (existingUser) => existingUser.name === loggedInUser?.name,
    );

    // Find the employee's manager
    const approver = users.find(
      (existingUser) => existingUser.name === "John Doe",
    );

    if (!employee || !approver) {
      console.error("Employee or approver could not be found");
      return;
    }

    // Prepare the leave request for the API
    const leaveRequest = {
      user_id: employee.id,
      approver_id: approver.id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      leave_type: formData.leave_type,
      status: "Pending",
    };

    try {
      await createLeaveRequest(leaveRequest);

      console.log("Leave request submitted successfully");

      // Close the modal after successful submission
      const modalElement = document.getElementById("applyLeaveModal");
      const modal = window.bootstrap?.Modal.getInstance(modalElement);

      modal?.hide();
    } catch (err) {
      console.error("Failed to submit leave request:", err);
    }
  }

  return (
    <div
      className="modal fade"
      id="applyLeaveModal"
      tabIndex="-1"
      aria-labelledby="applyLeaveModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title fw-semibold" id="applyLeaveModalLabel">
              Apply for Leave
            </h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Modal Body */}
            <div className="modal-body p-4">
              {/* Leave Type */}
              <div className="mb-4 text-start">
                <label className="form-label fw-semibold">
                  Leave Type <span className="text-danger">*</span>
                </label>

                <select
                  name="leave_type"
                  className="form-select"
                  value={formData.leave_type}
                  onChange={handleChange}
                  required
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal Leave">Personal Leave</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="mb-4 text-start">
                <label className="form-label fw-semibold">
                  Start Date <span className="text-danger">*</span>
                </label>

                <input
                  type="date"
                  name="start_date"
                  className="form-control"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* End Date */}
              <div className="mb-0 text-start">
                <label className="form-label fw-semibold">
                  End Date <span className="text-danger">*</span>
                </label>

                <input
                  type="date"
                  name="end_date"
                  className="form-control"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
