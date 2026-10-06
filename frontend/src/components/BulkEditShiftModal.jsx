import { useState, useEffect } from "react";
import { updateShift } from "../api/shifts";
import { getProjects } from "../api/projects";
import { getProjectSpecifications } from "../api/projectSpecifications";

export default function BulkEditShiftModal({
  selectedShifts,
  shifts,
  users,
  onUpdated,
  onClose,
}) {
  const [projects, setProjects] = useState([]);
  const [editedShifts, setEditedShifts] = useState({});
  const [specifications, setSpecifications] = useState([]);

  useEffect(() => {
    const initialValues = {};

    selectedShifts.forEach((shiftId) => {
      const shift = shifts.find(
        (existingShift) => existingShift.id === shiftId,
      );

      if (!shift) return;

      initialValues[shiftId] = {
        date: shift.date || "",
        project_id: shift.project_id || "",
        specification_id: shift.specification_id || "",
        work_type: shift.work_type || "",
      };
    });

    setEditedShifts(initialValues);
  }, [selectedShifts, shifts]);

  useEffect(() => {
    async function loadAssignmentData() {
      const projectData = await getProjects();
      const specificationData = await getProjectSpecifications();

      setProjects(projectData || []);
      setSpecifications(specificationData || []);
    }

    loadAssignmentData();
  }, []);

  const handleApplyChanges = async () => {
    for (const shiftId of selectedShifts) {
      const shift = shifts.find(
        (existingShift) => existingShift.id === shiftId,
      );

      const edited = editedShifts[shiftId];

      if (!shift || !edited) continue;

      if (!edited.date || !edited.project_id || !edited.work_type) {
        alert(
          "Please complete Date, Project, and Work Type for all selected shifts.",
        );
        return;
      }

      await updateShift(shiftId, {
        ...shift,
        date: edited.date,
        project_id: edited.project_id,
        work_type: edited.work_type,
      });
    }

    await onUpdated();
    onClose();
  };

  const firstShift = shifts.find((shift) => shift.id === selectedShifts[0]);

  const selectedUser = users.find(
    (user) => Number(user.id) === Number(firstShift?.user_id),
  );

  const sortedSelectedShifts = [...selectedShifts].sort((a, b) => {
    const shiftA = shifts.find((shift) => shift.id === a);
    const shiftB = shifts.find((shift) => shift.id === b);

    if (!shiftA || !shiftB) return 0;

    const dateCompare = shiftA.date.localeCompare(shiftB.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return (shiftA.slot_number || 0) - (shiftB.slot_number || 0);
  });

  return (
    <div className="modal fade show d-block" tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bulk Edit Shifts</h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <h6 className="fw-bold mb-3">{selectedUser?.name || "Employee"}</h6>

            {/* Frozen column header */}
            <div className="row fw-bold small text-muted mb-2">
              <div className="col-md-2">Date</div>
              <div className="col-md-2">Time</div>
              <div className="col-md-3">Project</div>
              <div className="col-md-3">Specification</div>
              <div className="col-md-2">Work Type</div>
            </div>

            {sortedSelectedShifts.map((shiftId) => {
              const shift = shifts.find(
                (existingShift) => existingShift.id === shiftId,
              );

              const edited = editedShifts[shiftId];

              if (!shift || !edited) return null;

              return (
                <div key={shiftId} className="row g-2 mb-3 align-items-center">
                  {/* Date */}
                  <div className="col-md-2">
                    <div className="form-control bg-light">{shift.date}</div>
                  </div>

                  {/* Start / End Time */}
                  <div className="col-md-2">
                    <div className="form-control bg-light">
                      {shift.shift_start?.slice(0, 5)}–
                      {shift.shift_end?.slice(0, 5)}
                    </div>
                  </div>

                  {/* Project */}
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={edited.project_id}
                      onChange={(e) =>
                        setEditedShifts((prev) => ({
                          ...prev,
                          [shiftId]: {
                            ...prev[shiftId],
                            project_id: e.target.value,
                            specification_id: "",
                          },
                        }))
                      }
                    >
                      <option value="">Select project...</option>

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specification */}
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={edited.specification_id}
                      onChange={(e) =>
                        setEditedShifts((prev) => ({
                          ...prev,
                          [shiftId]: {
                            ...prev[shiftId],
                            specification_id: e.target.value,
                          },
                        }))
                      }
                      disabled={!edited.project_id}
                    >
                      <option value="">Select specification...</option>

                      {specifications
                        .filter(
                          (specification) =>
                            Number(specification.project_id) ===
                            Number(edited.project_id),
                        )
                        .map((specification) => (
                          <option
                            key={specification.id}
                            value={specification.id}
                          >
                            Version {specification.version}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Work Type */}
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={edited.work_type}
                      onChange={(e) =>
                        setEditedShifts((prev) => ({
                          ...prev,
                          [shiftId]: {
                            ...prev[shiftId],
                            work_type: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Select...</option>
                      <option value="Testing">Testing</option>
                      <option value="Development">Development</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              );
            })}

            <div className="text-muted small mt-3">
              {selectedShifts.length} shifts selected
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApplyChanges}
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
