import { useState, useEffect } from "react";
import { createLeaveRequest, getLeaveRequests } from "../api/leaveRequests";

import { getPublicHolidaysByCountry } from "../api/publicHolidays";
import { getUsers } from "../api/users";

import { useAuth } from "../auth/authContext";

export default function ApplyLeaveModal({ onSubmitted }) {
  const { user: loggedInUser } = useAuth();

  // Statevar messages and confirmation state for leave request validation
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    const { name, value } = e.target;

    // Clear previous messages when form values change
    setError("");
    setSuccess("");

    // Update the selected form field
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Handle submitting the leave request - DEMO version only for hardcoded roles
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Find the logged-in employee in the database users by their user ID
    const employee =
      loggedInUser?.id == null
        ? undefined
        : users.find((existingUser) => existingUser.id === loggedInUser.id);

    // Use the employee's manager as the approver, otherwise any manager
    const approver =
      users.find((existingUser) => existingUser.id === employee?.manager_id) ||
      users.find(
        (existingUser) => existingUser.role?.toLowerCase() === "manager",
      );

    if (!employee) {
      setError("This login is not linked to an employee record.");
      return;
    }

    if (!approver) {
      setError("No manager was found to approve this request.");
      return;
    }

    // Prevent leave requests with an end date earlier than the start date
    if (formData.start_date > formData.end_date) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    // Load existing leave requests and public holidays
    const [existingLeaves, publicHolidays] = await Promise.all([
      getLeaveRequests(),
      getPublicHolidaysByCountry(employee.country),
    ]);

    // Prevent submission if validation data could not be loaded
    if (!Array.isArray(existingLeaves) || !Array.isArray(publicHolidays)) {
      setError("Unable to verify leave conflicts. Please try again.");
      return;
    }

    // Prevent overlapping leave requests that are Pending or Approved
    const overlappingLeave = existingLeaves.find(
      (request) =>
        Number(request.user_id) === Number(employee.id) &&
        ["Pending", "Approved"].includes(request.status) &&
        request.start_date <= formData.end_date &&
        request.end_date >= formData.start_date,
    );

    console.log("Employee ID:", employee.id);
    console.log("Requested dates:", formData.start_date, formData.end_date);
    console.log("Overlapping leave record:", overlappingLeave);

    if (overlappingLeave) {
      setError(
        `You already have a ${overlappingLeave.status.toLowerCase()} leave request overlapping these dates.`,
      );
      return;
    }

    // Prevent leave requests that include a public holiday
    const conflictingHoliday = publicHolidays.find(
      (holiday) =>
        holiday.date >= formData.start_date &&
        holiday.date <= formData.end_date,
    );

    if (conflictingHoliday) {
      setError("You cannot apply for leave on a public holiday.");
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

      setSuccess(`Leave request sent to ${approver.name} for approval.`);
      setFormData({ ...formData, start_date: "", end_date: "" });

      // Let the page refresh its list of requests
      if (onSubmitted) await onSubmitted();
    } catch (err) {
      setError(err.message);
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

              {error && (
                <div className="alert alert-danger mt-3 mb-0">{error}</div>
              )}
              {success && (
                <div className="alert alert-success mt-3 mb-0">{success}</div>
              )}
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
