import { useState } from "react";

export default function ReassignDirectReportsModal({
  manager,
  directReports,
  managers,
  onConfirm,
  onClose,
  saving,
  error,
}) {
  const [assignments, setAssignments] = useState({});

  // Update the replacement manager for one employee
  function handleAssignment(userId, managerId) {
    setAssignments((previous) => ({
      ...previous,
      [userId]: managerId,
    }));
  }

  // Copy one selected manager to every direct report
  function copyToAll(managerId) {
    if (!managerId) return;

    const updated = {};

    directReports.forEach((employee) => {
      updated[employee.id] = managerId;
    });

    setAssignments(updated);
  }

  // Require every employee to have a replacement manager
  const allAssigned =
    directReports.length > 0 &&
    directReports.every((employee) => assignments[employee.id]);

  return (
    // Modal for reassigning employees before deactivating their manager
    <div
      className="modal fade"
      id="reassignDirectReportsModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* Modal header */}
          <div className="modal-header">
            <h5 className="modal-title">Reassign Direct Reports</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              disabled={saving}
              onClick={onClose}
            />
          </div>

          {/* Modal body */}
          <div className="modal-body">
            <p>
              Deactivating <strong>{manager?.name}</strong>. Assign each
              employee to an active manager.
            </p>

            {/* Table showing direct reports and their replacement managers */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>New Manager</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {/* Display each direct report with a manager dropdown */}
                  {directReports.map((employee, index) => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>
                        <select
                          className="form-select"
                          value={assignments[employee.id] || ""}
                          disabled={saving}
                          onChange={(e) =>
                            handleAssignment(employee.id, e.target.value)
                          }
                        >
                          <option value="">Select manager...</option>
                          {managers
                            .filter((m) => m.id !== manager?.id)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                        </select>
                      </td>

                      {/* Copy the first selected manager to all employees */}
                      <td>
                        {index === 0 && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm text-nowrap"
                            disabled={saving || !assignments[employee.id]}
                            onClick={() => copyToAll(assignments[employee.id])}
                          >
                            Copy to All
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Display errors */}
            {error && <div className="alert alert-danger">{error}</div>}
          </div>

          {/* Modal actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-danger"
              disabled={!allAssigned || saving}
              onClick={() => onConfirm(assignments)}
            >
              {saving ? "Saving..." : "Reassign & Deactivate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
