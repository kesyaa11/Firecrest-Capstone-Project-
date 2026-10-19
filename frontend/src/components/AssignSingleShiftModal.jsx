import { useState, useEffect } from "react";
import { createShift } from "../api/shifts";
import { getProjects } from "../api/projects";
import { getProjectSpecifications } from "../api/projectSpecifications";

import { Modal } from "bootstrap";

const WORK_TYPES = [
  "Testing",
  "Development",
  "Meeting",
  "Documentation",
  "Other",
];

export default function AssignSingleShiftModal({
  user,
  date,
  slot,
  onShiftCreated,
}) {
  // Store the selected shift slot
  const slotNumber = slot || 1;

  // Store all available projects
  const [projects, setProjects] = useState([]);

  // Store all available project specifications
  const [specifications, setSpecifications] = useState([]);

  // Store the selected project
  const [selectedProject, setSelectedProject] = useState("");

  // Store the selected project specification
  const [selectedSpecification, setSelectedSpecification] = useState("");

  // Store the selected work type
  const [workType, setWorkType] = useState("");

  // Load projects and project specifications when the modal is opened
  useEffect(() => {
    async function loadAssignmentData() {
      try {
        const projectData = await getProjects();
        const specificationData = await getProjectSpecifications();

        setProjects(projectData || []);
        setSpecifications(specificationData || []);
      } catch (err) {
        console.error("Failed to load assignment data:", err);
      }
    }

    loadAssignmentData();
  }, []);

  // Get the start and end time for the selected shift slot
  function getShiftTimes(slot) {
    const shiftTimes = [
      { start: "08:00", end: "10:00" },
      { start: "10:30", end: "12:30" },
      { start: "12:45", end: "14:45" },
      { start: "15:00", end: "17:00" },
    ];

    return shiftTimes[slot - 1];
  }

  // Get specifications that belong to the selected project
  const filteredSpecifications = specifications.filter(
    (specification) =>
      Number(specification.project_id) === Number(selectedProject),
  );

  // Create the single shift
  async function handleSave() {
    try {
      if (!selectedProject) {
        alert("Please select a project.");
        return;
      }

      if (!selectedSpecification) {
        alert("Please select a specification.");
        return;
      }

      if (!workType) {
        alert("Please select a work type.");
        return;
      }

      const times = getShiftTimes(slotNumber);

      if (!times) {
        alert("No more shift slots available.");
        return;
      }

      await createShift({
        user_id: Number(user.id),
        date: date,
        duration: 2,
        shift_start: times.start,
        shift_end: times.end,
        shifts_count: 1,
        slot_number: slotNumber,
        project_id: Number(selectedProject),
        specification_id: Number(selectedSpecification),
        work_type: workType,
      });

      // Close modal after shift is created successfully
      const modalElement = document.getElementById("assignSingleShiftModal");
      const bootstrapModal = Modal.getInstance(modalElement);
      bootstrapModal?.hide();

      // Refresh the dashboard onShiftCreated
      if (onShiftCreated) {
        await onShiftCreated();
      }
    } catch (err) {
      console.error("Error creating shift:", err);
    }
  }

  return (
    <div className="modal fade" id="assignSingleShiftModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title">Assign Shift</h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body text-start">
            {/* Display the employee, date, and time selected from the schedule */}
            <div className="mb-4">
              <div className="mb-2">
                <strong>Employee:</strong> {user?.name || ""}
              </div>

              <div>
                <strong>Date:</strong> {date || ""}
                <span className="ms-3">
                  <strong>Time:</strong> {getShiftTimes(slotNumber)?.start}–
                  {getShiftTimes(slotNumber)?.end}
                </span>
              </div>
            </div>

            {/* Project */}
            <div className="mb-3">
              <label className="form-label fw-bold">Project</label>

              <select
                className="form-select"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedSpecification("");
                }}
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
            <div className="mb-3">
              <label className="form-label fw-bold">Specification</label>

              <select
                className="form-select"
                value={selectedSpecification}
                onChange={(e) => setSelectedSpecification(e.target.value)}
                disabled={!selectedProject}
              >
                <option value="">Select specification...</option>

                {filteredSpecifications.map((specification) => (
                  <option key={specification.id} value={specification.id}>
                    {`${specification.version || "No version"} — ${specification.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Type */}
            <div className="mb-3">
              <label className="form-label fw-bold">Work Type</label>

              <select
                className="form-select"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              >
                <option value="">Select...</option>

                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
