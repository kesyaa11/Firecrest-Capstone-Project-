export default function SkillCoverageModal({ show, skills, onClose }) {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Skill Coverage</h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {/* Display coverage levels, differences and recommendations for each skill. */}
            {skills.map((skill) => (
              <div key={skill.name} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">{skill.name}</h6>

                  <span
                    className={`badge ${
                      skill.status === "Gap"
                        ? "text-bg-warning"
                        : "text-bg-success"
                    }`}
                  >
                    {skill.status}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Current coverage</span>
                  <strong>{skill.current} users</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Required coverage</span>
                  <strong>{skill.required} users</strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span>Difference</span>
                  <strong>
                    {skill.current - skill.required > 0
                      ? `+${skill.current - skill.required}`
                      : skill.current - skill.required}
                  </strong>
                </div>

                {skill.status === "Gap" && (
                  <div className="mt-3">
                    <small className="text-muted">
                      Recommended development
                    </small>
                    <p className="mb-0">
                      Consider training existing team members to improve
                      coverage.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
