import { useState } from "react";
import SkillCoverageModal from "./SkillCoverageModal";

export default function SkillCoverage() {
  const [showDetails, setShowDetails] = useState(false);

  const skills = [
    { name: "AWS / Cloud", current: 2, required: 4, status: "Gap" },
    { name: "Advanced C#", current: 3, required: 5, status: "Gap" },
    { name: "React", current: 5, required: 4, status: "Covered" },
    { name: "Testing", current: 5, required: 4, status: "Covered" },
  ];

  return (
    <>
      <div className="card border mb-4">
        <div className="card-body">
          <h5 className="card-title mb-2">Skill Coverage</h5>

          <p className="small text-muted mb-3">
            Current workforce skill coverage
          </p>

          <div className="border rounded overflow-hidden">
            <table className="table table-striped mb-0 align-middle">
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.name}>
                    <td>{skill.name}</td>
                    <td className="text-end">
                      <span
                        className={`badge ${
                          skill.status === "Gap"
                            ? "text-bg-warning"
                            : "text-bg-success"
                        }`}
                      >
                        {skill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm mt-3"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </button>
        </div>
      </div>

      <SkillCoverageModal
        show={showDetails}
        skills={skills}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}
